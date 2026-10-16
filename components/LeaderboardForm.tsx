import { useState, useEffect, useCallback, useRef } from "react";
import { glassBtn } from "./sharedStyles";
import { loadPlayerName, savePlayerName } from "@/game/storage";
import { LeaderboardError, submitScore } from "@/lib/leaderboardClient";

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
  /** A submit reached the API and failed — offer a way past the form so an outage can't trap the player. */
  const [submitFailed, setSubmitFailed] = useState(false);
  // Refs, not state: rapid Space presses arrive before a re-render, so the guards must be synchronous
  /** A submit is on the wire — further saves and skips wait for it. */
  const inFlightRef = useRef(false);
  /** onSaved has fired; the form is on its way out and must not advance again. */
  const advancedRef = useRef(false);

  const advance = useCallback(() => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    onSaved();
  }, [onSaved]);

  useEffect(() => {
    const saved = loadPlayerName();
    if (saved) {
      setTimeout(() => setName(saved), 0);
    }
  }, []);

  const saveAndAdvance = useCallback(
    async (nameToSave: string) => {
      if (inFlightRef.current || advancedRef.current) return;
      const trimmed = nameToSave.trim();
      inFlightRef.current = true;
      setSubmitting(true);
      if (trimmed) {
        try {
          await submitScore({ name: trimmed, score, skin: skinName });
          savePlayerName(trimmed);
        } catch (err) {
          // Stay on the form so the player can retry, or skip via the button below
          console.error("[leaderboard] Saving score failed", err);
          setError(
            err instanceof LeaderboardError
              ? err.message
              : "Couldn't save your score. Please try again.",
          );
          setSubmitFailed(true);
          inFlightRef.current = false;
          setSubmitting(false);
          return;
        }
      }
      inFlightRef.current = false;
      setSubmitting(false);
      advance();
    },
    [score, skinName, advance],
  );

  /** Skips saving after a failure; ignored while a retry is still on the wire so it can't double-advance. */
  const handleSkip = () => {
    if (inFlightRef.current) return;
    advance();
  };

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
      e.stopImmediatePropagation();
      // A focused button handles Space natively, so "Continue without saving" stays reachable by keyboard
      if (tag === "BUTTON") return;
      e.preventDefault();
      if (e.repeat) return; // holding Space must not resubmit
      const currentName =
        name.trim() || loadPlayerName().trim();
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

      {submitFailed && (
        <button
          onClick={handleSkip}
          disabled={submitting}
          style={{
            ...glassBtn,
            fontSize: "0.78rem",
            padding: "0.4rem 1.25rem",
            letterSpacing: "0.03em",
            color: "#334155",
          }}
        >
          Continue without saving
        </button>
      )}
    </>
  );
}
