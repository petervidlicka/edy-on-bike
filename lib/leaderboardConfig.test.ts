import { describe, expect, it } from "vitest";
import { LEADERBOARD_SIZE, MAX_LEADERBOARD_NAME_LENGTH, scoreQualifies, validateLeaderboardName } from "./leaderboardConfig";

describe("validateLeaderboardName", () => {
  it("returns the cleaned name", () => {
    expect(validateLeaderboardName("  Edy​  Rider ")).toEqual({ ok: true, name: "Edy Rider" });
  });

  it("rejects empty, over-long and blocked names with player-facing messages", () => {
    expect(validateLeaderboardName(" ​ ")).toEqual({ ok: false, error: "Name is required." });
    expect(validateLeaderboardName("x".repeat(MAX_LEADERBOARD_NAME_LENGTH + 1))).toEqual({
      ok: false,
      error: `Name must be ${MAX_LEADERBOARD_NAME_LENGTH} characters or less.`,
    });
    expect(validateLeaderboardName("sh1t rider")).toEqual({ ok: false, error: "Please pick a different name." });
  });
});

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
