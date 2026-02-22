import { ObstacleInstance, ObstacleType } from "./types";
import { MIN_OBSTACLE_GAP, MIN_OBSTACLE_GAP_LATE } from "./constants";
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
  [ObstacleType.BUS_STOP]:        { width: 129, height: 68 },
  [ObstacleType.SHIPPING_CONTAINER]: { width: 176, height: 75 },
  [ObstacleType.STRAIGHT_RAMP]:   { width: 90, height: 30 },
  [ObstacleType.CURVED_RAMP]:     { width: 75, height: 36 },
  [ObstacleType.CONTAINER_WITH_RAMP]: { width: 176, height: 75 },
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
    rideable: type === ObstacleType.BUS_STOP || type === ObstacleType.SHIPPING_CONTAINER || type === ObstacleType.CONTAINER_WITH_RAMP,
    ramp: type === ObstacleType.STRAIGHT_RAMP || type === ObstacleType.CURVED_RAMP,
  };
}

// Returns the pixel distance to wait before spawning the next obstacle.
// Gap shrinks slightly as speed increases to raise difficulty, but stays
// comfortable in later stages thanks to a rising floor and a minimum speedFactor.
export function nextSpawnGap(speed: number, elapsedMs: number): number {
  const maxGap = MIN_OBSTACLE_GAP * 3.5;
  // Floor rises with time: 300 at start → 400 after 60s
  const timeFactor = Math.min(1, elapsedMs / 60_000);
  const minGap = MIN_OBSTACLE_GAP + (MIN_OBSTACLE_GAP_LATE - MIN_OBSTACLE_GAP) * timeFactor;
  // Speed factor bottoms at 0.3 instead of 0 to prevent complete gap collapse
  const speedFactor = Math.max(0.3, 1 - (speed - 5) / 20);
  return minGap + Math.random() * (maxGap - minGap) * speedFactor;
}
