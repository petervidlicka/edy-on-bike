/**
 * Layout B of the game-over screen: name entry for a run that made the board.
 * With a remembered name the primary action saves and restarts in one press;
 * otherwise the player types a name and lands on the leaderboard after saving.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { glassBtn } from "./sharedStyles";
import { GameOverPrimaryButton } from "./GameOverPrimaryButton";
import { GameOverLinkButton } from "./GameOverLinkButton";
import { loadPlayerName, savePlayerName } from "@/game/storage";
import { LeaderboardError, submitScore } from "@/lib/leaderboardClient";
import { useGamepadPress } from "@/hooks/useGamepad";

interface LeaderboardFormProps {
  score: number;
  skinName: string;
  /** Input lockout: the primary action and Space/Enter are ignored while true. */
  locked: boolean;
  /** A freshly typed name was saved — the screen shows the board with that row highlighted. */
  onSaved: (name: string) => void;
  /** The remembered name was saved — go straight to the next run. */
  onSavedAndRestart: () => void;
  /** Restart without saving. */
  onSkip: () => void;
}

/**
 * Owns the Space/Enter keys and gamepad A (save) / B (skip) while mounted (the summary and board views are not mounted then).
 * @param props - Run details, lockout flag and the three ways out of the form.
 * @example
 * <LeaderboardForm score={900} skinName="Racer" locked={false} onSaved={showBoard} onSavedAndRestart={restart} onSkip={restart} />
 */
export default function LeaderboardForm({
  score,
  skinName,
  locked,
  onSaved,
  onSavedAndRestart,
  onSkip,
}: LeaderboardFormProps) {
  // Client-only mount (game over is never prerendered), so reading storage in the initializer is safe
  const [savedName] = useState(() => loadPlayerName().trim());
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Refs, not state: rapid key presses arrive before a re-render, so the guards must be synchronous
  /** A submit is on the wire — further saves and skips wait for it. */
  const inFlightRef = useRef(false);
  /** The form has handed off (saved or skipped) and must not act again. */
  const doneRef = useRef(false);

  const oneTap = savedName !== "" && !editing;

  const save = useCallback(
    async (nameToSave: string, thenRestart: boolean) => {
      if (inFlightRef.current || doneRef.current) return;
      inFlightRef.current = true;
      setSubmitting(true);
      setError("");
      try {
        await submitScore({ name: nameToSave, score, skin: skinName });
        savePlayerName(nameToSave);
      } catch (err) {
        // Stay on the form so the player can retry, or hit Skip
        console.error("[leaderboard] Saving score failed", err);
        setError(err instanceof LeaderboardError ? err.message : "Couldn't save your score. Please try again.");
        inFlightRef.current = false;
        setSubmitting(false);
        return;
      }
      doneRef.current = true;
      if (thenRestart) onSavedAndRestart();
      else onSaved(nameToSave);
    },
    [score, skinName, onSaved, onSavedAndRestart],
  );

  /** Saves whatever the current mode calls for; the shared path for button, Enter and Space. */
  const submit = useCallback(() => {
    if (locked) return;
    if (oneTap) {
      void save(savedName, true);
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to appear on the leaderboard");
      return;
    }
    void save(trimmed, false);
  }, [locked, oneTap, savedName, name, save]);

  const handleSkip = () => {
    if (inFlightRef.current || doneRef.current) return;
    doneRef.current = true;
    onSkip();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.stopImmediatePropagation();
      // A focused button handles the key natively, so Skip / change name stay reachable by keyboard
      if (tag === "BUTTON") return;
      e.preventDefault();
      if (e.repeat) return; // holding the key must not resubmit
      submit();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [submit]);

  // A acts like Enter, even while the name field is focused; B is "continue without saving"
  useGamepadPress(
    (e) => {
      const { button } = e.detail;
      if (button !== "A" && button !== "B" && button !== "Start") return;
      e.stopImmediatePropagation();
      if (button === "B") {
        if (!locked) handleSkip();
      } else if (!submitting) {
        submit();
      }
    },
    { capture: true },
  );

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitting) {
      e.preventDefault();
      submit();
    }
    if (e.key === " ") e.stopPropagation();
  };

  return (
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
      {oneTap ? (
        <>
          <GameOverPrimaryButton onClick={submit} disabled={locked || submitting}>
            {submitting ? "Saving…" : `Save as ${savedName} & play`}
          </GameOverPrimaryButton>
          <GameOverLinkButton onClick={() => setEditing(true)} disabled={submitting}>
            Use a different name
          </GameOverLinkButton>
        </>
      ) : (
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
            onClick={submit}
            disabled={submitting || locked}
            style={{
              ...glassBtn,
              background: submitting ? "rgba(200,210,220,0.35)" : "rgba(106,138,154,0.38)",
              color: submitting ? "#94a3b8" : "#fff",
              cursor: submitting || locked ? "default" : "pointer",
              opacity: locked ? 0.45 : 1,
              transition: "opacity 0.5s ease",
              border: "1.5px solid rgba(255,255,255,0.45)",
              textShadow: submitting ? "none" : "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            {submitting ? "Saving…" : "Save score"}
          </button>
        </div>
      )}

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
          <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      <GameOverLinkButton onClick={handleSkip} disabled={submitting}>
        Skip &amp; play again
      </GameOverLinkButton>
    </div>
  );
}
