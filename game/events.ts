/**
 * Typed game events. One channel for "something notable just happened" so that
 * haptics, voice lines, toasts and sounds can react to the same moments without
 * growing `EngineCallbacks` by one callback per feature.
 *
 * Only events that the Engine actually emits live here; later features add their
 * own variants (grind ended, new best, skin unlocked) when they emit them.
 */
import type { BiomeId } from "./environments/types";

/**
 * Something notable that happened during a run.
 * - `runStart`: a run began (not fired again when a revive resumes it).
 * - `trickLanded`: a trick landing was scored; `points` is what was paid, `big` marks
 *   standout tricks (see `BIG_TRICK_POINTS`) for stronger feedback.
 * - `crash`: the rider crashed (fires before any ambulance revive).
 * - `revive`: the ambulance brought the rider back.
 * - `biomeChanged`: the transition into a new biome started.
 */
export type GameEvent =
  | { type: "runStart" }
  | { type: "trickLanded"; label: string; points: number; sketchy: boolean; big: boolean }
  | { type: "crash" }
  | { type: "revive" }
  | { type: "biomeChanged"; biome: BiomeId };

/** Receives every engine event; used by React screens for haptics, toasts, etc. */
export type GameEventHandler = (event: GameEvent) => void;
