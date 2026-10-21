import type {
  BiomeId,
  EnvironmentDefinition,
  EnvironmentPalette,
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

const NO_PASSES: readonly SkylinePass[] = [];

/**
 * Shortest biome transition in 60fps dt units (~4 seconds). Engine stretches each one to
 * however long the incoming buildings take to scroll across (see setTransitionDuration).
 */
const MIN_TRANSITION_DURATION = 240; // 4s at 60fps
/** Duration of the music crossfade in milliseconds. */
const MUSIC_CROSSFADE_MS = 3000;

// ── Events emitted by update() for Engine to act on ──

export interface EnvUpdateResult {
  /** If set, a transition into this biome just started (Engine announces it as an event). */
  biomeStarted?: BiomeId;
  /** If set, Engine should crossfade music to the new track. */
  musicCrossfade?: { track: string; durationMs: number };
  /** If set, a transition just started: Engine queues the incoming biome's scenery behind the current one. */
  appendBackground?: { fromEnv: EnvironmentDefinition; toEnv: EnvironmentDefinition };
  /** If set, the transition into this environment just finished (outgoing clouds/weather are gone). */
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
  /** Run time at which the next biome is due; pushed back when a biome is forced early. */
  private nextBiomeAtMs = BIOME_DURATION_MS;
  /** Steady-state skyline passes per drawer, so a frame outside a transition allocates nothing. */
  private steadyPasses = new Map<SkylineDrawFn, readonly SkylinePass[]>();

  // Transition state
  private fromEnv: EnvironmentDefinition | null = null;
  private toEnv: EnvironmentDefinition | null = null;
  private transitionProgress = 0;
  private transitioning = false;
  /** Length of the running transition, in 60fps dt units. */
  private transitionDuration = MIN_TRANSITION_DURATION;

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
      if (elapsedMs >= this.nextBiomeAtMs) {
        this.nextBiomeAtMs += BIOME_DURATION_MS;
        const fromEnv = this.currentEnv;
        const nextEnv = this.advanceBiome();
        result.biomeStarted = nextEnv.id;

        // Signal Engine to queue the new biome's scenery behind the current one
        result.appendBackground = { fromEnv, toEnv: nextEnv };

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
      this.transitionProgress += dt / this.transitionDuration;
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
    this.nextBiomeAtMs = BIOME_DURATION_MS;
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
   * Sets how long the transition that just started lasts, so colours, clouds and weather
   * change while the incoming biome's buildings scroll in rather than ahead of them.
   * @param frames - Duration in 60fps dt units; never shorter than ~4 seconds.
   */
  setTransitionDuration(frames: number): void {
    this.transitionDuration = Math.max(MIN_TRANSITION_DURATION, frames);
  }

  /** The biome being moved to during a transition, otherwise the current one. */
  getTargetEnvironment(): EnvironmentDefinition {
    return this.toEnv ?? this.currentEnv;
  }

  /** Eased transition progress (0–1) for cross-fades, or null when no transition is running. */
  getTransitionFade(): number | null {
    return this.transitioning ? easeInOutCubic(Math.min(1, this.transitionProgress)) : null;
  }

  /**
   * Far scenery bands to draw this frame. Across a transition the outgoing biome's
   * band fades out while the incoming one fades in.
   */
  getSkylines(): readonly SkylinePass[] {
    return this.fadedPasses((env) => env.skyline);
  }

  /** Road overlays (e.g. wet-road neon reflections), faded across a transition like skylines. */
  getRoadOverlays(): readonly SkylinePass[] {
    return this.fadedPasses((env) => env.roadOverlay);
  }

  /** Biome kit for the rider; switches halfway through a transition, with the buildings. */
  getRiderGear(): RiderGear | undefined {
    return this.getCurrentEnvironment().riderGear;
  }

  /**
   * Force an immediate transition to the next biome (debug only). A transition already
   * under way is finished first so no biome is skipped, and the forced biome gets a full
   * BIOME_DURATION_MS before the next one is due.
   */
  forceNextBiome(): EnvUpdateResult {
    const result: EnvUpdateResult = {};
    if (this.transitioning) this.completeTransition();
    this.nextBiomeAtMs = this.lastElapsedMs + BIOME_DURATION_MS;
    const nextEnv = this.advanceBiome();
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

  /** Moves on to the next biome in the cycle and starts the transition into it. */
  private advanceBiome(): EnvironmentDefinition {
    this.currentBiomeIndex++;
    const nextEnv = BIOME_CYCLE[this.currentBiomeIndex % BIOME_CYCLE.length];
    this.startTransition(nextEnv);
    return nextEnv;
  }

  /**
   * One pass per biome that has the picked drawer: outgoing fades out, incoming fades in.
   * Outside a transition the same cached array is returned every frame.
   */
  private fadedPasses(pick: (env: EnvironmentDefinition) => SkylineDrawFn | undefined): readonly SkylinePass[] {
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
    if (!current) return NO_PASSES;
    let passes = this.steadyPasses.get(current);
    if (!passes) {
      passes = [{ draw: current, alpha: 1 }];
      this.steadyPasses.set(current, passes);
    }
    return passes;
  }

  private startTransition(toEnv: EnvironmentDefinition): void {
    this.fromEnv = this.currentEnv;
    this.toEnv = toEnv;
    this.transitionProgress = 0;
    this.transitionDuration = MIN_TRANSITION_DURATION;
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
