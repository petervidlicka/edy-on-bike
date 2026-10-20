/**
 * Multiplayer trick boost: landing tricks pushes the rider forward across the screen
 * so whoever is on a roll visibly pulls ahead of the ghosts, then they drift back home
 * once the tricks stop. It only moves the rider's screen x, never the world speed, so
 * every racer still meets the same course at the same pace — the cost of a big boost
 * is less warning before the next obstacle.
 */
import { PLAYER_X_RATIO } from "../constants";

/**
 * Furthest the rider may be pushed, as a fraction of canvas width. Beyond about half
 * the screen the warning before obstacles at top speed gets too short to react to.
 */
export const BOOST_MAX_X_RATIO = 0.48;
const MAX_OFFSET = BOOST_MAX_X_RATIO - PLAYER_X_RATIO;

/** Every landed trick moves the rider at least this far forward (fraction of canvas width). */
const MIN_GAIN = 0.05;
/** Extra push for big tricks, scaled by points up to BIG_TRICK_POINTS (combos land here). */
const EXTRA_GAIN = 0.09;
const BIG_TRICK_POINTS = 300;
/** Sketchy landings earn half the push. */
const SKETCHY_GAIN_FACTOR = 0.5;

/** How long a boost holds after the last landed trick before the rider drifts home. */
export const BOOST_HOLD_MS = 10_000;
/** Easing time constants: a quick surge forward, a slower drift back. */
const SURGE_TAU_MS = 180;
const RETURN_TAU_MS = 650;

/**
 * Tracks the boost offset for one rider. Call onTrick() when a trick lands and update()
 * every frame, then add `offset` to the rider's home x ratio.
 * @example
 * const boost = new TrickBoost();
 * boost.onTrick(150, false);
 * boost.update(16);
 * player.x = canvasW * (PLAYER_X_RATIO + boost.offset);
 */
export class TrickBoost {
  /** Current offset from home, as a fraction of canvas width. */
  offset = 0;
  private target = 0;
  private holdMs = 0;

  /**
   * @param points - Bonus the trick scored (combos score more, so they push further).
   * @param sketchy - Landed sketchy; earns a smaller push.
   */
  onTrick(points: number, sketchy: boolean): void {
    const gain = (MIN_GAIN + EXTRA_GAIN * Math.min(1, Math.max(0, points) / BIG_TRICK_POINTS))
      * (sketchy ? SKETCHY_GAIN_FACTOR : 1);
    this.target = Math.min(MAX_OFFSET, this.target + gain);
    this.holdMs = BOOST_HOLD_MS;
  }

  /** @param rawDt - Real milliseconds since the last frame. */
  update(rawDt: number): void {
    if (this.holdMs > 0) {
      this.holdMs -= rawDt;
      if (this.holdMs <= 0) this.target = 0;
    }
    const tau = this.target > this.offset ? SURGE_TAU_MS : RETURN_TAU_MS;
    // Frame-rate independent exponential ease toward the target
    this.offset += (this.target - this.offset) * (1 - Math.exp(-rawDt / tau));
    if (Math.abs(this.target - this.offset) < 0.0005) this.offset = this.target;
  }

  reset(): void {
    this.offset = 0;
    this.target = 0;
    this.holdMs = 0;
  }
}
