/**
 * Score readout shared by the single-player HUD and the race HUD, so the number
 * looks the same in both modes and stays readable on any biome's sky.
 */
import { color, font, formatScore, glassSurfaceSmall, radius, text } from "./tokens";

interface HudChipProps {
  score: number;
  /** Speed multiplier, already formatted (e.g. "1.3"). */
  multiplier: string;
  /** Tints the score while a trick is being scored. */
  accent?: string;
}

/**
 * @param props - Score, formatted multiplier and optional accent colour.
 * @example
 * <HudChip score={482} multiplier="1.3" />
 */
export function HudChip({ score, multiplier, accent }: HudChipProps) {
  return (
    <div
      style={{
        ...glassSurfaceSmall,
        display: "flex",
        alignItems: "baseline",
        gap: "10px",
        padding: "8px 14px",
        borderRadius: radius.md,
        pointerEvents: "none",
      }}
    >
      <span style={{ ...text.number, color: accent ?? color.ink, transition: "color 0.3s ease" }}>{formatScore(score)}</span>
      <span style={{ fontFamily: font.mono, fontSize: "0.8rem", fontWeight: 700, color: color.muted }}>&times;{multiplier}</span>
    </div>
  );
}
