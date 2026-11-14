import { describe, expect, it, vi } from "vitest";
import {
  COMBO_SUMMARY_COLOR, createComboSummaryText, evaluateComboLanding, evaluateFlipLanding, evaluatePoseTrickLanding,
  processTrickLanding, resetAllTrickState,
} from "./TrickSystem";
import type { TrickContext } from "./TrickSystem";
import { createPlayer } from "./Player";
import { TrickType } from "./types";
import {
  BACKFLIP_BONUS, COMBO_MULTIPLIER, DOUBLE_CHAIN_BONUS, FLIP_TOLERANCE, SKETCHY_PENALTY,
  SKETCHY_TOLERANCE, SUPERMAN_BONUS, TRIPLE_CHAIN_BONUS,
} from "./constants";

const FULL = Math.PI * 2;
const flip = (angle: number, direction = 1) => evaluateFlipLanding(angle, direction, FULL, FLIP_TOLERANCE, SKETCHY_TOLERANCE);

/** A landing context with spy callbacks, for the dispatch tests. */
function landingCtx() {
  const ctx: TrickContext = { player: createPlayer(500, 1000), onCrash: vi.fn(), onAwardBonus: vi.fn() };
  const land = (hadFlip: boolean, hadPose: boolean, angle = 0, direction = 1) =>
    processTrickLanding(ctx, hadFlip, hadPose, angle, direction, FULL, FLIP_TOLERANCE, SKETCHY_TOLERANCE);
  return { ctx, land };
}

describe("evaluateFlipLanding", () => {
  it("lands a clean backflip within tolerance", () => {
    expect(flip(FULL + FLIP_TOLERANCE * 0.9)).toEqual({ crashed: false, label: "Backflip", bonus: BACKFLIP_BONUS, sketchy: false });
  });

  it("names frontflips by direction", () => {
    expect(flip(FULL, -1)).toMatchObject({ crashed: false, label: "Frontflip" });
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

describe("processTrickLanding", () => {
  it("does nothing when nothing was in the air", () => {
    const { ctx, land } = landingCtx();
    expect(land(false, false)).toBe(false);
    expect(ctx.onCrash).not.toHaveBeenCalled();
    expect(ctx.onAwardBonus).not.toHaveBeenCalled();
  });

  it("pays a clean flip and clears only the flip state", () => {
    const { ctx, land } = landingCtx();
    ctx.player.isBackflipping = true;
    ctx.player.backflipAngle = FULL;
    ctx.player.activeTrick = TrickType.SUPERMAN; // not judged: hadPose is false
    expect(land(true, false, FULL)).toBe(false);
    expect(ctx.onAwardBonus).toHaveBeenCalledWith("Backflip", BACKFLIP_BONUS, false);
    expect(ctx.onCrash).not.toHaveBeenCalled();
    expect(ctx.player).toMatchObject({ isBackflipping: false, backflipAngle: 0, activeTrick: TrickType.SUPERMAN });
  });

  it("crashes an under-rotated flip after clearing the flip state", () => {
    const { ctx, land } = landingCtx();
    ctx.player.isBackflipping = true;
    expect(land(true, false, FULL * 0.5)).toBe(true);
    expect(ctx.onCrash).toHaveBeenCalledWith(true);
    expect(ctx.onAwardBonus).not.toHaveBeenCalled();
    expect(ctx.player.isBackflipping).toBe(false);
  });

  it("crashes an unfinished pose and clears the pose state", () => {
    const { ctx, land } = landingCtx();
    ctx.player.activeTrick = TrickType.NO_HANDER;
    ctx.player.trickProgress = 0.4;
    expect(land(false, true)).toBe(true);
    expect(ctx.onCrash).toHaveBeenCalledWith(true);
    expect(ctx.player).toMatchObject({ activeTrick: TrickType.NONE, trickProgress: 0, trickCompletions: 0 });
  });

  it("judges flip + pose as a combo and clears both", () => {
    const { ctx, land } = landingCtx();
    ctx.player.activeTrick = TrickType.SUPERMAN;
    ctx.player.trickCompletions = 1;
    ctx.player.isBackflipping = true;
    expect(land(true, true, FULL)).toBe(false);
    expect(ctx.onAwardBonus).toHaveBeenCalledWith(
      "Superman Backflip", (SUPERMAN_BONUS + BACKFLIP_BONUS + DOUBLE_CHAIN_BONUS) * COMBO_MULTIPLIER, false,
    );
    expect(ctx.player).toMatchObject({ isBackflipping: false, activeTrick: TrickType.NONE, trickCompletions: 0 });
  });

  it("flags a sketchy landing to the award", () => {
    const { ctx, land } = landingCtx();
    expect(land(true, false, FULL - FLIP_TOLERANCE - SKETCHY_TOLERANCE / 2)).toBe(false);
    expect(ctx.onAwardBonus).toHaveBeenCalledWith("Sketchy Backflip", Math.round(BACKFLIP_BONUS * SKETCHY_PENALTY), true);
  });
});

describe("createComboSummaryText", () => {
  const summary = { links: 3, multiplier: 2, total: 640 };
  const halfWidthOf = (text: string) => (text.length * 26 * 0.55) / 2 + 8;

  it("centres on the rider when there is room", () => {
    const ft = createComboSummaryText(summary, 1000, 300, 40, 4000);
    expect(ft).toMatchObject({ x: 1020, y: 230, opacity: 1, color: COMBO_SUMMARY_COLOR, size: 26 });
    expect(ft.text).toContain("3 tricks");
    expect(ft.text).toContain("+640");
  });

  it("stops at the left edge for a rider close to it", () => {
    const ft = createComboSummaryText(summary, 10, 300, 40, 800);
    expect(ft.x).toBe(halfWidthOf(ft.text));
    expect(ft.x - halfWidthOf(ft.text)).toBeGreaterThanOrEqual(0);
  });

  it("stops at the right edge for a rider close to it", () => {
    const ft = createComboSummaryText(summary, 780, 300, 40, 800);
    expect(ft.x).toBe(800 - halfWidthOf(ft.text));
    expect(ft.x + halfWidthOf(ft.text)).toBeLessThanOrEqual(800);
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
