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
  MESSAGE_BURST,
  MESSAGE_RATE_PER_SEC,
  SNAPSHOT_BURST,
  SNAPSHOT_RATE_PER_SEC,
  ScoreGuard,
  SnapshotClock,
  TokenBucket,
  isPlayerNameAllowed,
  sanitizeExpectedPlayers,
  sanitizeIntent,
  sanitizeName,
  sanitizeSkinId,
  sanitizeSnapshot,
} from "./validation";
import {
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  isFriendRoomCode,
  isQuickPlayCode,
} from "../game/multiplayer/protocol";
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
/**
 * Quick play: how long a matchmade room waits for all matched riders to connect. After
 * that it races with whoever made it (2+), or sends the lone rider back to the queue.
 */
const QUICK_GATHER_MS = 5_000;
/** A socket that hasn't joined by now is closed, so idle sockets can't keep a room resident. */
const JOIN_TIMEOUT_MS = 10_000;
/**
 * Sockets connected but not (yet) joined. Real clients join within a round trip, so a
 * handful covers simultaneous arrivals; more is someone opening sockets to hold the room.
 */
const MAX_PENDING_SOCKETS = MAX_PLAYERS * 2;

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
  /** Server-only: per-racer snapshot rate limit (see SNAPSHOT_RATE_PER_SEC). */
  snapshotLimits: Map<string, TokenBucket> = new Map();
  /** Server-only: per-racer check that snapshot timestamps move forward plausibly. */
  snapshotClocks: Map<string, SnapshotClock> = new Map();
  /** Per-socket message budget, checked before parsing (joined or not). */
  messageLimits: WeakMap<Connection, TokenBucket> = new WeakMap();
  /** Matchmade room (first joiner came with intent "quick"). */
  quickPlay = false;
  /** Quick play: riders the matchmaker put in this room. */
  expectedPlayers = 0;
  /** Quick play: waiting for matched riders to connect; holds the auto-start. */
  gatherTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Quick play: the gather is over (everyone arrived, the wait ran out, or the room emptied).
   * A matchmade code hosts one match, so this is never reset: later quick joins re-queue.
   */
  quickGatherEnded = false;

  onConnect(conn: Connection) {
    // Only codes the client could have produced host rooms; anything else is a probe
    if (!isFriendRoomCode(this.name) && !isQuickPlayCode(this.name)) {
      conn.close(1008, "Invalid room code");
      return;
    }
    if (this.pendingSocketCount() > MAX_PENDING_SOCKETS) {
      conn.close(1013, "Too many connections");
      return;
    }

    // Don't add as player yet — wait for "join" message. PartyServer tracks the
    // socket internally; we add it to our map only after a successful join.
    this.messageLimits.set(conn, new TokenBucket(MESSAGE_RATE_PER_SEC, MESSAGE_BURST, Date.now()));
    setTimeout(() => {
      if (!this.isPlayerSocket(conn)) conn.close(1008, "Join timeout");
    }, JOIN_TIMEOUT_MS);
  }

  onMessage(sender: Connection, message: string | ArrayBuffer | ArrayBufferView) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) return;
    if (!this.messageLimits.get(sender)?.take(Date.now())) return; // flooding — drop unparsed

    let data: IncomingMessage;
    try {
      const parsed: unknown = JSON.parse(message);
      if (typeof parsed !== "object" || parsed === null) return;
      data = parsed as IncomingMessage;
    } catch {
      return;
    }

    if (data.type === "join") {
      this.handleJoin(data, sender);
      return;
    }

    // Everything else must come from the socket that joined as this player. Connection ids
    // are only trusted for sockets in our own map (see index.ts for why ids can't be chosen).
    if (!this.isPlayerSocket(sender)) return;
    // Only joined players keep the room alive; idle sockets can't hold it open
    this.resetInactivityTimer();

    switch (data.type) {
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
    // A socket that never joined (or a stale duplicate) must not remove the player with its id
    if (!this.isPlayerSocket(conn)) return;
    const player = this.players.get(conn.id);
    if (!player) return;

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
    this.afterPlayerRemoved();
  }

  // ── Message handlers ─────────────────────────────────────────────────

  private handleJoin(data: Incoming<"join">, sender: Connection) {
    // Duplicate join from the same socket (ids are server-generated, so never another one's)
    if (this.connections.has(sender.id)) return;

    const name = sanitizeName(data.name);
    if (!name) {
      this.rejectJoin(sender, `Pick a name between 1 and ${MAX_NAME_LENGTH} characters.`);
      return;
    }
    if (!isPlayerNameAllowed(name)) {
      this.rejectJoin(sender, "Please pick a different name.");
      return;
    }
    // Every guard below keys off the intent, so an unknown one must not get past them
    const intent = sanitizeIntent(data.intent);
    if (!intent) {
      this.rejectJoin(sender, "That join request isn't valid. Update the game and try again.");
      return;
    }

    // A room exists for any code as soon as someone connects, so a typo would otherwise drop the
    // player into a fresh empty room that looks exactly like a real lobby.
    if (intent === "join" && this.players.size === 0) {
      this.rejectJoin(sender, `No room found with code ${this.name}. Check the code and try again.`);
      return;
    }

    const quickIntent = intent === "quick";
    // Friend rooms live on typed-code shapes and matchmade rooms on Q-codes, so neither kind
    // can be opened on the other's code (which would strand matched riders in a friend lobby)
    if (quickIntent ? !isQuickPlayCode(this.name) : !isFriendRoomCode(this.name)) {
      this.rejectJoin(sender, "That room code isn't valid. Check the code and try again.");
      return;
    }

    // Room codes are random, so a new room can land on a code someone is already using
    if (intent === "create" && this.players.size > 0) {
      this.send(sender, {
        type: "error",
        message: "That room code is taken. Try creating the room again.",
        reason: "room_taken",
      });
      return;
    }

    if (quickIntent && this.quickGatherEnded) {
      // A matched rider who arrived too late (the race went ahead, or the match fell through
      // and the lone rider is leaving): send them back to the queue instead of a dead end
      this.send(sender, { type: "match_failed" });
      return;
    }

    if (this.players.size === 0) {
      this.quickPlay = quickIntent;
      if (quickIntent) {
        this.expectedPlayers = sanitizeExpectedPlayers(data.expected);
        this.gatherTimer = setTimeout(() => this.onGatherTimeout(), QUICK_GATHER_MS);
      }
    } else if (quickIntent !== this.quickPlay) {
      this.rejectJoin(sender, "That room isn't available. Try again.");
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
      // Matchmade riders already chose to race; only the first race skips READY
      ready: this.gatherTimer !== null,
      alive: true,
      score: 0,
    };

    this.players.set(sender.id, playerInfo);
    this.connections.set(sender.id, sender);
    this.resetInactivityTimer();

    // Send room_joined to the joining player
    this.send(sender, {
      type: "room_joined",
      roomCode: this.name,
      playerId: sender.id,
      players: Array.from(this.players.values()),
      phase: this.phase,
      seed: this.seed,
      quickPlay: this.quickPlay,
    });

    // Broadcast player_joined to everyone else
    this.sendToPlayers(
      { type: "player_joined", player: playerInfo },
      sender.id,
    );

    if (this.gatherTimer && this.players.size >= this.expectedPlayers) {
      this.stopGathering();
      this.maybeStartCountdown();
    }
  }

  /** Not every matched rider connected in time: race with whoever did, or re-queue a lone rider. */
  private onGatherTimeout() {
    this.gatherTimer = null;
    this.quickGatherEnded = true;
    if (this.players.size >= 2) {
      this.maybeStartCountdown();
      return;
    }
    this.sendToPlayers({ type: "match_failed" });
  }

  /** Ends a running quick-play gather for good (see quickGatherEnded). */
  private stopGathering() {
    if (!this.gatherTimer) return;
    clearTimeout(this.gatherTimer);
    this.gatherTimer = null;
    this.quickGatherEnded = true;
  }

  private handleReady(sender: Connection) {
    const player = this.players.get(sender.id);
    // Only meaningful in the lobby, and only once — repeats would just be re-broadcast spam
    if (!player || player.ready || this.phase !== "lobby") return;

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
    if (!this.snapshotLimits.get(sender.id)?.take(now)) return; // flooding — drop, don't relay

    const snapshot = sanitizeSnapshot(data.snapshot);
    if (!snapshot || !this.snapshotClocks.get(sender.id)?.accept(snapshot.t, now)) return;

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
    this.afterPlayerRemoved();
  }

  /** Shared tail of leave and disconnect: re-evaluate the race and lobby without that player. */
  private afterPlayerRemoved() {
    if (this.players.size === 0) {
      this.cleanup();
      return;
    }
    this.maybeCancelCountdown();
    this.checkFinishCondition();
    // Everyone left may now be ready (e.g. the one holdout just left)
    this.maybeStartCountdown();
  }

  // ── Game flow ────────────────────────────────────────────────────────

  /** Starts the race once at least 2 players are in the lobby and all are ready. */
  private maybeStartCountdown() {
    if (this.gatherTimer) return; // quick play: still waiting for matched riders to connect
    if (this.phase === "lobby" && this.players.size >= 2 && this.allPlayersReady()) {
      this.startCountdown();
    }
  }

  /**
   * A race needs 2 riders: if someone leaves mid-countdown and only one is left, go back to
   * the lobby instead of starting a solo "race". A matchmade rider is re-queued instead.
   */
  private maybeCancelCountdown() {
    if (this.phase !== "countdown" || this.players.size >= 2) return;
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.phase = "lobby";
    if (this.quickPlay) {
      this.sendToPlayers({ type: "match_failed" });
      return;
    }
    for (const player of this.players.values()) player.alive = true;
    this.sendToPlayers({ type: "countdown_cancelled", players: Array.from(this.players.values()) });
  }

  private startCountdown() {
    this.phase = "countdown";
    this.seed = Math.floor(Math.random() * 2147483647);

    this.sendToPlayers({
      type: "countdown_start",
      seed: this.seed,
    });

    this.countdownTimer = setTimeout(() => {
      this.countdownTimer = null;
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
      this.snapshotLimits.set(id, new TokenBucket(SNAPSHOT_RATE_PER_SEC, SNAPSHOT_BURST, raceStart));
      this.snapshotClocks.set(id, new SnapshotClock());
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
    this.snapshotLimits.clear();
    this.snapshotClocks.clear();
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

  /**
   * Whether this socket is the one that joined as `conn.id`. Every handler but join keys on
   * the connection id, so this is what ties a message (or a close) to the right player.
   */
  private isPlayerSocket(conn: Connection): boolean {
    return this.connections.get(conn.id) === conn;
  }

  /** Open sockets that haven't joined as a player. */
  private pendingSocketCount(): number {
    return Array.from(this.getConnections()).length - this.connections.size;
  }

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
    this.quickPlay = false;
    this.expectedPlayers = 0;
    this.stopGathering();
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.stopStaleCheck();
  }
}
