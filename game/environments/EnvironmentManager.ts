import type {
  BiomeId,
  EnvironmentDefinition,
  EnvironmentPalette,
  BackgroundDrawFn,
  RiderGear,
  SkylineDrawFn,
  SkylinePass,
} from "./types";
import { SUBURBAN_ENVIRONMENT } from "./suburban";
import { DUBAI_ENVIRONMENT } from "./dubai";
import { AUSTRIA_ENVIRONMENT } from "./austria";
import { TOKYO_ENVIRONMENT } from "./tokyo";
import { lerpPalette, easeInOutCubic } from "./colorLerp";

// ── Biome cycle ──
// Each biome lasts BIOME_DURATION_MS; after the last one the run loops back to the
// first. New biomes are added to the cycle in play order.

const BIOME_CYCLE: EnvironmentDefinition[] = [
  SUBURBAN_ENVIRONMENT,
  DUBAI_ENVIRONMENT,
  AUSTRIA_ENVIRONMENT,
  TOKYO_ENVIRONMENT,
];

/** How long each biome lasts before the next transition starts. */
const BIOME_DURATION_MS = 60_000;

/**
 * Biome-relative time reported on second and later laps, so a revisited biome starts on
 * its full obstacle roster instead of the gentle opening stages (the speed is high by then).
 */
const LATER_LAP_STAGE_MS = 30_000;

/** Duration of a biome transition in 60fps dt units (~4 seconds). */
const TRANSITION_DURATION = 240; // 4s at 60fps
/** Duration of the music crossfade in milliseconds. */
const MUSIC_CROSSFADE_MS = 3000;

// ── Events emitted by update() for Engine to act on ──

export interface EnvUpdateResult {
  /** If set, a transition into this biome just started (Engine announces it as an event). */
  biomeStarted?: BiomeId;
  /** If set, Engine should crossfade music to the new track. */
  musicCrossfade?: { track: string; durationMs: number };
  /** If set, Engine should append new biome buildings to the existing layer (transition start). */
  appendBackground?: { toEnv: EnvironmentDefinition };
  /** If set, Engine should fully replace background layers with this environment (transition end). */
  regenerateBackground?: EnvironmentDefinition;
}

/**
 * Manages the active environment/biome and handles smooth transitions
 * between biomes: a new one every BIOME_DURATION_MS, looping through BIOME_CYCLE.
 *
 * During a transition getCurrentPalette() returns an interpolated palette.
 */
export class EnvironmentManager {
  private currentEnv: EnvironmentDefinition;
  /** Biomes entered so far this run, counting every lap (index into the cycle modulo its length). */
  private currentBiomeIndex = 0;

  // Transition state
  private fromEnv: EnvironmentDefinition | null = null;
  private toEnv: EnvironmentDefinition | null = null;
  private transitionProgress = 0;
  private transitioning = false;

  // Biome-relative timing — tracks when the current biome started
  private biomeStartMs = 0;
  private lastElapsedMs = 0;

  constructor() {
    this.currentEnv = SUBURBAN_ENVIRONMENT;
  }

  /**
   * Called every frame with dt (60fps-normalized) and elapsed game time in ms.
   * Checks time thresholds and advances transition progress.
   * Returns events for Engine to act on.
   */
  update(dt: number, elapsedMs: number): EnvUpdateResult {
    const result: EnvUpdateResult = {};
    this.lastElapsedMs = elapsedMs;

    // Check if we should start a new transition
    if (!this.transitioning) {
      const dueIndex = Math.floor(elapsedMs / BIOME_DURATION_MS);
      if (dueIndex > this.currentBiomeIndex) {
        this.currentBiomeIndex++;
        const nextEnv = BIOME_CYCLE[this.currentBiomeIndex % BIOME_CYCLE.length];
        this.startTransition(nextEnv);
        result.biomeStarted = nextEnv.id;

        // Signal Engine to append new biome buildings to the existing layer
        result.appendBackground = { toEnv: nextEnv };

        // Signal Engine to crossfade music if track changed
        if (nextEnv.musicTrack !== this.fromEnv?.musicTrack) {
          result.musicCrossfade = {
            track: nextEnv.musicTrack,
            durationMs: MUSIC_CROSSFADE_MS,
          };
        }
      }
    }

    // Advance transition
    if (this.transitioning) {
      this.transitionProgress += dt / TRANSITION_DURATION;
      if (this.transitionProgress >= 1) {
        const completedEnv = this.toEnv;
        this.completeTransition();
        // Signal Engine to do a clean rebuild with just the new biome
        if (completedEnv) {
          result.regenerateBackground = completedEnv;
        }
      }
    }

    return result;
  }

  /** Reset back to starting environment (e.g. on game restart). */
  reset(): void {
    this.currentEnv = SUBURBAN_ENVIRONMENT;
    this.currentBiomeIndex = 0;
    this.fromEnv = null;
    this.toEnv = null;
    this.transitionProgress = 0;
    this.transitioning = false;
    this.biomeStartMs = 0;
    this.lastElapsedMs = 0;
  }

  /** Returns elapsed time relative to when the current biome started. */
  getBiomeElapsedMs(elapsedMs: number): number {
    const lapBonus = this.currentBiomeIndex >= BIOME_CYCLE.length ? LATER_LAP_STAGE_MS : 0;
    return Math.max(0, elapsedMs - this.biomeStartMs) + lapBonus;
  }

  /**
   * Returns the current effective palette.
   * During a transition, returns an interpolated palette.
   */
  getCurrentPalette(): EnvironmentPalette {
    if (this.transitioning && this.fromEnv && this.toEnv) {
      const t = easeInOutCubic(Math.min(1, this.transitionProgress));
      return lerpPalette(this.fromEnv.palette, this.toEnv.palette, t);
    }
    return this.currentEnv.palette;
  }

  /**
   * Returns the current environment definition.
   * During transition, returns the target environment after 50% progress,
   * otherwise the source environment.
   */
  getCurrentEnvironment(): EnvironmentDefinition {
    if (this.transitioning && this.toEnv && this.transitionProgress >= 0.5) {
      return this.toEnv;
    }
    return this.currentEnv;
  }

  /**
   * Returns background drawers for the current state.
   * During transition, merges both biomes' drawers so elements from both can be rendered.
   */
  getBackgroundDrawers(): Record<string, BackgroundDrawFn> {
    if (this.transitioning && this.fromEnv && this.toEnv) {
      return { ...this.fromEnv.backgroundDrawers, ...this.toEnv.backgroundDrawers };
    }
    return this.currentEnv.backgroundDrawers;
  }

  /**
   * Far scenery bands to draw this frame. Across a transition the outgoing biome's
   * band fades out while the incoming one fades in.
   */
  getSkylines(): SkylinePass[] {
    return this.fadedPasses((env) => env.skyline);
  }

  /** Road overlays (e.g. wet-road neon reflections), faded across a transition like skylines. */
  getRoadOverlays(): SkylinePass[] {
    return this.fadedPasses((env) => env.roadOverlay);
  }

  /** Biome kit for the rider; switches halfway through a transition, with the buildings. */
  getRiderGear(): RiderGear | undefined {
    return this.getCurrentEnvironment().riderGear;
  }

  /** Force an immediate transition to the next biome (debug only). */
  forceNextBiome(): EnvUpdateResult {
    const result: EnvUpdateResult = {};
    this.currentBiomeIndex++;
    const nextEnv = BIOME_CYCLE[this.currentBiomeIndex % BIOME_CYCLE.length];
    this.startTransition(nextEnv);
    result.biomeStarted = nextEnv.id;
    if (nextEnv.musicTrack !== this.fromEnv?.musicTrack) {
      result.musicCrossfade = {
        track: nextEnv.musicTrack,
        durationMs: MUSIC_CROSSFADE_MS,
      };
    }
    return result;
  }

  // ── Internal ──

  /** One pass per biome that has the picked drawer: outgoing fades out, incoming fades in. */
  private fadedPasses(pick: (env: EnvironmentDefinition) => SkylineDrawFn | undefined): SkylinePass[] {
    if (this.transitioning && this.fromEnv && this.toEnv) {
      const t = easeInOutCubic(Math.min(1, this.transitionProgress));
      const passes: SkylinePass[] = [];
      const from = pick(this.fromEnv);
      const to = pick(this.toEnv);
      if (from) passes.push({ draw: from, alpha: 1 - t });
      if (to) passes.push({ draw: to, alpha: t });
      return passes;
    }
    const current = pick(this.currentEnv);
    return current ? [{ draw: current, alpha: 1 }] : [];
  }

  private startTransition(toEnv: EnvironmentDefinition): void {
    this.fromEnv = this.currentEnv;
    this.toEnv = toEnv;
    this.transitionProgress = 0;
    this.transitioning = true;
    this.biomeStartMs = this.lastElapsedMs;
  }

  private completeTransition(): void {
    if (this.toEnv) {
      this.currentEnv = this.toEnv;
    }
    this.fromEnv = null;
    this.toEnv = null;
    this.transitionProgress = 0;
    this.transitioning = false;
  }
}
