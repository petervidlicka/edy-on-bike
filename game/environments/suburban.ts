import { ObstacleType, type BackgroundElement } from "../types";
import { SUBURBAN_BACKGROUND_DRAWERS } from "../rendering";
import type {
  EnvironmentDefinition,
  EnvironmentPalette,
  WeightedType,
} from "./types";

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
    { wall: "#c4aa90", roof: "#6a5548" },
    { wall: "#b8988a", roof: "#7a5a4a" },
    { wall: "#a8a098", roof: "#5a5a50" },
    { wall: "#c0b098", roof: "#6a6058" },
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
  person: "#5a5a6a",

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
    rock: "#b58850",
    rockHighlight: "#cca06a",
    rockShadow: "#7a5c38",
    tree: "#3a8a42",
    treeHighlight: "#58aa50",
    treeTrunk: "#6e4e38",
    treeTrunkShadow: "#523828",
    trolley: "#5a7a9a",
    trolleyBasket: "#4a6888",
    trolleyAccent: "#c47a42",
    car: "#c25a48",
    carRoof: "#a84a3c",
    carWindow: "#8abcd4",
    carBumper: "#8a7a6a",
    carWheel: "#2e2e2c",
    carHeadlight: "#e8d06a",
    carTaillight: "#c44040",
    bikeRider: "#5a4878",
    bikeFrame: "#7a6898",
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
    rampWood: "#b89a6a",
    rampWoodDark: "#8a6a40",
    rampWoodHighlight: "#d4b888",
    rampMetal: "#7a8a9a",
    rampMetalDark: "#5a6a7a",
  },
};

// ── Background element generation — extracted from Background.ts ──

function generateSuburbanElements(
  canvasWidth: number,
  groundY: number,
  palette: EnvironmentPalette
): BackgroundElement[] {
  const elements: BackgroundElement[] = [];

  let x = 0;
  let lastType = "";

  while (x < canvasWidth * 2.5) {
    const roll = Math.random();

    if (roll > 0.35) {
      // House (65% chance)
      const variant = Math.floor(Math.random() * 3); // 0 = cottage, 1 = village, 2 = tall
      const w = variant === 2 ? 40 + Math.random() * 15 : 50 + Math.random() * 30;
      const h = variant === 2 ? 55 + Math.random() * 20 : 40 + Math.random() * 20;
      const scheme =
        palette.buildings[Math.floor(Math.random() * palette.buildings.length)];
      elements.push({
        type: "house",
        x,
        y: groundY - h - 20,
        width: w,
        height: h,
        color: scheme.wall,
        roofColor: scheme.roof,
        variant,
      });
      const gap = 20 + Math.random() * 30;
      x += w + gap;

      // Maybe add a deer or person in the gap
      if (
        gap > 25 &&
        Math.random() > 0.6 &&
        lastType !== "deer" &&
        lastType !== "walking_person"
      ) {
        const isAnimal = Math.random() > 0.45;
        if (isAnimal) {
          elements.push({
            type: "deer",
            x: x - gap * 0.6,
            y: groundY - 32 - Math.random() * 5,
            width: 30,
            height: 28,
            color: palette.creature,
          });
          lastType = "deer";
        } else {
          elements.push({
            type: "walking_person",
            x: x - gap * 0.5,
            y: groundY - 38 - Math.random() * 3,
            width: 14,
            height: 32,
            color: palette.person,
          });
          lastType = "walking_person";
        }
      } else {
        lastType = "house";
      }
    } else {
      // Tree (35% chance)
      elements.push({
        type: "tree_silhouette",
        x,
        y: groundY - 65 - Math.random() * 15,
        width: 22 + Math.random() * 12,
        height: 55 + Math.random() * 20,
        color: palette.treeSilhouette,
      });
      x += 35 + Math.random() * 25;
      lastType = "tree";
    }
  }
  return elements;
}

// ── Obstacle pool — extracted from Obstacle.ts getWeightedTypes() ──

function suburbanWeightedTypes(elapsedMs: number): WeightedType[] {
  const basicWeight = elapsedMs >= 25_000 ? 0.4 : elapsedMs >= 10_000 ? 0.7 : 1.0;

  const types: WeightedType[] = [
    { type: ObstacleType.ROCK, weight: basicWeight },
    { type: ObstacleType.SMALL_TREE, weight: basicWeight },
  ];
  // Stage 2 (10s): tall trees, giant trees, trolleys, ramps
  if (elapsedMs >= 10_000) {
    types.push({ type: ObstacleType.TALL_TREE, weight: 0.8 });
    types.push({ type: ObstacleType.GIANT_TREE, weight: 0.5 });
    types.push({ type: ObstacleType.SHOPPING_TROLLEY, weight: 1.0 });
    types.push({ type: ObstacleType.STRAIGHT_RAMP, weight: 0.4 });
    types.push({ type: ObstacleType.CURVED_RAMP, weight: 0.4 });
  }
  // Stage 3 (25s): rideable obstacles
  if (elapsedMs >= 25_000) {
    types.push({ type: ObstacleType.BUS_STOP, weight: 0.8 });
    types.push({ type: ObstacleType.SHIPPING_CONTAINER, weight: 0.8 });
    types.push({ type: ObstacleType.CONTAINER_WITH_RAMP, weight: 0.5 });
  }
  // Stage 4 (40s): cars + other riders
  if (elapsedMs >= 40_000) {
    types.push({ type: ObstacleType.CAR, weight: 1.0 });
    types.push({ type: ObstacleType.PERSON_ON_BIKE, weight: 1.0 });
  }
  return types;
}

// ── Full environment definition ──

export const SUBURBAN_ENVIRONMENT: EnvironmentDefinition = {
  id: "suburban",
  name: "Suburbs",
  palette: SUBURBAN_PALETTE,
  background: {
    cloudCount: 12,
    cloudSpeedRatio: 0.1,
    buildingSpeedRatio: 0.4,
    generateElements: generateSuburbanElements,
  },
  backgroundDrawers: SUBURBAN_BACKGROUND_DRAWERS,
  obstaclePool: {
    getWeightedTypes: suburbanWeightedTypes,
  },
  musicTrack: "/music.mp3",
};
