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
import { BIKE_REST, resetCrashClock, stepBike, stepShake } from "./physics";
import { treeHangCrash } from "./treeHang";
import type {
  CrashDrawEnv,
  CrashInitContext,
  CrashPopText,
  CrashState,
  CrashVariant,
  CrashVariantData,
  CrashVariantId,
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

/**
 * Seconds at the end of a crash during which everything fades out. Every variant's
 * duration includes it. `FADE_OUT_S` in rendering/CrashRenderer.ts draws the fade and
 * must stay equal to this.
 */
export const CRASH_FADE_OUT_S = 0.3;

/**
 * A variant as the framework drives it, with its data type erased: `CrashVariant<D>`
 * is assignable here because the variant only ever receives the data its own `init`
 * returned (the map below is keyed by that data's `kind`).
 */
type AnyVariant = CrashVariant<CrashVariantData>;

/** Every variant by id, so the framework looks one up instead of switching over the ids. */
const VARIANTS: Record<CrashVariantId, AnyVariant> = {
  classic: classicCrash,
  faceplant: faceplantCrash,
  treeHang: treeHangCrash,
  carBonk: carBonkCrash,
};

/** The comic pop word of a variant, for the engine to put on screen at the impact. */
export function crashPopFor(id: CrashVariantId): CrashPopText {
  return VARIANTS[id].pop;
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
  const variant = VARIANTS[id];
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
  const variant = VARIANTS[cs.data.kind];
  if (variant.update) {
    variant.update(cs, cs.data, { dt, groundY });
  } else {
    stepBike(cs, dt, groundY, BIKE_REST);
  }
  if (variant.riderAt) {
    const r = variant.riderAt(cs.data, cs.anim);
    cs.riderX = r.x;
    cs.riderY = r.y;
    cs.riderAngle = r.angle;
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
 * Parks the crash clock just short of the fade-out, so the crashed rider stays fully
 * visible for as long as the caller holds it there (while the ambulance comes).
 * @param cs - Crash on display.
 */
export function holdCrashVisible(cs: CrashState): void {
  // A hair before the fade starts, so crashFadeAlpha still reports 1
  cs.elapsed = cs.duration - CRASH_FADE_OUT_S - 0.01;
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
  const variant = VARIANTS[cs.data.kind];
  variant.drawRider(ctx, cs, cs.data, env);
  drawCrashStars(ctx, variant.headAnchor(cs, cs.data), cs.anim - cs.starsFrom);
  ctx.restore();
}
