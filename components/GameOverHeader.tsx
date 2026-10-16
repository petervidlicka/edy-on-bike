/**
 * Title, score, personal-best line and unlock notice shared by every game-over view.
 */

interface GameOverHeaderProps {
  score: number;
  bestScore: number;
  newlyUnlockedSkins?: string[];
}

/**
 * @param props - The run's score, the saved best, and any skins this run unlocked.
 * @example
 * <GameOverHeader score={420} bestScore={900} />
 */
export function GameOverHeader({ score, bestScore, newlyUnlockedSkins }: GameOverHeaderProps) {
  const isNewBest = score > 0 && score >= bestScore;
  return (
    <>
      <h2
        style={{
          color: "#27435E",
          fontSize: "2.5rem",
          fontFamily: "var(--font-fredoka), sans-serif",
          fontWeight: 600,
          margin: "0 0 0.5rem",
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

      {newlyUnlockedSkins && newlyUnlockedSkins.length > 0 && (
        <div style={{
          background: "rgba(234,179,8,0.15)",
          border: "1.5px solid rgba(234,179,8,0.4)",
          borderRadius: "12px",
          padding: "0.4rem 1rem",
          marginTop: "0.3rem",
          textAlign: "center",
        }}>
          <p style={{ color: "#92400e", fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>
            New bike unlocked: {newlyUnlockedSkins.join(", ")}!
          </p>
        </div>
      )}
    </>
  );
}
