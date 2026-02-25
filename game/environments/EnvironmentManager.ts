import type {
  BiomeId,
  EnvironmentDefinition,
  EnvironmentPalette,
  BackgroundDrawFn,
} from "./types";
import { SUBURBAN_ENVIRONMENT } from "./suburban";
import { DUBAI_ENVIRONMENT } from "./dubai";
import { lerpPalette, easeInOutCubic } from "./colorLerp";

// ── Time thresholds for biome transitions ──
// When new biomes are added, register them in BIOME_REGISTRY and add entries here.

interface BiomeThreshold {
  timeMs: number;
  biomeId: BiomeId;
}

const BIOME_THRESHOLDS: BiomeThreshold[] = [
  { timeMs: 0, biomeId: "suburban" },
  { timeMs: 120_000, biomeId: "dubai" },
  // Future:
  // { timeMs: 240_000, biomeId: "desert" },
  // { timeMs: 360_000, biomeId: "snow" },
];

// Registry of all available environments.
// New biomes register themselves here when implemented.
const BIOME_REGISTRY: Record<string, EnvironmentDefinition> = {
  suburban: SUBURBAN_ENVIRONMENT,
  dubai: DUBAI_ENVIRONMENT,
};

/** Duration of a biome transition in 60fps dt units (~4 seconds). */
const TRANSITION_DURATION = 240; // 4s at 60fps
/** Duration of the music crossfade in milliseconds. */
const MUSIC_CROSSFADE_MS = 3000;

// ── Events emitted by update() for Engine to act on ──

export interface EnvUpdateResult {
  /** If set, Engine should crossfade music to the new track. */
  musicCrossfade?: { track: string; durationMs: number };
  /** If set, Engine should regenerate background with the new environment. */
  regenerateBackground?: EnvironmentDefinition;
}

/**
 * Manages the active environment/biome and handles smooth transitions
 * between biomes based on elapsed time thresholds.
 *
 * During a transition:
 * - getCurrentPalette() returns an interpolated palette
 * - getTransitionProgress() returns 0..1
 * - isTransitioning() returns true
 */
export class EnvironmentManager {
  private currentEnv: EnvironmentDefinition;
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
      const nextIndex = this.currentBiomeIndex + 1;
      if (nextIndex < BIOME_THRESHOLDS.length) {
        const threshold = BIOME_THRESHOLDS[nextIndex];
        if (elapsedMs >= threshold.timeMs) {
          const nextEnv = BIOME_REGISTRY[threshold.biomeId];
          if (nextEnv) {
            this.startTransition(nextEnv);
            this.currentBiomeIndex = nextIndex;

            // Signal Engine to crossfade music if track changed
            if (nextEnv.musicTrack !== this.currentEnv.musicTrack) {
              result.musicCrossfade = {
                track: nextEnv.musicTrack,
                durationMs: MUSIC_CROSSFADE_MS,
              };
            }
          }
        }
      }
    }

    // Advance transition
    if (this.transitioning) {
      this.transitionProgress += dt / TRANSITION_DURATION;
      if (this.transitionProgress >= 1) {
        this.completeTransition();
      }

      // At ~50% progress, signal Engine to regenerate background with new biome
      if (
        this.toEnv &&
        this.transitionProgress >= 0.5 &&
        this.transitionProgress - dt / TRANSITION_DURATION < 0.5
      ) {
        result.regenerateBackground = this.toEnv;
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
    return Math.max(0, elapsedMs - this.biomeStartMs);
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
   * After 50% transition, uses the target environment's drawers.
   */
  getBackgroundDrawers(): Record<string, BackgroundDrawFn> {
    if (this.transitioning && this.toEnv && this.transitionProgress >= 0.5) {
      return this.toEnv.backgroundDrawers;
    }
    return this.currentEnv.backgroundDrawers;
  }

  /** Whether a biome transition is currently in progress. */
  isTransitioning(): boolean {
    return this.transitioning;
  }

  /** Current transition progress (0..1). 0 when not transitioning. */
  getTransitionProgress(): number {
    return this.transitioning ? this.transitionProgress : 0;
  }

  /** Force an immediate transition to the next biome (debug only). */
  forceNextBiome(): EnvUpdateResult {
    const result: EnvUpdateResult = {};
    const nextIndex = this.currentBiomeIndex + 1;
    if (nextIndex >= BIOME_THRESHOLDS.length) return result;
    const threshold = BIOME_THRESHOLDS[nextIndex];
    const nextEnv = BIOME_REGISTRY[threshold.biomeId];
    if (!nextEnv) return result;
    this.startTransition(nextEnv);
    this.currentBiomeIndex = nextIndex;
    if (nextEnv.musicTrack !== this.currentEnv.musicTrack) {
      result.musicCrossfade = {
        track: nextEnv.musicTrack,
        durationMs: MUSIC_CROSSFADE_MS,
      };
    }
    return result;
  }

  // ── Internal ──

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
