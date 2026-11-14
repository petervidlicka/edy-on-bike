import { describe, expect, it } from "vitest";
import { EnvironmentManager } from "./EnvironmentManager";

const BIOME_MS = 60_000;
/** Shortest transition, in 60fps dt units (the manager's MIN_TRANSITION_DURATION). */
const TRANSITION_FRAMES = 240;

/** Forces the next biome and plays its transition out, so the manager is settled in it. */
function skipTo(manager: EnvironmentManager, biomes: number): void {
  for (let i = 0; i < biomes; i++) {
    manager.forceNextBiome();
    manager.update(TRANSITION_FRAMES, 0);
  }
}

describe("EnvironmentManager", () => {
  it("starts in the suburbs and moves on after BIOME_DURATION_MS", () => {
    const manager = new EnvironmentManager();
    expect(manager.getCurrentEnvironment().id).toBe("suburban");
    expect(manager.update(1, BIOME_MS - 1)).toEqual({});

    const started = manager.update(1, BIOME_MS);
    expect(started.biomeStarted).toBe("dubai");
    expect(started.transitionStarted?.from.id).toBe("suburban");
    expect(started.transitionStarted?.to.id).toBe("dubai");
    expect(started.musicCrossfade?.track).toBe("/music-dubai.mp3");
    expect(started.transitionEnded).toBeUndefined();
  });

  it("hands the environment over halfway through the transition and reports its end", () => {
    const manager = new EnvironmentManager();
    manager.update(1, BIOME_MS);
    expect(manager.getCurrentEnvironment().id).toBe("suburban");
    expect(manager.getTargetEnvironment().id).toBe("dubai");
    expect(manager.getTransitionFade()).toBeCloseTo(0, 5); // one frame (1/240) into the fade

    manager.update(TRANSITION_FRAMES / 2, BIOME_MS + 1);
    expect(manager.getCurrentEnvironment().id).toBe("dubai");

    const ended = manager.update(TRANSITION_FRAMES / 2, BIOME_MS + 2);
    expect(ended.transitionEnded).toBe(true);
    expect(manager.getTransitionFade()).toBeNull();
    expect(manager.getCurrentPalette()).toBe(manager.getCurrentEnvironment().palette);
  });

  it("blends the palette during a transition", () => {
    const manager = new EnvironmentManager();
    const from = manager.getCurrentEnvironment().palette;
    manager.update(1, BIOME_MS);
    manager.update(TRANSITION_FRAMES / 2, BIOME_MS + 1);
    const blended = manager.getCurrentPalette();
    expect(blended).not.toBe(from);
    expect(blended.sky).not.toBe(from.sky);
    expect(blended.sky).not.toBe(manager.getTargetEnvironment().palette.sky);
  });

  it("cycles through all four biomes and loops back around", () => {
    const manager = new EnvironmentManager();
    const seen = [manager.getCurrentEnvironment().id];
    for (let i = 0; i < 4; i++) {
      skipTo(manager, 1);
      seen.push(manager.getCurrentEnvironment().id);
    }
    expect(seen).toEqual(["suburban", "dubai", "austria", "tokyo", "suburban"]);
  });

  it("adds the biome's own full-roster time on later laps", () => {
    const manager = new EnvironmentManager();
    expect(manager.getBiomeElapsedMs(5_000)).toBe(5_000);
    skipTo(manager, 1); // dubai, first lap
    expect(manager.getBiomeElapsedMs(5_000)).toBe(5_000);
    skipTo(manager, 3); // suburban again: its roster is complete at 40 s
    expect(manager.getBiomeElapsedMs(5_000)).toBe(5_000 + 40_000);
    skipTo(manager, 1); // dubai again: complete at 30 s
    expect(manager.getBiomeElapsedMs(5_000)).toBe(5_000 + 30_000);
  });

  it("measures biome time from the transition start", () => {
    const manager = new EnvironmentManager();
    manager.update(1, BIOME_MS);
    expect(manager.getBiomeElapsedMs(BIOME_MS + 2_500)).toBe(2_500);
  });

  it("forceNextBiome moves on at once and pushes the schedule back a full biome", () => {
    const manager = new EnvironmentManager();
    manager.update(1, 10_000);
    const forced = manager.forceNextBiome();
    expect(forced.biomeStarted).toBe("dubai");
    expect(forced.musicCrossfade?.track).toBe("/music-dubai.mp3");
    manager.update(TRANSITION_FRAMES, 10_001);
    expect(manager.update(1, 10_000 + BIOME_MS - 1).biomeStarted).toBeUndefined();
    expect(manager.update(1, 10_000 + BIOME_MS).biomeStarted).toBe("austria");
  });

  it("finishes a running transition before forcing the next biome, so none is skipped", () => {
    const manager = new EnvironmentManager();
    manager.update(1, BIOME_MS); // → dubai, still transitioning
    expect(manager.forceNextBiome().biomeStarted).toBe("austria");
    expect(manager.getTargetEnvironment().id).toBe("austria");
    expect(manager.getCurrentEnvironment().id).toBe("dubai");
  });

  it("reset returns to the opening biome", () => {
    const manager = new EnvironmentManager();
    skipTo(manager, 2);
    manager.reset();
    expect(manager.getCurrentEnvironment().id).toBe("suburban");
    expect(manager.getTransitionFade()).toBeNull();
    expect(manager.update(1, BIOME_MS).biomeStarted).toBe("dubai");
  });

  it("returns the same skyline pass array frame after frame outside a transition", () => {
    const manager = new EnvironmentManager();
    skipTo(manager, 2); // austria has a skyline
    const first = manager.getSkylines();
    expect(first).toHaveLength(1);
    expect(first[0].alpha).toBe(1);
    expect(manager.getSkylines()).toBe(first);
  });
});
