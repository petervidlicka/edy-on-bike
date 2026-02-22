import { PlayerState, ObstacleInstance, ObstacleType } from "./types";

// Inner padding makes hitboxes slightly smaller than the visual bounds,
// so near-misses feel fair rather than frustrating.
const HITBOX_PADDING = 8;

// How many pixels from the obstacle top counts as "landing on top".
// Must be larger than the max fall distance per frame (~18px at peak velocity).
const TOP_LANDING_TOLERANCE = 35;

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
  // 3. At least 25% of the player's width overlaps the obstacle (allows rear-wheel landings)
  const playerBottom = py2;
  const obstacleTop = oy1;
  const overlapLeft = Math.max(px1, ox1);
  const overlapRight = Math.min(px2, ox2);
  const overlapWidth = overlapRight - overlapLeft;
  const playerWidth = px2 - px1;

  if (
    player.velocityY > 0 &&
    playerBottom >= obstacleTop &&
    playerBottom <= obstacleTop + TOP_LANDING_TOLERANCE &&
    overlapWidth / playerWidth >= 0.25
  ) {
    return "land_on_top";
  }

  // Any other overlap is a crash
  return "crash";
}

export interface RampCollisionResult {
  onRamp: boolean;
  surfaceY: number;
  surfaceAngle: number;
  rampType: "straight" | "curved" | null;
}

const NO_RAMP: RampCollisionResult = { onRamp: false, surfaceY: 0, surfaceAngle: 0, rampType: null };

export function checkRampCollision(
  player: PlayerState,
  obstacle: ObstacleInstance
): RampCollisionResult {
  if (!obstacle.ramp) return NO_RAMP;

  const playerCenterX = player.x + player.width / 2;
  const rampLeft = obstacle.x;
  const rampRight = obstacle.x + obstacle.width;

  // Player must be horizontally overlapping the ramp
  if (playerCenterX < rampLeft || playerCenterX > rampRight) return NO_RAMP;

  const t = (playerCenterX - rampLeft) / obstacle.width; // 0..1 across ramp
  const rampBaseY = obstacle.y + obstacle.height; // bottom = ground level

  if (obstacle.type === ObstacleType.STRAIGHT_RAMP) {
    const surfaceY = rampBaseY - t * obstacle.height;
    const surfaceAngle = Math.atan2(-obstacle.height, obstacle.width);
    return { onRamp: true, surfaceY, surfaceAngle, rampType: "straight" };
  }

  if (obstacle.type === ObstacleType.CURVED_RAMP) {
    const curvedT = t * t; // ease-in quadratic — gentle at bottom, steep at lip
    const surfaceY = rampBaseY - curvedT * obstacle.height;
    const dydx = (-2 * t * obstacle.height) / obstacle.width;
    const surfaceAngle = Math.atan2(dydx, 1);
    return { onRamp: true, surfaceY, surfaceAngle, rampType: "curved" };
  }

  return NO_RAMP;
}
