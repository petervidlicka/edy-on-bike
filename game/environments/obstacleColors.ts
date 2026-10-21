/**
 * Colours of each biome's own obstacles, defined once. The biome palette spreads them in,
 * and the obstacle renderers fall back to them: an obstacle can still be on screen after
 * its biome hands over (or appear on the debug course), when the active palette doesn't
 * define its colours.
 */
import type { EnvironmentPalette } from "./types";

type ObstacleColors = Partial<EnvironmentPalette["obstacle"]>;

/** Obstacles that only appear in Dubai. */
export const DUBAI_OBSTACLE_COLORS = {
  camel: "#c8a060",
  camelLeg: "#a08040",
  camelSaddle: "#c44040",
  sand: "#d8c078",
  sandHighlight: "#e8d498",
  sandShadow: "#b09858",
  pinkGClass: "#e87a9f",
  pinkGClassRoof: "#d06888",
  cactus: "#3a7a38",
  cactusHighlight: "#4a9a48",
  cactusSpine: "#2a5a28",
  chocolate: "#5a3a20",
  chocolateDark: "#3a2210",
  chocolateWrapper: "#d4a844",
  lamboGreen: "#86c232", // Verde Mantis
  lamboGreenDark: "#5e8f1f",
  lamboWindow: "#2a3a4a",
  ferrariRed: "#d11f1f", // Rosso Corsa
  ferrariRedDark: "#9a1414",
  convertible: "#1f5fbf",
  convertibleDark: "#164586",
  porsche: "#2fa8c9", // Miami Blue
  porscheDark: "#1f7d97",
  billboardFrame: "#a0a0a0",
  billboardPost: "#5a5a5a",
} as const satisfies ObstacleColors;

/** Obstacles that only appear in Austria. */
export const AUSTRIA_OBSTACLE_COLORS = {
  snow: "#f6f9fc",
  snowShadow: "#c6d6e6",
  ice: "#a8d4ec",
  iceHighlight: "#e4f4fc",
  beerCrate: "#c8102e", // Stiegl red
  beerCrateDark: "#8e0b20",
  snowCat: "#d42a1c", // Pistenbully red
  snowCatDark: "#9a1c12",
  snowCatTrack: "#2e3236",
  redDeer: "#8a5a36",
  redDeerDark: "#5e3c22",
  antler: "#d8c4a0",
  skiRacer: "#d81e28",
  skiRacerDark: "#9a141c",
} as const satisfies ObstacleColors;

/** Obstacles that only appear in Tokyo. */
export const TOKYO_OBSTACLE_COLORS = {
  keiCar: "#9ad8c4", // mint tall-roof Kei
  keiCarDark: "#6aae9a",
  taxi: "#2c3256", // deep indigo JPN-style taxi
  taxiDark: "#1c2040",
} as const satisfies ObstacleColors;
