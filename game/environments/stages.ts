/**
 * Time-staged obstacle pools: a biome opens with a few easy obstacles and widens its
 * roster at each stage start until the full one is in play. Each biome describes its
 * pool as one table (plus its own stage starts, if not the standard ones) instead of
 * re-implementing the staging, and the same table tells the biome cycle when the full
 * roster is reached.
 */
import type { ObstacleType } from "../types";
import type { ObstaclePoolConfig, WeightedType } from "./types";

/** Biome-relative times (ms) when the standard stage 2 (wider roster) and stage 3 (full weights) begin. */
export const STANDARD_STAGE_STARTS_MS: readonly number[] = [15_000, 30_000];

/**
 * Spawn weight in each stage, one entry per stage (the number of stage starts plus one).
 * `null` keeps the obstacle out of the pool for that stage.
 */
export type StageWeights = ReadonlyArray<number | null>;

/** One row of a stage table: an obstacle and its weight per stage. */
export type StageRow = readonly [ObstacleType, StageWeights];

/** Weights for the opening obstacles of a standard three-stage pool, which give way as harder ones arrive. */
export const EASING_OUT: StageWeights = [1.0, 0.7, 0.4];

/** Index of the stage running at `biomeMs` (0 before the first start). */
function stageAt(biomeMs: number, stageStarts: readonly number[]): number {
  let stage = 0;
  while (stage < stageStarts.length && biomeMs >= stageStarts[stage]) stage++;
  return stage;
}

/**
 * The pool at `biomeMs`, in table order (multiplayer seeds pick by index, so the order
 * is part of the course).
 * @param biomeMs - Time since this biome started (see EnvironmentManager.getBiomeElapsedMs).
 * @param table - Weight per stage for each obstacle.
 * @param stageStarts - Biome-relative times at which each later stage begins, ascending.
 * @example
 * stagedPool(20_000, [[ObstacleType.CACTUS, EASING_OUT], [ObstacleType.CAMEL, [null, 0.5, 0.8]]])
 * // → [{ type: CACTUS, weight: 0.7 }, { type: CAMEL, weight: 0.5 }]
 */
export function stagedPool(
  biomeMs: number,
  table: ReadonlyArray<StageRow>,
  stageStarts: readonly number[] = STANDARD_STAGE_STARTS_MS,
): WeightedType[] {
  const stage = stageAt(biomeMs, stageStarts);
  const pool: WeightedType[] = [];
  for (const [type, weights] of table) {
    const weight = weights[stage];
    if (weight !== null) pool.push({ type, weight });
  }
  return pool;
}

/**
 * A biome's obstacle pool from its stage table. The table is checked against the stage
 * count once, here, so a row with the wrong number of weights fails when the biome
 * module loads rather than silently mid-run.
 * @param table - Weight per stage for each obstacle.
 * @param stageStarts - Biome-relative times at which each later stage begins, ascending.
 * @returns A pool whose `fullRosterMs` is the last stage start.
 * @example
 * stagedObstaclePool([[ObstacleType.ROCK, [1, 0.5]]], [10_000]).fullRosterMs; // 10000
 */
export function stagedObstaclePool(
  table: ReadonlyArray<StageRow>,
  stageStarts: readonly number[] = STANDARD_STAGE_STARTS_MS,
): ObstaclePoolConfig {
  const stages = stageStarts.length + 1;
  for (const [type, weights] of table) {
    if (weights.length !== stages) {
      throw new Error(`Obstacle ${type} has ${weights.length} stage weights; the pool has ${stages} stages`);
    }
  }
  return {
    getWeightedTypes: (biomeMs) => stagedPool(biomeMs, table, stageStarts),
    fullRosterMs: stageStarts.length > 0 ? stageStarts[stageStarts.length - 1] : 0,
  };
}
