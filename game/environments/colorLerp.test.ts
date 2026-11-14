import { describe, expect, it } from "vitest";
import { easeInOutCubic, hexToRgb, lerpColor, lerpPalette, rgbToHex } from "./colorLerp";
import { SUBURBAN_PALETTE } from "./suburban";
import { DUBAI_PALETTE } from "./dubai";

describe("hex helpers", () => {
  it("round-trips and clamps", () => {
    expect(hexToRgb("#ff8000")).toEqual([255, 128, 0]);
    expect(rgbToHex(255, 128, 0)).toBe("#ff8000");
    expect(rgbToHex(300, -5, 0.4)).toBe("#ff0000");
  });

  it("mixes two colours", () => {
    expect(lerpColor("#000000", "#ffffff", 0)).toBe("#000000");
    expect(lerpColor("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(lerpColor("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});

describe("easeInOutCubic", () => {
  it("is fixed at the ends and symmetric about the middle", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(0.25) + easeInOutCubic(0.75)).toBeCloseTo(1);
  });
});

describe("lerpPalette", () => {
  it("is the source at 0 and the target at 1, keeping each side's own keys", () => {
    const start = lerpPalette(SUBURBAN_PALETTE, DUBAI_PALETTE, 0);
    expect(start.sky).toBe(SUBURBAN_PALETTE.sky);
    expect(start.buildings[0]).toEqual(SUBURBAN_PALETTE.buildings[0]);
    expect(start.obstacle.suv).toBe(SUBURBAN_PALETTE.obstacle.suv); // suburban-only
    expect(start.obstacle.camel).toBe(DUBAI_PALETTE.obstacle.camel); // dubai-only, kept for the incoming obstacles

    const end = lerpPalette(SUBURBAN_PALETTE, DUBAI_PALETTE, 1);
    expect(end.sky).toBe(DUBAI_PALETTE.sky);
    expect(end.obstacle.rock).toBe(DUBAI_PALETTE.obstacle.rock);
  });

  it("blends halfway and lerps building schemes element by element", () => {
    const mid = lerpPalette(SUBURBAN_PALETTE, DUBAI_PALETTE, 0.5);
    expect(mid.sky).toBe(lerpColor(SUBURBAN_PALETTE.sky, DUBAI_PALETTE.sky, 0.5));
    expect(mid.buildings).toHaveLength(Math.min(SUBURBAN_PALETTE.buildings.length, DUBAI_PALETTE.buildings.length));
    expect(mid.buildings[1].wall).toBe(lerpColor(SUBURBAN_PALETTE.buildings[1].wall, DUBAI_PALETTE.buildings[1].wall, 0.5));
  });

  it("caches each step of a transition and clamps t", () => {
    const a = lerpPalette(SUBURBAN_PALETTE, DUBAI_PALETTE, 0.5);
    expect(lerpPalette(SUBURBAN_PALETTE, DUBAI_PALETTE, 0.5)).toBe(a);
    expect(lerpPalette(SUBURBAN_PALETTE, DUBAI_PALETTE, 0.5001)).toBe(a); // same 1/128 step
    expect(lerpPalette(SUBURBAN_PALETTE, DUBAI_PALETTE, 7).sky).toBe(DUBAI_PALETTE.sky);
    expect(lerpPalette(SUBURBAN_PALETTE, DUBAI_PALETTE, -3).sky).toBe(SUBURBAN_PALETTE.sky);
  });
});
