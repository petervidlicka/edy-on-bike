export enum GameState {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  GAME_OVER = "GAME_OVER",
}

export enum ObstacleType {
  ROCK = "ROCK",
  SMALL_TREE = "SMALL_TREE",
  SHOPPING_TROLLEY = "SHOPPING_TROLLEY",
  CAR = "CAR",
  PERSON_ON_BIKE = "PERSON_ON_BIKE",
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
}

export interface ObstacleInstance {
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BackgroundLayer {
  elements: BackgroundElement[];
  speedRatio: number;
  offset: number;
}

export interface BackgroundElement {
  type: "cloud" | "house" | "tree_silhouette" | "deer" | "walking_person";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor?: string;
  variant?: number;
}
