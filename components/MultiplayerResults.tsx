"use client";

/** End-of-race rankings, with Play Again (same room) and Leave. */
import type { RankingEntry, MAX_PLAYERS } from "@/game/multiplayer/protocol";
import { GlassPanel } from "./ui/GlassPanel";
import { ScreenTitle } from "./ui/ScreenTitle";
import { GlassButton } from "./ui/GlassButton";
import { color, font, formatScore } from "./ui/tokens";

interface MultiplayerResultsProps {
  rankings: RankingEntry[];
  localPlayerId: string;
  onPlayAgain: () => void;
  onLeave: () => void;
}

/** Medal colour per finishing place (null = no medal); sized to the room limit so a bigger room fails to compile until it's extended. */
const MEDAL_COLORS = [color.gold, "#cbd5e1", "#d6a26a", null] as const satisfies { length: typeof MAX_PLAYERS };

/** Rankings come from the server, so every player sees the same order and scores. */
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
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.ui,
        padding: "8px",
      }}
    >
      <GlassPanel>
        <ScreenTitle>Race Results</ScreenTitle>

        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            width: "min(360px, 80vw)",
          }}
        >
          {rankings.map((entry, idx) => {
            const isLocal = entry.playerId === localPlayerId;
            const medal = MEDAL_COLORS[idx] ?? null;
            return (
              <li
                key={entry.playerId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "6px 12px",
                  borderRadius: "12px",
                  color: isLocal ? color.white : color.ink,
                  background: isLocal ? color.navy : "rgba(255,255,255,0.7)",
                }}
              >
                <span
                  aria-label={`Place ${idx + 1}`}
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: font.mono,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    // Medal discs always carry ink text; unmedalled places just show the number
                    color: medal ? color.ink : "inherit",
                    background: medal ?? "transparent",
                    boxShadow: medal ? "inset 0 -2px 0 rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: "1rem", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.name}
                  {isLocal && <span style={{ fontWeight: 600, opacity: 0.85 }}> (you)</span>}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: "1rem", fontWeight: 700 }}>{formatScore(entry.score)}</span>
              </li>
            );
          })}
        </ol>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <GlassButton variant="quiet" onClick={onLeave}>
            Leave
          </GlassButton>
          <GlassButton variant="primary" onClick={onPlayAgain}>
            Play again
          </GlassButton>
        </div>
      </GlassPanel>
    </div>
  );
}
