import { describe, expect, it, vi } from "vitest";
import { INITIAL_SPEED } from "@/game/constants";
import { createEngineStats } from "./engineStats";

describe("createEngineStats", () => {
  it("starts at score 0 and the base speed, like a fresh Engine", () => {
    const stats = createEngineStats();
    expect(stats.getScore()).toBe(0);
    expect(stats.getSpeed()).toBe(INITIAL_SPEED);
  });

  it("notifies subscribers when a value changes and not when it is repeated", () => {
    const stats = createEngineStats();
    const listener = vi.fn();
    stats.subscribe(listener);

    stats.setScore(10);
    stats.setScore(10);
    stats.setSpeed(INITIAL_SPEED);
    stats.setSpeed(INITIAL_SPEED + 1);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(stats.getScore()).toBe(10);
    expect(stats.getSpeed()).toBe(INITIAL_SPEED + 1);
  });

  it("stops notifying after unsubscribe", () => {
    const stats = createEngineStats();
    const listener = vi.fn();
    const unsubscribe = stats.subscribe(listener);
    stats.setScore(1);
    unsubscribe();
    stats.setScore(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
