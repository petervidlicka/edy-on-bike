/**
 * Public face of the crash variant framework. The engine only talks to these
 * functions: it creates one `CrashState`, starts a crash with a cause, steps it each
 * frame and draws it. Which variant runs, and how, stays inside `game/crashes/`.
 */
import { CRASH_DURATION } from "../constants";
import { crashFadeAlpha, drawCrashBike } from "../rendering/CrashRenderer";
import { carBonkCrash } from "./carBonk";
import { classicCrash } from "./classic";
import { faceplantCrash } from "./faceplant";
import { drawCrashStars } from "./garnish";
import { resetCrashClock, stepShake } from "./physics";
import { treeHangCrash } from "./treeHang";
import type {
  CrashDrawEnv,
  CrashInitContext,
  CrashPopText,
  CrashState,
  CrashVariant,
  CrashVariantData,
  CrashVariantId,
  Point,
} from "./types";

export { pickVariant, variantForCause } from "./registry";
export { createCrashPopText } from "./garnish";
export type {
  CrashCause,
  CrashDrawEnv,
  CrashPopText,
  CrashState,
  CrashVariantData,
  CrashVariantId,
} from "./types";

/** The comic pop word of a variant, for the engine to put on screen at the impact. */
export function crashPopFor(id: CrashVariantId): CrashPopText {
  switch (id) {
    case "classic": return classicCrash.pop;
    case "faceplant": return faceplantCrash.pop;
    case "treeHang": return treeHangCrash.pop;
    case "carBonk": return carBonkCrash.pop;
  }
}

/** A crash state at rest (classic, nothing running); the engine reuses one for every crash. */
export function createCrashState(): CrashState {
  return {
    elapsed: 0, duration: CRASH_DURATION, anim: 0, starsFrom: 0,
    shakeIntensity: 0, shakeOffsetX: 0, shakeOffsetY: 0,
    riderX: 0, riderY: 0, riderVX: 0, riderVY: 0,
    riderAngle: 0, riderAngularVel: 0, riderBounceCount: 0,
    bikeX: 0, bikeY: 0, bikeVX: 0, bikeVY: 0,
    bikeAngle: 0, bikeAngularVel: 0, bikeBounceCount: 0,
    bikeWheelRotation: 0,
    data: { kind: "classic" },
  };
}

/**
 * Starts a crash with the given variant: places the rider and the bike and resets the clocks.
 * @param cs - The crash state to (re)use.
 * @param id - Variant to play, from `pickVariant`.
 * @param ctx - The rider, speed, ground and cause at the moment of impact.
 */
export function beginCrash(cs: CrashState, id: CrashVariantId, ctx: CrashInitContext): void {
  switch (id) {
    case "classic": start(cs, classicCrash, ctx); break;
    case "faceplant": start(cs, faceplantCrash, ctx); break;
    case "treeHang": start(cs, treeHangCrash, ctx); break;
    case "carBonk": start(cs, carBonkCrash, ctx); break;
  }
}

function start<D extends CrashVariantData>(cs: CrashState, variant: CrashVariant<D>, ctx: CrashInitContext): void {
  resetCrashClock(cs, variant.duration, variant.starsFrom);
  cs.data = variant.init(cs, ctx);
}

/**
 * Advances the crash one frame.
 * @param cs - Crash in progress.
 * @param dt - Frame delta in 60 fps units (capped).
 * @param rawDt - Real frame time in ms; the crash's length is measured in real time.
 * @param groundY - The road line.
 * @returns True once the animation has run its full duration.
 */
export function stepCrash(cs: CrashState, dt: number, rawDt: number, groundY: number): boolean {
  cs.elapsed += rawDt / 1000;
  cs.anim += rawDt / 1000;
  if (cs.elapsed >= cs.duration) return true;

  stepShake(cs, dt);
  const step = { dt, groundY };
  switch (cs.data.kind) {
    case "classic": classicCrash.update(cs, cs.data, step); break;
    case "faceplant": faceplantCrash.update(cs, cs.data, step); break;
    case "treeHang": treeHangCrash.update(cs, cs.data, step); break;
    case "carBonk": carBonkCrash.update(cs, cs.data, step); break;
  }
  return false;
}

/**
 * Keeps the animation clock running without moving anything, for the stretch where the
 * crashed rider lies waiting for the ambulance: feet keep kicking, stars keep circling.
 * @param cs - Crash on display.
 * @param rawDt - Real frame time in ms.
 */
export function tickCrashAnim(cs: CrashState, rawDt: number): void {
  cs.anim += rawDt / 1000;
}

/**
 * Draws the crash: the bike, the variant's rider and decorations, and the stars once
 * the rider has settled, all fading out together at the end.
 * @param ctx - Canvas context (already shaken by the caller).
 * @param cs - Crash to draw.
 * @param env - Skin, palette and road line.
 */
export function drawCrash(ctx: CanvasRenderingContext2D, cs: CrashState, env: CrashDrawEnv): void {
  ctx.save();
  ctx.globalAlpha = crashFadeAlpha(cs);
  drawCrashBike(ctx, cs, env.skin);

  let head: Point;
  switch (cs.data.kind) {
    case "classic":
      classicCrash.drawRider(ctx, cs, cs.data, env);
      head = classicCrash.headAnchor(cs, cs.data);
      break;
    case "faceplant":
      faceplantCrash.drawRider(ctx, cs, cs.data, env);
      head = faceplantCrash.headAnchor(cs, cs.data);
      break;
    case "treeHang":
      treeHangCrash.drawRider(ctx, cs, cs.data, env);
      head = treeHangCrash.headAnchor(cs, cs.data);
      break;
    case "carBonk":
      carBonkCrash.drawRider(ctx, cs, cs.data, env);
      head = carBonkCrash.headAnchor(cs, cs.data);
      break;
  }
  drawCrashStars(ctx, head, cs.anim - cs.starsFrom);
  ctx.restore();
}
