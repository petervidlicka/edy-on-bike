import { describe, expect, it } from "vitest";
import { LEADERBOARD_SIZE, scoreQualifies } from "./leaderboardConfig";

const fullBoard = Array.from({ length: LEADERBOARD_SIZE }, (_, i) => ({ score: 100 + i * 10 }));

describe("scoreQualifies", () => {
  it("accepts any positive score while the board has room", () => {
    expect(scoreQualifies(1, [])).toBe(true);
    expect(scoreQualifies(0, [])).toBe(false);
  });

  it("needs to beat the lowest score on a full board", () => {
    expect(scoreQualifies(100, fullBoard)).toBe(false);
    expect(scoreQualifies(101, fullBoard)).toBe(true);
  });
});
