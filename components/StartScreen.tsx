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
        fontFamily: "var(--font-nunito), Arial, sans-serif",
      }}
    >
      <h1
        style={{
          color: "#1e293b",
          fontSize: "3rem",
          fontWeight: 800,
          margin: 0,
          letterSpacing: "0.04em",
          textShadow: "0 2px 6px rgba(255,255,255,0.4)",
        }}
      >
        Edy on Bike
      </h1>
      <p
        style={{
          color: "#334155",
          fontSize: "1rem",
          margin: 0,
          fontWeight: 600,
        }}
      >
        Jump and double-jump to avoid obstacles
      </p>
      <div
        style={{
          marginTop: "1.5rem",
          color: "#1e293b",
          fontSize: "1rem",
          fontWeight: 700,
          border: "2px solid rgba(30,41,59,0.45)",
          borderRadius: "8px",
          padding: "0.5rem 1.75rem",
          letterSpacing: "0.06em",
          textAlign: "center",
        }}
      >
        PRESS SPACE TO START
        <span
          style={{
            display: "block",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#64748b",
            letterSpacing: "0.04em",
            marginTop: "0.2rem",
          }}
        >
          or tap on mobile
        </span>
      </div>
    </div>
  );
}
