/**
 * Typed game events. One channel for "something notable just happened" so that
 * haptics, voice lines, toasts and sounds can react to the same moments without
 * growing `EngineCallbacks` by one callback per feature.
 *
 * Only events that the Engine actually emits live here; later features add their
 * own variants (new best, skin unlocked) when they emit them.
 */
import type { BiomeId } from "./environments/types";
import type { ObstacleType } from "./types";

/** Why a trick chain ended. */
export type ComboEndReason = "expired" | "sketchy" | "crash";

/**
 * Something notable that happened during a run.
 * - `runStart`: a run began (not fired again when a revive resumes it).
 * - `trickLanded`: a trick landing was scored; `points` is what was paid (after the chain
 *   multiplier, which is also given), `big` marks standout tricks (by their base bonus,
 *   see `BIG_TRICK_POINTS`) for stronger feedback.
 * - `comboChanged`: a landing extended the trick chain.
 * - `comboEnded`: a chain of 2+ links ended; `reason` tells a time-out ("expired") or a
 *   sketchy landing ("sketchy") from a "crash", which pays no cash-in.
 * - `grindEnded`: a ride along a rideable obstacle long enough to score ended (rolled off or
 *   jumped off); `points` is what was paid after the chain multiplier. Fires after the
 *   `trickLanded` / `comboChanged` events of the combo link it created.
 * - `crash`: the rider crashed (fires before any ambulance revive).
 * - `revive`: the ambulance brought the rider back.
 * - `biomeChanged`: the transition into a new biome started.
 */
export type GameEvent =
  | { type: "runStart" }
  | { type: "trickLanded"; label: string; points: number; sketchy: boolean; big: boolean; multiplier: number }
  | { type: "comboChanged"; links: number; multiplier: number }
  | { type: "comboEnded"; links: number; multiplier: number; total: number; reason: ComboEndReason }
  | { type: "grindEnded"; obstacle: ObstacleType; points: number }
  | { type: "crash" }
  | { type: "revive" }
  | { type: "biomeChanged"; biome: BiomeId };

/** Receives every engine event; used by React screens for haptics, toasts, etc. */
export type GameEventHandler = (event: GameEvent) => void;
