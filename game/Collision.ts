import { PlayerState, ObstacleInstance } from "./types";

// Inner padding makes hitboxes slightly smaller than the visual bounds,
// so near-misses feel fair rather than frustrating.
const HITBOX_PADDING = 8;

// How many pixels from the obstacle top counts as "landing on top".
// Must be larger than the max fall distance per frame (~18px at peak velocity).
const TOP_LANDING_TOLERANCE = 30;

export function checkCollision(player: PlayerState, obstacle: ObstacleInstance): boolean {
  return (
    player.x + HITBOX_PADDING < obstacle.x + obstacle.width - HITBOX_PADDING &&
    player.x + player.width - HITBOX_PADDING > obstacle.x + HITBOX_PADDING &&
    player.y + HITBOX_PADDING < obstacle.y + obstacle.height - HITBOX_PADDING &&
    player.y + player.height - HITBOX_PADDING > obstacle.y + HITBOX_PADDING
  );
}

export type RideableCollisionResult = "none" | "crash" | "land_on_top";

export function checkRideableCollision(
  player: PlayerState,
  obstacle: ObstacleInstance
): RideableCollisionResult {
  const px1 = player.x + HITBOX_PADDING;
  const px2 = player.x + player.width - HITBOX_PADDING;
  const py1 = player.y + HITBOX_PADDING;
  const py2 = player.y + player.height - HITBOX_PADDING;
  const ox1 = obstacle.x + HITBOX_PADDING;
  const ox2 = obstacle.x + obstacle.width - HITBOX_PADDING;
  // For rideable obstacles the visual top IS the landing surface — no top padding.
  // Side and bottom padding remain so near-misses feel forgiving.
  const oy1 = obstacle.y;
  const oy2 = obstacle.y + obstacle.height - HITBOX_PADDING;

  // No overlap at all
  if (px2 <= ox1 || px1 >= ox2 || py2 <= oy1 || py1 >= oy2) {
    return "none";
  }

  // There is overlap. Check if it qualifies as "landing on top":
  // 1. Player must be falling (velocityY > 0)
  // 2. Player's bottom edge must be near the top of the obstacle
  // 3. Player's horizontal center must be within the obstacle bounds
  const playerBottom = py2;
  const obstacleTop = oy1;
  const playerCenterX = (px1 + px2) / 2;

  if (
    player.velocityY > 0 &&
    playerBottom >= obstacleTop &&
    playerBottom <= obstacleTop + TOP_LANDING_TOLERANCE &&
    playerCenterX >= ox1 &&
    playerCenterX <= ox2
  ) {
    return "land_on_top";
  }

  // Any other overlap is a crash
  return "crash";
}
