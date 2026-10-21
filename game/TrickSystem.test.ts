import { describe, expect, it } from "vitest";
import { evaluateComboLanding, evaluateFlipLanding, evaluatePoseTrickLanding, resetAllTrickState } from "./TrickSystem";
import { createPlayer } from "./Player";
import { TrickType } from "./types";
import {
  BACKFLIP_BONUS, COMBO_MULTIPLIER, DOUBLE_CHAIN_BONUS, FLIP_TOLERANCE, SKETCHY_PENALTY,
  SKETCHY_TOLERANCE, SUPERMAN_BONUS, TRIPLE_CHAIN_BONUS,
} from "./constants";

const FULL = Math.PI * 2;
const flip = (angle: number, direction = 1) => evaluateFlipLanding(angle, direction, FULL, FLIP_TOLERANCE, SKETCHY_TOLERANCE);

describe("evaluateFlipLanding", () => {
  it("lands a clean backflip within tolerance", () => {
    expect(flip(FULL + FLIP_TOLERANCE * 0.9)).toEqual({ crashed: false, label: "Backflip", bonus: BACKFLIP_BONUS, sketchy: false });
  });

  it("names frontflips by direction", () => {
    expect(flip(FULL, -1).label).toBe("Frontflip");
  });

  it("pays double and triple flips with the chain bonus", () => {
    expect(flip(FULL * 2)).toMatchObject({ label: "Double Backflip", bonus: 2 * BACKFLIP_BONUS + DOUBLE_CHAIN_BONUS });
    expect(flip(FULL * 3)).toMatchObject({ label: "Triple Backflip", bonus: 3 * BACKFLIP_BONUS + TRIPLE_CHAIN_BONUS });
  });

  it("lands sketchy just outside the clean zone, with the penalty", () => {
    const result = flip(FULL - FLIP_TOLERANCE - SKETCHY_TOLERANCE / 2);
    expect(result).toEqual({
      crashed: false, label: "Sketchy Backflip", bonus: Math.round(BACKFLIP_BONUS * SKETCHY_PENALTY), sketchy: true,
    });
  });

  it("crashes when well short, flagged as under-rotated", () => {
    expect(flip(FULL * 0.6)).toEqual({ crashed: true, underRotated: true });
  });

  it("crashes when over-rotated past the sketchy zone", () => {
    expect(flip(FULL + FLIP_TOLERANCE + SKETCHY_TOLERANCE + 0.05)).toEqual({ crashed: true, underRotated: false });
  });
});

describe("evaluatePoseTrickLanding", () => {
  it("pays a completed Superman", () => {
    const player = createPlayer(500, 1000);
    player.activeTrick = TrickType.SUPERMAN;
    player.trickCompletions = 1;
    expect(evaluatePoseTrickLanding(player)).toEqual({ crashed: false, label: "Superman", bonus: SUPERMAN_BONUS, sketchy: false });
  });

  it("crashes when the pose never completed", () => {
    const player = createPlayer(500, 1000);
    player.activeTrick = TrickType.NO_HANDER;
    expect(evaluatePoseTrickLanding(player)).toEqual({ crashed: true, underRotated: true });
  });
});

describe("evaluateComboLanding", () => {
  it("pays pose + flip with the combo multiplier", () => {
    const player = createPlayer(500, 1000);
    player.activeTrick = TrickType.SUPERMAN;
    player.trickCompletions = 1;
    const result = evaluateComboLanding(player, FULL, 1, FULL, FLIP_TOLERANCE, SKETCHY_TOLERANCE);
    expect(result).toEqual({
      crashed: false,
      label: "Superman Backflip",
      bonus: (SUPERMAN_BONUS + BACKFLIP_BONUS + DOUBLE_CHAIN_BONUS) * COMBO_MULTIPLIER,
      sketchy: false,
    });
  });

  it("crashes on an unfinished pose even with a clean flip", () => {
    const player = createPlayer(500, 1000);
    player.activeTrick = TrickType.SUPERMAN;
    player.trickPhase = "extend";
    expect(evaluateComboLanding(player, FULL, 1, FULL, FLIP_TOLERANCE, SKETCHY_TOLERANCE)).toEqual({ crashed: true, underRotated: true });
  });
});

describe("resetAllTrickState", () => {
  it("clears flip and pose state (the revive relies on this)", () => {
    const player = createPlayer(500, 1000);
    player.isBackflipping = true;
    player.backflipAngle = 3;
    player.activeTrick = TrickType.SUPERMAN;
    player.trickCompletions = 2;
    player.targetTrickCount = 3;
    resetAllTrickState(player);
    expect(player).toMatchObject({
      isBackflipping: false, backflipAngle: 0, activeTrick: TrickType.NONE, trickCompletions: 0, targetTrickCount: 0,
    });
  });
});
