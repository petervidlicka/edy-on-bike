export default function StartScreen() {
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
        gap: "0.75rem",
      }}
    >
      <h1
        style={{
          color: "#d4dce4",
          fontSize: "3rem",
          fontWeight: "bold",
          margin: 0,
          letterSpacing: "0.04em",
          textShadow: "0 2px 10px rgba(0,0,0,0.35)",
        }}
      >
        Edy on Bike
      </h1>
      <p
        style={{
          color: "#a0aab4",
          fontSize: "1rem",
          margin: 0,
        }}
      >
        Jump and double-jump to avoid obstacles
      </p>
      <div
        style={{
          marginTop: "1.5rem",
          color: "#d4dce4",
          fontSize: "1rem",
          fontWeight: 600,
          border: "2px solid rgba(212,220,228,0.35)",
          borderRadius: "8px",
          padding: "0.5rem 1.75rem",
          letterSpacing: "0.06em",
        }}
      >
        PRESS SPACE TO START
      </div>
    </div>
  );
}
