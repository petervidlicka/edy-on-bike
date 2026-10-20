/**
 * The multiplayer wire protocol: message shapes and room limits shared by the
 * Next.js client and the Cloudflare Worker in party/. Both sides import this one
 * file so a protocol change can't drift between them.
 *
 * Keep it free of runtime imports (`import type` only): the Worker bundles it,
 * and anything it pulled in at runtime would ship to Cloudflare too.
 */
import type { SkinId, TrickType } from "../types";

// ── Room limits ──

/** Most riders in one room; the server rejects joins beyond this. */
export const MAX_PLAYERS = 4;

/** Longest display name, enforced by the lobby input and re-checked by the server. */
export const MAX_NAME_LENGTH = 16;

// ── Quick play (matchmaking) ──

/**
 * How long the first rider in the quick-play queue waits for others before the
 * matchmaker either starts the race (2+ riders) or asks them whether to keep waiting.
 */
export const QUICK_PLAY_WAIT_MS = 15_000;

/**
 * Once a lone rider has outlasted the wait, the next arrival only holds the match
 * this long for a third or fourth rider — the first one has waited long enough.
 */
export const QUICK_PLAY_GRACE_MS = 5_000;

/**
 * Quick-play room codes start with this and are longer than the 4-character codes
 * players type, so matchmade rooms can never collide with a friend's room.
 */
export const QUICK_PLAY_CODE_PREFIX = "Q";

// ── Room codes ──

/** Alphabet of every room code: no I/O/0/1, so codes read back unambiguously. */
export const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Length of the codes friends type to join a room. */
export const FRIEND_CODE_LENGTH = 4;

/** Random characters after QUICK_PLAY_CODE_PREFIX in a matchmade room code. */
export const QUICK_PLAY_CODE_RANDOM_LENGTH = 5;

/**
 * Picks a random room code from ROOM_CODE_CHARS.
 * @param length - Number of random characters.
 * @param prefix - Fixed start, e.g. QUICK_PLAY_CODE_PREFIX.
 * @example randomRoomCode(FRIEND_CODE_LENGTH) // "K7XM"
 */
export function randomRoomCode(length: number, prefix = ""): string {
  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

const ROOM_CODE_CLASS = `[${ROOM_CODE_CHARS}]`;
const FRIEND_CODE_PATTERN = new RegExp(`^${ROOM_CODE_CLASS}{${FRIEND_CODE_LENGTH}}$`);
const QUICK_PLAY_CODE_PATTERN = new RegExp(
  `^${QUICK_PLAY_CODE_PREFIX}${ROOM_CODE_CLASS}{${QUICK_PLAY_CODE_RANDOM_LENGTH}}$`,
);

/**
 * Whether a code has the shape of a typed friend-room code. The server only hosts friend
 * rooms on these, so a matchmade code can never be opened as a friend room (or vice versa).
 */
export function isFriendRoomCode(code: string): boolean {
  return FRIEND_CODE_PATTERN.test(code);
}

/** Whether a code has the shape the matchmaker hands out (see QUICK_PLAY_CODE_PREFIX). */
export function isQuickPlayCode(code: string): boolean {
  return QUICK_PLAY_CODE_PATTERN.test(code);
}

// ── Ghost snapshot — minimal state sent at ~15 Hz per player ──

export interface GhostSnapshot {
  /**
   * Sender's performance.now() in ms. Each page has its own time origin, so receivers
   * must map this onto their clock (see InterpolationBuffer) rather than compare directly.
   */
  t: number;
  /**
   * Height of the rider's top edge above the ground line (groundY − player.y).
   * Relative so it renders correctly on viewports with a different groundY.
   */
  h: number;
  /** Is on ground */
  og: boolean;
  /** Wheel rotation */
  wr: number;
  /** Bike tilt */
  bt: number;
  /** Rider lean */
  rl: number;
  /** Rider crouch */
  rc: number;
  /** Leg tuck */
  lt: number;
  /** Backflip angle */
  ba: number;
  /** Flip direction (1 = backflip, -1 = frontflip) */
  fd: number;
  /** Active trick enum */
  at: TrickType;
  /** Trick progress 0-1 */
  tp: number;
  /** Current score */
  s: number;
  /**
   * Rider's x as a fraction of the sender's canvas width (moves with the trick boost).
   * Optional so older clients without the boost still relay; receivers fall back to PLAYER_X_RATIO.
   */
  x?: number;
}

// ── Room phases ──

export type RoomPhase = "lobby" | "countdown" | "racing" | "finished";

// ── Player info (lobby state) ──

export interface PlayerInfo {
  id: string;
  name: string;
  skinId: SkinId;
  ready: boolean;
  alive: boolean;
  score: number;
}

// ── Ranking entry (end of race) ──

export interface RankingEntry {
  playerId: string;
  name: string;
  skinId: SkinId;
  score: number;
  rank: number;
}

// ── Client → Server messages ──

export type ClientMessage =
  /**
   * `intent` lets the server reject joins to codes nobody is in, instead of silently creating a room.
   * "quick" joins a matchmade room: everyone is ready on arrival and the race starts once
   * `expected` riders (the size of the match) have connected.
   */
  | { type: "join"; name: string; skinId: SkinId; intent: "create" | "join" | "quick"; expected?: number }
  | { type: "ready" }
  | { type: "player_update"; snapshot: GhostSnapshot }
  | { type: "player_crashed"; score: number }
  /** "Play Again" from the results screen — keeps the group in the same room. */
  | { type: "rematch" }
  | { type: "leave" };

// ── Server → Client messages ──

export type ServerMessage =
  | {
      type: "room_joined";
      roomCode: string;
      playerId: string;
      players: PlayerInfo[];
      phase: RoomPhase;
      seed: number;
      /** Matchmade room: no code to share, and the first race starts without READY. */
      quickPlay: boolean;
    }
  | { type: "player_joined"; player: PlayerInfo }
  | { type: "player_left"; playerId: string }
  | { type: "player_ready"; playerId: string }
  | {
      type: "countdown_start";
      seed: number;
    }
  /** A player left during the countdown and too few remain: back to the lobby with this roster. */
  | { type: "countdown_cancelled"; players: PlayerInfo[] }
  | { type: "race_start" }
  | {
      type: "ghost_update";
      playerId: string;
      snapshot: GhostSnapshot;
    }
  | {
      type: "player_crashed";
      playerId: string;
      score: number;
    }
  | {
      type: "race_finished";
      rankings: RankingEntry[];
    }
  /** Room went back to the lobby for a rematch; everyone is un-ready with scores cleared. */
  | { type: "room_reset"; players: PlayerInfo[] }
  /** Quick-play room: the match fell through or went ahead without this rider, so the client re-queues. */
  | { type: "match_failed" }
  /**
   * Join refused; `message` is shown to the player. `reason: "room_taken"` means a freshly
   * generated code was already in use, so the client quietly retries with a new one.
   */
  | { type: "error"; message: string; reason?: "room_taken" };

// ── Matchmaker (quick play) — a separate socket from the room ──

/** Client → matchmaker. Connecting alone doesn't queue, so idle sockets never get matched. */
export type MatchmakerClientMessage = { type: "queue" };

export type MatchmakerServerMessage =
  /** Sent whenever the queue changes. `msLeft` is null while nobody's wait is counting down. */
  | { type: "queue_status"; waiting: number; msLeft: number | null }
  /** The wait ran out with nobody else around; the rider stays queued until they leave. */
  | { type: "queue_lonely" }
  /** Join this room now; `expected` is how many riders were matched into it. */
  | { type: "matched"; roomCode: string; expected: number };
