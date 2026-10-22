/**
 * Shared types of the crash variant framework. A crash is a short, self-contained
 * animation that plays between the hit and the game-over screen (or the ambulance).
 * *What* the rider hit decides *which* variant plays; each variant lives in its own
 * file and plugs in through the `CrashVariant` interface.
 */
import type { ObstacleInstance, PlayerState, SkinDefinition } from "../types";
import type { EnvironmentPalette } from "../environments/types";

/**
 * Seconds at the end of a crash during which everything fades out. Every variant's
 * duration includes it. Lives here (a leaf module) so both the crash framework and
 * rendering/CrashRenderer.ts read the one value without an import cycle.
 */
export const CRASH_FADE_OUT_S = 0.3;

/**
 * Why the rider crashed. Variants are picked from this, so every `startCrash` call site
 * says what happened instead of the engine guessing afterwards.
 * - `obstacle`: ran into (or under-jumped) an obstacle; `obstacle` is the one that was hit.
 * - `badLanding`: a trick landing went wrong. `underRotated` tells a flip or pose that
 *   was not finished from one that went too far; `surfaceY` is the y the rider came down
 *   on (the road, or the top of a rideable obstacle).
 * - `eliminated`: the multiplayer server counted the local player out.
 */
export type CrashCause =
  | { kind: "obstacle"; obstacle: ObstacleInstance }
  | { kind: "badLanding"; underRotated: boolean; surfaceY: number }
  | { kind: "eliminated" };

/** Rider / bike position in canvas pixels. */
export interface Point {
  x: number;
  y: number;
}

/** Classic ragdoll tumble: all its state lives in the shared rider and bike fields. */
export interface ClassicCrashData {
  kind: "classic";
}

/** Head-first plant into the road after a bad trick landing. */
export interface FaceplantCrashData {
  kind: "faceplant";
  /** Hip position when the crash started (where the dive launches from). */
  startX: number;
  startY: number;
  /** Where the head ends up buried, and the surface it is buried in. */
  plantX: number;
  surfaceY: number;
  /** -1 falls back flat on the face (under-rotated), +1 somersaults over onto the back (over-rotated). */
  tipDir: 1 | -1;
}

/** Snagged by the back of the shirt in a tree crown, dangling and swinging. */
export interface TreeHangData {
  kind: "treeHang";
  startX: number;
  startY: number;
  /** The branch the rider hooks on, centre of the crown. */
  hookX: number;
  hookY: number;
  /** Bounding box and type of the tree that was hit; used to repaint foliage over the rider. */
  tree: Pick<ObstacleInstance, "type" | "x" | "y" | "width" | "height">;
}

/** Bounces off a car roof like a trampoline and ends up spread-eagle on it. */
export interface CarBonkData {
  kind: "carBonk";
  startX: number;
  startY: number;
  /** Roof contact: x the rider lands on and the y of the roof line. */
  roofX: number;
  roofY: number;
}

/** Variant-specific state, discriminated on `kind`. */
export type CrashVariantData = ClassicCrashData | FaceplantCrashData | TreeHangData | CarBonkData;

/** Identifier of a variant; also what the `crash` game event reports. */
export type CrashVariantId = CrashVariantData["kind"];

/**
 * Everything the crash animation needs. The rider and bike fields are shared by all
 * variants (every variant moves both); `data` carries what only one variant needs.
 */
export interface CrashState {
  /** Seconds since the crash began; drives the end of the animation and the fade-out. */
  elapsed: number;
  duration: number;
  /**
   * Seconds of animation time. Unlike `elapsed` it keeps running while the crashed rider
   * waits for the ambulance, so wiggling feet and circling stars stay alive.
   */
  anim: number;
  /** Anim time at which the cartoon stars start circling the rider's head. */
  starsFrom: number;

  shakeIntensity: number;
  shakeOffsetX: number;
  shakeOffsetY: number;

  /** Rider hip position and rotation (radians, clockwise). */
  riderX: number;
  riderY: number;
  riderVX: number;
  riderVY: number;
  riderAngle: number;
  riderAngularVel: number;
  riderBounceCount: number;

  /** Bike centre position and rotation. */
  bikeX: number;
  bikeY: number;
  bikeVX: number;
  bikeVY: number;
  bikeAngle: number;
  bikeAngularVel: number;
  bikeBounceCount: number;
  bikeWheelRotation: number;

  data: CrashVariantData;
}

/** What a variant needs to set itself up. */
export interface CrashInitContext {
  player: PlayerState;
  /** Current scroll speed; faster runs crash harder. */
  speed: number;
  groundY: number;
  cause: CrashCause;
}

/** Per-frame step handed to `update`. */
export interface CrashStep {
  /** Frame delta in 60 fps units (capped). */
  dt: number;
  groundY: number;
}

/** What `draw` needs besides the crash state. */
export interface CrashDrawEnv {
  skin: SkinDefinition;
  palette: EnvironmentPalette;
  groundY: number;
}

/** Text and colours of the comic "pop" word shown at the moment of impact. */
export interface CrashPopText {
  text: string;
  fill: string;
  outline: string;
}

/** Where a scripted rider is at a moment: hip position and figure rotation (radians, clockwise). */
export interface RiderPlacement extends Point {
  angle: number;
}

/**
 * One crash animation. `D` is the variant's own data; `init` returns it and the
 * framework stores it in `CrashState.data`, so `update`/`draw` get it already narrowed.
 * A scripted variant (one that animates the rider along keyframes rather than with
 * physics) gives `riderAt` and leaves `update` out: the framework then tumbles the
 * bike on the road and places the rider from the keyframes each frame.
 */
export interface CrashVariant<D extends CrashVariantData> {
  readonly id: D["kind"];
  /** Length of the animation in seconds, including the final CRASH_FADE_OUT_S fade-out. */
  readonly duration: number;
  /** Anim time (s) at which the rider has settled and the stars may start. */
  readonly starsFrom: number;
  readonly pop: CrashPopText;
  /** Starts the crash: places the rider and the bike, returns the variant data. */
  init(cs: CrashState, ctx: CrashInitContext): D;
  /**
   * Advances the rider and bike one frame (the shake and clocks are handled by the
   * framework). Absent: the bike tumbles on the road at BIKE_REST and the rider follows `riderAt`.
   */
  update?(cs: CrashState, data: D, step: CrashStep): void;
  /** The scripted rider's hip and rotation at anim time `t` (seconds). */
  riderAt?(data: D, t: number): RiderPlacement;
  /** Draws the rider and variant decorations; the bike, stars and fade are handled by the framework. */
  drawRider(ctx: CanvasRenderingContext2D, cs: CrashState, data: D, env: CrashDrawEnv): void;
  /** World position of the rider's head, where the stars circle. */
  headAnchor(cs: CrashState, data: D): Point;
}
