import { ObstacleInstance, ObstacleMotion, ObstacleType } from "./types";
import { MIN_OBSTACLE_GAP, MIN_OBSTACLE_GAP_LATE, INITIAL_SPEED, PLAYER_X_RATIO } from "./constants";
import { HITBOX_PADDING } from "./Collision";
import type { EnvironmentDefinition, WeightedType } from "./environments/types";

/** How far (px) non-ramp obstacles sit into the road so they look grounded. */
const MAX_ROAD_SINK = 10;

/** Minimum vertical hitbox overlap (px) between a grounded rider and an obstacle. */
const MIN_HIT_BAND = 6;

// Dimensions for each obstacle type
export const OBSTACLE_SPECS: Record<ObstacleType, { width: number; height: number }> = {
  [ObstacleType.ROCK]:            { width: 28, height: 20 },
  [ObstacleType.SMALL_TREE]:      { width: 22, height: 48 },
  [ObstacleType.TALL_TREE]:       { width: 22, height: 72 },  // 50% taller — needs double-jump
  [ObstacleType.GIANT_TREE]:      { width: 30, height: 108 }, // 50% taller than tall tree, bushy
  [ObstacleType.SHOPPING_TROLLEY]:{ width: 38, height: 38 },
  [ObstacleType.CAR]:             { width: 70, height: 36 },  // small hatchback
  [ObstacleType.SUV]:             { width: 84, height: 46 },
  [ObstacleType.DELIVERY_VAN]:    { width: 92, height: 52 },  // still single-jumpable (apex ~120px)
  [ObstacleType.PERSON_ON_BIKE]:  { width: 46, height: 52 },  // long wheelbase so it reads as a bike
  [ObstacleType.BUS_STOP]:        { width: 129, height: 68 },
  [ObstacleType.SHIPPING_CONTAINER]: { width: 176, height: 75 },
  [ObstacleType.STRAIGHT_RAMP]:   { width: 90, height: 30 },
  [ObstacleType.CURVED_RAMP]:     { width: 75, height: 36 },
  [ObstacleType.CONTAINER_WITH_RAMP]: { width: 176, height: 75 },

  // Dubai biome obstacles
  [ObstacleType.CAMEL]:           { width: 50, height: 48 },
  [ObstacleType.SAND_TRAP]:       { width: 120, height: 28 },
  [ObstacleType.LAND_CRUISER]:    { width: 80, height: 42 },
  [ObstacleType.PINK_G_CLASS]:    { width: 76, height: 46 },
  [ObstacleType.CACTUS]:          { width: 22, height: 60 },
  [ObstacleType.DUBAI_CHOCOLATE]: { width: 176, height: 75 },
  [ObstacleType.LAMBORGHINI_HURACAN]: { width: 88, height: 24 },  // supercars sit low
  [ObstacleType.FERRARI_458]:     { width: 88, height: 24 },
  [ObstacleType.CONVERTIBLE]:     { width: 80, height: 26 },
  [ObstacleType.ROLLS_ROYCE_PHANTOM]: { width: 112, height: 32 }, // long limo — real 5.76 m at game scale
  [ObstacleType.PORSCHE_911]:     { width: 88, height: 26 },
  [ObstacleType.DUBAI_BILLBOARD]:    { width: 309, height: 92 },

  // Austria biome obstacles
  [ObstacleType.SNOWMAN]:         { width: 30, height: 46 },
  [ObstacleType.FROZEN_LAKE]:     { width: 130, height: 24 },  // long, low — the Alpine sand trap
  [ObstacleType.RED_DEER]:        { width: 50, height: 56 },   // antlers make it a tall single jump
  [ObstacleType.BEER_CRATES]:     { width: 36, height: 42 },   // three crates stacked
  [ObstacleType.BEER_CRATE_WALL]: { width: 132, height: 56 },  // four wide, four high — rideable
  [ObstacleType.SNOW_CAT]:        { width: 168, height: 70 },  // Pistenbully, rideable cab roof
  [ObstacleType.SNOW_KICKER]:     { width: 80, height: 36 },   // curved ramp geometry, built of snow
  [ObstacleType.FREERIDE_SKIER]:  { width: 40, height: 50 },
  [ObstacleType.RACE_SKIER]:      { width: 44, height: 34 },   // tucked low
  [ObstacleType.SNOWBOARDER]:     { width: 40, height: 48 },
  [ObstacleType.SNOW_SCOOTER]:    { width: 66, height: 42 },
};

/**
 * Obstacles that travel on their own, by world speed (px per frame; + moves with the
 * rider, − comes towards it). Racers and scooters come at the rider, freeriders and
 * boarders cruise the same way so they arrive late.
 */
const MOTION_VX: Partial<Record<ObstacleType, number>> = {
  [ObstacleType.FREERIDE_SKIER]: 1.2,
  [ObstacleType.SNOWBOARDER]: 0.9,
  [ObstacleType.RACE_SKIER]: -2.2,
  [ObstacleType.SNOW_SCOOTER]: -1.4,
};

/** Upper bound on a mover's travel, which also bounds the spawn padding it needs. */
const MAX_MOTION_TRAVEL = 420;

/**
 * How far a mover travels: just enough to keep moving until it reaches the rider, so it
 * never visibly stops on screen. Past that it scrolls like a static obstacle.
 * @param vx - The mover's world speed.
 * @param approach - Distance from the spawn point to the rider (px).
 * @param speed - World scroll speed at spawn.
 */
function motionTravel(vx: number, approach: number, speed: number): number {
  // Oncoming: it also covers its own head start (see createObstacle), which works out to vx·approach/speed
  const travel = vx > 0 ? (vx * approach) / Math.max(1, speed - vx) : (-vx * approach) / speed;
  return Math.min(MAX_MOTION_TRAVEL, Math.round(travel));
}

const RIDEABLE_TYPES = new Set<ObstacleType>([
  ObstacleType.BUS_STOP,
  ObstacleType.SHIPPING_CONTAINER,
  ObstacleType.CONTAINER_WITH_RAMP,
  ObstacleType.DUBAI_CHOCOLATE,
  ObstacleType.DUBAI_BILLBOARD,
  ObstacleType.BEER_CRATE_WALL,
  ObstacleType.SNOW_CAT,
]);

const RAMP_TYPES = new Set<ObstacleType>([
  ObstacleType.STRAIGHT_RAMP,
  ObstacleType.CURVED_RAMP,
  ObstacleType.SNOW_KICKER,
]);

/** Trick name shown when the rider grinds along the top of each rideable obstacle. */
const GRIND_LABELS: Partial<Record<ObstacleType, string>> = {
  [ObstacleType.SHIPPING_CONTAINER]: "Container Grind",
  [ObstacleType.CONTAINER_WITH_RAMP]: "Container Grind",
  [ObstacleType.BUS_STOP]: "Bus Stop Grind",
  [ObstacleType.DUBAI_BILLBOARD]: "Billboard Grind",
  [ObstacleType.DUBAI_CHOCOLATE]: "Chocolate Grind \u{1F36B}",
  [ObstacleType.BEER_CRATE_WALL]: "Crate Grind \u{1F37A}",
  [ObstacleType.SNOW_CAT]: "Pistenbully Grind",
};

/**
 * Names a grind after the obstacle it happened on, so each rideable feels like its own trick.
 * @param type - The obstacle that was ridden.
 * @returns The label, or a generic "Grind" for a rideable without a dedicated name.
 */
export function getGrindLabel(type: ObstacleType): string {
  return GRIND_LABELS[type] ?? "Grind";
}

function weightedRandom(types: WeightedType[], rng: () => number = Math.random): ObstacleType {
  const total = types.reduce((sum, t) => sum + t.weight, 0);
  let rand = rng() * total;
  for (const t of types) {
    rand -= t.weight;
    if (rand <= 0) return t.type;
  }
  return types[types.length - 1].type;
}

/**
 * Builds an obstacle of `type` just off the right edge, sitting on the road.
 * @param speed - World scroll speed at spawn; sizes how far a moving obstacle travels.
 */
export function createObstacle(
  type: ObstacleType,
  canvasWidth: number,
  groundY: number,
  speed: number = INITIAL_SPEED
): ObstacleInstance {
  const spec = OBSTACLE_SPECS[type];
  // Ramps keep exact positioning (physics-dependent), everything else sits
  // slightly into the road so obstacles look grounded rather than floating.
  // The sink is capped so a grounded rider's hitbox still overlaps the obstacle's
  // by MIN_HIT_BAND px; otherwise low cars would only collide in a 1px sliver.
  const isRamp = RAMP_TYPES.has(type) || type === ObstacleType.CONTAINER_WITH_RAMP;
  const maxSink = spec.height - 2 * HITBOX_PADDING - MIN_HIT_BAND;
  const yOffset = isRamp ? 0 : Math.max(0, Math.min(maxSink, MAX_ROAD_SINK));
  const spawnX = canvasWidth + 60;
  const vx = MOTION_VX[type];
  const motion: ObstacleMotion | undefined = vx === undefined ? undefined : {
    vx,
    travelled: 0,
    maxTravel: motionTravel(vx, spawnX - canvasWidth * PLAYER_X_RATIO, speed),
  };
  // Oncoming movers start further out by their full travel, so they close in on the
  // obstacle ahead of them no more than a static one spawned at the usual point would.
  const spawnPad = motion && motion.vx < 0 ? motion.maxTravel : 0;
  return {
    type,
    x: spawnX + spawnPad,
    y: groundY - spec.height + yOffset,
    width: spec.width,
    height: spec.height,
    rideable: RIDEABLE_TYPES.has(type),
    ramp: RAMP_TYPES.has(type),
    ...(motion && { motion }),
  };
}

/**
 * Moves an obstacle one frame: the world scroll, plus its own travel while it has any
 * left. Travel depends only on frame time, never on randomness, so multiplayer clients
 * seeded alike still agree on the course.
 * @param obstacle - Mutated in place.
 * @param speed - Current world scroll speed (px per frame).
 * @param dt - Frame time in 60fps units.
 */
export function moveObstacle(obstacle: ObstacleInstance, speed: number, dt: number): void {
  obstacle.x -= speed * dt;
  const motion = obstacle.motion;
  if (!motion || motion.travelled >= motion.maxTravel) return;
  const step = Math.min(Math.abs(motion.vx) * dt, motion.maxTravel - motion.travelled);
  motion.travelled += step;
  obstacle.x += Math.sign(motion.vx) * step;
}

/**
 * Extra distance to leave before the next spawn, so a mover never closes in on the
 * obstacle behind it. One that travels with the rider drifts back towards it; an
 * oncoming one starts further out (see createObstacle) and may not have used up that
 * head start when the next obstacle appears. Either way its travel bounds the overlap.
 * @param obstacle - The obstacle just spawned.
 * @returns Pixels to add to the next spawn gap (0 for static obstacles).
 */
export function spawnGapPadding(obstacle: ObstacleInstance): number {
  return obstacle.motion?.maxTravel ?? 0;
}

export function spawnObstacle(
  canvasWidth: number,
  groundY: number,
  elapsedMs: number,
  envDef: EnvironmentDefinition,
  speed: number,
  rng: () => number = Math.random
): ObstacleInstance {
  const type = weightedRandom(envDef.obstaclePool.getWeightedTypes(elapsedMs), rng);
  return createObstacle(type, canvasWidth, groundY, speed);
}

// Returns the pixel distance to wait before spawning the next obstacle.
// Gap shrinks slightly as speed increases to raise difficulty, but stays
// comfortable in later stages thanks to a rising floor and a minimum speedFactor.
export function nextSpawnGap(speed: number, elapsedMs: number, rng: () => number = Math.random): number {
  const maxGap = MIN_OBSTACLE_GAP * 3.5;
  // Floor rises with time: 300 at start → 400 after 60s
  const timeFactor = Math.min(1, elapsedMs / 60_000);
  const minGap = MIN_OBSTACLE_GAP + (MIN_OBSTACLE_GAP_LATE - MIN_OBSTACLE_GAP) * timeFactor;
  // Speed factor bottoms at 0.3 instead of 0 to prevent complete gap collapse
  const speedFactor = Math.max(0.3, 1 - (speed - 5) / 20);
  return minGap + rng() * (maxGap - minGap) * speedFactor;
}
