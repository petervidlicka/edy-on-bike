/**
 * Ramp surface geometry shared by collision and riding physics, so the curved-kicker
 * profile and the container ramp's size are defined once. The renderer draws the same
 * curve from these numbers; keep `drawContainerWithRamp` and `drawCurvedRamp` in
 * rendering/obstacles/suburbanObstacles.ts in step with them.
 */

/**
 * The curved kicker on top of CONTAINER_WITH_RAMP: the last `width` px of the box rise
 * `height` px above its roof. Same profile as the standalone CURVED_RAMP in OBSTACLE_SPECS.
 */
export const CONTAINER_RAMP = { width: 75, height: 36 } as const;

/** A point on a ramp surface: the world y of the surface and its slope in radians. */
export interface RampSurface {
  y: number;
  /** Slope angle; negative means rising to the right (towards the lip). */
  angle: number;
}

/**
 * The curved ramp profile, a quadratic ease-in: gentle at the foot, steep at the lip.
 * Writes into `out` so per-frame callers allocate nothing.
 * @param t - Position across the ramp, 0 at the foot to 1 at the lip (callers clamp if needed).
 * @param width - Ramp length in px, which sets how steep the lip gets.
 * @param height - Rise from foot to lip in px.
 * @param baseY - World y of the foot (the ground, or the roof the ramp sits on).
 * @param out - Reused result object.
 * @returns `out`, with `y = baseY - t²·height` and `angle = atan2(-2·t·height / width, 1)`.
 * @example
 * curvedRampSurface(1, 75, 36, 500, { y: 0, angle: 0 }); // { y: 464, angle: ≈ -0.765 }
 */
export function curvedRampSurface(t: number, width: number, height: number, baseY: number, out: RampSurface): RampSurface {
  const curvedT = t * t;
  out.y = baseY - curvedT * height;
  out.angle = Math.atan2((-2 * t * height) / width, 1);
  return out;
}
