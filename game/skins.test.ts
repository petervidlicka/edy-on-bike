import { describe, expect, it } from "vitest";
import { getNextUnlock, getSkinById, isSkinUnlocked, SKINS } from "./skins";

describe("getSkinById / isSkinUnlocked", () => {
  it("finds a skin and unlocks by score or cheat", () => {
    const racer = getSkinById("racer");
    expect(racer.unlockScore).toBe(300);
    expect(isSkinUnlocked(racer, 299, false)).toBe(false);
    expect(isSkinUnlocked(racer, 300, false)).toBe(true);
    expect(isSkinUnlocked(racer, 0, true)).toBe(true);
  });
});

describe("getNextUnlock", () => {
  it("starts with the cheapest locked bike, measured from zero", () => {
    expect(getNextUnlock(0, false)).toEqual({
      skin: getSkinById("racer"),
      remaining: 300,
      progress: 0,
      previousThreshold: 0,
      requirement: "300 more points",
    });
  });

  it("measures progress from the previous tier so the bar visibly moves", () => {
    const next = getNextUnlock(570, false);
    expect(next?.skin.id).toBe("neon");
    expect(next?.previousThreshold).toBe(550);
    expect(next?.remaining).toBe(180);
    expect(next?.progress).toBeCloseTo(20 / 200);
    expect(next?.requirement).toBe("180 more points");
  });

  it("uses the singular for the last point", () => {
    expect(getNextUnlock(1049, false)?.requirement).toBe("1 more point");
  });

  it("is null once everything is unlocked, or with the cheat", () => {
    const top = Math.max(...SKINS.map((s) => s.unlockScore));
    expect(getNextUnlock(top, false)).toBeNull();
    expect(getNextUnlock(0, true)).toBeNull();
  });
});
