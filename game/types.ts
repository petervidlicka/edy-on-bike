export enum GameState {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  CRASHING = "CRASHING",
  AMBULANCE = "AMBULANCE",
  GAME_OVER = "GAME_OVER",
}

export interface CrashState {
  elapsed: number;
  duration: number;

  shakeIntensity: number;
  shakeOffsetX: number;
  shakeOffsetY: number;

  riderX: number;
  riderY: number;
  riderVX: number;
  riderVY: number;
  riderAngle: number;
  riderAngularVel: number;
  riderBounceCount: number;

  bikeX: number;
  bikeY: number;
  bikeVX: number;
  bikeVY: number;
  bikeAngle: number;
  bikeAngularVel: number;
  bikeBounceCount: number;
  bikeWheelRotation: number;
}

export enum AmbulancePhase {
  DRIVING_IN = "DRIVING_IN",
  STOPPED = "STOPPED",
  REVIVING = "REVIVING",
  DRIVING_OUT = "DRIVING_OUT",
}

export interface AmbulanceState {
  x: number;
  y: number;
  width: number;
  height: number;
  phase: AmbulancePhase;
  phaseTimer: number;
  targetX: number;
  sirenFlash: number;
  reviveFlashOpacity: number;
}

export enum ObstacleType {
  ROCK = "ROCK",
  SMALL_TREE = "SMALL_TREE",
  TALL_TREE = "TALL_TREE",
  GIANT_TREE = "GIANT_TREE",
  SHOPPING_TROLLEY = "SHOPPING_TROLLEY",
  CAR = "CAR",
  PERSON_ON_BIKE = "PERSON_ON_BIKE",
  BUS_STOP = "BUS_STOP",
  SHIPPING_CONTAINER = "SHIPPING_CONTAINER",
  STRAIGHT_RAMP = "STRAIGHT_RAMP",
  CURVED_RAMP = "CURVED_RAMP",
  CONTAINER_WITH_RAMP = "CONTAINER_WITH_RAMP",

  // Dubai biome obstacles
  CAMEL = "CAMEL",
  SAND_TRAP = "SAND_TRAP",
  LAND_CRUISER = "LAND_CRUISER",
  PINK_G_CLASS = "PINK_G_CLASS",
  CACTUS = "CACTUS",
  DUBAI_CHOCOLATE = "DUBAI_CHOCOLATE",
  LAMBORGHINI_HURACAN = "LAMBORGHINI_HURACAN",
  DUBAI_BILLBOARD = "DUBAI_BILLBOARD",
}

export enum TrickType {
  NONE = "NONE",
  SUPERMAN = "SUPERMAN",
  NO_HANDER = "NO_HANDER",
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  jumpCount: number;
  isOnGround: boolean;
  wheelRotation: number;
  /** Bike tilt in radians — positive = front wheel up (lean back). */
  bikeTilt: number;
  /** Rider backward lean in radians. 0 = default, positive = lean back. */
  riderLean: number;
  /** 0 = seated on saddle, 1 = standing/raised off seat. */
  riderCrouch: number;
  /** 0 = legs extended to pedals, 1 = knees pulled toward chest. */
  legTuck: number;
  /** When riding on top of a rideable obstacle, this is the obstacle reference. null otherwise. */
  ridingObstacle: ObstacleInstance | null;
  /** Flip rotation angle in radians. 0 = not flipping, 2*PI = complete. */
  backflipAngle: number;
  /** Whether a flip trick is in progress. */
  isBackflipping: boolean;
  /** Rotation direction: 1 = backflip (CCW), -1 = frontflip (CW). */
  flipDirection: number;
  /** How many flips the player intends to complete. Starts at 1, incremented by additional input. */
  targetFlipCount: number;
  /** Current active pose trick (mutually exclusive with flips). */
  activeTrick: TrickType;
  /** Progress of pose trick animation: 0 = neutral, 1 = fully extended. Animates 0→1→0. */
  trickProgress: number;
  /** Phase of pose trick: 'extend' (0→1) or 'return' (1→0). */
  trickPhase: "extend" | "return";
  /** Number of completed pose trick cycles in current airtime. */
  trickCompletions: number;
  /** How many pose trick cycles the player intends to complete. Starts at 1, incremented by additional input. */
  targetTrickCount: number;
  /** Pending ramp boost type. 'straight' = more distance, 'curved' = more height. */
  rampBoost: "straight" | "curved" | null;
  /** Current ramp surface angle in radians for bike tilt matching. */
  rampSurfaceAngle: number;
}

export interface ObstacleInstance {
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  rideable: boolean;
  /** True for ramp obstacles — player rides over them, never crashes. */
  ramp: boolean;
}

export interface BackgroundLayer {
  elements: BackgroundElement[];
  speedRatio: number;
  offset: number;
}

// --- Skin types ---

export type SkinId = "default" | "racer" | "cowboy" | "royal" | "neon" | "stealth";

export type HelmetStyle = "standard" | "aero" | "cowboy" | "crown" | "cap" | "goggles";

export type BikeStyle = "bmx" | "racing" | "mtb" | "cruiser" | "fixie" | "fatTire";

export interface SkinColors {
  wheel: string;
  frame: string;
  helmet: string;
  skin: string;
  shirt: string;
  pants: string;
}

export interface SkinDefinition {
  id: SkinId;
  name: string;
  helmetStyle: HelmetStyle;
  bikeStyle: BikeStyle;
  unlockScore: number;
  colors: SkinColors;
}

export interface SkinUnlockState {
  selectedSkinId: SkinId;
  bestScore: number;
  cheatUnlocked: boolean;
}

export interface BackgroundElement {
  /** Element type — extensible per biome (e.g. "house", "skyscraper", "palm_tree") */
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor?: string;
  variant?: number;
}
