"use client";

/**
 * Game-over overlay. Aims for one press from crash to next run: the leaderboard is
 * fetched immediately, and only a run that would make the board is asked for a name.
 * Views: summary (default) · form (qualifying / manual save) · leaderboard (on request).
 */
import { useState, useCallback } from "react";
import LeaderboardForm from "./LeaderboardForm";
import { GameOverHeader } from "./GameOverHeader";
import { GameOverSummary } from "./GameOverSummary";
import { GameOverLeaderboard } from "./GameOverLeaderboard";
import { GameOverLinkButton } from "./GameOverLinkButton";
import { LEADERBOARD_SIZE, scoreQualifies } from "@/lib/leaderboardConfig";
import { useGameOverLeaderboard } from "@/hooks/useGameOverLeaderboard";
import { useInputLockout, GAME_OVER_LOCKOUT_MS } from "@/hooks/useInputLockout";

interface GameOverScreenProps {
  score: number;
  bestScore: number;
  skinName: string;
  /** Saved best before this run (for the unlock progress animation). */
  previousBest: number;
  cheatUnlocked: boolean;
  /** Starts a new run immediately. */
  onRestart: () => void;
  /** Returns to the start screen (bike picker, multiplayer link). */
  onHome: () => void;
}

type View = "summary" | "form" | "leaderboard";

/** Longest the screen waits for the leaderboard before settling on the one-tap replay layout. */
const LEADERBOARD_FETCH_GRACE_MS = 1500;

/**
 * @param props - Run result, saved best, skin info and the restart / home actions.
 * @example
 * <GameOverScreen score={420} bestScore={900} skinName="Racer" onRestart={restart} onHome={home} />
 */
export default function GameOverScreen({ score, bestScore, skinName, previousBest, cheatUnlocked, onRestart, onHome }: GameOverScreenProps) {
  const board = useGameOverLeaderboard();
  const lockoutActive = useInputLockout(GAME_OVER_LOCKOUT_MS);
  // Give a slow leaderboard fetch a little longer, so the layout doesn't flip under the player's finger
  const fetchGraceActive = useInputLockout(LEADERBOARD_FETCH_GRACE_MS);
  const locked = lockoutActive || (board.status === "loading" && fetchGraceActive);
  /** An explicit choice by the player; until then the view follows whether the score qualifies. */
  const [chosenView, setChosenView] = useState<View | null>(null);
  const [saved, setSaved] = useState<{ name: string; score: number } | null>(null);

  const qualifies = board.status === "ready" && scoreQualifies(score, board.entries);
  const view: View = chosenView ?? (qualifies ? "form" : "summary");

  // Freeze the layout once input unlocks; a fetch landing later must not swap the screen
  // (adjusting state during render, React's pattern for state derived from a transition)
  if (!locked && chosenView === null) setChosenView(qualifies ? "form" : "summary");

  const handleSaved = useCallback(
    async (name: string) => {
      setSaved({ name, score });
      await board.reload();
      setChosenView("leaderboard");
    },
    [board, score],
  );

  return (
    <div
      onClick={view === "summary" || view === "leaderboard" ? () => !locked && onRestart() : undefined}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: view === "form" ? "none" : "auto",
        cursor: view === "form" || locked ? undefined : "pointer",
        gap: "clamp(0.2rem, 1vh, 0.4rem)",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
      }}
    >
      {view !== "leaderboard" && (
        <GameOverHeader score={score} bestScore={bestScore} previousBest={previousBest} cheatUnlocked={cheatUnlocked} />
      )}

      {view === "summary" && (
        <GameOverSummary
          locked={locked}
          leaderboardFailed={board.status === "error"}
          onRestart={onRestart}
          onShowLeaderboard={() => setChosenView("leaderboard")}
          onSaveScore={() => setChosenView("form")}
        />
      )}

      {view === "form" && (
        <>
          {qualifies && (
            <p style={{ color: "#92400e", margin: "0.3rem 0 0", fontSize: "1rem", fontWeight: 800 }}>
              🏆 You made the top {LEADERBOARD_SIZE}!
            </p>
          )}
          <LeaderboardForm
            score={score}
            skinName={skinName}
            locked={locked}
            onSaved={handleSaved}
            onSavedAndRestart={onRestart}
            onSkip={onRestart}
          />
        </>
      )}

      {view === "leaderboard" && (
        <GameOverLeaderboard board={board} saved={saved} locked={locked} onRestart={onRestart} />
      )}

      <GameOverLinkButton onClick={onHome}>Home / change bike</GameOverLinkButton>
    </div>
  );
}
