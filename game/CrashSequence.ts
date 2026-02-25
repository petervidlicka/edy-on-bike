import {
  CrashState,
  PlayerState,
  AmbulanceState,
  AmbulancePhase,
} from "./types";
import {
  INITIAL_SPEED,
  CRASH_DURATION,
  CRASH_SHAKE_INITIAL,
  CRASH_GRAVITY,
  CRASH_BOUNCE_DAMPING,
  AMBULANCE_DRIVE_SPEED,
  AMBULANCE_DRIVE_OUT_SPEED,
  AMBULANCE_STOP_MS,
  AMBULANCE_REVIVE_MS,
  AMBULANCE_WIDTH,
  AMBULANCE_HEIGHT,
} from "./constants";

export function initCrashPhysics(
  cs: CrashState,
  p: PlayerState,
  speed: number,
): void {
  const speedFactor = speed / INITIAL_SPEED;

  cs.elapsed = 0;
  cs.duration = CRASH_DURATION;
  cs.shakeIntensity = CRASH_SHAKE_INITIAL;
  cs.shakeOffsetX = 0;
  cs.shakeOffsetY = 0;

  // Rider: ejected forward and upward
  cs.riderX = p.x + 10;
  cs.riderY = p.y - 5;
  cs.riderVX = speed * 0.6 + 1.5;
  cs.riderVY = -6 - speedFactor * 2;
  cs.riderAngle = 0;
  cs.riderAngularVel = 0.15 + speedFactor * 0.08;
  cs.riderBounceCount = 0;

  // Carry upward momentum if player was still rising
  if (p.velocityY < 0) {
    cs.riderVY += p.velocityY * 0.5;
  }

  // Bike: slides forward, slight upward kick
  cs.bikeX = p.x;
  cs.bikeY = p.y + p.height * 0.3;
  cs.bikeVX = speed * 0.3;
  cs.bikeVY = -2;
  cs.bikeAngle = 0;
  cs.bikeAngularVel = -0.08;
  cs.bikeBounceCount = 0;
  cs.bikeWheelRotation = p.wheelRotation;
}

/** Returns true if the crash sequence has completed its duration. */
export function updateCrashPhysics(
  cs: CrashState,
  dt: number,
  rawDt: number,
  groundY: number,
): boolean {
  cs.elapsed += rawDt / 1000;

  if (cs.elapsed >= cs.duration) {
    return true; // Done crashing
  }

  const friction = 0.95;
  const angularDamping = 0.7;

  // Screen shake — exponential decay
  cs.shakeIntensity *= 1 - 0.06 * dt;
  if (cs.shakeIntensity < 0.3) cs.shakeIntensity = 0;
  cs.shakeOffsetX = (Math.random() - 0.5) * 2 * cs.shakeIntensity;
  cs.shakeOffsetY = (Math.random() - 0.5) * 2 * cs.shakeIntensity;

  // Rider physics
  const riderGroundY = groundY - 15;
  const riderSettled = cs.riderBounceCount >= 2;
  if (!riderSettled) cs.riderVY += CRASH_GRAVITY * dt;
  cs.riderX += cs.riderVX * dt;
  if (!riderSettled) cs.riderY += cs.riderVY * dt;
  cs.riderAngle += cs.riderAngularVel * dt;
  cs.riderVX *= Math.pow(friction, dt);

  if (cs.riderY >= riderGroundY && cs.riderVY > 0 && !riderSettled) {
    cs.riderY = riderGroundY;
    cs.riderBounceCount++;
    if (cs.riderBounceCount >= 2) {
      cs.riderVY = 0;
      cs.riderAngularVel = 0;
    } else {
      cs.riderVY = -cs.riderVY * CRASH_BOUNCE_DAMPING;
      cs.riderAngularVel *= angularDamping;
    }
    cs.riderVX *= 0.7;
  }

  // Bike physics
  const bikeGroundY = groundY - 12;
  const bikeSettled = cs.bikeBounceCount >= 2;
  if (!bikeSettled) cs.bikeVY += CRASH_GRAVITY * dt;
  cs.bikeX += cs.bikeVX * dt;
  if (!bikeSettled) cs.bikeY += cs.bikeVY * dt;
  cs.bikeAngle += cs.bikeAngularVel * dt;
  cs.bikeVX *= Math.pow(friction, dt);

  if (cs.bikeY >= bikeGroundY && cs.bikeVY > 0 && !bikeSettled) {
    cs.bikeY = bikeGroundY;
    cs.bikeBounceCount++;
    if (cs.bikeBounceCount >= 2) {
      cs.bikeVY = 0;
      cs.bikeAngularVel = 0;
    } else {
      cs.bikeVY = -cs.bikeVY * CRASH_BOUNCE_DAMPING;
      cs.bikeAngularVel *= angularDamping;
    }
    cs.bikeVX *= 0.6;
  }

  // Decelerating wheel spin
  cs.bikeWheelRotation += cs.bikeVX * dt * 0.08;

  return false;
}

export function createAmbulanceState(
  playerX: number,
  playerWidth: number,
  canvasW: number,
  groundY: number,
): AmbulanceState {
  return {
    x: canvasW + 140,
    y: groundY - AMBULANCE_HEIGHT,
    width: AMBULANCE_WIDTH,
    height: AMBULANCE_HEIGHT,
    phase: AmbulancePhase.DRIVING_IN,
    phaseTimer: 0,
    targetX: playerX + playerWidth + 10,
    sirenFlash: 0,
    reviveFlashOpacity: 0,
  };
}

export enum AmbulanceAction {
  NONE = "none",
  STOP_SIREN = "stop_siren",
  REVIVE = "revive",
  RESUME_GAME = "resume_game",
  REMOVE = "remove",
}

export function updateAmbulanceLogic(
  amb: AmbulanceState,
  dt: number,
  rawDt: number,
  canvasW: number,
): AmbulanceAction {
  amb.phaseTimer += rawDt;
  amb.sirenFlash += rawDt;

  switch (amb.phase) {
    case AmbulancePhase.DRIVING_IN:
      amb.x -= AMBULANCE_DRIVE_SPEED * dt;
      if (amb.x <= amb.targetX) {
        amb.x = amb.targetX;
        amb.phase = AmbulancePhase.STOPPED;
        amb.phaseTimer = 0;
        return AmbulanceAction.STOP_SIREN;
      }
      break;

    case AmbulancePhase.STOPPED:
      if (amb.phaseTimer >= AMBULANCE_STOP_MS) {
        amb.phase = AmbulancePhase.REVIVING;
        amb.phaseTimer = 0;
        amb.reviveFlashOpacity = 1;
        return AmbulanceAction.REVIVE;
      }
      break;

    case AmbulancePhase.REVIVING:
      amb.reviveFlashOpacity = Math.max(
        0,
        1 - amb.phaseTimer / AMBULANCE_REVIVE_MS,
      );
      if (amb.phaseTimer >= AMBULANCE_REVIVE_MS) {
        amb.phase = AmbulancePhase.DRIVING_OUT;
        amb.phaseTimer = 0;
        return AmbulanceAction.RESUME_GAME;
      }
      break;

    case AmbulancePhase.DRIVING_OUT:
      amb.x += AMBULANCE_DRIVE_OUT_SPEED * dt;
      if (amb.x > canvasW + 20) {
        return AmbulanceAction.REMOVE;
      }
      break;
  }

  return AmbulanceAction.NONE;
}
