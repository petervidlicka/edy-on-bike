import { ObstacleType, type BackgroundElement } from "../types";
import { DUBAI_BACKGROUND_DRAWERS } from "../rendering";
import type {
  EnvironmentDefinition,
  EnvironmentPalette,
  WeightedType,
} from "./types";

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
  person: "#e8e0d8",

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
    // Shared obstacle colors (for ramps, etc.)
    rock: "#c8a060",
    rockHighlight: "#d8b878",
    rockShadow: "#8a7040",
    tree: "#3a8a42",
    treeHighlight: "#58aa50",
    treeTrunk: "#6e4e38",
    treeTrunkShadow: "#523828",
    trolley: "#5a7a9a",
    trolleyBasket: "#4a6888",
    trolleyAccent: "#c47a42",
    car: "#e0e0e0",
    carRoof: "#c8c8c8",
    carWindow: "#70a8c8",
    carBumper: "#9a9090",
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

    // Dubai-specific obstacle colors
    camel: "#c8a060",
    camelLeg: "#a08040",
    camelSaddle: "#c44040",
    sand: "#d8c078",
    sandHighlight: "#e8d498",
    sandShadow: "#b09858",
    pinkGClass: "#e87a9f",
    pinkGClassRoof: "#d06888",
    cactus: "#3a7a38",
    cactusHighlight: "#4a9a48",
    cactusSpine: "#2a5a28",
    chocolate: "#5a3a20",
    chocolateDark: "#3a2210",
    chocolateWrapper: "#d4a844",
    lamboGreen: "#2d8a35",
    lamboGreenDark: "#1e6a25",
    lamboWindow: "#2a3a4a",
    billboardFrame: "#a0a0a0",
    billboardPost: "#5a5a5a",
  },
};

// ── Background element generation — Desert City skyline ──

function generateDubaiElements(
  canvasWidth: number,
  groundY: number,
  palette: EnvironmentPalette
): BackgroundElement[] {
  const elements: BackgroundElement[] = [];

  let x = 0;
  let lastType = "";
  let lastLandmarkVariant: number | null = null;
  let genericsSinceLandmark = 99; // allow landmark on first pick

  while (x < canvasWidth * 2.5) {
    const roll = Math.random();

    if (roll > 0.30) {
      // Skyscraper (70% chance)
      // Variants 0-4 = generic, 5-8 = landmarks
      let variant: number;
      let w: number, h: number;

      // Decide generic vs landmark: ~20% landmark chance, but only when
      // at least 3 generics have appeared since the last landmark
      const tryLandmark = Math.random() < 0.20 && genericsSinceLandmark >= 3;
      if (tryLandmark) {
        // Pick a landmark variant (5-8) that isn't the same as the last one
        const landmarks = [5, 6, 7, 8].filter(v => v !== lastLandmarkVariant);
        variant = landmarks[Math.floor(Math.random() * landmarks.length)];
      } else {
        variant = Math.floor(Math.random() * 5); // generic 0-4
      }

      switch (variant) {
        // Generic skyscrapers (0-4) — tall with variety
        case 0: case 1: case 2: case 3: case 4:
          w = 35 + Math.random() * 25;
          h = 150 + Math.random() * 100;
          break;
        // Landmarks
        case 5: // Burj Khalifa — narrow and extremely tall (double tallest generic)
          w = 30 + Math.random() * 10;
          h = 300 + Math.random() * 100;
          break;
        case 6: // Museum of the Future — wide oval, half the height of generic
          w = 60 + Math.random() * 20;
          h = 60 + Math.random() * 20;
          break;
        case 7: // Burj Al Arab — sail shape, very tall
          w = 50 + Math.random() * 15;
          h = 225 + Math.random() * 50;
          break;
        case 8: // Dubai Frame — two pillars with bridge, very tall
          w = 45 + Math.random() * 10;
          h = 200 + Math.random() * 50;
          break;
        default:
          w = 35 + Math.random() * 25;
          h = 150 + Math.random() * 100;
      }

      // Track landmark vs generic for deduplication
      if (variant >= 5) {
        lastLandmarkVariant = variant;
        genericsSinceLandmark = 0;
      } else {
        genericsSinceLandmark++;
      }

      const scheme =
        palette.buildings[Math.floor(Math.random() * palette.buildings.length)];
      elements.push({
        type: "skyscraper",
        x,
        y: groundY - h - 16,
        width: w,
        height: h,
        color: scheme.wall,
        roofColor: scheme.roof,
        variant,
      });
      const gap = 15 + Math.random() * 25;
      x += w + gap;

      // Maybe add a background camel or person in the gap
      if (
        gap > 20 &&
        Math.random() > 0.65 &&
        lastType !== "bg_camel" &&
        lastType !== "walking_person"
      ) {
        const isAnimal = Math.random() > 0.4;
        const vergeOffset = Math.random() * 18;
        if (isAnimal) {
          elements.push({
            type: "bg_camel",
            x: x - gap * 0.6,
            y: groundY - 32 - vergeOffset,
            width: 36,
            height: 32,
            color: palette.creature,
          });
          lastType = "bg_camel";
        } else {
          elements.push({
            type: "walking_person",
            x: x - gap * 0.5,
            y: groundY - 32 - vergeOffset,
            width: 14,
            height: 32,
            color: palette.person,
          });
          lastType = "walking_person";
        }
      } else {
        lastType = "skyscraper";
      }
    } else {
      // Palm tree (30% chance) — stays same size
      const sizeTier = Math.random();
      const tw = sizeTier < 0.5 ? 16 + Math.random() * 6 : 22 + Math.random() * 8;
      const th = sizeTier < 0.5 ? 50 + Math.random() * 20 : 70 + Math.random() * 25;
      const vergeOffset = Math.random() * 18;
      elements.push({
        type: "palm_tree",
        x,
        y: groundY - th - vergeOffset,
        width: tw,
        height: th,
        color: palette.treeSilhouette,
      });
      x += tw + 12 + Math.random() * 20;
      lastType = "palm_tree";
    }
  }
  return elements;
}

// ── Obstacle pool — Dubai biome, time-staged ──

// biomeMs = biome-relative elapsed time (0 = when this biome started, not game start)
function dubaiWeightedTypes(biomeMs: number): WeightedType[] {
  const earlyWeight = biomeMs >= 30_000 ? 0.4 : biomeMs >= 15_000 ? 0.7 : 1.0;

  const types: WeightedType[] = [
    // Stage 1: core desert obstacles + vehicle previews
    { type: ObstacleType.SAND_TRAP, weight: earlyWeight },
    { type: ObstacleType.CACTUS, weight: earlyWeight },
    { type: ObstacleType.CAMEL, weight: 0.8 },
    { type: ObstacleType.LAND_CRUISER, weight: 0.3 },
    { type: ObstacleType.PINK_G_CLASS, weight: 0.2 },
  ];
  // Stage 2 (15s into Dubai): ramps, more vehicles, chocolate + lambo + billboard
  if (biomeMs >= 15_000) {
    types.push({ type: ObstacleType.STRAIGHT_RAMP, weight: 0.4 });
    types.push({ type: ObstacleType.CURVED_RAMP, weight: 0.4 });
    types.push({ type: ObstacleType.DUBAI_CHOCOLATE, weight: 0.7 });
    types.push({ type: ObstacleType.LAMBORGHINI_HURACAN, weight: 0.5 });
    types.push({ type: ObstacleType.DUBAI_BILLBOARD, weight: 0.4 });
    for (const t of types) {
      if (t.type === ObstacleType.LAND_CRUISER) t.weight = 0.7;
      if (t.type === ObstacleType.PINK_G_CLASS) t.weight = 0.5;
    }
  }
  // Stage 3 (30s into Dubai): full roster, max weights
  if (biomeMs >= 30_000) {
    for (const t of types) {
      if (t.type === ObstacleType.LAND_CRUISER) t.weight = 1.0;
      if (t.type === ObstacleType.PINK_G_CLASS) t.weight = 0.7;
      if (t.type === ObstacleType.LAMBORGHINI_HURACAN) t.weight = 0.8;
      if (t.type === ObstacleType.DUBAI_CHOCOLATE) t.weight = 1.0;
    }
  }
  return types;
}

// ── Full environment definition ──

export const DUBAI_ENVIRONMENT: EnvironmentDefinition = {
  id: "dubai",
  name: "Desert City",
  palette: DUBAI_PALETTE,
  background: {
    cloudCount: 6,
    cloudSpeedRatio: 0.08,
    buildingSpeedRatio: 0.4,
    generateElements: generateDubaiElements,
  },
  backgroundDrawers: DUBAI_BACKGROUND_DRAWERS,
  obstaclePool: {
    getWeightedTypes: dubaiWeightedTypes,
  },
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
