/**
 * How fast a legitimate run can score. Shared by the multiplayer server (per-update score
 * guard) and the leaderboard API (whole-run check), so both follow trick tuning in
 * constants.ts. Pure and import-light: the Worker and the API route both bundle it.
 */
import { MAX_CHAIN_LANDING_BONUS } from "./constants";

/** Highest score the leaderboard and multiplayer accept. */
export const MAX_SCORE = 99_999;

/**
 * Distance scoring tops out at ~30 pts/s (max speed 10px/frame at 60fps, 20px per point);
 * the bound carries headroom so legitimate runs are never clamped.
 */
export const MAX_DISTANCE_POINTS_PER_SEC = 45;

/** Extra room on top of the computed trick maximum, for rounding and future small tweaks. */
const BONUS_MARGIN = 1.25;

/** Trick bonus that may land at once: the biggest pose+flip combo at the full chain multiplier. */
export const MAX_BONUS_BURST = Math.ceil(MAX_CHAIN_LANDING_BONUS * BONUS_MARGIN);

/**
 * Three flips need at least ~1.75s of rotation time (0.18 rad/frame at 60fps), so two
 * seconds is a safe floor between maximum landings; the refill rate follows from it.
 */
const MIN_SECONDS_BETWEEN_MAX_LANDINGS = 2;

/** Sustained trick bonus rate; refills the burst budget so long chains aren't clamped. */
export const BONUS_REFILL_PER_SEC = Math.ceil(MAX_CHAIN_LANDING_BONUS / MIN_SECONDS_BETWEEN_MAX_LANDINGS);

/**
 * The most a run lasting `elapsedMs` (wall clock, pauses included) could have scored.
 * @example maxPlausibleScore(60_000) // distance + trick allowance for one minute
 */
export function maxPlausibleScore(elapsedMs: number): number {
  const seconds = Math.max(0, elapsedMs) / 1000;
  const bound = MAX_DISTANCE_POINTS_PER_SEC * seconds + MAX_BONUS_BURST + BONUS_REFILL_PER_SEC * seconds;
  return Math.min(MAX_SCORE, Math.floor(bound));
}
