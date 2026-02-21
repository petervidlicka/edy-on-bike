"use client";

import { useState, useEffect, useRef } from "react";

interface LeaderboardEntry {
  name: string;
  score: number;
}

interface GameOverScreenProps {
  score: number;
  bestScore: number;
}

export default function GameOverScreen({ score, bestScore }: GameOverScreenProps) {
  const isNewBest = score > 0 && score >= bestScore;

  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved name from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("edy-player-name");
    if (saved) setName(saved);
  }, []);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => setLeaderboard(data))
      .catch(() => {});
  }, []);

  // Focus input on mount
  useEffect(() => {
    // Small delay so the space key from dying doesn't type into input
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter your name.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, score }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit.");
        setSubmitting(false);
        return;
      }
      localStorage.setItem("edy-player-name", trimmed);
      setSubmitted(true);
      // Refresh leaderboard
      const updated = await fetch("/api/leaderboard").then((r) => r.json());
      setLeaderboard(updated);
    } catch {
      setError("Network error.");
    }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitted && !submitting) {
      e.preventDefault();
      handleSubmit();
    }
    // Stop space from propagating to the game restart handler
    if (e.key === " ") {
      e.stopPropagation();
    }
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

      {/* Score submission */}
      <div
        style={{
          marginTop: "0.75rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          pointerEvents: "auto",
        }}
      >
        {!submitted ? (
          <>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Your name"
                maxLength={20}
                style={{
                  padding: "0.35rem 0.6rem",
                  borderRadius: "6px",
                  border: "2px solid rgba(30,41,59,0.3)",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-nunito), Arial, sans-serif",
                  outline: "none",
                  width: "140px",
                  background: "rgba(255,255,255,0.85)",
                  color: "#1e293b",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: "0.35rem 0.8rem",
                  borderRadius: "6px",
                  border: "2px solid rgba(30,41,59,0.3)",
                  background: submitting ? "#cbd5e1" : "#6a8a9a",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-nunito), Arial, sans-serif",
                  cursor: submitting ? "default" : "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                {submitting ? "..." : "Submit"}
              </button>
            </div>
            {error && (
              <p style={{ color: "#9a3412", fontSize: "0.8rem", margin: 0 }}>{error}</p>
            )}
          </>
        ) : (
          <p style={{ color: "#475569", fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>
            Score submitted!
          </p>
        )}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div
          style={{
            marginTop: "0.75rem",
            background: "rgba(255,255,255,0.7)",
            borderRadius: "8px",
            padding: "0.6rem 1rem",
            minWidth: "220px",
            maxWidth: "280px",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.4rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#1e293b",
              textAlign: "center",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Top Scores
          </h3>
          <ol
            style={{
              margin: 0,
              padding: "0 0 0 1.4rem",
              fontSize: "0.8rem",
              color: "#334155",
              lineHeight: 1.6,
              fontFamily: "var(--font-space-mono), monospace",
            }}
          >
            {leaderboard.slice(0, 10).map((entry, i) => (
              <li key={i}>
                <span style={{ fontWeight: 600 }}>{entry.name}</span>
                <span style={{ float: "right", fontWeight: 400 }}>
                  {String(entry.score).padStart(5, "0")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div
        style={{
          marginTop: "1rem",
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
