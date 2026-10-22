/**
 * Night Tokyo biome: a rainy neon street. Fourth in the biome cycle (after Austria).
 * Defines the night palette, the street backdrop (neon towers, landmarks, an elevated
 * train line), the time-staged obstacle pool (Kei cars, samurai, giant sushi) and the
 * rain, wet-road reflections and Edy's hachimaki.
 */
import { ObstacleType } from "../types";
import { pickPedestrian } from "./pedestrians";
import { TOKYO_OBSTACLE_COLORS } from "./obstacleColors";
import { PLAYER_COLORS, SHARED_OBSTACLE_COLORS } from "./sharedPalette";
import { EASING_OUT, stagedObstaclePool } from "./stages";
import { generateStreet, type StreetConfig } from "./street";
import { TOKYO_BACKGROUND_DRAWERS, drawTokyoNightSky, drawNeonReflections } from "../rendering";
import type { EnvironmentDefinition, EnvironmentPalette } from "./types";

// ── Night Tokyo palette — indigo sky, dark wet street, warm windows ──

export const TOKYO_PALETTE: EnvironmentPalette = {
  // Sky — deep indigo with a violet glow of city light on the horizon
  sky: "#0c0e2a",
  skyBottom: "#46306a",
  cloud: "#2c2a4c",

  // Ground & road — dark pavement and wet asphalt
  ground: "#24212e",
  road: "#2b2a36",
  roadLine: "#7a7a8c",

  // Background buildings — dark concrete and glass at night
  buildings: [
    { wall: "#1e2238", roof: "#141828" },
    { wall: "#28203a", roof: "#1a1428" },
    { wall: "#1a2a36", roof: "#101c26" },
    { wall: "#2c2832", roof: "#1c1a22" },
  ],
  windowGlass: "#ffd890", // warm lit windows
  doorKnob: "#c8a060",

  // Background nature — night sakura
  treeSilhouette: "#3a2630",
  treeHighlight: "#ff9ac8",
  backgroundTreeTrunk: "#3a2a2a",

  // Background creatures — shiba inu
  creature: "#d0884a",
  creatureLeg: "#a86a34",
  creatureTail: "#f4e6d0",

  player: PLAYER_COLORS,

  obstacle: {
    ...SHARED_OBSTACLE_COLORS,
    // Shared obstacles a touch darker for the night, with lit headlights and taillights
    rock: "#6a6a74",
    rockHighlight: "#8a8a96",
    rockShadow: "#44444c",
    tree: "#3a6a42",
    treeHighlight: "#4a8a50",
    treeTrunk: "#5a4232",
    treeTrunkShadow: "#423020",
    car: "#e8e8ec",
    carRoof: "#c8c8d0",
    carWindow: "#3a4a6a",
    carBumper: "#7a7a84",
    carWheel: "#1e1e22",
    carHeadlight: "#fff2b0",
    carTaillight: "#ff3a3a",
    bikeRider: "#3a5a8a",
    bikeFrame: "#4a6a9a",
    rampWood: "#a88a5a",
    rampWoodDark: "#7a5a34",
    rampWoodHighlight: "#c4a878",
    rampMetal: "#6a7a8a",
    rampMetalDark: "#4a5a6a",

    // Tokyo-specific obstacle colours
    ...TOKYO_OBSTACLE_COLORS,
    neonPink: "#ff3d8b",
    neonCyan: "#3de8ff",
  },
};

// ── Background element generation — neon street ──

/** Landmark element types; at most one in a row, and never the same one twice running. */
const LANDMARKS = ["tokyo_tower", "skytree", "pagoda", "torii", "big_screen", "train_viaduct"] as const;
type TokyoLandmark = (typeof LANDMARKS)[number];

/** Element types of the Tokyo backdrop (keys of TOKYO_BACKGROUND_DRAWERS). */
export type TokyoElementType =
  | TokyoLandmark
  | "neon_building"
  | "konbini"
  | "izakaya"
  | "umbrella_person"
  | "walking_person"
  | "sakura"
  | "japan_flag"
  | "street_lamp";

/** Seed carried in `variant` so a building keeps its signs and lit windows while scrolling. */
const seed = () => Math.floor(Math.random() * 10_000);

const TOKYO_STREET: StreetConfig<TokyoElementType, TokyoLandmark> = {
  landmarks: {
    chance: 0.15,
    ids: LANDMARKS,
    padBefore: 16,
    padAfter: 18,
    make(type, palette) {
      const size =
        type === "tokyo_tower" ? { w: 76 + Math.random() * 10, h: 250 + Math.random() * 30 }
        : type === "skytree" ? { w: 44 + Math.random() * 6, h: 340 + Math.random() * 40 }
        : type === "pagoda" ? { w: 52 + Math.random() * 8, h: 118 + Math.random() * 14 }
        : type === "torii" ? { w: 62 + Math.random() * 8, h: 56 + Math.random() * 6 }
        : type === "big_screen" ? { w: 110 + Math.random() * 16, h: 170 + Math.random() * 30 }
        : { w: 300 + Math.random() * 60, h: 74 + Math.random() * 8 };
      return {
        type,
        width: size.w,
        height: size.h,
        color: palette.buildings[0].wall,
        roofColor: palette.buildings[0].roof,
        variant: seed(),
      };
    },
  },
  fillers: {
    chance: 0.86,
    make(palette) {
      // Neon buildings packed tight, with the odd low shop in between
      if (Math.random() < 0.28) {
        const type = Math.random() < 0.5 ? "konbini" : "izakaya";
        return {
          type,
          width: type === "konbini" ? 74 + Math.random() * 10 : 58 + Math.random() * 10,
          height: type === "konbini" ? 44 + Math.random() * 4 : 48 + Math.random() * 6,
          color: palette.buildings[1].wall,
          variant: seed(),
          gap: 4 + Math.random() * 8,
        };
      }
      const scheme = palette.buildings[Math.floor(Math.random() * palette.buildings.length)];
      return {
        type: "neon_building",
        width: 40 + Math.random() * 42,
        height: 96 + Math.random() * 120,
        color: scheme.wall,
        roofColor: scheme.roof,
        variant: seed(),
        gap: -4 + Math.random() * 8,
      };
    },
  },
  // Street lamps take the tree slot; never two in a row
  trees: {
    neverTwice: true,
    make() {
      return { type: "street_lamp", width: 14, height: 74, color: "#5a5e6a", gap: Math.random() * 10, lift: 6 };
    },
  },
  // Now and then a pedestrian (often under an umbrella), a sakura or a flag; never two people in a row
  figures: {
    chance: 0.38,
    after: "filler",
    allowAfter: (last) => !(last?.kind === "figure" && (last.type === "umbrella_person" || last.type === "walking_person")),
    make(palette, _gap, vergeOffset) {
      const pick = Math.random();
      if (pick < 0.55) {
        return {
          type: Math.random() < 0.7 ? "umbrella_person" : "walking_person",
          ...pickPedestrian(),
          back: 10,
          lift: vergeOffset,
        };
      }
      if (pick < 0.8) {
        return { type: "sakura", width: 42, height: 62, color: palette.treeHighlight, variant: seed(), back: 18, lift: vergeOffset };
      }
      return { type: "japan_flag", width: 18, height: 64, color: "#bc002d", back: 8, lift: vergeOffset * 0.5 };
    },
  },
};

// ── Obstacle pool — Tokyo biome, time-staged ──

// Standard stage starts (15 s / 30 s), measured from when this biome started, not game start
const TOKYO_OBSTACLE_POOL = stagedObstaclePool([
  // Stage 1: street clutter + the first Kei cars
  [ObstacleType.SHIBA_INU, EASING_OUT],
  [ObstacleType.RAMEN_BOWL, EASING_OUT],
  [ObstacleType.MANEKI_NEKO, EASING_OUT],
  [ObstacleType.KAWAII_BARRIER, [0.8, 0.8, 0.8]],
  [ObstacleType.KEI_CAR, [0.6, 0.8, 0.8]],
  [ObstacleType.VENDING_MACHINE, [0.4, 0.6, 0.6]],
  // Stage 2 (15s into Tokyo): ramps, rideables, samurai, traffic and moving riders
  [ObstacleType.STRAIGHT_RAMP, [null, 0.4, 0.4]],
  [ObstacleType.CURVED_RAMP, [null, 0.4, 0.4]],
  [ObstacleType.SUSHI_ROLLS, [null, 0.5, 0.7]],
  [ObstacleType.SAKE_BARRELS, [null, 0.5, 0.7]],
  [ObstacleType.SAMURAI, [null, 0.6, 0.8]],
  [ObstacleType.KEI_TRUCK, [null, 0.5, 0.5]],
  [ObstacleType.JAPAN_TAXI, [null, 0.5, 0.7]],
  [ObstacleType.DELIVERY_SCOOTER, [null, 0.5, 0.7]],
  [ObstacleType.UMBRELLA_CYCLIST, [null, 0.4, 0.6]],
]);

// ── Full environment definition ──

export const TOKYO_ENVIRONMENT: EnvironmentDefinition = {
  id: "tokyo",
  name: "Tokyo Nights",
  palette: TOKYO_PALETTE,
  background: {
    cloudCount: 5,
    cloudSpeedRatio: 0.06,
    buildingSpeedRatio: 0.4,
    generateElements: (canvasWidth, groundY, palette) => generateStreet(canvasWidth, groundY, palette, TOKYO_STREET),
  },
  backgroundDrawers: TOKYO_BACKGROUND_DRAWERS,
  obstaclePool: TOKYO_OBSTACLE_POOL,
  musicTrack: "/music-tokyo.m4a",
  particleOverlay: {
    type: "rain",
    density: 0.55,
    speed: { x: -2.4, y: 9 },
    size: { min: 1.6, max: 3.2 },
    color: "#b4c8f0",
    opacity: 0.4,
  },
  skyline: drawTokyoNightSky,
  roadOverlay: drawNeonReflections,
  riderGear: "hachimaki",
};
