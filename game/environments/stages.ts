/**
 * Time-staged obstacle pools: a biome opens with a few easy obstacles, adds the rest
 * 15s in, and reaches full weights 30s in. Each biome describes its pool as one table
 * instead of re-implementing the staging.
 */
import type { ObstacleType } from "../types";
import type { WeightedType } from "./types";

/** Biome-relative time when stage 2 (wider roster) and stage 3 (full weights) begin. */
const STAGE_STARTS_MS = [15_000, 30_000] as const;

/**
 * Spawn weight in each stage: [0–15s, 15–30s, 30s+]. `null` keeps the obstacle out of
 * the pool for that stage.
 */
export type StageWeights = readonly [number | null, number | null, number | null];

/** Weights for the opening obstacles, which give way as harder ones arrive. */
export const EASING_OUT: StageWeights = [1.0, 0.7, 0.4];

/**
 * The pool at `biomeMs`, in table order (multiplayer seeds pick by index, so the order
 * is part of the course).
 * @param biomeMs - Time since this biome started (see EnvironmentManager.getBiomeElapsedMs).
 * @example
 * stagedPool(20_000, [[ObstacleType.CACTUS, EASING_OUT], [ObstacleType.CAMEL, [null, 0.5, 0.8]]])
 * // → [{ type: CACTUS, weight: 0.7 }, { type: CAMEL, weight: 0.5 }]
 */
export function stagedPool(
  biomeMs: number,
  table: ReadonlyArray<readonly [ObstacleType, StageWeights]>,
): WeightedType[] {
  const stage = biomeMs >= STAGE_STARTS_MS[1] ? 2 : biomeMs >= STAGE_STARTS_MS[0] ? 1 : 0;
  const pool: WeightedType[] = [];
  for (const [type, weights] of table) {
    const weight = weights[stage];
    if (weight !== null) pool.push({ type, weight });
  }
  return pool;
}
