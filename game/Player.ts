import { PlayerState, TrickType } from "./types";
import { PLAYER_X_RATIO, PLAYER_WIDTH, PLAYER_HEIGHT, GRAVITY, JUMP_FORCE, RIDEABLE_JUMP_MULTIPLIER, BACKFLIP_SPEED, RAMP_HEIGHT_MULTIPLIER, SUPERMAN_SPEED, NO_HANDER_SPEED } from "./constants";

export function createPlayer(groundY: number, canvasWidth: number): PlayerState {
  return {
    x: Math.floor(canvasWidth * PLAYER_X_RATIO),
    y: groundY - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityY: 0,
    jumpCount: 0,
    isOnGround: true,
    wheelRotation: 0,
    bikeTilt: 0,
    riderLean: 0,
    riderCrouch: 0,
    legTuck: 0,
    ridingObstacle: null,
    backflipAngle: 0,
    isBackflipping: false,
    flipDirection: 1,
    activeTrick: TrickType.NONE,
    trickProgress: 0,
    trickPhase: "extend",
    trickCompletions: 0,
    rampBoost: null,
    rampSurfaceAngle: 0,
  };
}

export function jumpPlayer(player: PlayerState): void {
  // Super-jump off a rideable obstacle
  if (player.ridingObstacle) {
    player.velocityY = JUMP_FORCE * RIDEABLE_JUMP_MULTIPLIER;
    player.isOnGround = false;
    player.jumpCount = 1; // counts as first jump — can still double-jump
    player.ridingObstacle = null;
    return;
  }
  if (player.jumpCount >= 2) return;
  let force = player.jumpCount === 0 ? JUMP_FORCE : JUMP_FORCE * 0.85;
  // Curved ramp boost: 50% more height on first jump
  if (player.jumpCount === 0 && player.rampBoost === "curved") {
    force *= RAMP_HEIGHT_MULTIPLIER;
  }
  player.velocityY = force;
  player.isOnGround = false;
  player.jumpCount++;
}

export function startBackflip(player: PlayerState): boolean {
  if (player.isOnGround || player.isBackflipping || player.ridingObstacle) return false;
  if (player.activeTrick !== TrickType.NONE) return false;
  player.isBackflipping = true;
  player.backflipAngle = 0;
  player.flipDirection = 1;
  return true;
}

export function startFrontflip(player: PlayerState): boolean {
  if (player.isOnGround || player.isBackflipping || player.ridingObstacle) return false;
  if (player.activeTrick !== TrickType.NONE) return false;
  player.isBackflipping = true;
  player.backflipAngle = 0;
  player.flipDirection = -1;
  return true;
}

export function startSuperman(player: PlayerState): boolean {
  if (player.isOnGround || player.ridingObstacle) return false;
  if (player.isBackflipping || player.activeTrick !== TrickType.NONE) return false;
  player.activeTrick = TrickType.SUPERMAN;
  player.trickProgress = 0;
  player.trickPhase = "extend";
  return true;
}

export function startNoHander(player: PlayerState): boolean {
  if (player.isOnGround || player.ridingObstacle) return false;
  if (player.isBackflipping || player.activeTrick !== TrickType.NONE) return false;
  player.activeTrick = TrickType.NO_HANDER;
  player.trickProgress = 0;
  player.trickPhase = "extend";
  return true;
}

export function updatePlayer(
  player: PlayerState,
  dt: number,
  groundY: number,
  speed: number
): void {
  // If riding an obstacle, skip normal physics (Engine manages Y position)
  if (player.ridingObstacle) {
    player.wheelRotation += speed * dt * 0.08;
    // Smoothly return animation to neutral
    player.bikeTilt += (0 - player.bikeTilt) * 0.25 * dt;
    player.riderLean += (0 - player.riderLean) * 0.2 * dt;
    player.riderCrouch += (0 - player.riderCrouch) * 0.2 * dt;
    player.legTuck += (0 - player.legTuck) * 0.2 * dt;
    return;
  }

  if (!player.isOnGround) {
    // Straight ramp boost: reduced gravity for 50% more horizontal distance
    const effectiveGravity = player.rampBoost === "straight" ? GRAVITY * 0.667 : GRAVITY;
    player.velocityY += effectiveGravity * dt;
    player.y += player.velocityY * dt;

    const groundPos = groundY - player.height;
    if (player.y >= groundPos) {
      player.y = groundPos;
      player.velocityY = 0;
      player.isOnGround = true;
      player.jumpCount = 0;
      player.rampBoost = null;
    }
  }

  // Wheel rotation synced to game speed
  player.wheelRotation += speed * dt * 0.08;

  // --- Backflip / frontflip rotation ---
  if (player.isBackflipping) {
    player.backflipAngle += BACKFLIP_SPEED * dt;
  }

  // --- Pose trick animation (superman, no hander) ---
  if (player.activeTrick !== TrickType.NONE) {
    const speed = player.activeTrick === TrickType.SUPERMAN ? SUPERMAN_SPEED : NO_HANDER_SPEED;
    if (player.trickPhase === "extend") {
      player.trickProgress = Math.min(1, player.trickProgress + speed * dt);
      if (player.trickProgress >= 1) {
        player.trickPhase = "return";
      }
    } else {
      player.trickProgress = Math.max(0, player.trickProgress - speed * dt);
      if (player.trickProgress <= 0) {
        player.trickCompletions++;
        player.trickPhase = "extend"; // ready for next chain
      }
    }
  }

  // --- Bunnyhop animation ---
  if (!player.isOnGround) {
    if (player.isBackflipping) {
      // Suppress bunnyhop tilt during backflip — return to neutral
      player.bikeTilt += (0 - player.bikeTilt) * 0.3 * dt;
      player.riderLean += (0 - player.riderLean) * 0.3 * dt;
      player.riderCrouch += (0 - player.riderCrouch) * 0.3 * dt;
      player.legTuck += (0 - player.legTuck) * 0.3 * dt;
    } else {
      const normalizedVel = -player.velocityY / 12;

      // Bike tilt: front wheel up while ascending, nose down while descending
      const targetTilt = Math.max(-0.3, Math.min(0.45, -player.velocityY * 0.03));
      player.bikeTilt += (targetTilt - player.bikeTilt) * 0.15 * dt;

      // Rider lean: lean back on ascent, forward on descent (staggered phase 1)
      const targetLean = normalizedVel * 0.35;
      player.riderLean += (targetLean - player.riderLean) * 0.13 * dt;

      // Rider crouch/stand: peaks mid-ascent at normalizedVel ≈ 0.3 (staggered phase 2)
      const targetCrouch = Math.max(0, 1 - Math.abs(normalizedVel - 0.3) * 2.5);
      player.riderCrouch += (targetCrouch - player.riderCrouch) * 0.13 * dt;

      // Leg tuck: peaks just past peak at normalizedVel ≈ -0.15 (staggered phase 3)
      const targetTuck = Math.max(0, 1 - Math.abs(normalizedVel + 0.15) * 2);
      player.legTuck += (targetTuck - player.legTuck) * 0.13 * dt;
    }
  } else {
    // Smoothly return all to neutral on ground
    if (player.rampSurfaceAngle !== 0) {
      // Match bike tilt to ramp surface
      const targetTilt = -player.rampSurfaceAngle;
      player.bikeTilt += (targetTilt - player.bikeTilt) * 0.3 * dt;
    } else {
      player.bikeTilt += (0 - player.bikeTilt) * 0.25 * dt;
    }
    player.riderLean += (0 - player.riderLean) * 0.2 * dt;
    player.riderCrouch += (0 - player.riderCrouch) * 0.2 * dt;
    player.legTuck += (0 - player.legTuck) * 0.2 * dt;
  }
}
