/**
 * Drawing primitives shared by every crash variant: the tumbling bike and the
 * stick-figure rider. Both are built from the same part helpers as the riding
 * pose in PlayerRenderer, so every skin works in every crash.
 */
import { SkinDefinition } from "../types";
import type { CrashState } from "../crashes/types";
import {
  getBikeGeometry,
  getWheelParams,
  drawWheel,
  drawBikeFrame,
  drawHandlebars,
  drawHelmet,
} from "./PlayerRenderer";
import { PLAYER_WIDTH, PLAYER_HEIGHT } from "../constants";
import { CRASH_FADE_OUT_S } from "../crashes/types";

/** Seconds at the end of a crash during which everything fades out. */

/**
 * Opacity of the crash scene: 1 until the last 0.3 s, then fading to 0.
 * @param crash - Crash state whose clock decides the fade.
 */
export function crashFadeAlpha(crash: CrashState): number {
  const fadeStart = crash.duration - CRASH_FADE_OUT_S;
  const alpha = crash.elapsed > fadeStart ? 1 - (crash.elapsed - fadeStart) / CRASH_FADE_OUT_S : 1;
  return Math.max(0, alpha);
}

/**
 * Draws the crashed bike (wheels, frame, handlebars) around its own centre. The
 * caller owns the fade (`globalAlpha`).
 * @param ctx - Canvas context.
 * @param crash - Crash state holding the bike position, angle and wheel spin.
 * @param skin - Skin that colours and shapes the bike.
 */
export function drawCrashBike(
  ctx: CanvasRenderingContext2D,
  crash: CrashState,
  skin: SkinDefinition
): void {
  const c = skin.colors;
  const glowWheels = skin.bikeStyle === "fixie";

  ctx.save();

  // Position and rotate the bike around its center
  ctx.translate(crash.bikeX, crash.bikeY);
  ctx.rotate(crash.bikeAngle);

  // Draw bike centered at origin
  const localX = -PLAYER_WIDTH / 2;
  const localY = -PLAYER_HEIGHT / 2;
  const g = getBikeGeometry(skin.bikeStyle, localX, localY);
  const wheelStyle = getWheelParams(skin);

  drawWheel(ctx, g.rearWheelX, g.wheelY, g.wheelR, crash.bikeWheelRotation, c.wheel, glowWheels, wheelStyle);
  drawWheel(ctx, g.frontWheelX, g.wheelY, g.wheelR, crash.bikeWheelRotation, c.wheel, glowWheels, wheelStyle);
  drawBikeFrame(ctx, skin, g);
  drawHandlebars(ctx, skin, g);

  ctx.restore();
}

/** A point relative to the rider's hip; x runs forward, y runs down (while upright). */
export type Offset = readonly [number, number];

/** Where the rider's limbs are, relative to the hip. The torso and head follow from `shoulder`. */
export interface RiderPose {
  footL: Offset;
  footR: Offset;
  shoulder: Offset;
  handL: Offset;
  handR: Offset;
  /** Draw crossed-out eyes instead of a normal one. */
  dazed?: boolean;
}

/** Torso top of an upright rider; the default for `RiderPose.shoulder`. */
export const UPRIGHT_SHOULDER: Offset = [2, -13];

/**
 * Draws the stick-figure rider with the hip at the origin: legs, torso, arms, hands,
 * head, face and helmet. The caller positions and rotates the context and owns the
 * fade, so one function serves every variant's pose.
 * @param ctx - Canvas context, already translated/rotated to the rider's hip.
 * @param skin - Skin that colours the rider and picks the helmet.
 * @param pose - Limb end points relative to the hip.
 */
export function drawRiderFigure(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  pose: RiderPose
): void {
  const c = skin.colors;
  const [shoulderX, shoulderY] = pose.shoulder;
  const headX = shoulderX + 1, headY = shoulderY - 7;

  // Legs
  ctx.strokeStyle = c.pants;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-1, 2);
  ctx.lineTo(pose.footL[0], pose.footL[1]);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.lineTo(pose.footR[0], pose.footR[1]);
  ctx.stroke();

  // Torso
  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Arms
  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(pose.handL[0], pose.handL[1]);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(pose.handR[0], pose.handR[1]);
  ctx.stroke();

  // Hands
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(pose.handL[0], pose.handL[1], 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pose.handR[0], pose.handR[1], 2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(headX, headY + 1, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  if (pose.dazed) {
    ctx.strokeStyle = "#2e2e2e";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headX + 1.8, headY - 1.4);
    ctx.lineTo(headX + 4.2, headY + 1.4);
    ctx.moveTo(headX + 4.2, headY - 1.4);
    ctx.lineTo(headX + 1.8, headY + 1.4);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#2e2e2e";
    ctx.beginPath();
    ctx.arc(headX + 3, headY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sunglasses for Shadow Ops
  if (skin.bikeStyle === "fatTire") {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(headX - 5, headY - 1.5, 11, 3);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(headX + 3, headY - 1, 2, 1);
  }

  // Helmet
  drawHelmet(ctx, headX, headY, skin.helmetStyle, c.helmet);
}
