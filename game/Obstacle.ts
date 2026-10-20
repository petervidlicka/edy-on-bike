import { ObstacleInstance, ObstacleMotion, ObstacleType } from "./types";
import { MIN_OBSTACLE_GAP, MIN_OBSTACLE_GAP_LATE, PLAYER_X_RATIO } from "./constants";
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
 * Obstacles that travel on their own, as how far they end up from where a static obstacle
 * would be by the time they reach the rider (px; + moves with the rider and arrives late,
 * − comes towards it and arrives early). Racers and scooters come at the rider, freeriders
 * and boarders cruise the same way. Each mover's own speed is `speed · offset / MOTION_RANGE`,
 * so it scales with the world speed.
 */
const MOTION_OFFSET: Partial<Record<ObstacleType, number>> = {
  [ObstacleType.FREERIDE_SKIER]: 500,
  [ObstacleType.SNOWBOARDER]: 400,
  [ObstacleType.RACE_SKIER]: -720,
  [ObstacleType.SNOW_SCOOTER]: -560,
};

/**
 * Distance ahead of the rider within which movers travel. Beyond it they sit still, which
 * is off screen on any display up to ~3000px wide at normal zoom. Being a constant, not
 * the screen width, it gives every multiplayer client the same course.
 */
const MOTION_RANGE = 2400;

/**
 * Where a mover is drawn and collides: its static position plus a shift that grows
 * linearly from 0 at MOTION_RANGE to `offset` at the rider, so it moves steadily the whole
 * time it is on screen.
 * @param motion - The mover's motion.
 * @param riderX - The rider's x.
 */
function movedX(motion: ObstacleMotion, riderX: number): number {
  const ahead = Math.min(MOTION_RANGE, motion.staticX - riderX);
  return motion.staticX + motion.offset * (1 - ahead / MOTION_RANGE);
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
 * Builds an obstacle of `type` just beyond `spawnEdge` (the right edge of the widest
 * view), sitting on the road.
 * @param riderX - The rider's x, which a mover's position is measured from.
 */
export function createObstacle(
  type: ObstacleType,
  spawnEdge: number,
  groundY: number,
  riderX: number = spawnEdge * PLAYER_X_RATIO
): ObstacleInstance {
  const spec = OBSTACLE_SPECS[type];
  // Ramps keep exact positioning (physics-dependent), everything else sits
  // slightly into the road so obstacles look grounded rather than floating.
  // The sink is capped so a grounded rider's hitbox still overlaps the obstacle's
  // by MIN_HIT_BAND px; otherwise low cars would only collide in a 1px sliver.
  const isRamp = RAMP_TYPES.has(type) || type === ObstacleType.CONTAINER_WITH_RAMP;
  const maxSink = spec.height - 2 * HITBOX_PADDING - MIN_HIT_BAND;
  const yOffset = isRamp ? 0 : Math.max(0, Math.min(maxSink, MAX_ROAD_SINK));
  const spawnX = spawnEdge + 60;
  const offset = MOTION_OFFSET[type];
  // Oncoming movers start further out by their full offset, so they never close in on the
  // obstacle ahead of them more than a static one spawned at the usual point would
  const motion: ObstacleMotion | undefined = offset === undefined ? undefined : {
    offset,
    staticX: spawnX + Math.max(0, -offset),
  };
  return {
    type,
    x: motion ? movedX(motion, riderX) : spawnX,
    y: groundY - spec.height + yOffset,
    width: spec.width,
    height: spec.height,
    rideable: RIDEABLE_TYPES.has(type),
    ramp: RAMP_TYPES.has(type),
    ...(motion && { motion }),
  };
}

/**
 * Moves an obstacle one frame with the world scroll; a mover also gets its own shift.
 * The shift depends only on distance to the rider, never on frame time or screen width,
 * so multiplayer clients seeded alike still agree on the course.
 * @param obstacle - Mutated in place.
 * @param speed - Current world scroll speed (px per frame).
 * @param dt - Frame time in 60fps units.
 * @param riderX - The rider's x.
 */
export function moveObstacle(obstacle: ObstacleInstance, speed: number, dt: number, riderX: number): void {
  const motion = obstacle.motion;
  if (!motion) {
    obstacle.x -= speed * dt;
    return;
  }
  motion.staticX -= speed * dt;
  obstacle.x = movedX(motion, riderX);
}

/**
 * Extra distance to leave before the next spawn, so a mover never closes in on the
 * obstacle behind it. One that travels with the rider drifts back towards it; an
 * oncoming one starts further out (see createObstacle) by its offset.
 * @param obstacle - The obstacle just spawned.
 * @returns Pixels to add to the next spawn gap (0 for static obstacles).
 */
export function spawnGapPadding(obstacle: ObstacleInstance): number {
  const offset = obstacle.motion?.offset ?? 0;
  // A mover that goes the rider's way keeps drifting back until the rider actually
  // catches it, slightly past the static arrival point: offset·R/(R − offset) in total
  return offset > 0 ? Math.ceil((offset * MOTION_RANGE) / (MOTION_RANGE - offset)) : -offset;
}

export function spawnObstacle(
  spawnEdge: number,
  groundY: number,
  elapsedMs: number,
  envDef: EnvironmentDefinition,
  riderX: number,
  rng: () => number = Math.random
): ObstacleInstance {
  const type = weightedRandom(envDef.obstaclePool.getWeightedTypes(elapsedMs), rng);
  return createObstacle(type, spawnEdge, groundY, riderX);
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
