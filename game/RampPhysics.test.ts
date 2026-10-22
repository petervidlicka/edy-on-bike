import { describe, expect, it } from "vitest";
import { processRampInteractions, processRidingState } from "./RampPhysics";
import { createObstacle } from "./Obstacle";
import { createPlayer } from "./Player";
import { JUMP_FORCE, RAMP_HEIGHT_MULTIPLIER } from "./constants";
import { CONTAINER_RAMP } from "./rampGeometry";
import { ObstacleType } from "./types";

const GROUND = 480;

describe("processRampInteractions", () => {
  it("snaps the rider to a ramp's surface and remembers its type", () => {
    const ramp = createObstacle(ObstacleType.STRAIGHT_RAMP, 0, GROUND); // x = 60, 90 wide, 30 high
    const p = createPlayer(GROUND, 1000);
    p.x = 60 + 45 - p.width / 2; // centre halfway up
    expect(processRampInteractions(p, [ramp], GROUND, 1)).toBe(true);
    expect(p.y).toBe(GROUND - 15 - p.height);
    expect(p.rampBoost).toBe("straight");
    expect(p.rampSurfaceAngle).toBeCloseTo(Math.atan2(-30, 90));
  });

  it("auto-launches a rider who rolled off a ramp, with a fifth of a jump", () => {
    const p = createPlayer(GROUND, 1000);
    p.rampBoost = "curved";
    p.y = GROUND - p.height - 10; // still above the road after the lip
    expect(processRampInteractions(p, [], GROUND, 1)).toBe(false);
    expect(p.isOnGround).toBe(false);
    expect(p.jumpCount).toBe(1);
    expect(p.velocityY).toBe(JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER * 0.2);

    const straight = createPlayer(GROUND, 1000);
    straight.rampBoost = "straight";
    straight.y = GROUND - straight.height - 10;
    processRampInteractions(straight, [], GROUND, 1);
    expect(straight.velocityY).toBe(JUMP_FORCE * 0.2);
  });

  it("leaves a grounded rider alone and decays the tilt off the ramp", () => {
    const p = createPlayer(GROUND, 1000);
    p.rampSurfaceAngle = 0.5;
    processRampInteractions(p, [], GROUND, 1);
    expect(p.isOnGround).toBe(true);
    expect(p.rampSurfaceAngle).toBeCloseTo(0.425);
    p.rampSurfaceAngle = 0.005;
    processRampInteractions(p, [], GROUND, 1);
    expect(p.rampSurfaceAngle).toBe(0);
  });
});

describe("processRidingState", () => {
  it("tracks the obstacle top, then the kicker on a container with ramp", () => {
    const box = createObstacle(ObstacleType.CONTAINER_WITH_RAMP, 0, GROUND); // x = 60, 176 wide, 75 high
    const p = createPlayer(GROUND, 1000);
    p.ridingObstacle = box;
    p.x = box.x + 20 - p.width / 2; // flat part
    processRidingState(p);
    expect(p.y).toBe(box.y - p.height);
    expect(p.rampBoost).toBeNull();

    p.x = box.x + box.width - p.width / 2; // at the lip, t = 1
    processRidingState(p);
    expect(p.y).toBe(box.y - CONTAINER_RAMP.height - p.height);
    expect(p.rampBoost).toBe("curved");
    expect(p.rampSurfaceAngle).toBeCloseTo(Math.atan2((-2 * CONTAINER_RAMP.height) / CONTAINER_RAMP.width, 1));
  });

  it("boosts the rider off the end of a ridden ramp and lets go of the obstacle", () => {
    const box = createObstacle(ObstacleType.CONTAINER_WITH_RAMP, 0, GROUND);
    const p = createPlayer(GROUND, 1000);
    p.ridingObstacle = box;
    p.rampBoost = "curved";
    p.x = box.x + box.width + 10; // the box has scrolled past
    processRidingState(p);
    expect(p.ridingObstacle).toBeNull();
    expect(p.jumpCount).toBe(1);
    expect(p.velocityY).toBe(JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER * 0.2);
  });

  it("does nothing when not riding", () => {
    const p = createPlayer(GROUND, 1000);
    const y = p.y;
    processRidingState(p);
    expect(p.y).toBe(y);
  });
});
