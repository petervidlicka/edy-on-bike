/**
 * Decides which crash variant plays. For now every crash is the classic tumble; the
 * specific variants register here as they are added.
 */
import { classicCrash } from "./classic";
import type { CrashCause, CrashVariantId } from "./types";

/**
 * The variant a cause calls for, ignoring any random fallback.
 * @param _cause - What the rider crashed into.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the cause matters once variants exist
export function variantForCause(_cause: CrashCause): CrashVariantId {
  return classicCrash.id;
}

/**
 * Picks the variant for a crash.
 * @param cause - What the rider crashed into.
 * @param _random - Source of randomness in [0, 1), for the random fallback to classic.
 * @returns The id of the variant to play.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the random fallback matters once variants exist
export function pickVariant(cause: CrashCause, _random: () => number): CrashVariantId {
  return variantForCause(cause);
}
