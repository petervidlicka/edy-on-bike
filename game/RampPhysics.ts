import { PlayerState, ObstacleInstance, ObstacleType } from "./types";
import { JUMP_FORCE, RAMP_HEIGHT_MULTIPLIER } from "./constants";
import { checkRampCollision } from "./Collision";

/**
 * Process all standalone ramp obstacles (STRAIGHT_RAMP, CURVED_RAMP).
 * Mutates player position, rampSurfaceAngle, rampBoost, velocityY as needed.
 * When no ramp is active, applies auto-launch and angle decay.
 */
export function processRampInteractions(
  player: PlayerState,
  obstacles: ObstacleInstance[],
  groundY: number
): { onAnyRamp: boolean } {
  let onAnyRamp = false;

  for (const obs of obstacles) {
    if (!obs.ramp) continue;
    if (!player.isOnGround && !player.ridingObstacle) continue;
    const rampResult = checkRampCollision(player, obs);
    if (rampResult.onRamp) {
      onAnyRamp = true;
      player.y = rampResult.surfaceY - player.height;
      player.rampSurfaceAngle = rampResult.surfaceAngle;
      player.rampBoost = rampResult.rampType;
    }
  }

  if (!onAnyRamp) {
    // Check if player just left a ramp (was elevated, now past the ramp end)
    if (player.rampBoost && player.isOnGround) {
      const groundPos = groundY - player.height;
      if (player.y < groundPos - 2) {
        // Auto-launch: player is above ground after riding off ramp
        // Gentle boost for passive roll-off; active jump gives full boost
        player.isOnGround = false;
        player.jumpCount = 1; // can still double-jump
        if (player.rampBoost === "curved") {
          player.velocityY = JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER * 0.2;
        } else {
          player.velocityY = JUMP_FORCE * 0.2;
        }
      }
    }
    // Smooth angle decay
    player.rampSurfaceAngle *= 0.85;
    if (Math.abs(player.rampSurfaceAngle) < 0.01) {
      player.rampSurfaceAngle = 0;
    }
  }

  return { onAnyRamp };
}

/**
 * Process the ridingObstacle surface — checks for scroll-past and updates
 * the player's y position to track the obstacle top (including the
 * curved ramp section on CONTAINER_WITH_RAMP).
 * Mutates player position, rampBoost, rampSurfaceAngle, ridingObstacle.
 */
export function processRidingState(player: PlayerState): { onRamp: boolean } {
  if (!player.ridingObstacle) return { onRamp: false };

  const obs = player.ridingObstacle;
  let onRamp = false;

  if (obs.x + obs.width < player.x + 8) {
    // Obstacle scrolled past player — apply gentle boost then clear riding state
    if (player.rampBoost) {
      player.jumpCount = 1;
      if (player.rampBoost === "curved") {
        player.velocityY = JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER * 0.2;
      } else {
        player.velocityY = JUMP_FORCE * 0.2;
      }
    }
    player.ridingObstacle = null;
  } else if (obs.type === ObstacleType.CONTAINER_WITH_RAMP) {
    // Container with ramp: last 75px has a curved ramp on top
    const rampW = 75;
    const rampH = 36;
    const rampX = obs.x + obs.width - rampW;
    const playerCenterX = player.x + player.width / 2;
    if (playerCenterX >= rampX) {
      // Player is on the ramp section — compute curved surface Y
      const t = (playerCenterX - rampX) / rampW;
      const curvedT = t * t;
      const surfaceY = obs.y - curvedT * rampH;
      player.y = surfaceY - player.height;
      player.rampBoost = "curved";
      player.rampSurfaceAngle = Math.atan2((-2 * t * rampH) / rampW, 1);
      onRamp = true;
    } else {
      player.y = obs.y - player.height;
    }
  } else {
    player.y = obs.y - player.height;
  }

  return { onRamp };
}
