/**
 * Draws remote players ("ghosts") on the local canvas by feeding their
 * interpolated snapshots through the normal player renderer at low opacity.
 */
import { PlayerState } from "../types";
import { PLAYER_X_RATIO, PLAYER_WIDTH, PLAYER_HEIGHT } from "../constants";
import { drawPlayer } from "../rendering/PlayerRenderer";
import { getSkinById } from "../skins";
import type { GhostPlayer } from "./MultiplayerAdapter";

/** Ghost tint colors — one per remote player slot. */
const GHOST_TINTS = ["#4488ff", "#44cc66", "#aa66ff", "#ff8844"];

/**
 * A ghost that stops updating (crashed, tab hidden, network stall) fades out
 * instead of freezing in place over the local rider. Normal gaps are ~70ms at 15 Hz.
 */
const GHOST_FADE_START_MS = 300;
const GHOST_FADE_DURATION_MS = 700;

/**
 * Draws a ghost (remote) player semi-transparently.
 * Constructs a mock PlayerState from the interpolated snapshot
 * and reuses the existing drawPlayer() renderer.
 */
export function drawGhostPlayer(
  ctx: CanvasRenderingContext2D,
  ghost: GhostPlayer,
  groundY: number,
  canvasW: number
): void {
  const snap = ghost.snapshot;
  const fade = 1 - Math.min(1, Math.max(0, (ghost.staleMs - GHOST_FADE_START_MS) / GHOST_FADE_DURATION_MS));
  if (fade <= 0) return;

  const playerX = Math.floor(canvasW * PLAYER_X_RATIO);
  // Snapshots carry height above ground; rebuild y against *this* viewport's ground line
  const y = groundY - snap.h;

  // Build a mock PlayerState from the snapshot
  const mockPlayer: PlayerState = {
    x: playerX,
    y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityY: 0,
    jumpCount: 0,
    isOnGround: snap.og,
    wheelRotation: snap.wr,
    bikeTilt: snap.bt,
    riderLean: snap.rl,
    riderCrouch: snap.rc,
    legTuck: snap.lt,
    ridingObstacle: null,
    backflipAngle: snap.ba,
    isBackflipping: snap.ba > 0,
    flipDirection: snap.fd,
    targetFlipCount: 0,
    activeTrick: snap.at,
    trickProgress: snap.tp,
    trickPhase: "extend",
    trickCompletions: 0,
    targetTrickCount: 0,
    rampBoost: null,
    rampSurfaceAngle: 0,
  };

  const skin = getSkinById(ghost.skinId as "default");
  const tintColor = GHOST_TINTS[ghost.slot % GHOST_TINTS.length];

  ctx.save();
  ctx.globalAlpha = 0.35 * fade;

  drawPlayer(ctx, mockPlayer, skin);

  // Name label above ghost
  ctx.globalAlpha = 0.7 * fade;
  ctx.fillStyle = tintColor;
  ctx.font = "bold 11px var(--font-nunito), Arial, sans-serif";
  ctx.textAlign = "center";
  const labelX = playerX + PLAYER_WIDTH / 2;
  const labelY = y - 12;
  ctx.fillText(ghost.name, labelX, labelY);

  // Score below name
  ctx.font = "10px var(--font-nunito), Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.5 * fade;
  ctx.fillText(String(snap.s), labelX, labelY + 12);

  ctx.restore();
}
