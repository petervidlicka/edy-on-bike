/**
 * Physics every crash variant shares: the screen shake and the tumbling bike. The
 * rider differs per variant (ragdoll, plant, hang, bounce), the bike does not.
 */
import { CRASH_BOUNCE_DAMPING, CRASH_GRAVITY, CRASH_SHAKE_INITIAL } from "../constants";
import type { CrashState } from "./types";

const FRICTION = 0.95;
const ANGULAR_DAMPING = 0.7;

/** Centre of the settled bike sits this far above the ground in the classic crash. */
export const CLASSIC_BIKE_REST = 12;

/**
 * Resets the clocks and the shake so a new crash starts clean.
 * @param cs - Crash state to reset.
 * @param duration - Length of the variant's animation in seconds.
 * @param starsFrom - Anim time at which the stars start.
 */
export function resetCrashClock(cs: CrashState, duration: number, starsFrom: number): void {
  cs.elapsed = 0;
  cs.anim = 0;
  cs.duration = duration;
  cs.starsFrom = starsFrom;
  cs.shakeIntensity = CRASH_SHAKE_INITIAL;
  cs.shakeOffsetX = 0;
  cs.shakeOffsetY = 0;
}

/**
 * Screen shake: exponential decay with a random jitter each frame. Cosmetic only, so
 * `Math.random` is fine (crashes never touch the seeded multiplayer RNG).
 * @param cs - Crash state whose shake fields are advanced.
 * @param dt - Frame delta in 60 fps units.
 */
export function stepShake(cs: CrashState, dt: number): void {
  cs.shakeIntensity *= 1 - 0.06 * dt;
  if (cs.shakeIntensity < 0.3) cs.shakeIntensity = 0;
  cs.shakeOffsetX = (Math.random() - 0.5) * 2 * cs.shakeIntensity;
  cs.shakeOffsetY = (Math.random() - 0.5) * 2 * cs.shakeIntensity;
}

/**
 * Tumbles the bike: gravity, two damped bounces on the ground, then it lies still
 * while the wheels spin down.
 * @param cs - Crash state whose bike fields are advanced.
 * @param dt - Frame delta in 60 fps units.
 * @param groundY - The surface the bike lands on.
 * @param rest - How far above `groundY` the bike's centre rests.
 */
export function stepBike(cs: CrashState, dt: number, groundY: number, rest: number): void {
  const bikeGroundY = groundY - rest;
  const bikeSettled = cs.bikeBounceCount >= 2;
  if (!bikeSettled) cs.bikeVY += CRASH_GRAVITY * dt;
  cs.bikeX += cs.bikeVX * dt;
  if (!bikeSettled) cs.bikeY += cs.bikeVY * dt;
  cs.bikeAngle += cs.bikeAngularVel * dt;
  cs.bikeVX *= Math.pow(FRICTION, dt);

  if (cs.bikeY >= bikeGroundY && cs.bikeVY > 0 && !bikeSettled) {
    cs.bikeY = bikeGroundY;
    cs.bikeBounceCount++;
    if (cs.bikeBounceCount >= 2) {
      cs.bikeVY = 0;
      cs.bikeAngularVel = 0;
    } else {
      cs.bikeVY = -cs.bikeVY * CRASH_BOUNCE_DAMPING;
      cs.bikeAngularVel *= ANGULAR_DAMPING;
    }
    cs.bikeVX *= 0.6;
  }

  // Decelerating wheel spin
  cs.bikeWheelRotation += cs.bikeVX * dt * 0.08;
}

/**
 * Starts the bike from where it is on screen. Uses the same box the riding bike is
 * drawn in, so the crash picks up exactly where the ride stopped.
 * @param cs - Crash state whose bike fields are set.
 * @param wheelRotation - The riding bike's wheel angle, so the spin continues.
 * @param kick - Initial velocity and spin.
 */
export function launchBike(
  cs: CrashState,
  at: { x: number; y: number },
  wheelRotation: number,
  kick: { vx: number; vy: number; spin: number },
): void {
  cs.bikeX = at.x;
  cs.bikeY = at.y;
  cs.bikeVX = kick.vx;
  cs.bikeVY = kick.vy;
  cs.bikeAngle = 0;
  cs.bikeAngularVel = kick.spin;
  cs.bikeBounceCount = 0;
  cs.bikeWheelRotation = wheelRotation;
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamps `v` to the range [0, 1]. */
export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Where a point of the rider's figure ends up once the figure is rotated about its hip.
 * @param hipX - Hip position in the world.
 * @param hipY - Hip position in the world.
 * @param angle - Figure rotation in radians, clockwise.
 * @param offset - Point relative to the hip in the figure's own (unrotated) frame.
 */
export function figurePoint(hipX: number, hipY: number, angle: number, offset: readonly [number, number]): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: hipX + offset[0] * cos - offset[1] * sin,
    y: hipY + offset[0] * sin + offset[1] * cos,
  };
}

/** The centre of the rider's head relative to the hip (matches `drawRiderFigure`). */
export const HEAD_OFFSET: readonly [number, number] = [3, -19];
