import { describe, expect, it } from "vitest";
import { pickVariant, variantForCause } from "./registry";
import { createObstacle } from "../Obstacle";
import { ObstacleType } from "../types";
import type { CrashCause } from "./types";

const GROUND = 480;

function hit(type: ObstacleType): CrashCause {
  return { kind: "obstacle", obstacle: createObstacle(type, 1000, GROUND) };
}

describe("variantForCause", () => {
  it("matches the cause to its variant from the obstacle's crash family", () => {
    expect(variantForCause({ kind: "badLanding", underRotated: true, surfaceY: GROUND })).toBe("faceplant");
    expect(variantForCause(hit(ObstacleType.TALL_TREE))).toBe("treeHang");
    expect(variantForCause(hit(ObstacleType.JAPAN_TAXI))).toBe("carBonk");
    expect(variantForCause(hit(ObstacleType.SNOW_CAT))).toBe("carBonk");
    expect(variantForCause(hit(ObstacleType.ROCK))).toBe("classic");
    expect(variantForCause({ kind: "eliminated" })).toBe("classic");
  });
});

describe("pickVariant", () => {
  it("falls back to the classic tumble for a share of crashes", () => {
    expect(pickVariant(hit(ObstacleType.SMALL_TREE), () => 0)).toBe("classic");
    expect(pickVariant(hit(ObstacleType.SMALL_TREE), () => 1)).toBe("treeHang");
    expect(pickVariant({ kind: "badLanding", underRotated: false, surfaceY: GROUND }, () => 1)).toBe("faceplant");
  });

  it("always plays the classic tumble for an elimination or a plain obstacle, without rolling", () => {
    let rolls = 0;
    const roll = () => (rolls++, 1);
    expect(pickVariant({ kind: "eliminated" }, roll)).toBe("classic");
    expect(pickVariant(hit(ObstacleType.CACTUS), roll)).toBe("classic");
    expect(rolls).toBe(0);
  });
});
