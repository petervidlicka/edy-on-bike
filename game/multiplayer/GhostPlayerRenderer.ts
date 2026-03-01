import { PlayerState, TrickType } from "../types";
import { PLAYER_X_RATIO, PLAYER_WIDTH, PLAYER_HEIGHT } from "../constants";
import { drawPlayer } from "../rendering/PlayerRenderer";
import { getSkinById } from "../skins";
import type { GhostPlayer } from "./MultiplayerAdapter";

/** Ghost tint colors — one per remote player slot. */
const GHOST_TINTS = ["#4488ff", "#44cc66", "#aa66ff", "#ff8844"];

/**
 * Draws a ghost (remote) player semi-transparently.
 * Constructs a mock PlayerState from the interpolated snapshot
 * and reuses the existing drawPlayer() renderer.
 */
export function drawGhostPlayer(
  ctx: CanvasRenderingContext2D,
  ghost: GhostPlayer,
  groundY: number,
  canvasW: number,
  ghostIndex?: number
): void {
  const snap = ghost.snapshot;
  if (!snap.a && snap.s <= 0) return; // ghost is dead with no data

  const playerX = Math.floor(canvasW * PLAYER_X_RATIO);

  // Build a mock PlayerState from the snapshot
  const mockPlayer: PlayerState = {
    x: playerX,
    y: snap.y,
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
  const tintColor = GHOST_TINTS[(ghostIndex ?? 0) % GHOST_TINTS.length];

  ctx.save();
  ctx.globalAlpha = snap.a ? 0.35 : 0.15; // dimmer if crashed

  drawPlayer(ctx, mockPlayer, skin);

  // Name label above ghost
  ctx.globalAlpha = snap.a ? 0.7 : 0.4;
  ctx.fillStyle = tintColor;
  ctx.font = "bold 11px var(--font-nunito), Arial, sans-serif";
  ctx.textAlign = "center";
  const labelX = playerX + PLAYER_WIDTH / 2;
  const labelY = snap.y - 12;
  ctx.fillText(ghost.name, labelX, labelY);

  // Score below name
  ctx.font = "10px var(--font-nunito), Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = snap.a ? 0.5 : 0.3;
  ctx.fillText(String(snap.s), labelX, labelY + 12);

  ctx.restore();
}

/**
 * Draws a score differential HUD at the top of the screen
 * showing which ghost players are ahead or behind.
 */
export function drawGhostScoreHUD(
  ctx: CanvasRenderingContext2D,
  ghosts: GhostPlayer[],
  localScore: number,
  canvasW: number
): void {
  if (ghosts.length === 0) return;

  ctx.save();
  ctx.font = "bold 12px var(--font-nunito), Arial, sans-serif";
  ctx.textAlign = "right";

  let y = 60;
  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i];
    const diff = ghost.snapshot.s - localScore;
    const tintColor = GHOST_TINTS[i % GHOST_TINTS.length];

    ctx.globalAlpha = ghost.snapshot.a ? 0.8 : 0.4;
    ctx.fillStyle = tintColor;

    const prefix = diff > 0 ? "+" : "";
    const status = ghost.snapshot.a ? "" : " [crashed]";
    ctx.fillText(
      `${ghost.name}: ${prefix}${diff}${status}`,
      canvasW - 12,
      y
    );
    y += 18;
  }

  ctx.restore();
}
