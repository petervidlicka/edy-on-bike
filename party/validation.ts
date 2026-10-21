/**
 * Input validation for the multiplayer server. Clients are untrusted: everything
 * they send is re-checked here before it is stored, ranked or relayed to others.
 */
import type { SkinId, TrickType } from "../game/types";
import { MAX_NAME_LENGTH, MAX_PLAYERS } from "../game/multiplayer/protocol";
import {
  BONUS_REFILL_PER_SEC,
  MAX_BONUS_BURST,
  MAX_DISTANCE_POINTS_PER_SEC,
  MAX_SCORE,
} from "../game/scoreBounds";
import type { GhostSnapshot } from "../game/multiplayer/protocol";
import { cleanPlayerName } from "../lib/playerName";

export { isPlayerNameAllowed } from "../lib/playerName";

/** Largest client message we accept. Real snapshots are ~250 chars of JSON. */
export const MAX_MESSAGE_CHARS = 1_024;

/**
 * Snapshot rate per racer. Clients send at ~15 Hz (67ms on their own clock); the burst
 * absorbs a few snapshots arriving bunched after a network or tab stall, so legitimate
 * ghosts don't stutter while sustained flooding is still dropped.
 */
export const SNAPSHOT_RATE_PER_SEC = 20;
export const SNAPSHOT_BURST = 6;

/**
 * Overall message rate per socket, checked before parsing. Generous next to real
 * traffic (~15 snapshots/s plus the odd lobby message); it exists to stop floods of
 * cheap messages like "ready" that would otherwise be re-broadcast to every player.
 */
export const MESSAGE_RATE_PER_SEC = 30;
export const MESSAGE_BURST = 40;

/**
 * How far a snapshot's sender clock (`t`) may run ahead of the server's clock since that
 * racer's previous snapshot. Covers network jitter; a bigger jump is a forged timestamp
 * that would make every receiver drop the ghost's later snapshots as out-of-order.
 */
const MAX_SNAPSHOT_CLOCK_LEAD_MS = 2_000;

/**
 * Token bucket for rate limiting: allows short bursts while bounding the sustained rate.
 * @example
 * const limiter = new TokenBucket(20, 6, Date.now());
 * if (!limiter.take(Date.now())) return; // over the limit — drop
 */
export class TokenBucket {
  private tokens: number;
  private lastAt: number;

  constructor(
    private readonly ratePerSec: number,
    private readonly burst: number,
    nowMs: number,
  ) {
    this.tokens = burst;
    this.lastAt = nowMs;
  }

  /** @returns Whether a token was available (and spent) at `nowMs`. */
  take(nowMs: number): boolean {
    const elapsedSec = Math.max(0, nowMs - this.lastAt) / 1000;
    this.lastAt = nowMs;
    this.tokens = Math.min(this.burst, this.tokens + elapsedSec * this.ratePerSec);
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

/**
 * Checks that a racer's snapshot timestamps move forward at a plausible pace, so one
 * forged `t` can't freeze that ghost for everyone (receivers drop out-of-order snapshots).
 */
export class SnapshotClock {
  private last: { t: number; atMs: number } | null = null;

  /**
   * @param t - The snapshot's sender timestamp (already known to be finite).
   * @param nowMs - Server time the snapshot arrived.
   * @returns Whether to relay it; accepted timestamps become the new baseline.
   */
  accept(t: number, nowMs: number): boolean {
    if (t < 0) return false;
    if (this.last) {
      const maxT = this.last.t + (nowMs - this.last.atMs) + MAX_SNAPSHOT_CLOCK_LEAD_MS;
      if (t <= this.last.t || t > maxT) return false;
    }
    this.last = { t, atMs: nowMs };
    return true;
  }
}

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

const NUMERIC_FIELDS = ["t", "h", "wr", "bt", "rl", "rc", "lt", "ba", "fd", "tp", "s"] as const;

/**
 * Normalises a display name (see cleanPlayerName: NFKC, invisible characters stripped,
 * whitespace collapsed).
 * @returns The cleaned name, or null if nothing usable is left or it's too long.
 */
export function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = cleanPlayerName(raw);
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
 * guard.accept(1_000_000, Date.now() + 70); // → one trick burst (MAX_BONUS_BURST) plus ~3, not a million
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
