import { describe, expect, it } from "vitest";
import { cleanPlayerName, isPlayerNameAllowed } from "./playerName";

describe("cleanPlayerName", () => {
  it("strips invisible and control characters and collapses whitespace", () => {
    expect(cleanPlayerName("  Edy​ ‮ Rider\u0007 ")).toBe("Edy Rider");
  });

  it("folds full-width letters (NFKC)", () => {
    expect(cleanPlayerName("ＥＤＹ")).toBe("EDY");
  });
});

describe("isPlayerNameAllowed", () => {
  it.each(["Edy", "Dickson", "Hancock", "Cassie", "Swanky Pete", "The Therapist", "Grape Ape", "Class Act", "Scott"])(
    "allows %s",
    (name) => expect(isPlayerNameAllowed(cleanPlayerName(name))).toBe(true),
  );

  it.each(["sh1t rider", "F.U.C.K", "big ass", "@ss", "n4zi", "ＦＵＣＫ", "wanker"])(
    "blocks %s",
    (name) => expect(isPlayerNameAllowed(cleanPlayerName(name))).toBe(false),
  );
});
