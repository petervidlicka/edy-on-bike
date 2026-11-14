/**
 * Desert City biome (Dubai/Miami inspired): second in the cycle. Defines the palette,
 * the glass-tower skyline with its landmarks, and the time-staged obstacle pool of
 * camels, sand traps and supercars.
 */
import { ObstacleType } from "../types";
import { pickPedestrian } from "./pedestrians";
import { DUBAI_OBSTACLE_COLORS } from "./obstacleColors";
import { PLAYER_COLORS, SHARED_OBSTACLE_COLORS } from "./sharedPalette";
import { EASING_OUT, stagedObstaclePool } from "./stages";
import { generateStreet, type StreetConfig } from "./street";
import { DUBAI_BACKGROUND_DRAWERS } from "../rendering";
import type { EnvironmentDefinition, EnvironmentPalette } from "./types";

// ── Desert City palette — Dubai/Miami inspired ──

export const DUBAI_PALETTE: EnvironmentPalette = {
  // Sky — hot blue with hazy horizon (suggests intense heat)
  sky: "#4a90c8",
  skyBottom: "#c8d8e0",
  cloud: "#e8e0d8",

  // Ground & road
  ground: "#d4b87a",
  road: "#8a8278",
  roadLine: "#b0a898",

  // Background buildings — glass & steel skyscrapers
  buildings: [
    { wall: "#c0d0e0", roof: "#8898a8" },
    { wall: "#d4c8b8", roof: "#a09080" },
    { wall: "#b8c8d8", roof: "#7888a0" },
    { wall: "#e0d8c8", roof: "#9a9080" },
  ],
  windowGlass: "#88b8d8",
  doorKnob: "#c8c0b0",

  // Background nature — palm trees
  treeSilhouette: "#5a8a48",
  treeHighlight: "#78aa60",
  backgroundTreeTrunk: "#8a7460",

  // Background creatures & people
  creature: "#c8a870",
  creatureLeg: "#a08858",
  creatureTail: "#b89868",

  player: PLAYER_COLORS,

  obstacle: {
    ...SHARED_OBSTACLE_COLORS,
    // Sandstone rocks and white cars
    rock: "#c8a060",
    rockHighlight: "#d8b878",
    rockShadow: "#8a7040",
    car: "#e0e0e0",
    carRoof: "#c8c8c8",
    carWindow: "#70a8c8",
    carBumper: "#9a9090",

    // Dubai-specific obstacle colors
    ...DUBAI_OBSTACLE_COLORS,
  },
};

// ── Background element generation — Desert City skyline ──

/** Element types of the Dubai backdrop (keys of DUBAI_BACKGROUND_DRAWERS). */
export type DubaiElementType = "skyscraper" | "palm_tree" | "bg_camel" | "walking_person";

/** Landmarks; the skyscraper drawer paints them from `variant` 5–8 (0–4 are generic towers). */
const LANDMARKS = ["burj_khalifa", "museum_of_the_future", "burj_al_arab", "dubai_frame"] as const;
type DubaiLandmark = (typeof LANDMARKS)[number];
const LANDMARK_VARIANT: Record<DubaiLandmark, number> = {
  burj_khalifa: 5,
  museum_of_the_future: 6,
  burj_al_arab: 7,
  dubai_frame: 8,
};

/** Size of each landmark: Burj Khalifa narrow and extremely tall (double the tallest generic), the Museum a torus wider than tall, Burj Al Arab a tall sail, the Frame ~0.6 wide : 1 tall like the real one. */
function landmarkSize(id: DubaiLandmark): { w: number; h: number } {
  switch (id) {
    case "burj_khalifa": return { w: 30 + Math.random() * 10, h: 390 + Math.random() * 130 };
    case "museum_of_the_future": return { w: 66 + Math.random() * 16, h: 56 + Math.random() * 14 };
    case "burj_al_arab": return { w: 50 + Math.random() * 15, h: 225 + Math.random() * 50 };
    case "dubai_frame": {
      const h = 200 + Math.random() * 50;
      return { w: h * 0.6, h };
    }
  }
}

const DUBAI_STREET: StreetConfig<DubaiElementType, DubaiLandmark> = {
  landmarks: {
    chance: 0.14, // a fifth of the 70% tower slots
    ids: LANDMARKS,
    // Breathing room on both sides so a landmark stands out of the packed skyline
    padBefore: 20,
    padAfter: 20,
    make(id, palette) {
      const { w, h } = landmarkSize(id);
      const scheme = palette.buildings[Math.floor(Math.random() * palette.buildings.length)];
      return { type: "skyscraper", width: w, height: h, color: scheme.wall, roofColor: scheme.roof, variant: LANDMARK_VARIANT[id] };
    },
  },
  fillers: {
    chance: 0.7,
    make(palette) {
      const scheme = palette.buildings[Math.floor(Math.random() * palette.buildings.length)];
      return {
        type: "skyscraper",
        width: 35 + Math.random() * 25,
        height: 150 + Math.random() * 100,
        color: scheme.wall,
        roofColor: scheme.roof,
        variant: Math.floor(Math.random() * 5), // generic 0-4
        // Generic towers pack tightly, even overlapping a little, for a dense skyline
        gap: -8 + Math.random() * 10,
      };
    },
  },
  trees: {
    make(palette, vergeOffset) {
      const sizeTier = Math.random();
      const tw = sizeTier < 0.5 ? 16 + Math.random() * 6 : 22 + Math.random() * 8;
      const th = sizeTier < 0.5 ? 50 + Math.random() * 20 : 70 + Math.random() * 25;
      return {
        type: "palm_tree",
        width: tw,
        height: th,
        color: palette.treeSilhouette,
        // Picks this palm's frond-length pattern (stable while it scrolls)
        variant: Math.floor(Math.random() * 8),
        gap: 12 + Math.random() * 20,
        lift: vergeOffset,
      };
    },
  },
  // Only landmark gaps have room for a figure; generics are packed too tightly
  figures: {
    chance: 0.5,
    after: "landmark",
    allowAfter: (last) => last?.kind !== "figure",
    make(palette, gap, vergeOffset) {
      if (Math.random() > 0.4) {
        return { type: "bg_camel", width: 36, height: 32, color: palette.creature, back: gap * 0.6, lift: vergeOffset };
      }
      return { type: "walking_person", ...pickPedestrian(), back: gap * 0.5, lift: vergeOffset };
    },
  },
};

// ── Obstacle pool — Dubai biome, time-staged ──

// Standard stage starts (15 s / 30 s), measured from when this biome started, not game start
const DUBAI_OBSTACLE_POOL = stagedObstaclePool([
  // Stage 1: core desert obstacles + vehicle previews
  [ObstacleType.SAND_TRAP, EASING_OUT],
  [ObstacleType.CACTUS, EASING_OUT],
  [ObstacleType.CAMEL, [0.8, 0.8, 0.8]],
  [ObstacleType.LAND_CRUISER, [0.3, 0.7, 1.0]],
  [ObstacleType.PINK_G_CLASS, [0.2, 0.5, 0.7]],
  // Stage 2 (15s into Dubai): ramps, more vehicles, chocolate + supercars + billboard
  [ObstacleType.STRAIGHT_RAMP, [null, 0.4, 0.4]],
  [ObstacleType.CURVED_RAMP, [null, 0.4, 0.4]],
  [ObstacleType.DUBAI_CHOCOLATE, [null, 0.7, 1.0]],
  [ObstacleType.LAMBORGHINI_HURACAN, [null, 0.5, 0.8]],
  [ObstacleType.FERRARI_458, [null, 0.4, 0.6]],
  [ObstacleType.CONVERTIBLE, [null, 0.4, 0.6]],
  [ObstacleType.ROLLS_ROYCE_PHANTOM, [null, 0.3, 0.5]],
  [ObstacleType.PORSCHE_911, [null, 0.4, 0.6]],
  [ObstacleType.DUBAI_BILLBOARD, [null, 0.4, 0.4]],
]);

// ── Full environment definition ──

export const DUBAI_ENVIRONMENT: EnvironmentDefinition = {
  id: "dubai",
  name: "Desert City",
  palette: DUBAI_PALETTE,
  background: {
    cloudCount: 6,
    cloudSpeedRatio: 0.08,
    buildingSpeedRatio: 0.4,
    generateElements: (canvasWidth, groundY, palette) => generateStreet(canvasWidth, groundY, palette, DUBAI_STREET),
  },
  backgroundDrawers: DUBAI_BACKGROUND_DRAWERS,
  obstaclePool: DUBAI_OBSTACLE_POOL,
  musicTrack: "/music-dubai.mp3",
  particleOverlay: {
    type: "sand",
    density: 0.3,
    speed: { x: 2, y: 0.5 },
    size: { min: 1, max: 2 },
    color: "#d4b878",
    opacity: 0.3,
  },
};
