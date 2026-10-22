/**
 * Title, score, personal-best badge and unlock progress shared by every game-over view.
 */
import type { ReactNode } from "react";
import { UnlockProgress } from "./UnlockProgress";
import { ScreenTitle } from "./ui/ScreenTitle";
import { badgeNeutral, badgeWarn, font, formatScore, text } from "./ui/tokens";

interface GameOverHeaderProps {
  score: number;
  bestScore: number;
  /** Best before this run, so the unlock bar can animate from it. */
  previousBest: number;
  cheatUnlocked: boolean;
  /** Extra badge shown beside the personal-best one (e.g. "You made the top 10"). */
  extraBadge?: ReactNode;
}

/**
 * @param props - The run's score, the saved best, the pre-run best and cheat state for the unlock bar, and an optional extra badge.
 * @example
 * <GameOverHeader score={420} bestScore={900} previousBest={800} cheatUnlocked={false} />
 */
export function GameOverHeader({ score, bestScore, previousBest, cheatUnlocked, extraBadge }: GameOverHeaderProps) {
  const isNewBest = score > 0 && score >= bestScore;
  return (
    <>
      <ScreenTitle>Game Over</ScreenTitle>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span style={text.label}>Score</span>
        <span style={text.numberXl}>{formatScore(score)}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
        {isNewBest ? (
          <span style={badgeWarn}>New personal best</span>
        ) : bestScore > 0 ? (
          <span style={badgeNeutral}>
            Best <span style={{ fontFamily: font.mono }}>{formatScore(bestScore)}</span>
          </span>
        ) : null}
        {extraBadge}
      </div>

      <UnlockProgress bestScore={bestScore} cheatUnlocked={cheatUnlocked} animateFrom={previousBest} />
    </>
  );
}
