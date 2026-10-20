import type { BackgroundElement, ObstacleType } from "../types";
import type { ViewBounds } from "../Camera";

// ── Biome identifiers ──

export type BiomeId = "suburban" | "dubai" | "austria" | "tokyo";

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

  // Background creatures (pedestrian colours come from environments/pedestrians.ts)
  creature: string;
  creatureLeg: string;
  creatureTail: string;

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

    // Suburban traffic variants (optional — fall back to the car colours)
    suv?: string;
    suvDark?: string;
    van?: string;
    vanDark?: string;
    vanAccent?: string;

    // Dubai-specific (optional — not needed by suburban)
    camel?: string;
    camelLeg?: string;
    camelSaddle?: string;
    sand?: string;
    sandHighlight?: string;
    sandShadow?: string;
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
    ferrariRed?: string;
    ferrariRedDark?: string;
    convertible?: string;
    convertibleDark?: string;
    porsche?: string;
    porscheDark?: string;
    billboardFrame?: string;
    billboardPost?: string;

    // Austria-specific (optional — fall back to built-in colours)
    snow?: string;
    snowShadow?: string;
    ice?: string;
    iceHighlight?: string;
    beerCrate?: string;
    beerCrateDark?: string;
    snowCat?: string;
    snowCatDark?: string;
    snowCatTrack?: string;
    redDeer?: string;
    redDeerDark?: string;
    antler?: string;
    skiRacer?: string;
    skiRacerDark?: string;

    // Tokyo-specific (optional — fall back to built-in colours)
    keiCar?: string;
    keiCarDark?: string;
    taxi?: string;
    taxiDark?: string;
    neonPink?: string;
    neonCyan?: string;
  };
}

/**
 * Extra kit Edy wears in a biome, drawn over the selected skin: goggles and a scarf in
 * the snow, a hachimaki headband in Tokyo. Absent = the skin as designed.
 */
export type RiderGear = "winter" | "hachimaki";

/**
 * Draws a far scenery band (mountain range, distant skyline) between the sky and the
 * building layer, covering `view` (wider than the canvas while the big-air camera is
 * zoomed out). `offset` is the cloud layer's scroll, so it moves at cloud parallax.
 */
export type SkylineDrawFn = (
  ctx: CanvasRenderingContext2D,
  view: ViewBounds,
  groundY: number,
  offset: number,
  palette: EnvironmentPalette
) => void;

/** A skyline to draw this frame and how opaque, so it can fade in and out across a transition. */
export interface SkylinePass {
  readonly draw: SkylineDrawFn;
  readonly alpha: number;
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

// ── Particle overlay (snow, sand, rain) ──

export interface ParticleOverlayConfig {
  /** Snow and sand draw as dots; rain draws as streaks along its fall direction. */
  type: "snow" | "sand" | "rain";
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
  /** Optional far scenery band drawn behind the building layer. */
  skyline?: SkylineDrawFn;
  /**
   * Optional pass over the road after it is drawn (e.g. neon reflections on wet tarmac).
   * Same signature as a skyline; `offset` is the road layer's scroll.
   */
  roadOverlay?: SkylineDrawFn;
  /** Optional biome kit drawn on the rider. */
  riderGear?: RiderGear;
}
