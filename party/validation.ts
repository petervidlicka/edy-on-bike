/**
 * Input validation for the multiplayer server. Clients are untrusted: everything
 * they send is re-checked here before it is stored, ranked or relayed to others.
 */
import type { SkinId, TrickType } from "../game/types";
import { MAX_NAME_LENGTH, MAX_PLAYERS } from "../game/multiplayer/protocol";
import type { GhostSnapshot } from "../game/multiplayer/protocol";

/** Largest client message we accept. Real snapshots are ~250 chars of JSON. */
export const MAX_MESSAGE_CHARS = 1_024;

/** Clients send at ~15 Hz (67ms); anything much faster is spam, not gameplay. */
export const MIN_UPDATE_INTERVAL_MS = 40;

/**
 * Every SkinId in game/types.ts. Keyed by the union so adding a skin there fails
 * to compile until it's listed here, instead of the server quietly turning it
 * into "default". Unknown ids from clients fall back to the default skin.
 */
const SKIN_IDS: ReadonlySet<string> = new Set(
  Object.keys({
    default: true, racer: true, cowboy: true, royal: true, neon: true, stealth: true,
  } satisfies Record<SkinId, true>),
);

/** Every TrickType in game/types.ts, as sent on the wire; exhaustive for the same reason. */
const TRICK_TYPES: ReadonlySet<string> = new Set(
  Object.keys({ NONE: true, SUPERMAN: true, NO_HANDER: true } satisfies Record<`${TrickType}`, true>),
);

/**
 * Score plausibility. Distance scoring tops out at ~30 pts/s (max speed 10px/frame
 * at 60fps, 20px per point); the biggest single trick is a triple Superman (380),
 * and tricks need airtime, so they can't land back-to-back every frame.
 * Bounds carry headroom so legitimate runs are never clamped.
 */
const MAX_DISTANCE_POINTS_PER_SEC = 45;
/** Trick bonus that may land at once (a 380 triple plus margin). */
const MAX_BONUS_BURST = 600;
/** Sustained trick bonus rate — refills the burst budget. */
const BONUS_REFILL_PER_SEC = 250;
/** Same ceiling as the leaderboard API. */
const MAX_SCORE = 99_999;

const NUMERIC_FIELDS = ["t", "h", "wr", "bt", "rl", "rc", "lt", "ba", "fd", "tp", "s"] as const;

/**
 * Normalises a display name: strips control characters, collapses whitespace.
 * @returns The cleaned name, or null if nothing usable is left or it's too long.
 */
export function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\p{Cc}/gu, "").replace(/\s+/g, " ").trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return null;
  return name;
}

/**
 * Quick-play match size claimed by a joining client. Only gates how long the room
 * waits before auto-starting, so out-of-range values are clamped rather than rejected.
 * @returns An integer between 2 and MAX_PLAYERS.
 */
export function sanitizeExpectedPlayers(raw: unknown): number {
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : MAX_PLAYERS;
  return Math.min(MAX_PLAYERS, Math.max(2, n));
}

/** @returns A known skin id, or "default" for anything unrecognised. */
export function sanitizeSkinId(raw: unknown): SkinId {
  return typeof raw === "string" && SKIN_IDS.has(raw) ? (raw as SkinId) : "default";
}

/**
 * Rebuilds a snapshot from the expected fields only (exactly GhostSnapshot), so a
 * client can't use the relay to push arbitrary payloads to other players.
 * @returns The clean snapshot, or null if any field has the wrong type.
 */
export function sanitizeSnapshot(raw: unknown): GhostSnapshot | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;

  for (const key of NUMERIC_FIELDS) {
    const value = src[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
  }
  if (typeof src.og !== "boolean") return null;
  if (typeof src.at !== "string" || !TRICK_TYPES.has(src.at)) return null;

  const n = (key: (typeof NUMERIC_FIELDS)[number]) => src[key] as number;
  const snapshot: GhostSnapshot = {
    t: n("t"), h: n("h"), og: src.og, wr: n("wr"), bt: n("bt"), rl: n("rl"),
    rc: n("rc"), lt: n("lt"), ba: n("ba"), fd: n("fd"), at: src.at as TrickType, tp: n("tp"), s: n("s"),
  };
  // Optional (older clients don't send it); clamped to the screen so a ghost can't be pushed off it
  if (typeof src.x === "number" && Number.isFinite(src.x)) {
    snapshot.x = Math.min(1, Math.max(0, src.x));
  }
  return snapshot;
}

/**
 * Per-player guard against inflated client scores. Scores never go down; each
 * increase is capped by distance allowance for the elapsed time, and anything
 * beyond that (trick bonuses) spends a token bucket. Per-update allowances would
 * compound under flooding; a bucket keeps the total bounded by time.
 * @example
 * const guard = new ScoreGuard(Date.now());
 * guard.accept(1_000_000, Date.now() + 70); // → ~603, not a million
 */
export class ScoreGuard {
  private score = 0;
  private bonusBudget = MAX_BONUS_BURST;
  private lastAt: number;

  constructor(startMs: number) {
    this.lastAt = startMs;
  }

  /**
   * @param reported - Score the client claims (untrusted).
   * @param nowMs - Server time of this report.
   * @returns The accepted score after clamping.
   */
  accept(reported: unknown, nowMs: number): number {
    const elapsedSec = Math.max(0, nowMs - this.lastAt) / 1000;
    this.lastAt = nowMs;
    this.bonusBudget = Math.min(MAX_BONUS_BURST, this.bonusBudget + BONUS_REFILL_PER_SEC * elapsedSec);

    if (typeof reported !== "number" || !Number.isFinite(reported) || reported <= this.score) {
      return this.score;
    }
    const distanceAllowance = MAX_DISTANCE_POINTS_PER_SEC * elapsedSec;
    const gain = Math.min(reported - this.score, distanceAllowance + this.bonusBudget);
    this.bonusBudget -= Math.max(0, gain - distanceAllowance);
    this.score = Math.min(MAX_SCORE, Math.floor(this.score + gain));
    return this.score;
  }
}
