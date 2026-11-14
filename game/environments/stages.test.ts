import { describe, expect, it } from "vitest";
import { EASING_OUT, stagedObstaclePool, stagedPool } from "./stages";
import { ObstacleType } from "../types";

const TABLE = [
  [ObstacleType.CACTUS, EASING_OUT],
  [ObstacleType.CAMEL, [0.8, 0.8, 0.8]],
  [ObstacleType.CURVED_RAMP, [null, 0.4, 0.6]],
] as const;

describe("stagedPool", () => {
  it("opens with stage-1 obstacles only", () => {
    expect(stagedPool(0, TABLE)).toEqual([
      { type: ObstacleType.CACTUS, weight: 1 },
      { type: ObstacleType.CAMEL, weight: 0.8 },
    ]);
  });

  it("adds stage-2 obstacles at 15s and full weights at 30s, keeping table order", () => {
    expect(stagedPool(15_000, TABLE).map((t) => [t.type, t.weight])).toEqual([
      [ObstacleType.CACTUS, 0.7], [ObstacleType.CAMEL, 0.8], [ObstacleType.CURVED_RAMP, 0.4],
    ]);
    expect(stagedPool(30_000, TABLE).map((t) => t.weight)).toEqual([0.4, 0.8, 0.6]);
  });

  it("takes a biome's own stage starts, one weight per stage", () => {
    const table = [[ObstacleType.ROCK, [1, 0.7, 0.4, 0.4]], [ObstacleType.CAR, [null, null, null, 0.4]]] as const;
    const starts = [10_000, 25_000, 40_000];
    expect(stagedPool(9_999, table, starts)).toEqual([{ type: ObstacleType.ROCK, weight: 1 }]);
    expect(stagedPool(25_000, table, starts)).toEqual([{ type: ObstacleType.ROCK, weight: 0.4 }]);
    expect(stagedPool(40_000, table, starts).map((t) => t.type)).toEqual([ObstacleType.ROCK, ObstacleType.CAR]);
  });
});

describe("stagedObstaclePool", () => {
  it("reports the last stage start as the full-roster time", () => {
    expect(stagedObstaclePool(TABLE).fullRosterMs).toBe(30_000);
    expect(stagedObstaclePool([[ObstacleType.ROCK, [1, 1]]], [10_000]).fullRosterMs).toBe(10_000);
  });

  it("samples the same pool as stagedPool", () => {
    expect(stagedObstaclePool(TABLE).getWeightedTypes(20_000)).toEqual(stagedPool(20_000, TABLE));
  });

  it("rejects a row whose weights do not cover every stage", () => {
    expect(() => stagedObstaclePool([[ObstacleType.ROCK, [1, 1]]])).toThrow(/ROCK has 2 stage weights/);
  });
});
