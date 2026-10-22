/**
 * Ramp riding: snaps the rider to standalone ramps and to the kicker on top of a
 * container, launches them off the lip, and eases the bike's tilt back afterwards.
 */
import { PlayerState, ObstacleInstance, RampType } from "./types";
import { JUMP_FORCE, RAMP_HEIGHT_MULTIPLIER } from "./constants";
import { checkRampCollision } from "./Collision";
import { OBSTACLE_SPECS } from "./Obstacle";
import { CONTAINER_RAMP, curvedRampSurface, type RampSurface } from "./rampGeometry";

/** Scratch result for the container kicker, reused every frame so riding allocates nothing. */
const SURFACE: RampSurface = { y: 0, angle: 0 };

/**
 * Upward kick when the rider rolls off a ramp without jumping: a fifth of a jump, with
 * the curve's extra height. An active jump on the ramp gives the full boost instead.
 */
function rollOffVelocity(boost: RampType): number {
  return boost === "curved" ? JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER * 0.2 : JUMP_FORCE * 0.2;
}

/**
 * Process all standalone ramp obstacles (STRAIGHT_RAMP, CURVED_RAMP, SNOW_KICKER).
 * Mutates player position, rampSurfaceAngle, rampBoost, velocityY as needed.
 * When no ramp is active, applies auto-launch and angle decay.
 * @returns Whether the rider is on a ramp this frame.
 */
export function processRampInteractions(
  player: PlayerState,
  obstacles: ObstacleInstance[],
  groundY: number,
  dt = 1
): boolean {
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
        player.isOnGround = false;
        player.jumpCount = 1; // can still double-jump
        player.velocityY = rollOffVelocity(player.rampBoost);
      }
    }
    // Smooth angle decay, per 60fps frame so it eases the same at any refresh rate
    player.rampSurfaceAngle *= Math.pow(0.85, dt);
    if (Math.abs(player.rampSurfaceAngle) < 0.01) {
      player.rampSurfaceAngle = 0;
    }
  }

  return onAnyRamp;
}

/**
 * Process the ridingObstacle surface — checks for scroll-past and updates
 * the player's y position to track the obstacle top (including the
 * curved ramp section on CONTAINER_WITH_RAMP).
 * Mutates player position, rampBoost, rampSurfaceAngle, ridingObstacle.
 */
export function processRidingState(player: PlayerState): void {
  const obs = player.ridingObstacle;
  if (!obs) return;

  if (obs.x + obs.width < player.x + 8) {
    // Obstacle scrolled past player — apply gentle boost then clear riding state
    if (player.rampBoost) {
      player.jumpCount = 1;
      player.velocityY = rollOffVelocity(player.rampBoost);
    }
    player.ridingObstacle = null;
  } else if (OBSTACLE_SPECS[obs.type].ramp === "onContainer") {
    // The box's last CONTAINER_RAMP.width px carry a curved kicker on the roof
    const rampX = obs.x + obs.width - CONTAINER_RAMP.width;
    const playerCenterX = player.x + player.width / 2;
    if (playerCenterX >= rampX) {
      // Player is on the ramp section — follow the curved surface
      const t = (playerCenterX - rampX) / CONTAINER_RAMP.width;
      const surface = curvedRampSurface(t, CONTAINER_RAMP.width, CONTAINER_RAMP.height, obs.y, SURFACE);
      player.y = surface.y - player.height;
      player.rampBoost = "curved";
      player.rampSurfaceAngle = surface.angle;
    } else {
      player.y = obs.y - player.height;
    }
  } else {
    player.y = obs.y - player.height;
  }
}
