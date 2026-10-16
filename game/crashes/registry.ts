/**
 * Decides which crash variant plays. Specific variants win over the generic one, but
 * a share of crashes still falls back to the classic tumble so they stay surprising.
 */
import { ObstacleType } from "../types";
import { CRASH_CLASSIC_CHANCE } from "../constants";
import { carBonkCrash, CAR_OBSTACLES } from "./carBonk";
import { faceplantCrash } from "./faceplant";
import { treeHangCrash } from "./treeHang";
import { classicCrash } from "./classic";
import type { CrashCause, CrashVariantId } from "./types";

const TREE_OBSTACLES: readonly ObstacleType[] = [
  ObstacleType.SMALL_TREE,
  ObstacleType.TALL_TREE,
  ObstacleType.GIANT_TREE,
];

/**
 * The variant a cause calls for, ignoring the random classic fallback.
 * @param cause - What the rider crashed into.
 */
export function variantForCause(cause: CrashCause): CrashVariantId {
  switch (cause.kind) {
    case "badLanding":
      return faceplantCrash.id;
    case "obstacle":
      if (TREE_OBSTACLES.includes(cause.obstacle.type)) return treeHangCrash.id;
      if (CAR_OBSTACLES.includes(cause.obstacle.type)) return carBonkCrash.id;
      return classicCrash.id;
    case "eliminated":
      return classicCrash.id;
  }
}

/**
 * Picks the variant for a crash: the one the cause calls for, except for
 * `CRASH_CLASSIC_CHANCE` of crashes (and every multiplayer elimination), which get the classic tumble.
 * @param cause - What the rider crashed into.
 * @param random - Source of randomness in [0, 1); crashes are local, so `Math.random` is fine.
 * @returns The id of the variant to play.
 * @example
 * pickVariant({ kind: "obstacle", obstacle: tree }, Math.random); // "treeHang" about 3 times in 4
 */
export function pickVariant(cause: CrashCause, random: () => number): CrashVariantId {
  const wanted = variantForCause(cause);
  if (wanted === classicCrash.id || cause.kind === "eliminated") return classicCrash.id;
  return random() < CRASH_CLASSIC_CHANCE ? classicCrash.id : wanted;
}
