/**
 * Hit testing between the rider and obstacles: plain overlap, landing on or crashing
 * into a rideable, and following a ramp's surface. Pure functions over the data objects.
 */
import { PlayerState, ObstacleInstance, RampType } from "./types";
import { HITBOX_PADDING } from "./constants";
import { OBSTACLE_SPECS } from "./Obstacle";
import { CONTAINER_RAMP, curvedRampSurface, type RampSurface } from "./rampGeometry";

export { HITBOX_PADDING };

/** Scratch result for curved surfaces, reused so collision checks allocate nothing extra. */
const SURFACE: RampSurface = { y: 0, angle: 0 };

// How many pixels below the obstacle top still count as "landing on top" when the
// previous position isn't known. Covers ~18px of fall per frame at 60fps; slower frames
// fall further, which the swept check in checkRideableCollision handles.
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

/**
 * Classifies an overlap with a rideable obstacle as a landing on top or a crash.
 * @param prevY - The rider's y before this frame's movement. A rider whose bottom was
 *   above the top last frame landed on it, however far they fell in one (slow) frame.
 */
export function checkRideableCollision(
  player: PlayerState,
  obstacle: ObstacleInstance,
  prevY: number = player.y
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

  // For CONTAINER_WITH_RAMP, follow the actual curved ramp surface so
  // landings at any point on the ramp are detected correctly (not just the peak).
  let effectiveOy1 = oy1;
  if (OBSTACLE_SPECS[obstacle.type].ramp === "onContainer") {
    const rampX = obstacle.x + obstacle.width - CONTAINER_RAMP.width;
    const playerCenterX = (px1 + px2) / 2;
    if (playerCenterX >= rampX) {
      const t = Math.min(1, (playerCenterX - rampX) / CONTAINER_RAMP.width);
      effectiveOy1 = curvedRampSurface(t, CONTAINER_RAMP.width, CONTAINER_RAMP.height, obstacle.y, SURFACE).y;
    }
  }

  // No overlap at all
  if (px2 <= ox1 || px1 >= ox2 || py2 <= effectiveOy1 || py1 >= oy2) {
    return "none";
  }

  // There is overlap. Check if it qualifies as "landing on top":
  // 1. Player must be falling (velocityY > 0)
  // 2. Player's bottom edge must be near the top of the obstacle
  // 3. At least 25% of the player's width overlaps the obstacle (allows rear-wheel landings)
  //    Except when hitting the back edge (leaving the obstacle), where any overlap is fine.
  const playerBottom = py2;
  const obstacleTop = effectiveOy1;
  const overlapLeft = Math.max(px1, ox1);
  const overlapRight = Math.min(px2, ox2);
  const overlapWidth = overlapRight - overlapLeft;
  const playerWidth = px2 - px1;

  const isLeaving = px2 > ox2;
  const requiredOverlapRatio = isLeaving ? 0 : 0.25;

  const prevBottom = prevY + player.height - HITBOX_PADDING;
  const crossedTop = prevBottom <= obstacleTop + TOP_LANDING_TOLERANCE;
  if (
    player.velocityY > 0 &&
    playerBottom >= obstacleTop &&
    (playerBottom <= obstacleTop + TOP_LANDING_TOLERANCE || crossedTop) &&
    overlapWidth / playerWidth >= requiredOverlapRatio
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
  rampType: RampType | null;
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

  // The profile comes from the spec, so the snow kicker shares the curved ramp's surface
  // (only its art differs) and a container's kicker is handled by the riding code instead
  const shape = OBSTACLE_SPECS[obstacle.type].ramp;
  if (shape === "straight") {
    const surfaceY = rampBaseY - t * obstacle.height;
    const surfaceAngle = Math.atan2(-obstacle.height, obstacle.width);
    return { onRamp: true, surfaceY, surfaceAngle, rampType: "straight" };
  }
  if (shape === "curved") {
    const surface = curvedRampSurface(t, obstacle.width, obstacle.height, rampBaseY, SURFACE);
    return { onRamp: true, surfaceY: surface.y, surfaceAngle: surface.angle, rampType: "curved" };
  }

  return NO_RAMP;
}
