import { CrashState, SkinDefinition } from "../types";
import {
  getBikeGeometry,
  getWheelParams,
  drawWheel,
  drawBikeFrame,
  drawHandlebars,
  drawHelmet,
} from "./PlayerRenderer";
import { PLAYER_WIDTH, PLAYER_HEIGHT } from "../constants";

export function drawCrashBike(
  ctx: CanvasRenderingContext2D,
  crash: CrashState,
  skin: SkinDefinition
): void {
  const c = skin.colors;
  const glowWheels = skin.bikeStyle === "fixie";

  // Fade-out in last 0.3s
  const fadeStart = crash.duration - 0.3;
  const alpha =
    crash.elapsed > fadeStart
      ? 1 - (crash.elapsed - fadeStart) / 0.3
      : 1;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);

  // Position and rotate the bike around its center
  ctx.translate(crash.bikeX, crash.bikeY);
  ctx.rotate(crash.bikeAngle);

  // Draw bike centered at origin
  const localX = -PLAYER_WIDTH / 2;
  const localY = -PLAYER_HEIGHT / 2;
  const g = getBikeGeometry(skin.bikeStyle, localX, localY);
  const { spokeCount, spokeWidth, spokeColor, knobby } = getWheelParams(skin);

  drawWheel(
    ctx, g.rearWheelX, g.wheelY, g.wheelR, crash.bikeWheelRotation,
    c.wheel, glowWheels, spokeCount, spokeWidth, spokeColor, knobby
  );
  drawWheel(
    ctx, g.frontWheelX, g.wheelY, g.wheelR, crash.bikeWheelRotation,
    c.wheel, glowWheels, spokeCount, spokeWidth, spokeColor, knobby
  );
  drawBikeFrame(ctx, skin, g, localX, localY);
  drawHandlebars(ctx, skin, g);

  ctx.restore();
}

export function drawCrashRider(
  ctx: CanvasRenderingContext2D,
  crash: CrashState,
  skin: SkinDefinition
): void {
  const c = skin.colors;

  // Fade-out in last 0.3s
  const fadeStart = crash.duration - 0.3;
  const alpha =
    crash.elapsed > fadeStart
      ? 1 - (crash.elapsed - fadeStart) / 0.3
      : 1;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);

  ctx.translate(crash.riderX, crash.riderY);
  ctx.rotate(crash.riderAngle);

  // Limb spread: compact → ragdoll over first 0.3s
  const spread = Math.min(crash.elapsed / 0.3, 1);

  // Proportions centered at hip (0,0)
  const hipX = 0, hipY = 0;
  const shoulderX = 2, shoulderY = -13;
  const headX = shoulderX + 1, headY = shoulderY - 7;

  // Legs — spread outward
  ctx.strokeStyle = c.pants;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hipX - 1, hipY + 2);
  ctx.lineTo(hipX - 6 * spread, hipY + 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hipX + 2, hipY + 2);
  ctx.lineTo(hipX + 8 * spread, hipY + 10);
  ctx.stroke();

  // Torso
  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Arms — flung outward
  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(shoulderX - 10 * spread, shoulderY + 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(shoulderX + 8 * spread, shoulderY - 5 * spread);
  ctx.stroke();

  // Hands
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(shoulderX - 10 * spread, shoulderY + 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(shoulderX + 8 * spread, shoulderY - 5 * spread, 2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(headX, headY + 1, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#2e2e2e";
  ctx.beginPath();
  ctx.arc(headX + 3, headY, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Sunglasses for Shadow Ops
  if (skin.bikeStyle === "fatTire") {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(headX - 5, headY - 1.5, 11, 3);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(headX + 3, headY - 1, 2, 1);
  }

  // Helmet
  drawHelmet(ctx, headX, headY, skin.helmetStyle, c.helmet);

  ctx.restore();
}
