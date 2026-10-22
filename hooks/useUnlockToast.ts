/**
 * In-run "bike unlocked" toast. The target tier is fixed at run start from the saved
 * best; nothing is persisted mid-run (`recordBestScore` at game over stays the source of truth).
 * Watches the score through the engine stats store rather than React state, so the
 * screen that hosts it doesn't re-render per score tick: only the toast text is state.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Engine } from "@/game/Engine";
import { GameState } from "@/game/types";
import { getNextUnlock } from "@/game/skins";
import { haptic } from "@/lib/haptics";
import type { EngineStats } from "./engineStats";

/** How long the toast stays on screen. */
const TOAST_MS = 2500;

/**
 * Watches the live score and announces bikes it passes the unlock threshold of,
 * with a chime and Edy's voice line. One run can cross several tiers; they are announced together.
 * @param engineRef - Engine used to play the chime.
 * @param gameState - Current engine state; the target is computed when a run starts.
 * @param stats - The engine's live stats store (score).
 * @param bestScore - Saved best score (the run-start best).
 * @param cheatUnlocked - Skip entirely when everything is already unlocked.
 * @returns The toast text, or null when nothing is showing.
 * @example
 * const toast = useUnlockToast(engineRef, gameState, stats, bestScore, cheatUnlocked);
 */
export function useUnlockToast(
  engineRef: React.RefObject<Engine | null>,
  gameState: GameState,
  stats: EngineStats,
  bestScore: number,
  cheatUnlocked: boolean,
): string | null {
  const [message, setMessage] = useState<string | null>(null);
  const targetScoreRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Score ticks arrive outside React's render cycle, so they read the run state from a ref
  const runningRef = useRef(gameState === GameState.RUNNING);
  // Latest saved values, read only when a run starts (bestScore changes at game over, not mid-run)
  const savedRef = useRef({ bestScore, cheatUnlocked });
  useEffect(() => {
    savedRef.current = { bestScore, cheatUnlocked };
  });

  const resetTarget = useCallback(() => {
    const next = getNextUnlock(savedRef.current.bestScore, savedRef.current.cheatUnlocked);
    targetScoreRef.current = next ? next.skin.unlockScore : null;
  }, []);

  const clearToast = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setMessage(null);
  }, []);

  /** Announces every tier `score` has passed since the last check (none if the run isn't on). */
  const checkScore = useCallback(
    (score: number) => {
      if (!runningRef.current) return;
      const names: string[] = [];
      while (targetScoreRef.current !== null && score >= targetScoreRef.current) {
        const crossed = targetScoreRef.current;
        const next = getNextUnlock(crossed, false);
        // The skin unlocked at `crossed` is the one getNextUnlock(crossed - 1) pointed at
        const unlocked = getNextUnlock(crossed - 1, false);
        if (unlocked) names.push(unlocked.skin.name);
        targetScoreRef.current = next ? next.skin.unlockScore : null;
      }
      if (names.length === 0) return;
      engineRef.current?.playUnlockChime();
      engineRef.current?.announce("skinUnlocked");
      haptic("success");
      setMessage(`🔓 ${names.join(" & ")} unlocked!`);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setMessage(null), TOAST_MS);
    },
    [engineRef],
  );

  // Compute the first target once per run start. RUNNING is also re-entered after an
  // ambulance revive; recomputing there would re-announce bikes already passed this run.
  // Leaving the run drops any toast (and its timer).
  const prevStateRef = useRef(gameState);
  useEffect(() => {
    runningRef.current = gameState === GameState.RUNNING;
    const prev = prevStateRef.current;
    prevStateRef.current = gameState;
    if (gameState !== GameState.RUNNING) {
      // Hiding the toast when the run ends is the point of this effect
      // eslint-disable-next-line react-hooks/set-state-in-effect
      clearToast();
      return;
    }
    if (prev === GameState.AMBULANCE) return;
    resetTarget();
    // Ticks that arrived before React committed the RUNNING state were skipped above
    checkScore(stats.getScore());
  }, [gameState, stats, resetTarget, checkScore, clearToast]);

  // A restart from the pause menu goes RUNNING -> IDLE -> RUNNING in one batch, so the state
  // effect above never sees it; the score dropping back is what marks the new run there.
  useEffect(() => {
    let lastScore = stats.getScore();
    return stats.subscribe(() => {
      const score = stats.getScore();
      const dropped = score < lastScore;
      lastScore = score;
      if (dropped) {
        resetTarget();
        clearToast();
        return;
      }
      checkScore(score);
    });
  }, [stats, resetTarget, clearToast, checkScore]);

  useEffect(() => () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  return message;
}
