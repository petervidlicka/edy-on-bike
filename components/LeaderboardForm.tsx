/**
 * Layout B of the game-over screen: name entry for a run that made the board.
 * With a remembered name the primary action saves and restarts in one press;
 * otherwise the player types a name and lands on the leaderboard after saving.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { GameOverPrimaryButton } from "./GameOverPrimaryButton";
import { GameOverLinkButton } from "./GameOverLinkButton";
import { loadPlayerName, savePlayerName } from "@/game/storage";
import { LeaderboardError, submitScore } from "@/lib/leaderboardClient";
import { useGamepadPress } from "@/hooks/useGamepad";
import { color, input, text } from "./ui/tokens";

interface LeaderboardFormProps {
  /** The run's leaderboard ticket; null once resolved means the run was never registered. */
  runTicket: Promise<string | null>;
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
 * <LeaderboardForm runTicket={ticket} score={900} skinName="Racer" locked={false} onSaved={showBoard} onSavedAndRestart={restart} onSkip={restart} />
 */
export default function LeaderboardForm({
  runTicket,
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
        const runId = await runTicket;
        if (!runId) {
          throw new LeaderboardError("This run wasn't registered with the leaderboard (offline when it started?), so it can't be saved.");
        }
        await submitScore({ name: nameToSave, score, skin: skinName, runId });
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
    [runTicket, score, skinName, onSaved, onSavedAndRestart],
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="leaderboard-name" style={text.label}>
            Name for the leaderboard
          </label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              id="leaderboard-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Your name"
              maxLength={20}
              aria-invalid={error ? true : undefined}
              style={{
                ...input,
                width: "min(200px, 40vw)",
                border: error ? `2px solid ${color.danger}` : input.border,
              }}
            />
            <GameOverPrimaryButton onClick={submit} disabled={submitting || locked}>
              {submitting ? "Saving…" : "Save"}
            </GameOverPrimaryButton>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" style={{ ...text.body, color: color.danger, fontSize: "0.8rem", fontWeight: 700 }}>
          {error}
        </p>
      )}

      <GameOverLinkButton onClick={handleSkip} disabled={submitting}>
        Skip &amp; play again
      </GameOverLinkButton>
    </div>
  );
}
