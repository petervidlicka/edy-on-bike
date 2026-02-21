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
export const RIDEABLE_JUMP_MULTIPLIER = 1.5;
export const BACKFLIP_SPEED = 0.18; // radians per dt unit (~0.58s for full rotation at 60fps)
export const BACKFLIP_BONUS = 50;
export const SUPERMAN_SPEED = 0.06; // progress per dt (~0.57s full cycle at 60fps)
export const NO_HANDER_SPEED = 0.07;
export const SUPERMAN_BONUS = 60;
export const NO_HANDER_BONUS = 30;
export const TRICK_COMPLETION_THRESHOLD = 0.9; // 90% = safe landing
export const RAMP_HEIGHT_MULTIPLIER = 1.5;
export const DOUBLE_CHAIN_BONUS = 100;
export const TRIPLE_CHAIN_BONUS = 200;

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
    rampWood: "#b89a6a",
    rampWoodDark: "#8a6a40",
    rampWoodHighlight: "#d4b888",
    rampMetal: "#7a8a9a",
    rampMetalDark: "#5a6a7a",
  },
} as const;
