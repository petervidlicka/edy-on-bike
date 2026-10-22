import { describe, expect, it } from "vitest";
import { createPlayer, jumpPlayer, startBackflip, startFrontflip, updatePlayer } from "./Player";
import {
  GRIND_BIKE_TILT, JUMP_FORCE, MAX_FLIP_COUNT, PLAYER_HEIGHT, RAMP_HEIGHT_MULTIPLIER, RIDEABLE_JUMP_MULTIPLIER,
} from "./constants";
import { ObstacleType, type ObstacleInstance } from "./types";

const GROUND = 480;
/** A ground line so far down that an airborne rider never lands during a test. */
const NO_GROUND = 1_000_000;

function rideable(): ObstacleInstance {
  return { type: ObstacleType.BUS_STOP, x: 0, y: GROUND - 68, width: 129, height: 68, rideable: true, ramp: false };
}

function airborne() {
  const p = createPlayer(GROUND, 1000);
  jumpPlayer(p);
  return p;
}

describe("jumpPlayer", () => {
  it("jumps once, double-jumps weaker, then ignores a third press", () => {
    const p = createPlayer(GROUND, 1000);
    jumpPlayer(p);
    expect(p.velocityY).toBe(JUMP_FORCE);
    expect(p.isOnGround).toBe(false);
    expect(p.jumpCount).toBe(1);
    jumpPlayer(p);
    expect(p.velocityY).toBe(JUMP_FORCE * 0.85);
    expect(p.jumpCount).toBe(2);
    p.velocityY = 3;
    jumpPlayer(p);
    expect(p.velocityY).toBe(3);
    expect(p.jumpCount).toBe(2);
  });

  it("super-jumps off a rideable, leaves it, and still has the double jump", () => {
    const p = createPlayer(GROUND, 1000);
    p.ridingObstacle = rideable();
    jumpPlayer(p);
    expect(p.velocityY).toBe(JUMP_FORCE * RIDEABLE_JUMP_MULTIPLIER);
    expect(p.ridingObstacle).toBeNull();
    expect(p.jumpCount).toBe(1);
    jumpPlayer(p);
    expect(p.jumpCount).toBe(2);
  });

  it("boosts the first jump off a curved ramp only", () => {
    const p = createPlayer(GROUND, 1000);
    p.rampBoost = "curved";
    jumpPlayer(p);
    expect(p.velocityY).toBe(JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER);
    jumpPlayer(p);
    expect(p.velocityY).toBe(JUMP_FORCE * 0.85);
  });
});

describe("flips", () => {
  it("only start in the air and never while riding", () => {
    const grounded = createPlayer(GROUND, 1000);
    expect(startBackflip(grounded)).toBe(false);
    const riding = airborne();
    riding.ridingObstacle = rideable();
    expect(startFrontflip(riding)).toBe(false);
  });

  it("queues the next flip only once 90° into the current target, up to MAX_FLIP_COUNT", () => {
    const p = airborne();
    expect(startBackflip(p)).toBe(true);
    expect(p.targetFlipCount).toBe(1);
    expect(p.flipDirection).toBe(1);

    p.backflipAngle = Math.PI / 2 - 0.01;
    expect(startBackflip(p)).toBe(false);
    expect(p.targetFlipCount).toBe(1);
    p.backflipAngle = Math.PI / 2;
    expect(startBackflip(p)).toBe(true);
    expect(p.targetFlipCount).toBe(2);

    // The third needs 90° into the second
    p.backflipAngle = Math.PI * 2 + Math.PI / 2 - 0.01;
    expect(startBackflip(p)).toBe(false);
    p.backflipAngle = Math.PI * 2 + Math.PI / 2;
    expect(startBackflip(p)).toBe(true);
    expect(p.targetFlipCount).toBe(MAX_FLIP_COUNT);

    p.backflipAngle = Math.PI * 5;
    expect(startBackflip(p)).toBe(false);
    expect(p.targetFlipCount).toBe(MAX_FLIP_COUNT);
  });

  it("refuses to reverse direction mid-flip", () => {
    const p = airborne();
    expect(startFrontflip(p)).toBe(true);
    expect(p.flipDirection).toBe(-1);
    expect(startBackflip(p)).toBe(false);
    expect(p.flipDirection).toBe(-1);
  });

  it("rotates to the target angle and stops there", () => {
    const p = airborne();
    startBackflip(p);
    for (let i = 0; i < 300; i++) updatePlayer(p, 1, NO_GROUND, 5);
    expect(p.backflipAngle).toBeCloseTo(Math.PI * 2, 10);
    expect(p.backflipAngle).toBeLessThanOrEqual(Math.PI * 2);
  });
});

describe("updatePlayer", () => {
  it("snaps to the ground on landing and resets jump state and ramp boost", () => {
    const p = createPlayer(GROUND, 1000);
    jumpPlayer(p);
    p.rampBoost = "straight";
    let frames = 0;
    while (!p.isOnGround && frames++ < 600) updatePlayer(p, 1, GROUND, 5);
    expect(p.isOnGround).toBe(true);
    expect(p.y).toBe(GROUND - PLAYER_HEIGHT);
    expect(p.velocityY).toBe(0);
    expect(p.jumpCount).toBe(0);
    expect(p.rampBoost).toBeNull();
  });

  it("eases the grind pose by the same share whether a frame comes whole or in halves", () => {
    const whole = createPlayer(GROUND, 1000);
    whole.ridingObstacle = rideable();
    updatePlayer(whole, 1, GROUND, 5);
    expect(whole.bikeTilt).toBe(GRIND_BIKE_TILT * 0.25);

    const halves = createPlayer(GROUND, 1000);
    halves.ridingObstacle = rideable();
    updatePlayer(halves, 0.5, GROUND, 5);
    updatePlayer(halves, 0.5, GROUND, 5);
    expect(halves.bikeTilt).toBeCloseTo(whole.bikeTilt, 12);
    expect(halves.riderCrouch).toBeCloseTo(whole.riderCrouch, 12);
  });
});
