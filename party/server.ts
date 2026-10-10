import type * as Party from "partykit/server";
import {
  MAX_MESSAGE_CHARS,
  MIN_UPDATE_INTERVAL_MS,
  ScoreGuard,
  sanitizeName,
  sanitizeSkinId,
  sanitizeSnapshot,
} from "./validation";

// ── Types ──────────────────────────────────────────────────────────────

type RoomPhase = "lobby" | "countdown" | "racing" | "finished";

interface PlayerInfo {
  id: string;
  name: string;
  skinId: string;
  ready: boolean;
  alive: boolean;
  score: number;
}

interface RankingEntry {
  playerId: string;
  name: string;
  skinId: string;
  score: number;
  rank: number;
}

/**
 * Messages a client may send. Mirrors ClientMessage in game/multiplayer/types.ts,
 * but payload fields are `unknown`: they come off the wire and are validated here.
 */
type ClientMessage =
  | { type: "join"; name: unknown; skinId: unknown; intent: unknown }
  | { type: "ready" }
  | { type: "player_update"; snapshot: unknown }
  | { type: "player_crashed"; score: unknown }
  | { type: "rematch" }
  | { type: "leave" };

/**
 * A racer who sends no updates for this long is treated as crashed. Covers hidden
 * tabs (rAF stops), frozen browsers and sockets that die without a close event —
 * otherwise the race could never finish for everyone else.
 */
const STALE_PLAYER_MS = 10_000;
const STALE_CHECK_INTERVAL_MS = 2_000;

// ── Server ─────────────────────────────────────────────────────────────

export default class MultiplayerServer implements Party.Server {
  players: Map<string, PlayerInfo> = new Map();
  connections: Map<string, Party.Connection> = new Map();
  phase: RoomPhase = "lobby";
  seed: number;
  inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  countdownTimer: ReturnType<typeof setTimeout> | null = null;
  staleCheckTimer: ReturnType<typeof setInterval> | null = null;
  /** Server-only: last time (Date.now) each racer sent a snapshot. */
  lastUpdateAt: Map<string, number> = new Map();
  /** Server-only: plausibility guard for each racer's client-reported score. */
  scoreGuards: Map<string, ScoreGuard> = new Map();

  constructor(readonly room: Party.Room) {
    this.seed = Math.floor(Math.random() * 2147483647);
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Don't add as player yet — wait for "join" message.
    // Connection is already tracked by PartyKit internally;
    // we store it in our map only after a successful join.
    this.resetInactivityTimer();
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) return;

    let data: ClientMessage;
    try {
      const parsed: unknown = JSON.parse(message);
      if (typeof parsed !== "object" || parsed === null) return;
      data = parsed as ClientMessage;
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

  onClose(conn: Party.Connection) {
    const player = this.players.get(conn.id);
    if (!player) {
      return;
    }

    // If the player was in a race and still alive, treat as a crash
    if ((this.phase === "racing" || this.phase === "countdown") && player.alive) {
      player.alive = false;
      this.broadcast(
        { type: "player_crashed", playerId: player.id, score: player.score },
      );
    }

    this.broadcast(
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

  private handleJoin(data: { type: "join"; name: unknown; skinId: unknown; intent: unknown }, sender: Party.Connection) {
    if (this.players.has(sender.id)) return; // duplicate join from the same socket

    const name = sanitizeName(data.name);
    if (!name) {
      this.rejectJoin(sender, "Pick a name between 1 and 16 characters.");
      return;
    }

    // PartyKit spins up a room for any code, so a typo would otherwise drop the
    // player into a fresh empty room that looks exactly like a real lobby.
    if (data.intent === "join" && this.players.size === 0) {
      this.rejectJoin(sender, `No room found with code ${this.room.id}. Check the code and try again.`);
      return;
    }

    if (this.phase !== "lobby") {
      this.rejectJoin(sender, "That race has already started. Ask for a new room code.");
      return;
    }

    if (this.players.size >= 4) {
      this.rejectJoin(sender, "That room is full (4 players max).");
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
    sender.send(JSON.stringify({
      type: "room_joined",
      roomCode: this.room.id,
      playerId: sender.id,
      players: Array.from(this.players.values()),
      phase: this.phase,
      seed: this.seed,
    }));

    // Broadcast player_joined to everyone else
    this.broadcast(
      { type: "player_joined", player: playerInfo },
      sender.id,
    );
  }

  private handleReady(sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    player.ready = true;

    this.broadcast({ type: "player_ready", playerId: sender.id });
    this.maybeStartCountdown();
  }

  /**
   * First "Play Again" after a race resets the room to a fresh lobby with the same
   * players, so a group can keep racing on one code. Players still on the results
   * screen stay un-ready, which holds the next countdown until they opt in or leave.
   */
  private handleRematch(sender: Party.Connection) {
    if (!this.players.has(sender.id) || this.phase !== "finished") return;
    this.phase = "lobby";
    for (const player of this.players.values()) {
      player.ready = false;
      player.alive = true;
      player.score = 0;
    }
    this.broadcast({ type: "room_reset", players: Array.from(this.players.values()) });
  }

  private handlePlayerUpdate(data: { type: "player_update"; snapshot: unknown }, sender: Party.Connection) {
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
    this.broadcast(
      { type: "ghost_update", playerId: sender.id, snapshot },
      sender.id,
    );
  }

  private handlePlayerCrashed(data: { type: "player_crashed"; score: unknown }, sender: Party.Connection) {
    const player = this.players.get(sender.id);
    // Already out (timed out / disconnected) — keep the score we recorded then
    if (!player || !player.alive || this.phase !== "racing") return;

    player.alive = false;
    player.score = this.scoreGuards.get(sender.id)?.accept(data.score, Date.now()) ?? player.score;

    this.broadcast({
      type: "player_crashed",
      playerId: sender.id,
      score: player.score,
    });

    this.checkFinishCondition();
  }

  private handleLeave(sender: Party.Connection) {
    const player = this.players.get(sender.id);
    if (!player) return;

    this.players.delete(sender.id);
    this.connections.delete(sender.id);

    this.broadcast(
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
    const startAtMs = Date.now() + 3000;

    this.broadcast({
      type: "countdown_start",
      startAtMs,
      seed: this.seed,
    });

    this.countdownTimer = setTimeout(() => {
      this.phase = "racing";
      this.broadcast({ type: "race_start" });
      this.startStaleCheck();
    }, 3000);
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
        this.broadcast({ type: "player_crashed", playerId: player.id, score: player.score });
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
    this.broadcast({ type: "race_finished", rankings });
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /** Tells a client why it can't join; the client shows the message and drops the socket. */
  private rejectJoin(sender: Party.Connection, message: string) {
    sender.send(JSON.stringify({ type: "error", message }));
  }

  private broadcast(msg: Record<string, unknown>, excludeId?: string) {
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
    this.inactivityTimer = setTimeout(() => {
      for (const conn of this.connections.values()) {
        conn.close();
      }
    }, 5 * 60 * 1000);
  }

  /** Room is empty: stop timers and reset so the code can be used for a fresh lobby. */
  private cleanup() {
    this.phase = "lobby";
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.stopStaleCheck();
  }
}

MultiplayerServer satisfies Party.Worker;
