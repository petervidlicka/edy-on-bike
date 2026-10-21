import { describe, expect, it } from "vitest";
import { MAX_BONUS_BURST, MAX_DISTANCE_POINTS_PER_SEC, MAX_SCORE, maxPlausibleScore } from "./scoreBounds";
import { MAX_CHAIN_LANDING_BONUS } from "./constants";

describe("maxPlausibleScore", () => {
  it("allows one maximum trick landing straight away", () => {
    expect(maxPlausibleScore(0)).toBe(MAX_BONUS_BURST);
    expect(MAX_BONUS_BURST).toBeGreaterThanOrEqual(MAX_CHAIN_LANDING_BONUS);
  });

  it("grows with time by at least the distance rate", () => {
    const perMinute = maxPlausibleScore(60_000) - maxPlausibleScore(0);
    expect(perMinute).toBeGreaterThanOrEqual(MAX_DISTANCE_POINTS_PER_SEC * 60);
  });

  it("never exceeds the leaderboard ceiling and treats negative time as zero", () => {
    expect(maxPlausibleScore(24 * 60 * 60 * 1000)).toBe(MAX_SCORE);
    expect(maxPlausibleScore(-5_000)).toBe(maxPlausibleScore(0));
  });

  it("rejects an instant 99,999 (the curl exploit)", () => {
    expect(maxPlausibleScore(1_000)).toBeLessThan(MAX_SCORE);
  });
});
