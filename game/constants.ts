// Ground line sits at 75% of canvas height
export const GROUND_RATIO = 0.75;

// Physics & gameplay (these are resolution-independent)
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const INITIAL_SPEED = 5;
export const SPEED_INCREASE = 0.07;
export const SPEED_INTERVAL = 12000;
export const SCORE_PER_PX = 20;
export const MIN_OBSTACLE_GAP = 300;

// Player dimensions
export const PLAYER_X_RATIO = 0.20; // 20% from the left of the canvas
export const PLAYER_WIDTH = 64;
export const PLAYER_HEIGHT = 58;

// Colors — muted palette
export const COLORS = {
  sky: "#b8c6d4",
  skyBottom: "#d4dce4",
  cloud: "#cdd5dc",
  ground: "#8a9a7c",
  road: "#7a7a78",
  roadLine: "#a3a39f",
  house1: "#c4aa90",
  house2: "#b8988a",
  house3: "#a8a098",
  house4: "#c0b098",
  roof1: "#6a5548",
  roof2: "#7a5a4a",
  roof3: "#5a5a50",
  roof4: "#6a6058",
  treeSilhouette: "#4a6a44",
  treeHighlight: "#5a7a50",
  deer: "#9a7a5a",
  person: "#5a5a6a",
  player: {
    wheel: "#2e2e2e",
    frame: "#8b1a1a",
    helmet: "#9b3333",
    skin: "#c8a882",
    shirt: "#7a8a9a",
    pants: "#5a5a6a",
  },
  obstacle: {
    rock: "#8a8a82",
    rockShadow: "#6a6a64",
    tree: "#6a7a5a",
    treeTrunk: "#8a7a6a",
    trolley: "#7a7a82",
    trolleyBasket: "#6a6a72",
    car: "#8a6a6a",
    carWindow: "#9aaaba",
    bikeRider: "#6a6a7a",
  },
} as const;
