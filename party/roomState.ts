/**
 * Pure state machine of one multiplayer room: who is in it, which phase it is in, and
 * what happens on every join, ready, snapshot, crash, leave and timer. It never touches a
 * socket or a clock — time-dependent methods take `now`, and every method returns the
 * messages to deliver and the timers to (re)arm — so the whole lobby → countdown → race →
 * results flow is unit testable. MultiplayerServer (server.ts) is the I/O glue that feeds
 * it socket events.
 */
import {
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
  PlayerInfo,
  RankingEntry,
  RoomPhase,
  ServerMessage,
} from "../game/multiplayer/protocol";

// ── Timings ────────────────────────────────────────────────────────────

/**
 * A racer who sends no updates for this long is treated as crashed. Covers hidden
 * tabs (rAF stops), frozen browsers and sockets that die without a close event —
 * otherwise the race could never finish for everyone else.
 */
export const STALE_PLAYER_MS = 10_000;
/** Lobby → race. Clients count 3-2-1 locally and start on race_start, not on their own timer. */
export const COUNTDOWN_MS = 3_000;
/** How often silent racers are counted out (see STALE_PLAYER_MS). */
export const STALE_CHECK_INTERVAL_MS = 2_000;
/**
 * Quick play: how long a matchmade room waits for all matched riders to connect. After
 * that it races with whoever made it (2+), or sends the lone rider back to the queue.
 */
export const QUICK_GATHER_MS = 5_000;

/** Seeds stay in the positive int32 range (Math.random() * this, floored). */
const MAX_SEED = 2147483647;

// ── Effects ────────────────────────────────────────────────────────────

/** Timers a room runs; the glue keeps at most one of each armed. */
export type RoomTimerId = "gather" | "countdown" | "staleCheck";

/** Arm (replacing any armed timer of that id) or disarm a room timer. */
export type TimerIntent =
  | { kind: "schedule"; id: RoomTimerId; inMs: number }
  | { kind: "cancel"; id: RoomTimerId };

/**
 * One message to deliver. "all" and "others" address joined players only (a socket that
 * never joined is never broadcast to); "one" addresses a socket by id, joined or not —
 * that's how a rejected joiner gets its error.
 */
export type Outbound =
  | { to: "all"; msg: ServerMessage }
  | { to: "others"; except: string; msg: ServerMessage }
  | { to: "one"; id: string; msg: ServerMessage };

/** Everything a state transition asks the glue to do, in order. */
export interface RoomEffects {
  outbox: Outbound[];
  timers: TimerIntent[];
}

/** The untrusted payload of a "join" message, as it comes off the wire. */
export interface JoinRequest {
  name: unknown;
  skinId: unknown;
  intent: unknown;
  expected: unknown;
}

function newEffects(): RoomEffects {
  return { outbox: [], timers: [] };
}

// ── State ──────────────────────────────────────────────────────────────

/**
 * Room lifecycle: lobby → countdown → racing → finished (→ lobby again on rematch).
 * Ids are the server-generated socket ids; the glue guarantees each call comes from the
 * socket that joined as that id (see MultiplayerServer#isPlayerSocket).
 * @example
 * const room = new RoomState("K7XM");
 * const fx = room.join("s1", { name: "Edy", skinId: "default", intent: "create", expected: undefined });
 * // fx.outbox[0] → { to: "one", id: "s1", msg: { type: "room_joined", ... } }
 */
export class RoomState {
  readonly players: Map<string, PlayerInfo> = new Map();
  phase: RoomPhase = "lobby";
  seed: number;
  /** Matchmade room (first joiner came with intent "quick"). */
  quickPlay = false;
  /** Quick play: riders the matchmaker put in this room. */
  expectedPlayers = 0;
  /** Quick play: waiting for matched riders to connect; holds the auto-start. */
  gathering = false;
  /**
   * Quick play: the gather is over (everyone arrived, the wait ran out, or the room emptied).
   * A matchmade code hosts one match, so this is never reset: later quick joins re-queue.
   */
  quickGatherEnded = false;

  /** Last time each racer sent a snapshot; silent racers are counted out (STALE_PLAYER_MS). */
  private readonly lastUpdateAt: Map<string, number> = new Map();
  /** Plausibility guard for each racer's client-reported score. */
  private readonly scoreGuards: Map<string, ScoreGuard> = new Map();
  /** Per-racer snapshot rate limit (see SNAPSHOT_RATE_PER_SEC). */
  private readonly snapshotLimits: Map<string, TokenBucket> = new Map();
  /** Per-racer check that snapshot timestamps move forward plausibly. */
  private readonly snapshotClocks: Map<string, SnapshotClock> = new Map();
  /** When the current race started; the silence baseline for racers who never sent a snapshot. */
  private raceStartAt = 0;

  /**
   * @param roomCode - The Durable Object name: decides which join intents the room accepts.
   * @param nextSeed - Course seed source; injectable so tests get deterministic seeds.
   */
  constructor(
    readonly roomCode: string,
    private readonly nextSeed: () => number = () => Math.floor(Math.random() * MAX_SEED),
  ) {
    this.seed = nextSeed();
  }

  /** Whether `id` has joined as a player (the glue only trusts messages from such sockets). */
  hasPlayer(id: string): boolean {
    return this.players.has(id);
  }

  // ── Client messages ──────────────────────────────────────────────────

  /**
   * Admits a socket as a player, or tells it why not. Every guard keys off the intent, so
   * a typo'd code can't open a room and a matchmade code can't host a friend room.
   */
  join(id: string, data: JoinRequest): RoomEffects {
    const fx = newEffects();
    // Duplicate join from the same socket (ids are server-generated, so never another one's)
    if (this.players.has(id)) return fx;

    const name = sanitizeName(data.name);
    if (!name) {
      return this.rejectJoin(fx, id, `Pick a name between 1 and ${MAX_NAME_LENGTH} characters.`);
    }
    if (!isPlayerNameAllowed(name)) {
      return this.rejectJoin(fx, id, "Please pick a different name.");
    }
    // Every guard below keys off the intent, so an unknown one must not get past them
    const intent = sanitizeIntent(data.intent);
    if (!intent) {
      return this.rejectJoin(fx, id, "That join request isn't valid. Update the game and try again.");
    }

    // A room exists for any code as soon as someone connects, so a typo would otherwise drop the
    // player into a fresh empty room that looks exactly like a real lobby.
    if (intent === "join" && this.players.size === 0) {
      return this.rejectJoin(fx, id, `No room found with code ${this.roomCode}. Check the code and try again.`);
    }

    const quickIntent = intent === "quick";
    // Friend rooms live on typed-code shapes and matchmade rooms on Q-codes, so neither kind
    // can be opened on the other's code (which would strand matched riders in a friend lobby)
    if (quickIntent ? !isQuickPlayCode(this.roomCode) : !isFriendRoomCode(this.roomCode)) {
      return this.rejectJoin(fx, id, "That room code isn't valid. Check the code and try again.");
    }

    // Room codes are random, so a new room can land on a code someone is already using
    if (intent === "create" && this.players.size > 0) {
      fx.outbox.push({
        to: "one",
        id,
        msg: { type: "error", message: "That room code is taken. Try creating the room again.", reason: "room_taken" },
      });
      return fx;
    }

    if (quickIntent && this.quickGatherEnded) {
      // A matched rider who arrived too late (the race went ahead, or the match fell through
      // and the lone rider is leaving): send them back to the queue instead of a dead end
      fx.outbox.push({ to: "one", id, msg: { type: "match_failed" } });
      return fx;
    }

    if (this.players.size === 0) {
      this.quickPlay = quickIntent;
      if (quickIntent) {
        this.expectedPlayers = sanitizeExpectedPlayers(data.expected);
        this.gathering = true;
        fx.timers.push({ kind: "schedule", id: "gather", inMs: QUICK_GATHER_MS });
      }
    } else if (quickIntent !== this.quickPlay) {
      return this.rejectJoin(fx, id, "That room isn't available. Try again.");
    }

    if (this.phase !== "lobby") {
      return this.rejectJoin(fx, id, "That race has already started. Ask for a new room code.");
    }

    if (this.players.size >= MAX_PLAYERS) {
      return this.rejectJoin(fx, id, `That room is full (${MAX_PLAYERS} players max).`);
    }

    const player: PlayerInfo = {
      id,
      name,
      skinId: sanitizeSkinId(data.skinId),
      // Matchmade riders already chose to race; only the first race skips READY
      ready: this.gathering,
      alive: true,
      score: 0,
    };
    this.players.set(id, player);

    fx.outbox.push({
      to: "one",
      id,
      msg: {
        type: "room_joined",
        roomCode: this.roomCode,
        playerId: id,
        players: this.roster(),
        phase: this.phase,
        seed: this.seed,
        quickPlay: this.quickPlay,
      },
    });
    fx.outbox.push({ to: "others", except: id, msg: { type: "player_joined", player } });

    if (this.gathering && this.players.size >= this.expectedPlayers) {
      this.stopGathering(fx);
      this.maybeStartCountdown(fx);
    }
    return fx;
  }

  /** READY from the lobby. Only meaningful once — repeats would just be re-broadcast spam. */
  ready(id: string): RoomEffects {
    const fx = newEffects();
    const player = this.players.get(id);
    if (!player || player.ready || this.phase !== "lobby") return fx;

    player.ready = true;
    fx.outbox.push({ to: "all", msg: { type: "player_ready", playerId: id } });
    this.maybeStartCountdown(fx);
    return fx;
  }

  /** A racer's snapshot: rate-limited, sanitised, score-guarded, then relayed to the others. */
  playerUpdate(id: string, rawSnapshot: unknown, now: number): RoomEffects {
    const fx = newEffects();
    const player = this.players.get(id);
    // Ignore racers already counted out (e.g. timed out, then their tab came back)
    if (!player || !player.alive || this.phase !== "racing") return fx;

    if (!this.snapshotLimits.get(id)?.take(now)) return fx; // flooding — drop, don't relay

    const snapshot = sanitizeSnapshot(rawSnapshot);
    if (!snapshot || !this.snapshotClocks.get(id)?.accept(snapshot.t, now)) return fx;

    // Keep a plausible latest score so a racer who times out or disconnects is ranked fairly
    player.score = this.scoreGuards.get(id)?.accept(snapshot.s, now) ?? player.score;
    snapshot.s = player.score;
    this.lastUpdateAt.set(id, now);

    fx.outbox.push({ to: "others", except: id, msg: { type: "ghost_update", playerId: id, snapshot } });
    return fx;
  }

  /** The racer's own crash report. Already-out racers keep the score recorded then. */
  playerCrashed(id: string, reportedScore: unknown, now: number): RoomEffects {
    const fx = newEffects();
    const player = this.players.get(id);
    if (!player || !player.alive || this.phase !== "racing") return fx;

    player.alive = false;
    player.score = this.scoreGuards.get(id)?.accept(reportedScore, now) ?? player.score;

    fx.outbox.push({ to: "all", msg: { type: "player_crashed", playerId: id, score: player.score } });
    this.checkFinishCondition(fx);
    return fx;
  }

  /**
   * First "Play Again" after a race resets the room to a fresh lobby with the same
   * players, so a group can keep racing on one code. Players still on the results
   * screen stay un-ready, which holds the next countdown until they opt in or leave.
   */
  rematch(id: string): RoomEffects {
    const fx = newEffects();
    if (!this.players.has(id) || this.phase !== "finished") return fx;

    this.phase = "lobby";
    for (const player of this.players.values()) {
      player.ready = false;
      player.alive = true;
      player.score = 0;
    }
    fx.outbox.push({ to: "all", msg: { type: "room_reset", players: this.roster() } });
    return fx;
  }

  /** An explicit "leave": the player is gone, with no crash recorded. */
  leave(id: string): RoomEffects {
    const fx = newEffects();
    if (!this.players.delete(id)) return fx;

    fx.outbox.push({ to: "all", msg: { type: "player_left", playerId: id } });
    this.afterPlayerRemoved(fx);
    return fx;
  }

  /** The player's socket closed. Mid-race (or countdown) that counts as a crash. */
  disconnect(id: string): RoomEffects {
    const fx = newEffects();
    const player = this.players.get(id);
    if (!player) return fx;

    this.players.delete(id);
    if ((this.phase === "racing" || this.phase === "countdown") && player.alive) {
      player.alive = false;
      fx.outbox.push({ to: "all", msg: { type: "player_crashed", playerId: id, score: player.score } });
    }
    fx.outbox.push({ to: "all", msg: { type: "player_left", playerId: id } });
    this.afterPlayerRemoved(fx);
    return fx;
  }

  // ── Timers ───────────────────────────────────────────────────────────

  /** A timer the state asked for (see TimerIntent) has fired. */
  onTimer(id: RoomTimerId, now: number): RoomEffects {
    const fx = newEffects();
    switch (id) {
      case "gather":
        this.onGatherTimeout(fx);
        break;
      case "countdown":
        this.onCountdownDone(fx, now);
        break;
      case "staleCheck":
        this.onStaleCheck(fx, now);
        break;
    }
    return fx;
  }

  /** Not every matched rider connected in time: race with whoever did, or re-queue a lone rider. */
  private onGatherTimeout(fx: RoomEffects) {
    this.gathering = false;
    this.quickGatherEnded = true;
    if (this.players.size >= 2) {
      this.maybeStartCountdown(fx);
      return;
    }
    fx.outbox.push({ to: "all", msg: { type: "match_failed" } });
  }

  private onCountdownDone(fx: RoomEffects, now: number) {
    this.phase = "racing";
    fx.outbox.push({ to: "all", msg: { type: "race_start" } });
    this.startStaleCheck(fx, now);
  }

  /** Counts out racers who stopped sending updates, then re-arms itself while the race runs. */
  private onStaleCheck(fx: RoomEffects, now: number) {
    for (const player of this.players.values()) {
      if (!player.alive) continue;
      if (now - (this.lastUpdateAt.get(player.id) ?? this.raceStartAt) < STALE_PLAYER_MS) continue;
      player.alive = false;
      fx.outbox.push({ to: "all", msg: { type: "player_crashed", playerId: player.id, score: player.score } });
    }
    this.checkFinishCondition(fx);
    if (this.phase === "racing") {
      fx.timers.push({ kind: "schedule", id: "staleCheck", inMs: STALE_CHECK_INTERVAL_MS });
    }
  }

  // ── Game flow ────────────────────────────────────────────────────────

  /** Ends a running quick-play gather for good (see quickGatherEnded). */
  private stopGathering(fx: RoomEffects) {
    if (!this.gathering) return;
    this.gathering = false;
    this.quickGatherEnded = true;
    fx.timers.push({ kind: "cancel", id: "gather" });
  }

  /** Starts the race once at least 2 players are in the lobby and all are ready. */
  private maybeStartCountdown(fx: RoomEffects) {
    if (this.gathering) return; // quick play: still waiting for matched riders to connect
    if (this.phase === "lobby" && this.players.size >= 2 && this.allPlayersReady()) {
      this.startCountdown(fx);
    }
  }

  private startCountdown(fx: RoomEffects) {
    this.phase = "countdown";
    this.seed = this.nextSeed();
    fx.outbox.push({ to: "all", msg: { type: "countdown_start", seed: this.seed } });
    fx.timers.push({ kind: "schedule", id: "countdown", inMs: COUNTDOWN_MS });
  }

  /**
   * A race needs 2 riders: if someone leaves mid-countdown and only one is left, go back to
   * the lobby instead of starting a solo "race". A matchmade rider is re-queued instead; a
   * friend-room rider is un-readied too, so the next race still needs everyone's READY.
   */
  private maybeCancelCountdown(fx: RoomEffects) {
    if (this.phase !== "countdown" || this.players.size >= 2) return;
    fx.timers.push({ kind: "cancel", id: "countdown" });
    this.phase = "lobby";
    if (this.quickPlay) {
      fx.outbox.push({ to: "all", msg: { type: "match_failed" } });
      return;
    }
    for (const player of this.players.values()) {
      player.alive = true;
      player.ready = false;
    }
    fx.outbox.push({ to: "all", msg: { type: "countdown_cancelled", players: this.roster() } });
  }

  /** Shared tail of leave and disconnect: re-evaluate the race and lobby without that player. */
  private afterPlayerRemoved(fx: RoomEffects) {
    if (this.players.size === 0) {
      this.cleanup(fx);
      return;
    }
    this.maybeCancelCountdown(fx);
    this.checkFinishCondition(fx);
    // Everyone left may now be ready (e.g. the one holdout just left)
    this.maybeStartCountdown(fx);
  }

  /** Arms the silence check and the per-racer guards; clients start their engine shortly after race_start. */
  private startStaleCheck(fx: RoomEffects, now: number) {
    this.raceStartAt = now;
    for (const id of this.players.keys()) {
      this.lastUpdateAt.set(id, now);
      this.scoreGuards.set(id, new ScoreGuard(now));
      this.snapshotLimits.set(id, new TokenBucket(SNAPSHOT_RATE_PER_SEC, SNAPSHOT_BURST, now));
      this.snapshotClocks.set(id, new SnapshotClock());
    }
    fx.timers.push({ kind: "schedule", id: "staleCheck", inMs: STALE_CHECK_INTERVAL_MS });
  }

  private stopStaleCheck(fx: RoomEffects) {
    fx.timers.push({ kind: "cancel", id: "staleCheck" });
    this.lastUpdateAt.clear();
    this.scoreGuards.clear();
    this.snapshotLimits.clear();
    this.snapshotClocks.clear();
  }

  private checkFinishCondition(fx: RoomEffects) {
    if (this.phase !== "racing") return;
    for (const player of this.players.values()) {
      if (player.alive) return;
    }
    this.finishRace(fx);
  }

  private finishRace(fx: RoomEffects) {
    this.phase = "finished";
    this.stopStaleCheck(fx);

    const sorted = this.roster().sort((a, b) => b.score - a.score);
    const rankings: RankingEntry[] = sorted.map((p, i) => ({
      playerId: p.id,
      name: p.name,
      skinId: p.skinId,
      score: p.score,
      rank: i + 1,
    }));

    // Abandoned results screens are closed by the inactivity timer; a fixed timer here
    // would also kick players who went back to the lobby for a rematch.
    fx.outbox.push({ to: "all", msg: { type: "race_finished", rankings } });
  }

  /**
   * No joined players left: stop race timers and reset so the code can be used for a
   * fresh lobby (a matchmade code stays spent — see quickGatherEnded).
   */
  private cleanup(fx: RoomEffects) {
    this.phase = "lobby";
    this.quickPlay = false;
    this.expectedPlayers = 0;
    this.stopGathering(fx);
    fx.timers.push({ kind: "cancel", id: "countdown" });
    this.stopStaleCheck(fx);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /** Tells a client why it can't join; the client shows the message and drops the socket. */
  private rejectJoin(fx: RoomEffects, id: string, message: string): RoomEffects {
    fx.outbox.push({ to: "one", id, msg: { type: "error", message } });
    return fx;
  }

  /** A fresh array of the players (the objects themselves are the live ones). */
  private roster(): PlayerInfo[] {
    return Array.from(this.players.values());
  }

  private allPlayersReady(): boolean {
    for (const player of this.players.values()) {
      if (!player.ready) return false;
    }
    return true;
  }
}
