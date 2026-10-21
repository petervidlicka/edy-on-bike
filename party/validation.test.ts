import { describe, expect, it } from "vitest";
import { ScoreGuard, SnapshotClock, TokenBucket, sanitizeName, sanitizeSnapshot } from "./validation";
import { MAX_NAME_LENGTH } from "../game/multiplayer/protocol";
import { MAX_BONUS_BURST, MAX_DISTANCE_POINTS_PER_SEC } from "../game/scoreBounds";

const snapshot = { t: 1000, h: 0, og: true, wr: 0, bt: 0, rl: 0, rc: 0, lt: 0, ba: 0, fd: 1, at: "NONE", tp: 0, s: 0 };

describe("TokenBucket", () => {
  it("allows a burst, then refills at the rate", () => {
    const bucket = new TokenBucket(10, 3, 0);
    expect([bucket.take(0), bucket.take(0), bucket.take(0), bucket.take(0)]).toEqual([true, true, true, false]);
    expect(bucket.take(100)).toBe(true); // 0.1s × 10/s = 1 token
    expect(bucket.take(100)).toBe(false);
  });
});

describe("SnapshotClock", () => {
  it("accepts forward timestamps and drops ones that go back or jump ahead", () => {
    const clock = new SnapshotClock();
    expect(clock.accept(1000, 0)).toBe(true);
    expect(clock.accept(900, 50)).toBe(false); // backwards
    expect(clock.accept(1e15, 100)).toBe(false); // forged jump
    expect(clock.accept(1100, 100)).toBe(true);
  });

  it("allows a jump after a real stall of the same length", () => {
    const clock = new SnapshotClock();
    clock.accept(1000, 0);
    expect(clock.accept(31_000, 30_000)).toBe(true);
  });
});

describe("ScoreGuard", () => {
  it("clamps an inflated score to one trick burst plus distance for the elapsed time", () => {
    const guard = new ScoreGuard(0);
    const accepted = guard.accept(1_000_000, 70);
    expect(accepted).toBeLessThanOrEqual(MAX_BONUS_BURST + Math.ceil(MAX_DISTANCE_POINTS_PER_SEC * 0.07));
    // The burst is spent: an immediate second claim gets only the refill
    expect(guard.accept(1_000_000, 80) - accepted).toBeLessThan(200);
  });

  it("never lets the score go down", () => {
    const guard = new ScoreGuard(0);
    const first = guard.accept(100, 10_000);
    expect(guard.accept(10, 11_000)).toBe(first);
  });
});

describe("sanitizeName", () => {
  it("cleans and length-checks", () => {
    expect(sanitizeName("  Edy​ ")).toBe("Edy");
    expect(sanitizeName("x".repeat(MAX_NAME_LENGTH + 1))).toBeNull();
    expect(sanitizeName(42)).toBeNull();
  });
});

describe("sanitizeSnapshot", () => {
  it("rebuilds only the known fields and clamps x to the screen", () => {
    const clean = sanitizeSnapshot({ ...snapshot, x: 7, evil: "<script>" });
    expect(clean).toEqual({ ...snapshot, x: 1 });
  });

  it("rejects wrong types and unknown tricks", () => {
    expect(sanitizeSnapshot({ ...snapshot, h: "high" })).toBeNull();
    expect(sanitizeSnapshot({ ...snapshot, at: "TELEPORT" })).toBeNull();
    expect(sanitizeSnapshot({ ...snapshot, t: Infinity })).toBeNull();
  });
});
