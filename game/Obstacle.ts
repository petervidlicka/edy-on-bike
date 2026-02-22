import { ObstacleInstance, ObstacleType } from "./types";
import { MIN_OBSTACLE_GAP } from "./constants";
import type { EnvironmentDefinition, WeightedType } from "./environments/types";

// Dimensions for each obstacle type
export const OBSTACLE_SPECS: Record<ObstacleType, { width: number; height: number }> = {
  [ObstacleType.ROCK]:            { width: 28, height: 20 },
  [ObstacleType.SMALL_TREE]:      { width: 22, height: 48 },
  [ObstacleType.TALL_TREE]:       { width: 22, height: 72 },  // 50% taller — needs double-jump
  [ObstacleType.GIANT_TREE]:      { width: 30, height: 108 }, // 50% taller than tall tree, bushy
  [ObstacleType.SHOPPING_TROLLEY]:{ width: 38, height: 38 },
  [ObstacleType.CAR]:             { width: 80, height: 42 },
  [ObstacleType.PERSON_ON_BIKE]:  { width: 38, height: 52 },
  [ObstacleType.BUS_STOP]:        { width: 117, height: 91 },
  [ObstacleType.SHIPPING_CONTAINER]: { width: 176, height: 75 },
  [ObstacleType.STRAIGHT_RAMP]:   { width: 60, height: 20 },
  [ObstacleType.CURVED_RAMP]:     { width: 50, height: 24 },
};

function weightedRandom(types: WeightedType[]): ObstacleType {
  const total = types.reduce((sum, t) => sum + t.weight, 0);
  let rand = Math.random() * total;
  for (const t of types) {
    rand -= t.weight;
    if (rand <= 0) return t.type;
  }
  return types[types.length - 1].type;
}

export function spawnObstacle(
  canvasWidth: number,
  groundY: number,
  elapsedMs: number,
  envDef: EnvironmentDefinition
): ObstacleInstance {
  const type = weightedRandom(envDef.obstaclePool.getWeightedTypes(elapsedMs));
  const spec = OBSTACLE_SPECS[type];
  return {
    type,
    x: canvasWidth + 60,
    y: groundY - spec.height,
    width: spec.width,
    height: spec.height,
    rideable: type === ObstacleType.BUS_STOP || type === ObstacleType.SHIPPING_CONTAINER,
    ramp: type === ObstacleType.STRAIGHT_RAMP || type === ObstacleType.CURVED_RAMP,
  };
}

// Returns the pixel distance to wait before spawning the next obstacle.
// Gap shrinks slightly as speed increases to raise difficulty.
export function nextSpawnGap(speed: number): number {
  const maxGap = MIN_OBSTACLE_GAP * 3.5;
  const minGap = MIN_OBSTACLE_GAP;
  const speedFactor = Math.max(0, 1 - (speed - 5) / 20);
  return minGap + Math.random() * (maxGap - minGap) * speedFactor;
}
