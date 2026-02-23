import { PlayerState, TrickType } from "./types";
import { PLAYER_X_RATIO, PLAYER_WIDTH, PLAYER_HEIGHT, GRAVITY, JUMP_FORCE, RIDEABLE_JUMP_MULTIPLIER, BACKFLIP_SPEED, RAMP_HEIGHT_MULTIPLIER, SUPERMAN_SPEED, NO_HANDER_SPEED, MAX_FLIP_COUNT } from "./constants";

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
    targetFlipCount: 0,
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
  if (player.isOnGround || player.ridingObstacle) return false;

  // If already backflipping, queue an additional flip — but only after 90° of
  // progress into the current target to prevent accidental double-queue
  if (player.isBackflipping && player.flipDirection === 1) {
    const minAngle = (player.targetFlipCount - 1) * Math.PI * 2 + Math.PI / 2;
    if (player.targetFlipCount < MAX_FLIP_COUNT && player.backflipAngle >= minAngle) {
      player.targetFlipCount++;
      return true;
    }
    return false;
  }
  // Can't start a backflip while frontflipping
  if (player.isBackflipping) return false;

  // Allow starting a flip while a pose trick is active (combo)
  player.isBackflipping = true;
  player.backflipAngle = 0;
  player.flipDirection = 1;
  player.targetFlipCount = 1;
  return true;
}

export function startFrontflip(player: PlayerState): boolean {
  if (player.isOnGround || player.ridingObstacle) return false;

  // If already frontflipping, queue an additional flip — but only after 90° of
  // progress into the current target to prevent accidental double-queue
  if (player.isBackflipping && player.flipDirection === -1) {
    const minAngle = (player.targetFlipCount - 1) * Math.PI * 2 + Math.PI / 2;
    if (player.targetFlipCount < MAX_FLIP_COUNT && player.backflipAngle >= minAngle) {
      player.targetFlipCount++;
      return true;
    }
    return false;
  }
  // Can't start a frontflip while backflipping
  if (player.isBackflipping) return false;

  // Allow starting a flip while a pose trick is active (combo)
  player.isBackflipping = true;
  player.backflipAngle = 0;
  player.flipDirection = -1;
  player.targetFlipCount = 1;
  return true;
}

export function startSuperman(player: PlayerState): boolean {
  if (player.isOnGround || player.ridingObstacle) return false;
  if (player.activeTrick !== TrickType.NONE) return false; // can't switch pose tricks
  // Allow starting a pose trick while flipping (combo)
  player.activeTrick = TrickType.SUPERMAN;
  player.trickProgress = 0;
  player.trickPhase = "extend";
  return true;
}

export function startNoHander(player: PlayerState): boolean {
  if (player.isOnGround || player.ridingObstacle) return false;
  if (player.activeTrick !== TrickType.NONE) return false; // can't switch pose tricks
  // Allow starting a pose trick while flipping (combo)
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
    // Straight ramp boost: reduced gravity for more horizontal distance
    const effectiveGravity = player.rampBoost === "straight" ? GRAVITY * 0.5 : GRAVITY;
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
    const targetAngle = player.targetFlipCount * Math.PI * 2;
    const remaining = targetAngle - player.backflipAngle;

    if (remaining > 0) {
      // Decelerate as we approach the target angle
      const decelZone = Math.PI * 0.6; // ~108° before target, start slowing
      let speedFactor = 1.0;
      if (remaining < decelZone) {
        speedFactor = 0.3 + 0.7 * (remaining / decelZone);
      }
      player.backflipAngle = Math.min(
        player.backflipAngle + BACKFLIP_SPEED * speedFactor * dt,
        targetAngle,
      );
    }
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
      // BMX bunnyhop phases driven by normalizedVel (1 = launch, 0 = peak, <0 = descent)
      const normalizedVel = -player.velocityY / 12;

      // Phase 1 (early ascent): Rider leans back hard and crouches low — loading the rear
      const leanBack = Math.max(0, normalizedVel) ** 0.7 * 0.55;
      const targetLean = leanBack;
      player.riderLean += (targetLean - player.riderLean) * 0.18 * dt;

      // Rider crouch: LOW early (crouching into the jump), then extends/stands up at peak
      // Negative normalizedVel-offset makes crouch peak during early ascent
      const crouchDown = Math.max(0, normalizedVel - 0.2) * 1.2; // crouch in early ascent
      const standUp = Math.max(0, 0.3 - Math.abs(normalizedVel)) * 2.5; // stand near peak
      const targetCrouch = Math.min(1, Math.max(standUp - crouchDown * 0.5, -0.3));
      player.riderCrouch += (targetCrouch - player.riderCrouch) * 0.15 * dt;

      // Phase 2 (slightly delayed): Bike tilts backward — front wheel lifts
      // Delayed onset: only kicks in once normalizedVel drops below ~0.85
      const tiltPhase = Math.max(0, Math.min(1, (1 - normalizedVel) * 2.5));
      const ascentTilt = tiltPhase * Math.max(0, normalizedVel) * 0.35;
      const descentTilt = Math.min(0, normalizedVel) * 0.03;
      const targetTilt = Math.max(-0.04, Math.min(0.35, ascentTilt + descentTilt));
      player.bikeTilt += (targetTilt - player.bikeTilt) * 0.14 * dt;

      // Phase 4 (descent): Leg tuck peaks just past peak
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
