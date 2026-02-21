import { ObstacleInstance, ObstacleType } from "./types";
import { MIN_OBSTACLE_GAP } from "./constants";

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

type WeightedType = { type: ObstacleType; weight: number };

// Basic obstacles are down-weighted at later stages so harder obstacles
// appear more frequently (target: ~20-25% fewer basics per stage unlock).
function getWeightedTypes(elapsedMs: number): WeightedType[] {
  // basicWeight drops as stages advance so harder obstacles dominate
  const basicWeight = elapsedMs >= 25_000 ? 0.4 : elapsedMs >= 10_000 ? 0.7 : 1.0;

  const types: WeightedType[] = [
    { type: ObstacleType.ROCK,       weight: basicWeight },
    { type: ObstacleType.SMALL_TREE, weight: basicWeight },
  ];
  // Stage 2 (10s): tall trees, giant trees, trolleys, ramps
  if (elapsedMs >= 10_000) {
    types.push({ type: ObstacleType.TALL_TREE,        weight: 0.8 });
    types.push({ type: ObstacleType.GIANT_TREE,       weight: 0.5 });
    types.push({ type: ObstacleType.SHOPPING_TROLLEY, weight: 1.0 });
    types.push({ type: ObstacleType.STRAIGHT_RAMP,    weight: 0.4 });
    types.push({ type: ObstacleType.CURVED_RAMP,      weight: 0.4 });
  }
  // Stage 3 (25s): rideable obstacles — ramps/rideables dominate
  if (elapsedMs >= 25_000) {
    types.push({ type: ObstacleType.BUS_STOP,           weight: 0.8 });
    types.push({ type: ObstacleType.SHIPPING_CONTAINER, weight: 0.8 });
  }
  // Stage 4 (40s): cars + other riders
  if (elapsedMs >= 40_000) {
    types.push({ type: ObstacleType.CAR,            weight: 1.0 });
    types.push({ type: ObstacleType.PERSON_ON_BIKE, weight: 1.0 });
  }
  return types;
}

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
  elapsedMs: number
): ObstacleInstance {
  const type = weightedRandom(getWeightedTypes(elapsedMs));
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
