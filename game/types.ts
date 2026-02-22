export enum GameState {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  GAME_OVER = "GAME_OVER",
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
  /** Current active pose trick (mutually exclusive with flips). */
  activeTrick: TrickType;
  /** Progress of pose trick animation: 0 = neutral, 1 = fully extended. Animates 0→1→0. */
  trickProgress: number;
  /** Phase of pose trick: 'extend' (0→1) or 'return' (1→0). */
  trickPhase: "extend" | "return";
  /** Number of completed pose trick cycles in current airtime. */
  trickCompletions: number;
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
