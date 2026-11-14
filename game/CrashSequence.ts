/**
 * The ambulance that may come for a crashed rider: it drives in, stops, revives the
 * rider and drives out again. The crash animation itself lives in `game/crashes/`.
 */
import { AmbulanceState, AmbulancePhase } from "./types";
import {
  AMBULANCE_DRIVE_SPEED,
  AMBULANCE_DRIVE_OUT_SPEED,
  AMBULANCE_STOP_MS,
  AMBULANCE_REVIVE_MS,
  AMBULANCE_WIDTH,
  AMBULANCE_HEIGHT,
} from "./constants";

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
      // Keeps driving the way it came (leftwards, behind the rider) rather than U-turning.
      amb.x -= AMBULANCE_DRIVE_OUT_SPEED * dt;
      if (amb.x + amb.width < -20) {
        return AmbulanceAction.REMOVE;
      }
      break;
  }

  return AmbulanceAction.NONE;
}
