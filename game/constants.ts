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
/**
 * Inner padding that makes hitboxes slightly smaller than the visual bounds, so
 * near-misses feel fair rather than frustrating. Obstacle placement reads it to keep
 * low obstacles hittable.
 */
export const HITBOX_PADDING = 8;
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
export const RAMP_HEIGHT_MULTIPLIER = 1.1;
export const RAMP_GRAVITY_MULTIPLIER = 0.5;
export const DOUBLE_CHAIN_BONUS = 100;
export const TRIPLE_CHAIN_BONUS = 200;
export const COMBO_MULTIPLIER = 2;
/** A landing worth at least this many points counts as a "big" trick in game events. */
export const BIG_TRICK_POINTS = 150;

// Combo chain (trick landings linked across jumps). Tune these by playing.
/** Time on the ground the player has to land the next trick before the chain ends. */
export const COMBO_WINDOW_MS = 2500;
/** Multiplier gained per extra link: 1 link = x1, 2 links = x1.5, 3 = x2, ... */
export const COMBO_STEP = 0.5;
/** The multiplier never grows past this. */
export const COMBO_MAX_MULTIPLIER = 4;
/** A chain only gets a summary / "combo ended" event from this many links on. */
export const COMBO_MIN_LINKS_FOR_SUMMARY = 2;
/** Screen flash when a link raises the multiplier to at least this. */
export const COMBO_FLASH_MULTIPLIER = 3;
/** Confetti burst when a link raises the multiplier to at least this (the cap by default). */
export const COMBO_CONFETTI_MULTIPLIER = COMBO_MAX_MULTIPLIER;
/** Meter pop animation: starts at this scale and settles to 1 over COMBO_PULSE_MS. */
export const COMBO_PULSE_SCALE = 1.3;
export const COMBO_PULSE_MS = 200;
/** Peak opacity and fade time of the white screen flash. */
export const COMBO_FLASH_ALPHA = 0.28;
export const COMBO_FLASH_MS = 220;
export const COMBO_CONFETTI_COUNT = 48;
/** Combo step sound: pitch rises this many semitones per link, for at most COMBO_PITCH_MAX_STEPS links. */
export const COMBO_PITCH_SEMITONES_PER_LINK = 1.5;
export const COMBO_PITCH_MAX_STEPS = 7;

// Grinds (riding along the top of a rideable obstacle). Tune these by playing.
/** Shortest ride (ms) that counts as a grind; shorter touches pay nothing. */
export const GRIND_MIN_MS = 300;
/** Grind payout before the chain multiplier: GRIND_BASE + GRIND_PER_SEC per second ridden. */
export const GRIND_BASE = 10;
export const GRIND_PER_SEC = 40;
/** Pose while grinding. Negative riderCrouch lowers the hips (positive stands taller); negative bikeTilt dips the nose. */
export const GRIND_RIDER_CROUCH = -0.6;
export const GRIND_BIKE_TILT = -0.05;
/** Sparks emitted per frame at the rear-wheel contact while grinding (inclusive range). */
export const GRIND_SPARKS_MIN = 2;
export const GRIND_SPARKS_MAX = 3;
/** Hard cap on live sparks so a long grind on a slow device can't flood the pool. */
export const GRIND_SPARK_MAX = 90;
/** Scrape sound: loudness and the band-pass centre/width of the filtered noise. */
export const GRIND_SOUND_GAIN = 0.06;
export const GRIND_SOUND_FREQ_HZ = 3000;
export const GRIND_SOUND_Q = 1.2;

/**
 * Largest bonus one landing can pay before any chain multiplier: three pose cycles
 * plus three flips landed together (MAX_FLIP_COUNT caps both in Player.ts), the
 * triple chain bonus, and the pose+flip combo multiplier. Mirrors the scoring in
 * TrickSystem.evaluateComboLanding; the multiplayer server derives its score limits
 * from this, so keep them in step if trick scoring changes.
 */
export const MAX_TRICK_LANDING_BONUS =
  (MAX_FLIP_COUNT * Math.max(SUPERMAN_BONUS, NO_HANDER_BONUS) +
    MAX_FLIP_COUNT * BACKFLIP_BONUS +
    Math.max(DOUBLE_CHAIN_BONUS, TRIPLE_CHAIN_BONUS)) *
  COMBO_MULTIPLIER;
/** Largest points a single landing can pay once a full-multiplier chain is running. */
export const MAX_CHAIN_LANDING_BONUS = MAX_TRICK_LANDING_BONUS * COMBO_MAX_MULTIPLIER;

// Crash animation
export const CRASH_DURATION = 1.2; // seconds
export const CRASH_GRAVITY = 0.45;
export const CRASH_BOUNCE_DAMPING = 0.35;
export const CRASH_SHAKE_INITIAL = 8; // pixels
/** Share of crashes that play the classic tumble even when a more specific variant fits. */
export const CRASH_CLASSIC_CHANCE = 0.25;
/** Seconds into a crash after which a tap or Space may skip it (only when no ambulance is coming). */
export const CRASH_SKIP_AFTER_S = 0.6;

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

// Multiplayer
export const NETWORK_SYNC_INTERVAL_MS = 67; // ~15 Hz
