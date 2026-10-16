/**
 * Background pedestrians shared by every biome: the colour sets, the kinds, and how a
 * kind and skin tone are packed into a BackgroundElement's numeric `variant`. Element
 * generation picks pedestrians here; the renderer decodes them with the same helpers.
 */
import type { BackgroundElement } from "../types";

/** Skin tones; HAIR_COLORS is indexed in parallel so each tone has a matching hair colour. */
export const SKIN_TONES = ["#f1c9a5", "#d9a87e", "#b07a52", "#7a5034"] as const;
/** Hair colour per skin-tone index. */
export const HAIR_COLORS = ["#5a3c24", "#2b2018", "#c98b3c", "#1c1612"] as const;
const TOPS = ["#e4572e", "#2e86ab", "#f2c14e", "#4caf7d", "#d1495b", "#8e6cbd", "#ff8c42", "#3bb3c3"];
const BOTTOMS = ["#3d405b", "#4a6fa5", "#2f2f2f", "#8d6e63", "#5c6b73", "#b04a6a"];

/** Pedestrian kinds; the element variant packs kind + kinds.length × skin-tone index. */
export const PEDESTRIAN_KINDS = ["man", "woman", "child"] as const;

/** One of the pedestrian kinds in PEDESTRIAN_KINDS. */
export type PedestrianKind = (typeof PEDESTRIAN_KINDS)[number];

/**
 * Unpacks a walking_person element's `variant` into its kind and skin-tone index, so
 * the renderer and the picker agree on one encoding.
 *
 * @example decodePedestrianVariant(4) // { kind: "woman", skinIndex: 1 }
 */
export function decodePedestrianVariant(variant: number): { kind: PedestrianKind; skinIndex: number } {
  const n = PEDESTRIAN_KINDS.length;
  return {
    kind: PEDESTRIAN_KINDS[variant % n],
    skinIndex: Math.floor(variant / n) % SKIN_TONES.length,
  };
}

/**
 * Picks a random pedestrian for a background layer: kind, skin tone and a colourful
 * outfit. Children are shorter, so the caller should use the returned height.
 *
 * @param rng Random source, injectable for deterministic generation.
 * @returns Fields to spread into a walking_person BackgroundElement.
 */
export function pickPedestrian(
  rng: () => number = Math.random,
): Pick<BackgroundElement, "variant" | "color" | "roofColor" | "width" | "height"> {
  const kindIndex = Math.floor(rng() * PEDESTRIAN_KINDS.length);
  const skinIndex = Math.floor(rng() * SKIN_TONES.length);
  const isChild = PEDESTRIAN_KINDS[kindIndex] === "child";
  return {
    variant: kindIndex + PEDESTRIAN_KINDS.length * skinIndex,
    color: TOPS[Math.floor(rng() * TOPS.length)],
    roofColor: BOTTOMS[Math.floor(rng() * BOTTOMS.length)],
    width: isChild ? 11 : 14,
    height: isChild ? 22 : 32,
  };
}
