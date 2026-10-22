/**
 * Palette parts every biome shares: Edy's own colours and the look of the obstacles
 * that can turn up on any course (trolleys, bus stops, containers, ramps and the rest).
 * A biome palette spreads these in and overrides only what it restyles (snowed over,
 * night-darkened), so a new biome cannot drift from the others by retyping forty hex
 * values. The values are the Suburban look, the opening biome.
 */
import type { EnvironmentPalette, SharedObstacleColors } from "./types";

/** Edy's colours as the palette carries them; the same in every biome. */
export const PLAYER_COLORS: EnvironmentPalette["player"] = {
  wheel: "#2e2e2e",
  frame: "#8b1a1a",
  helmet: "#9b3333",
  skin: "#c8a882",
  shirt: "#7a8a9a",
  pants: "#5a5a6a",
};

/** Default colours of the shared obstacles (the Suburban look). */
export const SHARED_OBSTACLE_COLORS: SharedObstacleColors = {
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
  carWheel: "#2e2e2c",
  carHeadlight: "#e8d06a",
  carTaillight: "#c44040",
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
  giantTreeBark: "#4a3020",
  giantTreeOutline: "#1e5a24",
  rampWood: "#b89a6a",
  rampWoodDark: "#8a6a40",
  rampWoodHighlight: "#d4b888",
  rampMetal: "#7a8a9a",
  rampMetalDark: "#5a6a7a",
};
