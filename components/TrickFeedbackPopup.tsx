/**
 * "Backflip +75 (×1.5)"-style feedback under the score chip, shared by the single-player
 * and race HUDs. Also owns the clean/sketchy colours so the chip can tint its score to match.
 */
import { formatMultiplier } from "@/game/ComboChain";
import type { TrickFeedbackData } from "@/hooks/useGameEngine";
import { color, font, radius } from "./ui/tokens";

/**
 * The colour a landed trick is shown in: clean landings green, sketchy ones amber.
 * @example
 * <LiveHudChip stats={stats} accent={trickFeedback ? trickFeedbackColor(trickFeedback) : undefined} />
 */
export function trickFeedbackColor(trickFeedback: TrickFeedbackData): string {
  return trickFeedback.sketchy ? color.caution : color.success;
}

/**
 * Renders nothing when there's no recent trick.
 * @param props - The last landed trick, or null.
 * @example
 * <TrickFeedbackPopup trickFeedback={trickFeedback} />
 */
export function TrickFeedbackPopup({ trickFeedback }: { trickFeedback: TrickFeedbackData | null }) {
  if (!trickFeedback) return null;
  return (
    <span
      style={{
        color: trickFeedbackColor(trickFeedback),
        fontFamily: font.mono,
        fontSize: "0.8rem",
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: radius.sm,
        background: "rgba(255,255,255,0.85)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {trickFeedback.name} +{trickFeedback.points}
      {trickFeedback.multiplier > 1 && ` (×${formatMultiplier(trickFeedback.multiplier)})`}
    </span>
  );
}
