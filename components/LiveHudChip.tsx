/**
 * The score chip wired to the live engine stats. The only HUD element that
 * re-renders per score tick; everything around it receives stable props.
 */
import { INITIAL_SPEED } from "@/game/constants";
import { useEngineScore, useEngineSpeed, type EngineStats } from "@/hooks/engineStats";
import { HudChip } from "./ui/HudChip";

interface LiveHudChipProps {
  stats: EngineStats;
  /** Tints the score while a trick is being scored. */
  accent?: string;
}

/**
 * @param props - The engine's stats store and an optional accent colour.
 * @example
 * <LiveHudChip stats={stats} accent={trickFeedback ? color.success : undefined} />
 */
export function LiveHudChip({ stats, accent }: LiveHudChipProps) {
  const score = useEngineScore(stats);
  const speed = useEngineSpeed(stats);
  return <HudChip score={score} multiplier={(speed / INITIAL_SPEED).toFixed(1)} accent={accent} />;
}
