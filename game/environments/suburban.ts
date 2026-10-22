/**
 * Suburban biome: the opening streets. Defines the palette, the house-and-tree
 * backdrop and the four-stage obstacle pool that eases the player in.
 */
import { ObstacleType } from "../types";
import { pickPedestrian } from "./pedestrians";
import { PLAYER_COLORS, SHARED_OBSTACLE_COLORS } from "./sharedPalette";
import { stagedObstaclePool, type StageWeights } from "./stages";
import { generateStreet, type StreetConfig } from "./street";
import { SUBURBAN_BACKGROUND_DRAWERS } from "../rendering";
import type { EnvironmentDefinition, EnvironmentPalette } from "./types";

// ── Suburban palette — extracted from constants.ts COLORS + inline hex values in Renderer.ts ──

export const SUBURBAN_PALETTE: EnvironmentPalette = {
  // Sky
  sky: "#b8c6d4",
  skyBottom: "#d4dce4",
  cloud: "#cdd5dc",

  // Ground & road
  ground: "#96bc6a",
  road: "#7a7a78",
  roadLine: "#a3a39f",

  // Background buildings
  buildings: [
    { wall: "#e2d3b5", roof: "#5a4a40" }, // cream, brown tiles
    { wall: "#9db4c8", roof: "#4f5560" }, // soft blue, slate
    { wall: "#c47a5e", roof: "#4a3e38" }, // brick red, dark tiles
    { wall: "#b5c49a", roof: "#5a5048" }, // sage, brown tiles
    { wall: "#ece6dc", roof: "#6e4a3a" }, // white, terracotta
  ],
  windowGlass: "#b0c0cc",
  doorKnob: "#c8c0b8",

  // Background nature
  treeSilhouette: "#4a6a44",
  treeHighlight: "#5a7a50",
  backgroundTreeTrunk: "#7a6a5a",

  // Background creatures & people
  creature: "#9a7a5a",
  creatureLeg: "#7a6048",
  creatureTail: "#c0a880",

  player: PLAYER_COLORS,

  // Obstacles: the shared look is the suburban one, plus the traffic variants only seen here
  obstacle: {
    ...SHARED_OBSTACLE_COLORS,
    suv: "#4f6b74",
    suvDark: "#3b525a",
    van: "#e8e4dc",
    vanDark: "#b9b3a8",
    vanAccent: "#c47a42",
  },
};

// ── Background element generation — houses, trees, and a deer or a walker in the gaps ──

/** Element types of the suburban backdrop (keys of SUBURBAN_BACKGROUND_DRAWERS). */
export type SuburbanElementType = "house" | "tree_silhouette" | "deer" | "walking_person";

const SUBURBAN_STREET: StreetConfig<SuburbanElementType> = {
  fillers: {
    chance: 0.65,
    make(palette) {
      // 0 = wide bungalow, 1 = two-storey, 2 = narrow townhouse, 3 = small church (rare)
      const variant = Math.random() < 0.07 ? 3 : Math.floor(Math.random() * 3);
      const w =
        variant === 0 ? 72 + Math.random() * 18
        : variant === 1 ? 50 + Math.random() * 12
        : variant === 2 ? 30 + Math.random() * 8
        : 62 + Math.random() * 10;
      const h =
        variant === 0 ? 30 + Math.random() * 8
        : variant === 1 ? 50 + Math.random() * 10
        : variant === 2 ? 58 + Math.random() * 12
        : 34 + Math.random() * 6;
      const scheme = palette.buildings[Math.floor(Math.random() * palette.buildings.length)];
      return {
        type: "house",
        width: w,
        height: h,
        color: scheme.wall,
        roofColor: scheme.roof,
        variant,
        gap: 20 + Math.random() * 30,
      };
    },
  },
  trees: {
    make(palette, vergeOffset) {
      // Three size tiers: small / medium / large
      const sizeTier = Math.random();
      const tw =
        sizeTier < 0.33 ? 18 + Math.random() * 6   // small:  18-24
        : sizeTier < 0.66 ? 26 + Math.random() * 8  // medium: 26-34
        : 34 + Math.random() * 10;                  // large:  34-44
      const th =
        sizeTier < 0.33 ? 40 + Math.random() * 14  // small:  40-54
        : sizeTier < 0.66 ? 56 + Math.random() * 16 // medium: 56-72
        : 76 + Math.random() * 18;                  // large:  76-94
      return {
        type: "tree_silhouette",
        width: tw,
        height: th,
        color: palette.treeSilhouette,
        gap: 12 + Math.random() * 20,
        lift: vergeOffset,
      };
    },
  },
  figures: {
    chance: 0.4,
    minGap: 25,
    after: "filler",
    // Never two figures in a row
    allowAfter: (last) => last?.kind !== "figure",
    make(palette, gap, vergeOffset) {
      if (Math.random() > 0.45) {
        return { type: "deer", width: 30, height: 28, color: palette.creature, back: gap * 0.6, lift: vergeOffset };
      }
      return { type: "walking_person", ...pickPedestrian(), back: gap * 0.5, lift: vergeOffset };
    },
  },
};

// ── Obstacle pool — Suburban biome, time-staged ──

/**
 * The opening biome teaches one thing at a time, so its four stages start later and
 * are spread wider (10/25/40 s) than the other biomes' standard 15/30 s.
 */
const SUBURBAN_STAGE_STARTS_MS: readonly number[] = [10_000, 25_000, 40_000];

/** Weights for the opening obstacles, which give way as harder ones arrive. */
const BASICS: StageWeights = [1.0, 0.7, 0.4, 0.4];

const SUBURBAN_OBSTACLE_POOL = stagedObstaclePool([
  // Stage 1: rocks and small trees
  [ObstacleType.ROCK, BASICS],
  [ObstacleType.SMALL_TREE, BASICS],
  // Stage 2 (10s): tall trees, giant trees, trolleys, ramps
  [ObstacleType.TALL_TREE, [null, 0.8, 0.8, 0.8]],
  [ObstacleType.GIANT_TREE, [null, 0.5, 0.5, 0.5]],
  [ObstacleType.SHOPPING_TROLLEY, [null, 1.0, 1.0, 1.0]],
  [ObstacleType.STRAIGHT_RAMP, [null, 0.4, 0.4, 0.4]],
  [ObstacleType.CURVED_RAMP, [null, 0.4, 0.4, 0.4]],
  // Stage 3 (25s): rideable obstacles
  [ObstacleType.BUS_STOP, [null, null, 0.8, 0.8]],
  [ObstacleType.SHIPPING_CONTAINER, [null, null, 0.8, 0.8]],
  [ObstacleType.CONTAINER_WITH_RAMP, [null, null, 0.5, 0.5]],
  // Stage 4 (40s): traffic (the old single car weight split across three sizes) + other riders
  [ObstacleType.CAR, [null, null, null, 0.4]],
  [ObstacleType.SUV, [null, null, null, 0.35]],
  [ObstacleType.DELIVERY_VAN, [null, null, null, 0.25]],
  [ObstacleType.PERSON_ON_BIKE, [null, null, null, 1.0]],
], SUBURBAN_STAGE_STARTS_MS);

// ── Full environment definition ──

export const SUBURBAN_ENVIRONMENT: EnvironmentDefinition = {
  id: "suburban",
  name: "Suburbs",
  palette: SUBURBAN_PALETTE,
  background: {
    cloudCount: 12,
    cloudSpeedRatio: 0.1,
    buildingSpeedRatio: 0.4,
    generateElements: (canvasWidth, groundY, palette) => generateStreet(canvasWidth, groundY, palette, SUBURBAN_STREET),
  },
  backgroundDrawers: SUBURBAN_BACKGROUND_DRAWERS,
  obstaclePool: SUBURBAN_OBSTACLE_POOL,
  musicTrack: "/music.mp3",
};
