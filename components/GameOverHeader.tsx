/**
 * Title, score, personal-best line and unlock progress shared by every game-over view.
 */
import { UnlockProgress } from "./UnlockProgress";

interface GameOverHeaderProps {
  score: number;
  bestScore: number;
  /** Best before this run, so the unlock bar can animate from it. */
  previousBest: number;
  cheatUnlocked: boolean;
}

/**
 * @param props - The run's score, the saved best, and the pre-run best and cheat state for the unlock bar.
 * @example
 * <GameOverHeader score={420} bestScore={900} previousBest={800} cheatUnlocked={false} />
 */
export function GameOverHeader({ score, bestScore, previousBest, cheatUnlocked }: GameOverHeaderProps) {
  const isNewBest = score > 0 && score >= bestScore;
  return (
    <>
      <h2
        style={{
          color: "#27435E",
          fontSize: "clamp(1.8rem, 9vh, 2.5rem)",
          lineHeight: 1.1,
          fontFamily: "var(--font-fredoka), sans-serif",
          fontWeight: 600,
          margin: "0 0 clamp(0rem, 1vh, 0.5rem)",
          letterSpacing: "0.08em",
          textShadow: "0 2px 6px rgba(255,255,255,0.3)",
        }}
      >
        GAME OVER
      </h2>

      <p style={{ color: "#1e293b", margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
        Score: <strong>{score}</strong>
      </p>

      {isNewBest ? (
        <p style={{ color: "#92400e", margin: 0, fontSize: "0.9rem", fontWeight: 700 }}>
          🎉 New personal best!
        </p>
      ) : bestScore > 0 ? (
        <p style={{ color: "#475569", margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>
          Your best: {bestScore}
        </p>
      ) : null}

      <div style={{ marginTop: "0.3rem" }}>
        <UnlockProgress bestScore={bestScore} cheatUnlocked={cheatUnlocked} animateFrom={previousBest} />
      </div>
    </>
  );
}
