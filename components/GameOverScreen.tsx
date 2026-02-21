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
      }}
    >
      <h2
        style={{
          color: "#c4785a",
          fontSize: "2.5rem",
          fontWeight: "bold",
          margin: 0,
          letterSpacing: "0.08em",
          textShadow: "0 2px 10px rgba(0,0,0,0.35)",
        }}
      >
        GAME OVER
      </h2>

      <p
        style={{
          color: "#d4dce4",
          margin: "0.75rem 0 0",
          fontSize: "1.1rem",
        }}
      >
        Score: <strong>{score}</strong>
      </p>

      {isNewBest ? (
        <p style={{ color: "#c4a860", margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>
          New best!
        </p>
      ) : bestScore > 0 ? (
        <p style={{ color: "#a0aab4", margin: 0, fontSize: "0.9rem" }}>
          Best: {bestScore}
        </p>
      ) : null}

      <div
        style={{
          marginTop: "1.5rem",
          color: "#d4dce4",
          fontSize: "1rem",
          fontWeight: 600,
          border: "2px solid rgba(212,220,228,0.3)",
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
