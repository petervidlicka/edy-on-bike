import { describe, expect, it } from "vitest";
import { AmbulanceAction, createAmbulanceState, updateAmbulanceLogic } from "./CrashSequence";
import { AMBULANCE_REVIVE_MS, AMBULANCE_STOP_MS, AMBULANCE_WIDTH } from "./constants";
import { AmbulancePhase } from "./types";

const FRAME_MS = 1000 / 60;

describe("ambulance sequence", () => {
  it("drives in, stops, revives, drives out, and asks for each action once in order", () => {
    const amb = createAmbulanceState(200, 64, 1000, 480);
    expect(amb.x).toBe(1140);
    expect(amb.targetX).toBe(274);
    expect(amb.phase).toBe(AmbulancePhase.DRIVING_IN);

    const actions: AmbulanceAction[] = [];
    const phasesAt: Partial<Record<AmbulanceAction, AmbulancePhase>> = {};
    for (let i = 0; i < 5000; i++) {
      const action = updateAmbulanceLogic(amb, 1, FRAME_MS);
      if (action === AmbulanceAction.NONE) continue;
      actions.push(action);
      phasesAt[action] = amb.phase;
      if (action === AmbulanceAction.REMOVE) break;
    }
    expect(actions).toEqual([
      AmbulanceAction.STOP_SIREN,
      AmbulanceAction.REVIVE,
      AmbulanceAction.RESUME_GAME,
      AmbulanceAction.REMOVE,
    ]);
    expect(phasesAt[AmbulanceAction.STOP_SIREN]).toBe(AmbulancePhase.STOPPED);
    expect(phasesAt[AmbulanceAction.REVIVE]).toBe(AmbulancePhase.REVIVING);
    expect(phasesAt[AmbulanceAction.RESUME_GAME]).toBe(AmbulancePhase.DRIVING_OUT);
    expect(amb.x + AMBULANCE_WIDTH).toBeLessThan(-20);
  });

  it("parks exactly at the target and waits the stop and revive times", () => {
    const amb = createAmbulanceState(200, 64, 1000, 480);
    while (amb.phase === AmbulancePhase.DRIVING_IN) updateAmbulanceLogic(amb, 1, FRAME_MS);
    expect(amb.x).toBe(amb.targetX);

    // Stopped: nothing until AMBULANCE_STOP_MS has passed
    expect(updateAmbulanceLogic(amb, 1, AMBULANCE_STOP_MS - 1)).toBe(AmbulanceAction.NONE);
    expect(updateAmbulanceLogic(amb, 1, 1)).toBe(AmbulanceAction.REVIVE);
    expect(amb.reviveFlashOpacity).toBe(1);

    // Reviving: the flash fades over AMBULANCE_REVIVE_MS, then the game resumes
    expect(updateAmbulanceLogic(amb, 1, AMBULANCE_REVIVE_MS / 2)).toBe(AmbulanceAction.NONE);
    expect(amb.reviveFlashOpacity).toBeCloseTo(0.5);
    expect(updateAmbulanceLogic(amb, 1, AMBULANCE_REVIVE_MS / 2)).toBe(AmbulanceAction.RESUME_GAME);
    expect(amb.reviveFlashOpacity).toBe(0);
  });
});
