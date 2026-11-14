import { describe, expect, it } from "vitest";
import { SeededRNG } from "./SeededRNG";

/**
 * Golden Mulberry32 output for seed 12345. Every client in a room derives its course from
 * the same seed, so a change to this sequence would desync racers on different builds.
 */
const GOLDEN_12345 = [
  0.9797282677609473, 0.3067522644996643, 0.484205421525985, 0.817934412509203, 0.5094283693470061,
  0.34747186047025025, 0.07375754183158278, 0.7663964673411101, 0.9968264393974096, 0.8250224851071835,
];

function take(rng: SeededRNG, n: number): number[] {
  return Array.from({ length: n }, () => rng.random());
}

describe("SeededRNG", () => {
  it("reproduces the golden sequence for a seed", () => {
    expect(take(new SeededRNG(12345), 10)).toEqual(GOLDEN_12345);
    expect(take(new SeededRNG(0), 3)).toEqual([0.26642920868471265, 0.0003297457005828619, 0.2232720274478197]);
  });

  it("depends on the seed alone, so every screen size sees the same course", () => {
    // Two clients with the same seed and any interleaving of other work draw identical values
    const phone = new SeededRNG(777);
    const desktop = new SeededRNG(777);
    const fromPhone = take(phone, 50);
    const fromDesktop: number[] = [];
    for (let i = 0; i < 50; i++) {
      Math.random(); // unrelated randomness (particles, UI) never touches the course stream
      fromDesktop.push(desktop.random());
    }
    expect(fromDesktop).toEqual(fromPhone);
    expect(take(new SeededRNG(778), 5)).not.toEqual(take(new SeededRNG(777), 5));
  });

  it("stays in [0, 1) and truncates the seed to 32 bits", () => {
    for (const value of take(new SeededRNG(2147483647), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
    expect(take(new SeededRNG(2 ** 32 + 12345), 3)).toEqual(GOLDEN_12345.slice(0, 3));
  });
});
