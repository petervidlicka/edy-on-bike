import { describe, expect, it } from "vitest";
import {
  CAR_OBSTACLES, createObstacle, getGrindLabel, moveObstacle, nextSpawnGap, OBSTACLE_SPECS, RAMP_TYPES,
  RIDEABLE_TYPES, spawnGapPadding, spawnObstacle, TREE_OBSTACLES,
} from "./Obstacle";
import { MIN_OBSTACLE_GAP, MIN_OBSTACLE_GAP_LATE } from "./constants";
import { SUBURBAN_ENVIRONMENT } from "./environments/suburban";
import { ObstacleType } from "./types";

const GROUND = 480;
const EDGE = 1000;
const RIDER_X = 200;

describe("OBSTACLE_SPECS", () => {
  it("derives the old tables from the catalogue", () => {
    expect(RIDEABLE_TYPES.has(ObstacleType.BUS_STOP)).toBe(true);
    expect(RIDEABLE_TYPES.has(ObstacleType.ROCK)).toBe(false);
    expect([...RAMP_TYPES]).toEqual([ObstacleType.STRAIGHT_RAMP, ObstacleType.CURVED_RAMP, ObstacleType.SNOW_KICKER]);
    expect(TREE_OBSTACLES).toEqual([ObstacleType.SMALL_TREE, ObstacleType.TALL_TREE, ObstacleType.GIANT_TREE]);
    expect(CAR_OBSTACLES).toContain(ObstacleType.SNOW_CAT);
    expect(CAR_OBSTACLES).not.toContain(ObstacleType.CAMEL);
    expect(getGrindLabel(ObstacleType.SHIPPING_CONTAINER)).toBe("Container Grind");
    expect(getGrindLabel(ObstacleType.ROCK)).toBe("Grind");
  });
});

describe("createObstacle", () => {
  it("sinks grounded obstacles into the road, capped so low ones stay hittable", () => {
    // A car is tall enough for the full 10px sink
    const car = createObstacle(ObstacleType.CAR, EDGE, GROUND);
    expect(car.y).toBe(GROUND - OBSTACLE_SPECS[ObstacleType.CAR].height + 10);
    expect(car.x).toBe(EDGE + 60);
    // A rock (20px) would lose its hit band, so it sits on the surface
    const rock = createObstacle(ObstacleType.ROCK, EDGE, GROUND);
    expect(rock.y).toBe(GROUND - 20);
    // A Lamborghini (24px) can only sink 2px
    const lambo = createObstacle(ObstacleType.LAMBORGHINI_HURACAN, EDGE, GROUND);
    expect(lambo.y).toBe(GROUND - 24 + 2);
  });

  it("keeps anything with a ramp exactly on the road and flags standalone ramps", () => {
    const ramp = createObstacle(ObstacleType.CURVED_RAMP, EDGE, GROUND);
    expect(ramp.y).toBe(GROUND - 36);
    expect(ramp.ramp).toBe(true);
    expect(ramp.rideable).toBe(false);
    const container = createObstacle(ObstacleType.CONTAINER_WITH_RAMP, EDGE, GROUND);
    expect(container.y).toBe(GROUND - 75);
    expect(container.ramp).toBe(false);
    expect(container.rideable).toBe(true);
  });

  it("starts an oncoming mover further out by its offset", () => {
    const racer = createObstacle(ObstacleType.RACE_SKIER, EDGE, GROUND, RIDER_X);
    expect(racer.motion).toEqual({ offset: -720, staticX: EDGE + 60 + 720 });
    expect(racer.x).toBeLessThan(racer.motion!.staticX);
    expect(createObstacle(ObstacleType.ROCK, EDGE, GROUND).motion).toBeUndefined();
  });
});

describe("moveObstacle", () => {
  it.each([ObstacleType.RACE_SKIER, ObstacleType.FREERIDE_SKIER])("%s approaches the rider every frame and passes them", (type) => {
    const mover = createObstacle(type, EDGE, GROUND, RIDER_X);
    let prevX = mover.x;
    let passed = false;
    for (let i = 0; i < 2000 && !passed; i++) {
      moveObstacle(mover, 5, 1, RIDER_X);
      expect(mover.x).toBeLessThan(prevX);
      prevX = mover.x;
      passed = mover.x + mover.width < RIDER_X;
    }
    expect(passed).toBe(true);
  });

  it("scrolls a static obstacle with the world", () => {
    const rock = createObstacle(ObstacleType.ROCK, EDGE, GROUND);
    moveObstacle(rock, 5, 0.5, RIDER_X);
    expect(rock.x).toBe(EDGE + 60 - 2.5);
  });
});

describe("spawnGapPadding", () => {
  it("pads by the offset for oncoming movers and the catch-up distance for followers", () => {
    expect(spawnGapPadding(createObstacle(ObstacleType.ROCK, EDGE, GROUND))).toBeCloseTo(0); // −0: no padding
    expect(spawnGapPadding(createObstacle(ObstacleType.RACE_SKIER, EDGE, GROUND))).toBe(720);
    // 500 · 2400 / (2400 − 500) = 631.6, rounded up
    expect(spawnGapPadding(createObstacle(ObstacleType.FREERIDE_SKIER, EDGE, GROUND))).toBe(632);
  });
});

describe("nextSpawnGap", () => {
  it("stays between the rising floor and 3.5× the base gap, shrinking with speed", () => {
    expect(nextSpawnGap(5, 0, () => 0)).toBe(MIN_OBSTACLE_GAP);
    expect(nextSpawnGap(5, 60_000, () => 0)).toBe(MIN_OBSTACLE_GAP_LATE);
    expect(nextSpawnGap(5, 0, () => 1)).toBe(MIN_OBSTACLE_GAP * 3.5);
    // Speed factor bottoms out at 0.3
    expect(nextSpawnGap(25, 0, () => 1)).toBe(MIN_OBSTACLE_GAP + MIN_OBSTACLE_GAP * 2.5 * 0.3);
    expect(nextSpawnGap(100, 0, () => 1)).toBe(nextSpawnGap(25, 0, () => 1));
  });
});

describe("spawnObstacle", () => {
  // Suburban at 0 s offers ROCK and SMALL_TREE at equal weight
  it("picks by cumulative weight from one rng call", () => {
    let calls = 0;
    const rng = (value: number) => () => (calls++, value);
    expect(spawnObstacle(EDGE, GROUND, 0, SUBURBAN_ENVIRONMENT, RIDER_X, rng(0)).type).toBe(ObstacleType.ROCK);
    expect(spawnObstacle(EDGE, GROUND, 0, SUBURBAN_ENVIRONMENT, RIDER_X, rng(0.5)).type).toBe(ObstacleType.ROCK);
    expect(spawnObstacle(EDGE, GROUND, 0, SUBURBAN_ENVIRONMENT, RIDER_X, rng(0.75)).type).toBe(ObstacleType.SMALL_TREE);
    expect(spawnObstacle(EDGE, GROUND, 0, SUBURBAN_ENVIRONMENT, RIDER_X, rng(0.999)).type).toBe(ObstacleType.SMALL_TREE);
    expect(calls).toBe(4);
  });
});
