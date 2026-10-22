/**
 * Snowy Austria biome: a groomed piste through an Alpine ski village. Third in the
 * biome cycle (after Dubai). Defines the palette, the village backdrop, the
 * time-staged obstacle pool (skiers, Pistenbully, Stiegl crates) and the winter kit.
 */
import { ObstacleType } from "../types";
import { pickPedestrian } from "./pedestrians";
import { AUSTRIA_OBSTACLE_COLORS } from "./obstacleColors";
import { PLAYER_COLORS, SHARED_OBSTACLE_COLORS } from "./sharedPalette";
import { EASING_OUT, stagedObstaclePool } from "./stages";
import { generateStreet, type StreetConfig } from "./street";
import { AUSTRIA_BACKGROUND_DRAWERS, drawAlpineRange } from "../rendering";
import type { EnvironmentDefinition, EnvironmentPalette } from "./types";

// ── Snowy Austria palette — crisp blue sky, white snow, timber chalets ──

export const AUSTRIA_PALETTE: EnvironmentPalette = {
  // Sky — clear Alpine blue fading to a pale horizon
  sky: "#5d9ad6",
  skyBottom: "#d6e6f4",
  cloud: "#f4f8fc",

  // Ground & road — snow verge and a groomed piste
  ground: "#eef3f8",
  road: "#dde7f0",
  roadLine: "#bfd0e0",

  // Background buildings — chalet timber over white plaster
  buildings: [
    { wall: "#f2ece0", roof: "#6a4a32" }, // white plaster, dark timber
    { wall: "#e8d7b8", roof: "#5a3e2a" }, // cream, walnut
    { wall: "#f4e4cc", roof: "#7a5236" }, // warm white, larch
    { wall: "#e6dccb", roof: "#4e3a2c" }, // stone white, old timber
  ],
  windowGlass: "#f6d78a", // warm lit windows
  doorKnob: "#c8a060",

  // Background nature — snowy spruce
  treeSilhouette: "#2f5a46",
  treeHighlight: "#3f7058",
  backgroundTreeTrunk: "#5a4232",

  // Background creatures — red deer
  creature: "#8a5a36",
  creatureLeg: "#6a4228",
  creatureTail: "#d8c0a0",

  player: PLAYER_COLORS,

  obstacle: {
    ...SHARED_OBSTACLE_COLORS,
    // Shared obstacles snowed over: grey rocks, dark spruce, pale cars, a blue cyclist
    rock: "#8a9098",
    rockHighlight: "#f4f8fc",
    rockShadow: "#5a6068",
    tree: "#2f5a46",
    treeHighlight: "#3f7058",
    treeTrunk: "#5a4232",
    treeTrunkShadow: "#423020",
    car: "#d8dde4",
    carRoof: "#c0c8d0",
    carWindow: "#70a8c8",
    carBumper: "#8a9098",
    bikeRider: "#2a5a8a",
    bikeFrame: "#3a6a9a",
    giantTreeCanopy: "#2f5a46",
    giantTreeCanopyHighlight: "#3f7058",
    giantTreeTrunk: "#5a4232",
    giantTreeBark: "#423020",
    giantTreeOutline: "#1e3e30",

    // Austria-specific obstacle colours
    ...AUSTRIA_OBSTACLE_COLORS,
  },
};

// ── Background element generation — Alpine ski village ──

/** Landmark element types; at most one in a row, and never the same one twice running. */
const LANDMARKS = ["onion_church", "ski_jump", "chairlift", "apres_bar"] as const;
type AustriaLandmark = (typeof LANDMARKS)[number];

/** Element types of the Austria backdrop (keys of AUSTRIA_BACKGROUND_DRAWERS). */
export type AustriaElementType =
  | AustriaLandmark
  | "chalet"
  | "snow_pine"
  | "bg_red_deer"
  | "walking_person"
  | "austrian_flag";

const AUSTRIA_STREET: StreetConfig<AustriaElementType, AustriaLandmark> = {
  landmarks: {
    chance: 0.16,
    ids: LANDMARKS,
    padBefore: 16,
    padAfter: 20,
    make(type, palette) {
      const size =
        type === "onion_church" ? { w: 46 + Math.random() * 8, h: 118 + Math.random() * 18 }
        : type === "ski_jump" ? { w: 150 + Math.random() * 20, h: 150 + Math.random() * 20 }
        : type === "chairlift" ? { w: 230 + Math.random() * 40, h: 120 + Math.random() * 20 }
        : { w: 74 + Math.random() * 10, h: 50 + Math.random() * 6 };
      return { type, width: size.w, height: size.h, color: palette.buildings[0].wall, roofColor: palette.buildings[0].roof };
    },
  },
  fillers: {
    chance: 0.62,
    make(palette) {
      // Chalet hotel (variants: 0 = big hotel, 1 = gasthof, 2 = pension, 3 = small hut)
      const variant = Math.floor(Math.random() * 4);
      const w =
        variant === 0 ? 96 + Math.random() * 20
        : variant === 1 ? 74 + Math.random() * 14
        : variant === 2 ? 58 + Math.random() * 10
        : 38 + Math.random() * 8;
      const h =
        variant === 0 ? 84 + Math.random() * 14
        : variant === 1 ? 64 + Math.random() * 10
        : variant === 2 ? 52 + Math.random() * 8
        : 32 + Math.random() * 6;
      const scheme = palette.buildings[Math.floor(Math.random() * palette.buildings.length)];
      return {
        type: "chalet",
        width: w,
        height: h,
        color: scheme.wall,
        roofColor: scheme.roof,
        variant,
        gap: 14 + Math.random() * 30,
      };
    },
  },
  trees: {
    make(palette, vergeOffset) {
      // Snowy spruce — small / medium / large
      const sizeTier = Math.random();
      const tw = sizeTier < 0.4 ? 16 + Math.random() * 6 : sizeTier < 0.8 ? 22 + Math.random() * 8 : 30 + Math.random() * 8;
      const th = sizeTier < 0.4 ? 40 + Math.random() * 12 : sizeTier < 0.8 ? 56 + Math.random() * 16 : 78 + Math.random() * 18;
      return {
        type: "snow_pine",
        width: tw,
        height: th,
        color: palette.treeSilhouette,
        gap: 6 + Math.random() * 16,
        lift: vergeOffset,
      };
    },
  },
  // A deer, a skier on foot or a flag in the gap, only between two plain chalets
  figures: {
    chance: 0.45,
    minGap: 22,
    after: "filler",
    allowAfter: (last) => last?.kind === "filler",
    make(palette, gap, vergeOffset) {
      const pick = Math.random();
      if (pick < 0.35) {
        return { type: "bg_red_deer", width: 28, height: 30, color: palette.creature, back: gap * 0.7, lift: vergeOffset };
      }
      if (pick < 0.7) {
        return { type: "walking_person", ...pickPedestrian(), back: gap * 0.5, lift: vergeOffset };
      }
      return { type: "austrian_flag", width: 18, height: 62, color: "#c8102e", back: gap * 0.6, lift: vergeOffset * 0.5 };
    },
  },
};

// ── Obstacle pool — Austria biome, time-staged ──

// Standard stage starts (15 s / 30 s), measured from when this biome started, not game start
const AUSTRIA_OBSTACLE_POOL = stagedObstaclePool([
  // Stage 1: village obstacles + a first cruising freerider
  [ObstacleType.SNOWMAN, EASING_OUT],
  [ObstacleType.FROZEN_LAKE, EASING_OUT],
  [ObstacleType.RED_DEER, [0.8, 0.8, 0.8]],
  [ObstacleType.BEER_CRATES, [0.7, 0.7, 0.7]],
  [ObstacleType.FREERIDE_SKIER, [0.4, 0.6, 0.8]],
  // Stage 2 (15s into Austria): kickers, rideables and the rest of the moving crowd
  [ObstacleType.SNOW_KICKER, [null, 0.6, 0.6]],
  [ObstacleType.SNOW_CAT, [null, 0.5, 0.7]],
  [ObstacleType.BEER_CRATE_WALL, [null, 0.5, 0.7]],
  [ObstacleType.SNOWBOARDER, [null, 0.5, 0.7]],
  [ObstacleType.RACE_SKIER, [null, 0.4, 0.7]],
  [ObstacleType.SNOW_SCOOTER, [null, 0.4, 0.6]],
]);

// ── Full environment definition ──

export const AUSTRIA_ENVIRONMENT: EnvironmentDefinition = {
  id: "austria",
  name: "Snowy Austria",
  palette: AUSTRIA_PALETTE,
  background: {
    cloudCount: 7,
    cloudSpeedRatio: 0.08,
    buildingSpeedRatio: 0.4,
    generateElements: (canvasWidth, groundY, palette) => generateStreet(canvasWidth, groundY, palette, AUSTRIA_STREET),
  },
  backgroundDrawers: AUSTRIA_BACKGROUND_DRAWERS,
  obstaclePool: AUSTRIA_OBSTACLE_POOL,
  musicTrack: "/music-austria.mp3",
  particleOverlay: {
    type: "snow",
    density: 0.9,
    speed: { x: -0.6, y: 1.1 },
    size: { min: 1, max: 2.6 },
    color: "#ffffff",
    opacity: 0.85,
  },
  skyline: drawAlpineRange,
  riderGear: "winter",
};
