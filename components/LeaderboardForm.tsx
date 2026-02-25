import { useState, useEffect, useCallback } from "react";
import { glassBtn } from "./sharedStyles";
interface LeaderboardFormProps {
  score: number;
  skinName: string;
  onSaved: () => void;
}

export default function LeaderboardForm({
  score,
  skinName,
  onSaved,
}: LeaderboardFormProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("edy-player-name");
    if (saved) setName(saved);
  }, []);

  const saveAndAdvance = useCallback(
    async (nameToSave: string) => {
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
      setSubmitting(false);
      onSaved();
    },
    [score, skinName, onSaved],
  );

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const currentName =
        name.trim() || (localStorage.getItem("edy-player-name") ?? "").trim();
      if (!currentName) {
        setError("Please enter your name to appear on the leaderboard");
        return;
      }
      setError("");
      saveAndAdvance(currentName);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [name, saveAndAdvance]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitting) {
      e.preventDefault();
      handleSaveScore();
    }
    if (e.key === " ") e.stopPropagation();
  };

  return (
    <>
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
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
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
          <div
            style={{
              background: "rgba(254,226,226,0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: "12px",
              padding: "0.3rem 0.85rem",
            }}
          >
            <p
              style={{
                color: "#dc2626",
                fontSize: "0.8rem",
                margin: 0,
                fontWeight: 600,
              }}
            >
              {error}
            </p>
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
  );
}
