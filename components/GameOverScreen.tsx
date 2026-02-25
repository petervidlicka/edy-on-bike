"use client";

import { useState, useEffect, useCallback } from "react";
import LeaderboardForm from "./LeaderboardForm";
import { glassBtn } from "./sharedStyles";

interface LeaderboardEntry {
  name: string;
  score: number;
  skin?: string;
}

interface GameOverScreenProps {
  score: number;
  bestScore: number;
  skinName: string;
  newlyUnlockedSkins?: string[];
  onRestart: () => void;
}

export default function GameOverScreen({ score, bestScore, skinName, newlyUnlockedSkins, onRestart }: GameOverScreenProps) {
  const isNewBest = score > 0 && score >= bestScore;

  const [step, setStep] = useState<1 | 2>(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await fetch("/api/leaderboard").then((r) => r.json());
      setLeaderboard(data.scores ?? []);
      setTotalPlayers(data.totalPlayers ?? 0);
    } catch { }
  }, []);

  const handleSaved = useCallback(async () => {
    await fetchLeaderboard();
    setStep(2);
  }, [fetchLeaderboard]);

  // Space key: step 2 → restart
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || step !== 2) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onRestart();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [step, onRestart]);

  return (
    <div
      onClick={step === 2 ? onRestart : undefined}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: step === 2 ? "auto" : "none",
        cursor: step === 2 ? "pointer" : undefined,
        gap: "0.4rem",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
      }}
    >
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

      {/* ── Step 1: score summary + name entry ── */}
      {step === 1 && (
        <>
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

          <LeaderboardForm score={score} skinName={skinName} onSaved={handleSaved} />
        </>
      )}

      {/* ── Step 2: global leaderboard + restart ── */}
      {step === 2 && (
        <>
          {leaderboard.length > 0 ? (
            <div
              style={{
                background: "rgba(255,255,255,0.72)",
                borderRadius: "10px",
                padding: "0.65rem 1.1rem",
                minWidth: "260px",
                maxWidth: "360px",
                marginTop: "0.25rem",
                pointerEvents: "auto",
              }}
            >
              <h3
                style={{
                  margin: "0 0 0.4rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#1e293b",
                  textAlign: "center",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Top Scores
              </h3>
              <ol
                style={{
                  margin: 0,
                  padding: "0 0 0 1.3rem",
                  fontSize: "0.8rem",
                  color: "#334155",
                  lineHeight: 1.65,
                  fontFamily: "var(--font-space-mono), monospace",
                }}
              >
                {leaderboard.slice(0, 7).map((entry, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <span style={{ fontWeight: 600, flex: "1 1 auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</span>
                    {entry.skin && (
                      <span style={{ fontSize: "0.65rem", color: "#64748b", whiteSpace: "nowrap" }}>{entry.skin}</span>
                    )}
                    <span style={{ fontWeight: 400, whiteSpace: "nowrap" }}>
                      {String(entry.score).padStart(5, "0")}
                    </span>
                  </li>
                ))}
              </ol>
              {totalPlayers > 0 && (
                <p style={{
                  margin: "0.45rem 0 0",
                  fontSize: "0.72rem",
                  color: "#64748b",
                  textAlign: "center",
                  fontWeight: 600,
                  fontFamily: "var(--font-nunito), Arial, sans-serif",
                }}>
                  {totalPlayers} total player{totalPlayers !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: "#475569", fontSize: "0.85rem", margin: "0.5rem 0" }}>
              No scores yet — be the first!
            </p>
          )}

          <p style={{
            marginTop: "1rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#64748b",
            letterSpacing: "0.04em",
          }}>
            click or press Space to continue
          </p>
        </>
      )}
    </div>
  );
}
