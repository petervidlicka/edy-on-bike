/**
 * Physics and placement every crash variant shares: the screen shake, the tumbling
 * bodies (rider or bike: gravity, two damped bounces, then still), where the rider's
 * hip sits on the bike, and the bike kick-off every scripted variant starts with.
 */
import { CRASH_BOUNCE_DAMPING, CRASH_GRAVITY, CRASH_SHAKE_INITIAL, PLAYER_HEIGHT, PLAYER_WIDTH } from "../constants";
import type { PlayerState } from "../types";
import type { CrashState, Point } from "./types";

/** Horizontal speed kept per 60 fps frame while a body slides. */
const FRICTION = 0.95;
/** Spin kept on the first bounce. */
const ANGULAR_DAMPING = 0.7;
/** Share of horizontal speed the bike keeps on each bounce. */
const BIKE_LANDING_FRICTION = 0.6;

/** Centre of the settled bike sits this far above the ground in the classic crash. */
export const CLASSIC_BIKE_REST = 12;
/** Centre of the bike resting on the road in the scripted variants (faceplant, tree hang, car bonk). */
export const BIKE_REST = 20;

/** Hip of an upright rider on the bike, relative to the player box. */
export const HIP_FROM_PLAYER: readonly [number, number] = [27, 24];

/** The centre of the rider's head relative to the hip (matches `drawRiderFigure`). */
export const HEAD_OFFSET: readonly [number, number] = [3, -19];

/** The two bodies a crash moves. */
export type CrashBody = "rider" | "bike";

/** The `CrashState` fields that make up each body, so one tumble routine serves both. */
const BODY_FIELDS = {
  rider: {
    x: "riderX", y: "riderY", vx: "riderVX", vy: "riderVY",
    angle: "riderAngle", angularVel: "riderAngularVel", bounces: "riderBounceCount",
  },
  bike: {
    x: "bikeX", y: "bikeY", vx: "bikeVX", vy: "bikeVY",
    angle: "bikeAngle", angularVel: "bikeAngularVel", bounces: "bikeBounceCount",
  },
} as const satisfies Record<CrashBody, Record<string, keyof CrashState>>;

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
 * Tumbles a body one frame: gravity, two damped bounces on the ground, then it lies
 * still (only sliding to a stop).
 * @param cs - Crash state whose body fields are advanced.
 * @param body - Which body to move.
 * @param dt - Frame delta in 60 fps units.
 * @param groundY - The surface the body lands on.
 * @param rest - How far above `groundY` the body's centre rests.
 * @param landingFriction - Share of horizontal speed kept on each bounce.
 */
export function stepBody(
  cs: CrashState,
  body: CrashBody,
  dt: number,
  groundY: number,
  rest: number,
  landingFriction: number,
): void {
  const f = BODY_FIELDS[body];
  const restY = groundY - rest;
  const settled = cs[f.bounces] >= 2;
  if (!settled) cs[f.vy] += CRASH_GRAVITY * dt;
  cs[f.x] += cs[f.vx] * dt;
  if (!settled) cs[f.y] += cs[f.vy] * dt;
  cs[f.angle] += cs[f.angularVel] * dt;
  cs[f.vx] *= Math.pow(FRICTION, dt);

  if (cs[f.y] >= restY && cs[f.vy] > 0 && !settled) {
    cs[f.y] = restY;
    cs[f.bounces]++;
    if (cs[f.bounces] >= 2) {
      cs[f.vy] = 0;
      cs[f.angularVel] = 0;
    } else {
      cs[f.vy] = -cs[f.vy] * CRASH_BOUNCE_DAMPING;
      cs[f.angularVel] *= ANGULAR_DAMPING;
    }
    cs[f.vx] *= landingFriction;
  }
}

/**
 * Tumbles the bike (see `stepBody`) while the wheels spin down with its slide.
 * @param cs - Crash state whose bike fields are advanced.
 * @param dt - Frame delta in 60 fps units.
 * @param groundY - The surface the bike lands on.
 * @param rest - How far above `groundY` the bike's centre rests.
 */
export function stepBike(cs: CrashState, dt: number, groundY: number, rest: number): void {
  stepBody(cs, "bike", dt, groundY, rest, BIKE_LANDING_FRICTION);
  // Decelerating wheel spin
  cs.bikeWheelRotation += cs.bikeVX * dt * 0.08;
}

/**
 * Puts the rider's hip at a point, at rest and upright, ready for a scripted path.
 * @param cs - Crash state whose rider fields are set.
 */
export function placeRider(cs: CrashState, x: number, y: number): void {
  cs.riderX = x;
  cs.riderY = y;
  cs.riderAngle = 0;
  cs.riderVX = cs.riderVY = cs.riderAngularVel = 0;
  cs.riderBounceCount = 0;
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
  at: Point,
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

/**
 * Kicks the bike off from under the rider, centred on the player box, with the
 * riding wheel spin: how every scripted variant leaves the bike behind.
 * @param cs - Crash state whose bike fields are set.
 * @param p - The rider at the moment of impact.
 * @param kick - Initial velocity and spin.
 */
export function launchBikeFromRider(cs: CrashState, p: PlayerState, kick: { vx: number; vy: number; spin: number }): void {
  launchBike(cs, { x: p.x + PLAYER_WIDTH / 2, y: p.y + PLAYER_HEIGHT / 2 }, p.wheelRotation, kick);
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
export function figurePoint(hipX: number, hipY: number, angle: number, offset: readonly [number, number]): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: hipX + offset[0] * cos - offset[1] * sin,
    y: hipY + offset[0] * sin + offset[1] * cos,
  };
}

/** The rider's head in the world, for the circling stars (every variant anchors them there). */
export function riderHead(cs: CrashState): Point {
  return figurePoint(cs.riderX, cs.riderY, cs.riderAngle, HEAD_OFFSET);
}
