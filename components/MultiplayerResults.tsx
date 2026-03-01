"use client";

import { RankingEntry } from "@/game/multiplayer/types";

interface MultiplayerResultsProps {
  rankings: RankingEntry[];
  localPlayerId: string;
  onPlayAgain: () => void;
  onLeave: () => void;
}

const glassBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.22)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  border: "1.5px solid rgba(255,255,255,0.55)",
  borderRadius: "18px",
  padding: "0.65rem 2.25rem",
  boxShadow:
    "0 2px 20px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
  color: "#1e293b",
  fontSize: "1rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textAlign: "center",
  cursor: "pointer",
  fontFamily: "var(--font-nunito), Arial, sans-serif",
};

const MEDAL_COLORS = ["#fbbf24", "#c0c0c0", "#cd7f32", "#94a3b8"];
const MEDAL_LABELS = ["\u{1F947}", "\u{1F948}", "\u{1F949}", "4th"];

export default function MultiplayerResults({
  rankings,
  localPlayerId,
  onPlayAgain,
  onLeave,
}: MultiplayerResultsProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
        padding: "1rem",
      }}
    >
      <h2
        style={{
          color: "#27435E",
          fontSize: "2.2rem",
          fontFamily: "var(--font-fredoka), sans-serif",
          fontWeight: 600,
          margin: 0,
          letterSpacing: "0.04em",
          textShadow: "0 2px 6px rgba(255,255,255,0.4)",
        }}
      >
        RACE RESULTS
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        {rankings.map((entry, idx) => {
          const isLocal = entry.playerId === localPlayerId;
          const medalColor = MEDAL_COLORS[idx] ?? "#94a3b8";
          return (
            <div
              key={entry.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 1rem",
                borderRadius: "14px",
                background: isLocal
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(255,255,255,0.22)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: isLocal
                  ? "2px solid rgba(251,191,36,0.6)"
                  : "1px solid rgba(255,255,255,0.4)",
                boxShadow: isLocal
                  ? "0 0 16px rgba(251,191,36,0.2)"
                  : "none",
              }}
            >
              {/* Rank medal */}
              <span
                style={{
                  fontSize: idx < 3 ? "1.5rem" : "1rem",
                  width: "2rem",
                  textAlign: "center",
                  color: idx >= 3 ? "#94a3b8" : undefined,
                  fontWeight: 700,
                }}
              >
                {MEDAL_LABELS[idx] ?? `${idx + 1}th`}
              </span>

              {/* Player name */}
              <span
                style={{
                  flex: 1,
                  fontSize: "1rem",
                  fontWeight: isLocal ? 700 : 600,
                  color: "#334155",
                }}
              >
                {entry.name}
              </span>

              {/* Score */}
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#27435E",
                  fontFamily: "monospace",
                }}
              >
                {entry.score}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button onClick={onPlayAgain} style={glassBtn}>
          PLAY AGAIN
        </button>
        <button onClick={onLeave} style={glassBtn}>
          LEAVE
        </button>
      </div>
    </div>
  );
}
