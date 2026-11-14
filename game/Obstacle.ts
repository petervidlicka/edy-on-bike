/**
 * Obstacle catalogue and spawning. Everything the game knows about an obstacle type —
 * its box, whether it can be ridden, which ramp profile it carries, how it moves, what
 * its grind is called and which crash it triggers — lives in one `OBSTACLE_SPECS` row,
 * so adding a type is a single entry rather than edits to several parallel tables.
 */
import { ObstacleInstance, ObstacleMotion, ObstacleType } from "./types";
import { HITBOX_PADDING, MIN_OBSTACLE_GAP, MIN_OBSTACLE_GAP_LATE, PLAYER_X_RATIO } from "./constants";
import type { EnvironmentDefinition, WeightedType } from "./environments/types";

/** How far (px) non-ramp obstacles sit into the road so they look grounded. */
const MAX_ROAD_SINK = 10;

/** Minimum vertical hitbox overlap (px) between a grounded rider and an obstacle. */
const MIN_HIT_BAND = 6;

/**
 * Ramp profile an obstacle carries: a standalone wedge or curve the rider rolls over,
 * or a curved kicker on top of a rideable box (see `CONTAINER_RAMP` in rampGeometry).
 */
export type RampShape = "straight" | "curved" | "onContainer";

/** The crash animation family an obstacle calls for (see crashes/registry). */
export type CrashFamily = "car" | "tree";

/** Everything the game knows about one obstacle type. */
export interface ObstacleSpec {
  width: number;
  height: number;
  /** The rider can land on and ride along the top. */
  rideable?: true;
  /** Ramp profile, if the obstacle has one; `undefined` means it is hit, not ridden over. */
  ramp?: RampShape;
  /**
   * For obstacles that travel on their own: how far they end up from where a static
   * obstacle would be by the time they reach the rider (px; + moves with the rider and
   * arrives late, − comes towards it and arrives early). Each mover's own speed is
   * `speed · offset / MOTION_RANGE`, so it scales with the world speed.
   */
  motionOffset?: number;
  /** Trick name shown when the rider grinds along the top of a rideable. */
  grindLabel?: string;
  /** Which crash variant hitting this obstacle plays. */
  crashFamily?: CrashFamily;
  /** Trees only: how far down from the top the tree-hang hook sits, as a fraction of height. */
  hookDepth?: number;
}

const CAR: CrashFamily = "car";
const TREE: CrashFamily = "tree";

/** The catalogue of obstacle types; sizes are in world px. */
export const OBSTACLE_SPECS: Record<ObstacleType, ObstacleSpec> = {
  [ObstacleType.ROCK]:            { width: 28, height: 20 },
  [ObstacleType.SMALL_TREE]:      { width: 22, height: 48, crashFamily: TREE, hookDepth: 0.26 },
  [ObstacleType.TALL_TREE]:       { width: 22, height: 72, crashFamily: TREE, hookDepth: 0.3 },  // 50% taller — needs double-jump
  [ObstacleType.GIANT_TREE]:      { width: 30, height: 108, crashFamily: TREE, hookDepth: 0.3 }, // 50% taller than tall tree, bushy
  [ObstacleType.SHOPPING_TROLLEY]:{ width: 38, height: 38 },
  [ObstacleType.CAR]:             { width: 70, height: 36, crashFamily: CAR },  // small hatchback
  [ObstacleType.SUV]:             { width: 84, height: 46, crashFamily: CAR },
  [ObstacleType.DELIVERY_VAN]:    { width: 92, height: 52, crashFamily: CAR },  // still single-jumpable (apex ~120px)
  [ObstacleType.PERSON_ON_BIKE]:  { width: 46, height: 52 },  // long wheelbase so it reads as a bike
  [ObstacleType.BUS_STOP]:        { width: 129, height: 68, rideable: true, grindLabel: "Bus Stop Grind" },
  [ObstacleType.SHIPPING_CONTAINER]: { width: 176, height: 75, rideable: true, grindLabel: "Container Grind" },
  [ObstacleType.STRAIGHT_RAMP]:   { width: 90, height: 30, ramp: "straight" },
  [ObstacleType.CURVED_RAMP]:     { width: 75, height: 36, ramp: "curved" },
  [ObstacleType.CONTAINER_WITH_RAMP]: { width: 176, height: 75, rideable: true, ramp: "onContainer", grindLabel: "Container Grind" },

  // Dubai biome obstacles
  [ObstacleType.CAMEL]:           { width: 50, height: 48 },
  [ObstacleType.SAND_TRAP]:       { width: 120, height: 28 },
  [ObstacleType.LAND_CRUISER]:    { width: 80, height: 42, crashFamily: CAR },
  [ObstacleType.PINK_G_CLASS]:    { width: 76, height: 46, crashFamily: CAR },
  [ObstacleType.CACTUS]:          { width: 22, height: 60 },
  [ObstacleType.DUBAI_CHOCOLATE]: { width: 176, height: 75, rideable: true, grindLabel: "Chocolate Grind \u{1F36B}" },
  [ObstacleType.LAMBORGHINI_HURACAN]: { width: 88, height: 24, crashFamily: CAR },  // supercars sit low
  [ObstacleType.FERRARI_458]:     { width: 88, height: 24, crashFamily: CAR },
  [ObstacleType.CONVERTIBLE]:     { width: 80, height: 26, crashFamily: CAR },
  [ObstacleType.ROLLS_ROYCE_PHANTOM]: { width: 112, height: 32, crashFamily: CAR }, // long limo — real 5.76 m at game scale
  [ObstacleType.PORSCHE_911]:     { width: 88, height: 26, crashFamily: CAR },
  [ObstacleType.DUBAI_BILLBOARD]:    { width: 309, height: 92, rideable: true, grindLabel: "Billboard Grind" },

  // Austria biome obstacles. Racers and snow scooters come at the rider; freeriders and
  // boarders cruise the same way (see `motionOffset`).
  [ObstacleType.SNOWMAN]:         { width: 30, height: 46 },
  [ObstacleType.FROZEN_LAKE]:     { width: 130, height: 24 },  // long, low — the Alpine sand trap
  [ObstacleType.RED_DEER]:        { width: 50, height: 56 },   // antlers make it a tall single jump
  [ObstacleType.BEER_CRATES]:     { width: 36, height: 42 },   // three crates stacked
  [ObstacleType.BEER_CRATE_WALL]: { width: 132, height: 56, rideable: true, grindLabel: "Crate Grind \u{1F37A}" },  // four wide, four high
  [ObstacleType.SNOW_CAT]:        { width: 168, height: 70, rideable: true, grindLabel: "Pistenbully Grind", crashFamily: CAR },  // Pistenbully, rideable cab roof
  [ObstacleType.SNOW_KICKER]:     { width: 80, height: 36, ramp: "curved" },   // curved ramp geometry, built of snow
  [ObstacleType.FREERIDE_SKIER]:  { width: 40, height: 50, motionOffset: 500 },
  [ObstacleType.RACE_SKIER]:      { width: 44, height: 34, motionOffset: -720 },   // tucked low
  [ObstacleType.SNOWBOARDER]:     { width: 40, height: 48, motionOffset: 400 },
  [ObstacleType.SNOW_SCOOTER]:    { width: 66, height: 42, motionOffset: -560, crashFamily: CAR },

  // Tokyo biome obstacles. Umbrella cyclists come at the rider; delivery scooters cruise
  // the same way.
  [ObstacleType.KEI_CAR]:         { width: 60, height: 42, crashFamily: CAR },   // tall-roof box on tiny wheels
  [ObstacleType.KEI_TRUCK]:       { width: 72, height: 40, crashFamily: CAR },
  [ObstacleType.JAPAN_TAXI]:      { width: 78, height: 42, crashFamily: CAR },   // roof lamp included
  [ObstacleType.SAMURAI]:         { width: 36, height: 58 },   // katana raised
  [ObstacleType.SUSHI_ROLLS]:     { width: 150, height: 50, rideable: true, grindLabel: "Sushi Grind \u{1F363}" },  // maki on a wooden board
  [ObstacleType.VENDING_MACHINE]: { width: 32, height: 62 },   // tall, glowing
  [ObstacleType.SAKE_BARRELS]:    { width: 124, height: 56, rideable: true, grindLabel: "Sake Grind \u{1F376}" },  // two rows of taru
  [ObstacleType.DELIVERY_SCOOTER]:{ width: 52, height: 46, motionOffset: 480 },
  [ObstacleType.UMBRELLA_CYCLIST]:{ width: 46, height: 60, motionOffset: -620 },   // mamachari plus umbrella
  [ObstacleType.KAWAII_BARRIER]:  { width: 64, height: 34 },
  [ObstacleType.MANEKI_NEKO]:     { width: 32, height: 40 },
  [ObstacleType.RAMEN_BOWL]:      { width: 46, height: 30 },
  [ObstacleType.SHIBA_INU]:       { width: 38, height: 28 },
};

/** Every obstacle type, in catalogue order. */
const ALL_TYPES = Object.keys(OBSTACLE_SPECS) as ObstacleType[];

/** Types whose spec passes `test`, in catalogue order. */
function typesWhere(test: (spec: ObstacleSpec) => boolean): readonly ObstacleType[] {
  return ALL_TYPES.filter((type) => test(OBSTACLE_SPECS[type]));
}

/**
 * A standalone ramp the rider rolls over (never crashes into); the kicker on top of a
 * container belongs to a rideable box instead.
 */
export function isStandaloneRamp(spec: ObstacleSpec): boolean {
  return spec.ramp === "straight" || spec.ramp === "curved";
}

/** Obstacles the rider can land on and ride along. */
export const RIDEABLE_TYPES: ReadonlySet<ObstacleType> = new Set(typesWhere((s) => s.rideable === true));

/** Standalone ramps (see `isStandaloneRamp`). */
export const RAMP_TYPES: ReadonlySet<ObstacleType> = new Set(typesWhere(isStandaloneRamp));

/** Every obstacle drawn as a vehicle, which the car-bonk crash handles. */
export const CAR_OBSTACLES: readonly ObstacleType[] = typesWhere((s) => s.crashFamily === "car");

/** The trees, which the tree-hang crash handles. */
export const TREE_OBSTACLES: readonly ObstacleType[] = typesWhere((s) => s.crashFamily === "tree");

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

/**
 * Names a grind after the obstacle it happened on, so each rideable feels like its own trick.
 * @param type - The obstacle that was ridden.
 * @returns The label, or a generic "Grind" for a rideable without a dedicated name.
 */
export function getGrindLabel(type: ObstacleType): string {
  return OBSTACLE_SPECS[type].grindLabel ?? "Grind";
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
  // Anything carrying a ramp keeps exact positioning (physics-dependent); everything
  // else sits slightly into the road so obstacles look grounded rather than floating.
  // The sink is capped so a grounded rider's hitbox still overlaps the obstacle's
  // by MIN_HIT_BAND px; otherwise low cars would only collide in a 1px sliver.
  const maxSink = spec.height - 2 * HITBOX_PADDING - MIN_HIT_BAND;
  const yOffset = spec.ramp ? 0 : Math.max(0, Math.min(maxSink, MAX_ROAD_SINK));
  const spawnX = spawnEdge + 60;
  const offset = spec.motionOffset;
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
    rideable: spec.rideable === true,
    ramp: isStandaloneRamp(spec),
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
