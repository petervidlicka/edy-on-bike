"use client";

import { useState, useEffect, useCallback } from "react";

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
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Pre-fill name from localStorage — no auto-focus so Space works freely
  useEffect(() => {
    const saved = localStorage.getItem("edy-player-name");
    if (saved) setName(saved);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await fetch("/api/leaderboard").then((r) => r.json());
      setLeaderboard(data);
    } catch {}
  }, []);

  // Save score then show leaderboard (step 2)
  const saveAndAdvance = useCallback(async (nameToSave: string) => {
    const trimmed = nameToSave.trim();
    setSubmitting(true);
    if (trimmed) {
      try {
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed, score, skin: skinName }),
        });
        localStorage.setItem("edy-player-name", trimmed);
      } catch {}
    }
    await fetchLeaderboard();
    setSubmitting(false);
    setStep(2);
  }, [score, skinName, fetchLeaderboard]);

  // Handle Save Score button — validates name first
  const handleSaveScore = async () => {
    if (submitting) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to appear on the leaderboard");
      return;
    }
    setError("");
    await saveAndAdvance(trimmed);
  };

  // Space key: step 1 → save with current name and advance; step 2 → restart
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      e.stopImmediatePropagation(); // prevent GameCanvas from also handling Space
      if (step === 1) {
        const currentName = name.trim() || (localStorage.getItem("edy-player-name") ?? "").trim();
        if (!currentName) {
          setError("Please enter your name to appear on the leaderboard");
          return;
        }
        setError("");
        saveAndAdvance(currentName);
      } else {
        onRestart();
      }
    };
    // Capture phase so this fires before GameCanvas's bubbling listener
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [step, name, saveAndAdvance, onRestart]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitting) {
      e.preventDefault();
      handleSaveScore();
    }
    // Don't let Space bubble out of the input
    if (e.key === " ") e.stopPropagation();
  };

  const glassBtn: React.CSSProperties = {
    padding: "0.55rem 1.5rem",
    borderRadius: "20px",
    border: "1.5px solid rgba(255,255,255,0.55)",
    fontSize: "0.9rem",
    fontWeight: 700,
    fontFamily: "var(--font-nunito), Arial, sans-serif",
    letterSpacing: "0.04em",
    cursor: "pointer",
    pointerEvents: "auto",
    background: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(24px) saturate(200%)",
    WebkitBackdropFilter: "blur(24px) saturate(200%)",
    color: "#1e293b",
    boxShadow: "0 2px 16px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
  };

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
        gap: "0.4rem",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
      }}
    >
      <h2
        style={{
          color: "#9a3412",
          fontSize: "2.5rem",
          fontWeight: 800,
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

          <div
            style={{
              marginTop: "0.6rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.4rem",
              pointerEvents: "auto",
            }}
          >
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
                onKeyDown={handleInputKeyDown}
                placeholder="Your name"
                maxLength={20}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "6px",
                  border: "2px solid rgba(30,41,59,0.3)",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-nunito), Arial, sans-serif",
                  outline: "none",
                  width: "145px",
                  background: "rgba(255,255,255,0.88)",
                  color: "#1e293b",
                }}
              />
              <button
                onClick={handleSaveScore}
                disabled={submitting}
                style={{
                  ...glassBtn,
                  background: submitting
                    ? "rgba(200,210,220,0.35)"
                    : "rgba(106,138,154,0.38)",
                  color: submitting ? "#94a3b8" : "#fff",
                  cursor: submitting ? "default" : "pointer",
                  border: "1.5px solid rgba(255,255,255,0.45)",
                  textShadow: submitting ? "none" : "0 1px 2px rgba(0,0,0,0.15)",
                }}
              >
                {submitting ? "Saving…" : "Save score"}
              </button>
            </div>
            {error && (
              <div style={{
                background: "rgba(254,226,226,0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(220,38,38,0.25)",
                borderRadius: "12px",
                padding: "0.3rem 0.85rem",
              }}>
                <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: 0, fontWeight: 600 }}>{error}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSaveScore}
            style={{
              ...glassBtn,
              fontSize: "0.78rem",
              padding: "0.4rem 1.25rem",
              marginTop: "0.1rem",
              letterSpacing: "0.03em",
              color: "#334155",
            }}
          >
            or press Space to save &amp; continue
          </button>
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
                {leaderboard.slice(0, 10).map((entry, i) => (
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
            </div>
          ) : (
            <p style={{ color: "#475569", fontSize: "0.85rem", margin: "0.5rem 0" }}>
              No scores yet — be the first!
            </p>
          )}

          <button
            onClick={onRestart}
            style={{
              ...glassBtn,
              marginTop: "0.75rem",
              fontSize: "1rem",
              padding: "0.6rem 2rem",
              letterSpacing: "0.06em",
            }}
          >
            PLAY AGAIN
            <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#64748b", letterSpacing: "0.04em", marginTop: "0.15rem" }}>
              or press Space
            </span>
          </button>
        </>
      )}
    </div>
  );
}
