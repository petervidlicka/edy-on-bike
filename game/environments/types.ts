import type { BackgroundElement, ObstacleType } from "../types";

// ── Biome identifiers ──

export type BiomeId = "suburban" | "dubai" | "desert" | "snow";

// ── Color palette for an environment ──

export interface EnvironmentPalette {
  // Sky
  sky: string;
  skyBottom: string;
  cloud: string;

  // Ground & road
  ground: string;
  road: string;
  roadLine: string;

  // Background buildings/structures
  buildings: Array<{ wall: string; roof: string }>;
  windowGlass: string;
  doorKnob: string;

  // Background nature
  treeSilhouette: string;
  treeHighlight: string;
  backgroundTreeTrunk: string;

  // Background creatures & people
  creature: string;
  creatureLeg: string;
  creatureTail: string;
  person: string;

  // Player colors
  player: {
    wheel: string;
    frame: string;
    helmet: string;
    skin: string;
    shirt: string;
    pants: string;
  };

  // Obstacle colors
  obstacle: {
    rock: string;
    rockHighlight: string;
    rockShadow: string;
    tree: string;
    treeHighlight: string;
    treeTrunk: string;
    treeTrunkShadow: string;
    trolley: string;
    trolleyBasket: string;
    trolleyAccent: string;
    car: string;
    carRoof: string;
    carWindow: string;
    carBumper: string;
    carWheel: string;
    carHeadlight: string;
    carTaillight: string;
    bikeRider: string;
    bikeFrame: string;
    busStopFrame: string;
    busStopRoof: string;
    busStopGlass: string;
    busStopSign: string;
    container: string;
    containerDark: string;
    containerDoor: string;
    giantTreeCanopy: string;
    giantTreeCanopyHighlight: string;
    giantTreeTrunk: string;
    giantTreeBark: string;
    giantTreeOutline: string;
    rampWood: string;
    rampWoodDark: string;
    rampWoodHighlight: string;
    rampMetal: string;
    rampMetalDark: string;

    // Dubai-specific (optional — not needed by suburban)
    camel?: string;
    camelLeg?: string;
    camelSaddle?: string;
    sand?: string;
    sandHighlight?: string;
    sandShadow?: string;
    buggyFrame?: string;
    buggyCage?: string;
    buggyWheel?: string;
    pinkGClass?: string;
    pinkGClassRoof?: string;
    cactus?: string;
    cactusHighlight?: string;
    cactusSpine?: string;
    chocolate?: string;
    chocolateDark?: string;
    chocolateWrapper?: string;
    lamboGreen?: string;
    lamboGreenDark?: string;
    lamboWindow?: string;
  };
}

// ── Background element drawing ──

export type BackgroundDrawFn = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  palette: EnvironmentPalette,
  roofColor?: string,
  variant?: number
) => void;

// ── Background generation config ──

export interface BackgroundGeneratorConfig {
  /** Number of cloud elements to generate */
  cloudCount: number;
  /** Parallax speed ratio for cloud layer (0.1 = very slow) */
  cloudSpeedRatio: number;
  /** Parallax speed ratio for building/tree layer */
  buildingSpeedRatio: number;
  /** Generate building-layer elements for this environment */
  generateElements: (
    canvasWidth: number,
    groundY: number,
    palette: EnvironmentPalette
  ) => BackgroundElement[];
}

// ── Obstacle pool config ──

export interface WeightedType {
  type: ObstacleType;
  weight: number;
}

export interface ObstaclePoolConfig {
  /** Return weighted obstacle types available at the given elapsed time */
  getWeightedTypes: (elapsedMs: number) => WeightedType[];
}

// ── Particle overlay (snow, sand) ──

export interface ParticleOverlayConfig {
  type: "snow" | "sand";
  /** Particles per 100×100px area */
  density: number;
  speed: { x: number; y: number };
  size: { min: number; max: number };
  color: string;
  opacity: number;
}

// ── Full environment definition ──

export interface EnvironmentDefinition {
  id: BiomeId;
  name: string;
  palette: EnvironmentPalette;
  background: BackgroundGeneratorConfig;
  /** Map of element type → draw function for background layer dispatch */
  backgroundDrawers: Record<string, BackgroundDrawFn>;
  obstaclePool: ObstaclePoolConfig;
  /** Path to music file (e.g. "/music.mp3") */
  musicTrack: string;
  /** Optional particle overlay (snow, sand, etc.) */
  particleOverlay?: ParticleOverlayConfig;
}
