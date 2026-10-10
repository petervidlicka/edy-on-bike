/**
 * Input validation for the multiplayer server. Clients are untrusted: everything
 * they send is re-checked here before it is stored, ranked or relayed to others.
 */

/** Largest client message we accept. Real snapshots are ~250 chars of JSON. */
export const MAX_MESSAGE_CHARS = 1_024;

/** Clients send at ~15 Hz (67ms); anything much faster is spam, not gameplay. */
export const MIN_UPDATE_INTERVAL_MS = 40;

/** Matches the lobby's name input. */
const MAX_NAME_LENGTH = 16;

/** Mirrors SkinId in game/types.ts — unknown ids fall back to the default skin. */
const SKIN_IDS = new Set(["default", "racer", "cowboy", "royal", "neon", "stealth"]);

/** Mirrors TrickType in game/types.ts. */
const TRICK_TYPES = new Set(["NONE", "SUPERMAN", "NO_HANDER"]);

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

/** Ghost snapshot as relayed to other players — only these fields, nothing else. */
export interface RelaySnapshot {
  t: number;
  h: number;
  og: boolean;
  wr: number;
  bt: number;
  rl: number;
  rc: number;
  lt: number;
  ba: number;
  fd: number;
  at: string;
  tp: number;
  s: number;
}

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

/** @returns A known skin id, or "default" for anything unrecognised. */
export function sanitizeSkinId(raw: unknown): string {
  return typeof raw === "string" && SKIN_IDS.has(raw) ? raw : "default";
}

/**
 * Rebuilds a snapshot from the expected fields only, so a client can't use the
 * relay to push arbitrary payloads to other players.
 * @returns The clean snapshot, or null if any field has the wrong type.
 */
export function sanitizeSnapshot(raw: unknown): RelaySnapshot | null {
  if (typeof raw !== "object" || raw === null) return null;
  const src = raw as Record<string, unknown>;

  for (const key of NUMERIC_FIELDS) {
    const value = src[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
  }
  if (typeof src.og !== "boolean") return null;
  if (typeof src.at !== "string" || !TRICK_TYPES.has(src.at)) return null;

  const n = (key: (typeof NUMERIC_FIELDS)[number]) => src[key] as number;
  return {
    t: n("t"), h: n("h"), og: src.og, wr: n("wr"), bt: n("bt"), rl: n("rl"),
    rc: n("rc"), lt: n("lt"), ba: n("ba"), fd: n("fd"), at: src.at, tp: n("tp"), s: n("s"),
  };
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
