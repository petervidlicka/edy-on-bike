import { describe, expect, it } from "vitest";
import {
  FRIEND_CODE_LENGTH, QUICK_PLAY_CODE_PREFIX, QUICK_PLAY_CODE_RANDOM_LENGTH,
  isFriendRoomCode, isQuickPlayCode, randomRoomCode,
} from "./protocol";

describe("room codes", () => {
  it("generates codes of each kind that pass their own check and not the other's", () => {
    for (let i = 0; i < 200; i++) {
      const friend = randomRoomCode(FRIEND_CODE_LENGTH);
      const quick = randomRoomCode(QUICK_PLAY_CODE_RANDOM_LENGTH, QUICK_PLAY_CODE_PREFIX);
      expect(isFriendRoomCode(friend)).toBe(true);
      expect(isQuickPlayCode(friend)).toBe(false);
      expect(isQuickPlayCode(quick)).toBe(true);
      expect(isFriendRoomCode(quick)).toBe(false);
    }
  });

  it("rejects look-alikes, lowercase and URL characters", () => {
    for (const code of ["AB0D", "ab2d", "AB#D", "A?BC", "../x", "ABCDE", ""]) {
      expect(isFriendRoomCode(code)).toBe(false);
    }
  });
});
