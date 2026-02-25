// Ground line sits at 75% of canvas height
export const GROUND_RATIO = 0.75;

// Physics & gameplay (these are resolution-independent)
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const INITIAL_SPEED = 5;
export const SPEED_INCREASE = 0.07;
export const SPEED_INTERVAL = 12000;
export const MAX_SPEED_MULTIPLIER = 2.0;
export const SCORE_PER_PX = 20;
export const MIN_OBSTACLE_GAP = 350;
export const MIN_OBSTACLE_GAP_LATE = 450;
export const RIDEABLE_JUMP_MULTIPLIER = 1.3;
export const FLIP_TOLERANCE = Math.PI / 6; // 30° clean landing zone
export const SKETCHY_TOLERANCE = Math.PI / 6; // additional 30° sketchy zone
export const SKETCHY_PENALTY = 0.7; // 30% point penalty
export const BACKFLIP_SPEED = 0.18; // radians per dt unit (~0.58s for full rotation at 60fps)
export const MAX_FLIP_COUNT = 3; // maximum number of chained flips per airtime
export const BACKFLIP_BONUS = 50;
export const SUPERMAN_SPEED = 0.06; // progress per dt (~0.57s full cycle at 60fps)
export const NO_HANDER_SPEED = 0.10;
export const SUPERMAN_BONUS = 60;
export const NO_HANDER_BONUS = 30;
export const TRICK_COMPLETION_THRESHOLD = 0.9; // 90% = safe landing
export const RAMP_HEIGHT_MULTIPLIER = 1.1;
export const RAMP_GRAVITY_MULTIPLIER = 0.5;
export const DOUBLE_CHAIN_BONUS = 100;
export const TRIPLE_CHAIN_BONUS = 200;
export const COMBO_MULTIPLIER = 2;

// Crash animation
export const CRASH_DURATION = 1.2; // seconds
export const CRASH_GRAVITY = 0.45;
export const CRASH_BOUNCE_DAMPING = 0.35;
export const CRASH_SHAKE_INITIAL = 8; // pixels

// Ambulance
export const AMBULANCE_CHANCE = 0.25;
export const AMBULANCE_WIDTH = 120;
export const AMBULANCE_HEIGHT = 55;
export const AMBULANCE_DRIVE_SPEED = 9;
export const AMBULANCE_DRIVE_OUT_SPEED = 14;
export const AMBULANCE_STOP_MS = 800;
export const AMBULANCE_REVIVE_MS = 600;

// Player dimensions
export const PLAYER_X_RATIO = 0.20; // 20% from the left of the canvas
export const PLAYER_WIDTH = 64;
export const PLAYER_HEIGHT = 58;
