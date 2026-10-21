import { describe, expect, it } from "vitest";
import { EASING_OUT, stagedPool } from "./stages";
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
});
