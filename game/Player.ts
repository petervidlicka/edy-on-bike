import { PlayerState } from "./types";
import { PLAYER_X_RATIO, PLAYER_WIDTH, PLAYER_HEIGHT, GRAVITY, JUMP_FORCE, RIDEABLE_JUMP_MULTIPLIER, BACKFLIP_SPEED } from "./constants";

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
  const force = player.jumpCount === 0 ? JUMP_FORCE : JUMP_FORCE * 0.85;
  player.velocityY = force;
  player.isOnGround = false;
  player.jumpCount++;
}

export function startBackflip(player: PlayerState): boolean {
  if (player.isOnGround || player.isBackflipping || player.ridingObstacle) {
    return false;
  }
  player.isBackflipping = true;
  player.backflipAngle = 0;
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
    player.velocityY += GRAVITY * dt;
    player.y += player.velocityY * dt;

    const groundPos = groundY - player.height;
    if (player.y >= groundPos) {
      player.y = groundPos;
      player.velocityY = 0;
      player.isOnGround = true;
      player.jumpCount = 0;
    }
  }

  // Wheel rotation synced to game speed
  player.wheelRotation += speed * dt * 0.08;

  // --- Backflip rotation ---
  if (player.isBackflipping) {
    player.backflipAngle += BACKFLIP_SPEED * dt;
    if (player.backflipAngle >= Math.PI * 2) {
      player.backflipAngle = Math.PI * 2;
      player.isBackflipping = false;
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
    player.bikeTilt += (0 - player.bikeTilt) * 0.25 * dt;
    player.riderLean += (0 - player.riderLean) * 0.2 * dt;
    player.riderCrouch += (0 - player.riderCrouch) * 0.2 * dt;
    player.legTuck += (0 - player.legTuck) * 0.2 * dt;
  }
}
