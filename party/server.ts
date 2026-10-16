/**
 * Multiplayer room server: a PartyServer Durable Object on Cloudflare, one
 * instance per room code (see index.ts for routing, wrangler.jsonc for config).
 * Runs separately from the Next.js app — see MULTIPLAYER.md for dev/deploy.
 * It relays validated ghost snapshots, decides when races start and finish,
 * and ranks players; clients are untrusted (see validation.ts).
 */
import { Server, type Connection } from "partyserver";
import {
  MAX_MESSAGE_CHARS,
  MIN_UPDATE_INTERVAL_MS,
  ScoreGuard,
  sanitizeName,
  sanitizeSkinId,
  sanitizeSnapshot,
} from "./validation";
import { MAX_NAME_LENGTH, MAX_PLAYERS } from "../game/multiplayer/protocol";
import type {
  ClientMessage,
  PlayerInfo,
  RankingEntry,
  RoomPhase,
  ServerMessage,
} from "../game/multiplayer/protocol";

// ── Types ──────────────────────────────────────────────────────────────

/**
 * A ClientMessage as it comes off the wire: the `type` tag is trusted for
 * dispatch, every payload field is `unknown` until validation.ts has checked it.
 */
type Untrusted<M> = M extends { type: infer T }
  ? { type: T } & { [K in Exclude<keyof M, "type">]: unknown }
  : never;

type IncomingMessage = Untrusted<ClientMessage>;
type Incoming<T extends IncomingMessage["type"]> = Extract<IncomingMessage, { type: T }>;

/**
 * A racer who sends no updates for this long is treated as crashed. Covers hidden
 * tabs (rAF stops), frozen browsers and sockets that die without a close event —
 * otherwise the race could never finish for everyone else.
 */
const STALE_PLAYER_MS = 10_000;
/** Lobby → race. Clients count 3-2-1 locally and start on race_start, not on their own timer. */
const COUNTDOWN_MS = 3_000;
const STALE_CHECK_INTERVAL_MS = 2_000;

// ── Server ─────────────────────────────────────────────────────────────

/** Room lifecycle: lobby → countdown → racing → finished (→ lobby again on rematch). */
export class MultiplayerServer extends Server {
  /**
   * No hibernation: room state and the countdown/stale-check timers live in memory,
   * so the Durable Object must stay resident while players are connected.
   */
  static options = { hibernate: false };

  players: Map<string, PlayerInfo> = new Map();
  /** Joined players' sockets only — spectators that never sent "join" aren't broadcast to. */
  connections: Map<string, Connection> = new Map();
  phase: RoomPhase = "lobby";
  seed = Math.floor(Math.random() * 2147483647);
  inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  countdownTimer: ReturnType<typeof setTimeout> | null = null;
  staleCheckTimer: ReturnType<typeof setInterval> | null = null;
  /** Server-only: last time (Date.now) each racer sent a snapshot. */
  lastUpdateAt: Map<string, number> = new Map();
  /** Server-only: plausibility guard for each racer's client-reported score. */
  scoreGuards: Map<string, ScoreGuard> = new Map();

  onConnect() {
    // Don't add as player yet — wait for "join" message.
    // PartyServer tracks the socket internally; we add it to our map
    // only after a successful join.
    this.resetInactivityTimer();
  }

  onMessage(sender: Connection, message: string | ArrayBuffer | ArrayBufferView) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) return;

    let data: IncomingMessage;
    try {
      const parsed: unknown = JSON.parse(message);
      if (typeof parsed !== "object" || parsed === null) return;
      data = parsed as IncomingMessage;
    } catch {
      return;
    }

    this.resetInactivityTimer();

    switch (data.type) {
      case "join":
        this.handleJoin(data, sender);
        break;
      case "ready":
        this.handleReady(sender);
        break;
      case "player_update":
        this.handlePlayerUpdate(data, sender);
        break;
      case "player_crashed":
        this.handlePlayerCrashed(data, sender);
        break;
      case "rematch":
        this.handleRematch(sender);
        break;
      case "leave":
        this.handleLeave(sender);
        break;
    }
  }

  onClose(conn: Connection) {
    const player = this.players.get(conn.id);
    if (!player) {
      return;
    }

    // If the player was in a race and still alive, treat as a crash
    if ((this.phase === "racing" || this.phase === "countdown") && player.alive) {
      player.alive = false;
      this.sendToPlayers(
        { type: "player_crashed", playerId: player.id, score: player.score },
      );
    }

    this.sendToPlayers(
      { type: "player_left", playerId: player.id },
      player.id,
    );

    this.players.delete(conn.id);
    this.connections.delete(conn.id);

    this.checkFinishCondition();
    // Everyone left may now be ready (e.g. the one holdout just left)
    this.maybeStartCountdown();

    if (this.players.size === 0) {
      this.cleanup();
    }
  }

  // ── Message handlers ─────────────────────────────────────────────────

  private handleJoin(data: Incoming<"join">, sender: Connection) {
    if (this.players.has(sender.id)) return; // duplicate join from the same socket

    const name = sanitizeName(data.name);
    if (!name) {
      this.rejectJoin(sender, `Pick a name between 1 and ${MAX_NAME_LENGTH} characters.`);
      return;
    }

    // A room exists for any code as soon as someone connects, so a typo would otherwise drop the
    // player into a fresh empty room that looks exactly like a real lobby.
    if (data.intent === "join" && this.players.size === 0) {
      this.rejectJoin(sender, `No room found with code ${this.name}. Check the code and try again.`);
      return;
    }

    if (this.phase !== "lobby") {
      this.rejectJoin(sender, "That race has already started. Ask for a new room code.");
      return;
    }

    if (this.players.size >= MAX_PLAYERS) {
      this.rejectJoin(sender, `That room is full (${MAX_PLAYERS} players max).`);
      return;
    }

    const playerInfo: PlayerInfo = {
      id: sender.id,
      name,
      skinId: sanitizeSkinId(data.skinId),
      ready: false,
      alive: true,
      score: 0,
    };

    this.players.set(sender.id, playerInfo);
    this.connections.set(sender.id, sender);

    // Send room_joined to the joining player
    this.send(sender, {
      type: "room_joined",
      roomCode: this.name,
      playerId: sender.id,
      players: Array.from(this.players.values()),
      phase: this.phase,
      seed: this.seed,
    });

    // Broadcast player_joined to everyone else
    this.sendToPlayers(
      { type: "player_joined", player: playerInfo },
      sender.id,
    );
  }

  private handleReady(sender: Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    player.ready = true;

    this.sendToPlayers({ type: "player_ready", playerId: sender.id });
    this.maybeStartCountdown();
  }

  /**
   * First "Play Again" after a race resets the room to a fresh lobby with the same
   * players, so a group can keep racing on one code. Players still on the results
   * screen stay un-ready, which holds the next countdown until they opt in or leave.
   */
  private handleRematch(sender: Connection) {
    if (!this.players.has(sender.id) || this.phase !== "finished") return;
    this.phase = "lobby";
    for (const player of this.players.values()) {
      player.ready = false;
      player.alive = true;
      player.score = 0;
    }
    this.sendToPlayers({ type: "room_reset", players: Array.from(this.players.values()) });
  }

  private handlePlayerUpdate(data: Incoming<"player_update">, sender: Connection) {
    const player = this.players.get(sender.id);
    // Ignore racers already counted out (e.g. timed out, then their tab came back)
    if (!player || !player.alive || this.phase !== "racing") return;

    const now = Date.now();
    const lastAt = this.lastUpdateAt.get(sender.id) ?? now;
    if (now - lastAt < MIN_UPDATE_INTERVAL_MS) return; // flooding — drop, don't relay

    const snapshot = sanitizeSnapshot(data.snapshot);
    if (!snapshot) return;

    // Keep a plausible latest score so a racer who times out or disconnects is ranked fairly
    player.score = this.scoreGuards.get(sender.id)?.accept(snapshot.s, now) ?? player.score;
    snapshot.s = player.score;
    this.lastUpdateAt.set(sender.id, now);

    // Relay the cleaned snapshot to all other players
    this.sendToPlayers(
      { type: "ghost_update", playerId: sender.id, snapshot },
      sender.id,
    );
  }

  private handlePlayerCrashed(data: Incoming<"player_crashed">, sender: Connection) {
    const player = this.players.get(sender.id);
    // Already out (timed out / disconnected) — keep the score we recorded then
    if (!player || !player.alive || this.phase !== "racing") return;

    player.alive = false;
    player.score = this.scoreGuards.get(sender.id)?.accept(data.score, Date.now()) ?? player.score;

    this.sendToPlayers({
      type: "player_crashed",
      playerId: sender.id,
      score: player.score,
    });

    this.checkFinishCondition();
  }

  private handleLeave(sender: Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    this.players.delete(sender.id);
    this.connections.delete(sender.id);

    this.sendToPlayers(
      { type: "player_left", playerId: player.id },
    );

    this.checkFinishCondition();
    // Everyone left may now be ready (e.g. the one holdout just left)
    this.maybeStartCountdown();

    if (this.players.size === 0) {
      this.cleanup();
    }
  }

  // ── Game flow ────────────────────────────────────────────────────────

  /** Starts the race once at least 2 players are in the lobby and all are ready. */
  private maybeStartCountdown() {
    if (this.phase === "lobby" && this.players.size >= 2 && this.allPlayersReady()) {
      this.startCountdown();
    }
  }

  private startCountdown() {
    this.phase = "countdown";
    this.seed = Math.floor(Math.random() * 2147483647);

    this.sendToPlayers({
      type: "countdown_start",
      seed: this.seed,
    });

    this.countdownTimer = setTimeout(() => {
      this.phase = "racing";
      this.sendToPlayers({ type: "race_start" });
      this.startStaleCheck();
    }, COUNTDOWN_MS);
  }

  /** Periodically counts out racers who stopped sending updates. */
  private startStaleCheck() {
    // Clients start their engine shortly after race_start; count from here
    const raceStart = Date.now();
    for (const id of this.players.keys()) {
      this.lastUpdateAt.set(id, raceStart);
      this.scoreGuards.set(id, new ScoreGuard(raceStart));
    }

    this.staleCheckTimer = setInterval(() => {
      const now = Date.now();
      for (const player of this.players.values()) {
        if (!player.alive) continue;
        if (now - (this.lastUpdateAt.get(player.id) ?? raceStart) < STALE_PLAYER_MS) continue;
        player.alive = false;
        this.sendToPlayers({ type: "player_crashed", playerId: player.id, score: player.score });
      }
      this.checkFinishCondition();
    }, STALE_CHECK_INTERVAL_MS);
  }

  private stopStaleCheck() {
    if (this.staleCheckTimer) {
      clearInterval(this.staleCheckTimer);
      this.staleCheckTimer = null;
    }
    this.lastUpdateAt.clear();
    this.scoreGuards.clear();
  }

  private checkFinishCondition() {
    if (this.phase !== "racing") return;

    const allDead = Array.from(this.players.values()).every((p) => !p.alive);
    if (allDead) {
      this.finishRace();
    }
  }

  private finishRace() {
    this.phase = "finished";
    this.stopStaleCheck();

    const sorted = Array.from(this.players.values()).sort(
      (a, b) => b.score - a.score,
    );

    const rankings: RankingEntry[] = sorted.map((p, i) => ({
      playerId: p.id,
      name: p.name,
      skinId: p.skinId,
      score: p.score,
      rank: i + 1,
    }));

    // Abandoned results screens are closed by the inactivity timer; a fixed timer here
    // would also kick players who went back to the lobby for a rematch.
    this.sendToPlayers({ type: "race_finished", rankings });
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /** Tells a client why it can't join; the client shows the message and drops the socket. */
  private rejectJoin(sender: Connection, message: string) {
    this.send(sender, { type: "error", message });
  }

  /** JSON-encodes one message for one socket. */
  private send(conn: Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  /** JSON-encodes and sends to every joined player (unlike Server#broadcast, which hits all sockets). */
  private sendToPlayers(msg: ServerMessage, excludeId?: string) {
    const raw = JSON.stringify(msg);
    for (const [id, conn] of this.connections) {
      if (id !== excludeId) {
        conn.send(raw);
      }
    }
  }

  private allPlayersReady(): boolean {
    for (const player of this.players.values()) {
      if (!player.ready) return false;
    }
    return true;
  }

  private resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    // Close every socket, not just joined players — a socket that connects and
    // never sends "join" would otherwise stay open (and keep the room alive) forever.
    this.inactivityTimer = setTimeout(() => {
      this.inactivityTimer = null;
      for (const conn of this.getConnections()) {
        conn.close();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * No joined players left: stop race timers and reset so the code can be used
   * for a fresh lobby. The inactivity timer keeps running so sockets that never
   * joined still get closed.
   */
  private cleanup() {
    this.phase = "lobby";
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.stopStaleCheck();
  }
}
