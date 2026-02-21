interface GameOverScreenProps {
  score: number;
  bestScore: number;
}

export default function GameOverScreen({ score, bestScore }: GameOverScreenProps) {
  const isNewBest = score > 0 && score >= bestScore;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        gap: "0.5rem",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
      }}
    >
      <h2
        style={{
          color: "#9a3412",
          fontSize: "2.5rem",
          fontWeight: 800,
          margin: 0,
          letterSpacing: "0.08em",
          textShadow: "0 2px 6px rgba(255,255,255,0.3)",
        }}
      >
        GAME OVER
      </h2>

      <p
        style={{
          color: "#1e293b",
          margin: "0.75rem 0 0",
          fontSize: "1.1rem",
          fontWeight: 600,
        }}
      >
        Score: <strong>{score}</strong>
      </p>

      {isNewBest ? (
        <p style={{ color: "#92400e", margin: 0, fontSize: "0.9rem", fontWeight: 700 }}>
          New best!
        </p>
      ) : bestScore > 0 ? (
        <p style={{ color: "#475569", margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>
          Best: {bestScore}
        </p>
      ) : null}

      <div
        style={{
          marginTop: "1.5rem",
          color: "#1e293b",
          fontSize: "1rem",
          fontWeight: 700,
          border: "2px solid rgba(30,41,59,0.4)",
          borderRadius: "8px",
          padding: "0.5rem 1.75rem",
          letterSpacing: "0.06em",
        }}
      >
        PRESS SPACE TO PLAY AGAIN
      </div>
    </div>
  );
}
