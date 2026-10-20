/**
 * Night Tokyo biome: a rainy neon street. Fourth in the biome cycle (after Austria).
 * Defines the night palette, the street backdrop (neon towers, landmarks, an elevated
 * train line), the time-staged obstacle pool (Kei cars, samurai, giant sushi) and the
 * rain, wet-road reflections and Edy's hachimaki.
 */
import { ObstacleType, type BackgroundElement } from "../types";
import { pickPedestrian } from "./pedestrians";
import { EASING_OUT, stagedPool } from "./stages";
import { TOKYO_BACKGROUND_DRAWERS, drawTokyoNightSky, drawNeonReflections } from "../rendering";
import type {
  EnvironmentDefinition,
  EnvironmentPalette,
  WeightedType,
} from "./types";

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

  // Player
  player: {
    wheel: "#2e2e2e",
    frame: "#8b1a1a",
    helmet: "#9b3333",
    skin: "#c8a882",
    shirt: "#7a8a9a",
    pants: "#5a5a6a",
  },

  // Obstacles
  obstacle: {
    // Shared obstacle colours (ramps etc.), a touch darker for the night
    rock: "#6a6a74",
    rockHighlight: "#8a8a96",
    rockShadow: "#44444c",
    tree: "#3a6a42",
    treeHighlight: "#4a8a50",
    treeTrunk: "#5a4232",
    treeTrunkShadow: "#423020",
    trolley: "#5a7a9a",
    trolleyBasket: "#4a6888",
    trolleyAccent: "#c47a42",
    car: "#e8e8ec",
    carRoof: "#c8c8d0",
    carWindow: "#3a4a6a",
    carBumper: "#7a7a84",
    carWheel: "#1e1e22",
    carHeadlight: "#fff2b0",
    carTaillight: "#ff3a3a",
    bikeRider: "#3a5a8a",
    bikeFrame: "#4a6a9a",
    busStopFrame: "#3a7a6a",
    busStopRoof: "#2e5e52",
    busStopGlass: "#a0c8d4",
    busStopSign: "#d4a444",
    container: "#c4683a",
    containerDark: "#8a4828",
    containerDoor: "#a85830",
    giantTreeCanopy: "#2e7a36",
    giantTreeCanopyHighlight: "#48994a",
    giantTreeTrunk: "#5e4030",
    giantTreeBark: "#4a3020",
    giantTreeOutline: "#1e5a24",
    rampWood: "#a88a5a",
    rampWoodDark: "#7a5a34",
    rampWoodHighlight: "#c4a878",
    rampMetal: "#6a7a8a",
    rampMetalDark: "#4a5a6a",

    // Tokyo-specific obstacle colours
    keiCar: "#9ad8c4", // mint tall-roof Kei
    keiCarDark: "#6aae9a",
    taxi: "#2c3256", // deep indigo JPN-style taxi
    taxiDark: "#1c2040",
    neonPink: "#ff3d8b",
    neonCyan: "#3de8ff",
  },
};

// ── Background element generation — neon street ──

/** Landmark element types; at most one in a row, and never the same one twice running. */
const LANDMARKS = ["tokyo_tower", "skytree", "pagoda", "torii", "big_screen", "train_viaduct"] as const;

function generateTokyoElements(
  canvasWidth: number,
  groundY: number,
  palette: EnvironmentPalette
): BackgroundElement[] {
  const elements: BackgroundElement[] = [];

  let x = 0;
  let lastType = "";
  let lastLandmark = "";
  let sinceLandmark = 99; // allow a landmark on the first pick

  while (x < canvasWidth * 2.5) {
    const roll = Math.random();
    // Seed carried in `variant` so a building keeps its signs and lit windows while scrolling
    const seed = Math.floor(Math.random() * 10_000);

    if (roll < 0.15 && sinceLandmark >= 3) {
      const options = LANDMARKS.filter((l) => l !== lastLandmark);
      const type = options[Math.floor(Math.random() * options.length)];
      const size =
        type === "tokyo_tower" ? { w: 76 + Math.random() * 10, h: 250 + Math.random() * 30 }
        : type === "skytree" ? { w: 44 + Math.random() * 6, h: 340 + Math.random() * 40 }
        : type === "pagoda" ? { w: 52 + Math.random() * 8, h: 118 + Math.random() * 14 }
        : type === "torii" ? { w: 62 + Math.random() * 8, h: 56 + Math.random() * 6 }
        : type === "big_screen" ? { w: 110 + Math.random() * 16, h: 170 + Math.random() * 30 }
        : { w: 300 + Math.random() * 60, h: 74 + Math.random() * 8 };
      x += 16;
      elements.push({
        type,
        x,
        y: groundY - size.h - 16,
        width: size.w,
        height: size.h,
        color: palette.buildings[0].wall,
        roofColor: palette.buildings[0].roof,
        variant: seed,
      });
      x += size.w + 18;
      lastLandmark = type;
      lastType = type;
      sinceLandmark = 0;
    } else if (roll < 0.86 || lastType === "lamp") {
      // Neon building — packed tight, with the odd low shop in between
      const lowShop = Math.random() < 0.28;
      if (lowShop) {
        const type = Math.random() < 0.5 ? "konbini" : "izakaya";
        const w = type === "konbini" ? 74 + Math.random() * 10 : 58 + Math.random() * 10;
        const h = type === "konbini" ? 44 + Math.random() * 4 : 48 + Math.random() * 6;
        elements.push({ type, x, y: groundY - h - 16, width: w, height: h, color: palette.buildings[1].wall, variant: seed });
        x += w + 4 + Math.random() * 8;
      } else {
        const w = 40 + Math.random() * 42;
        const h = 96 + Math.random() * 120;
        const scheme = palette.buildings[Math.floor(Math.random() * palette.buildings.length)];
        elements.push({
          type: "neon_building",
          x,
          y: groundY - h - 16,
          width: w,
          height: h,
          color: scheme.wall,
          roofColor: scheme.roof,
          variant: seed,
        });
        x += w + (-4 + Math.random() * 8);
      }
      sinceLandmark++;

      // Now and then a pedestrian (often under an umbrella), a sakura or a flag
      if (Math.random() > 0.62 && lastType !== "person") {
        const pick = Math.random();
        const vergeOffset = Math.random() * 18;
        if (pick < 0.55) {
          const person = pickPedestrian();
          elements.push({
            type: Math.random() < 0.7 ? "umbrella_person" : "walking_person",
            x: x - 10,
            y: groundY - person.height - vergeOffset,
            ...person,
          });
          lastType = "person";
        } else if (pick < 0.8) {
          elements.push({
            type: "sakura",
            x: x - 18,
            y: groundY - 62 - vergeOffset,
            width: 42,
            height: 62,
            color: palette.treeHighlight,
            variant: seed,
          });
          lastType = "sakura";
        } else {
          elements.push({
            type: "japan_flag",
            x: x - 8,
            y: groundY - 64 - vergeOffset * 0.5,
            width: 18,
            height: 64,
            color: "#bc002d",
          });
          lastType = "flag";
        }
      } else {
        lastType = "building";
      }
    } else {
      // Street lamp (never two in a row)
      elements.push({
        type: "street_lamp",
        x,
        y: groundY - 74 - 6,
        width: 14,
        height: 74,
        color: "#5a5e6a",
      });
      x += 14 + Math.random() * 10;
      lastType = "lamp";
    }
  }
  return elements;
}

// ── Obstacle pool — Tokyo biome, time-staged ──

// biomeMs = biome-relative elapsed time (0 = when this biome started, not game start)
function tokyoWeightedTypes(biomeMs: number): WeightedType[] {
  return stagedPool(biomeMs, [
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
}

// ── Full environment definition ──

export const TOKYO_ENVIRONMENT: EnvironmentDefinition = {
  id: "tokyo",
  name: "Tokyo Nights",
  palette: TOKYO_PALETTE,
  background: {
    cloudCount: 5,
    cloudSpeedRatio: 0.06,
    buildingSpeedRatio: 0.4,
    generateElements: generateTokyoElements,
  },
  backgroundDrawers: TOKYO_BACKGROUND_DRAWERS,
  obstaclePool: {
    getWeightedTypes: tokyoWeightedTypes,
  },
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
