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
  type: "cloud" | "house" | "tree_silhouette";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor?: string;
}
