/**
 * In-run "bike unlocked" toast. The target tier is fixed at run start from the saved
 * best; nothing is persisted mid-run (`recordBestScore` at game over stays the source of truth).
 */
import { useEffect, useRef, useState } from "react";
import type { Engine } from "@/game/Engine";
import { GameState } from "@/game/types";
import { getNextUnlock } from "@/game/skins";

/** How long the toast stays on screen. */
const TOAST_MS = 2500;

/**
 * Watches the live score and announces bikes it passes the unlock threshold of,
 * with a chime. One run can cross several tiers; they are announced together.
 * @param engineRef - Engine used to play the chime.
 * @param gameState - Current engine state; the target is computed when a run starts.
 * @param score - Live score.
 * @param bestScore - Saved best score (the run-start best).
 * @param cheatUnlocked - Skip entirely when everything is already unlocked.
 * @returns The toast text, or null when nothing is showing.
 * @example
 * const toast = useUnlockToast(engineRef, gameState, score, bestScore, cheatUnlocked);
 */
export function useUnlockToast(
  engineRef: React.RefObject<Engine | null>,
  gameState: GameState,
  score: number,
  bestScore: number,
  cheatUnlocked: boolean,
): string | null {
  const [message, setMessage] = useState<string | null>(null);
  const targetScoreRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest saved values, read only when a run starts (bestScore changes at game over, not mid-run)
  const savedRef = useRef({ bestScore, cheatUnlocked });
  useEffect(() => {
    savedRef.current = { bestScore, cheatUnlocked };
  });

  // Compute the first target once per run start. RUNNING is also re-entered after an
  // ambulance revive; recomputing there would re-announce bikes already passed this run.
  const prevStateRef = useRef(gameState);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = gameState;
    if (gameState !== GameState.RUNNING || prev === GameState.AMBULANCE) return;
    const next = getNextUnlock(savedRef.current.bestScore, savedRef.current.cheatUnlocked);
    targetScoreRef.current = next ? next.skin.unlockScore : null;
  }, [gameState]);

  useEffect(() => {
    if (gameState !== GameState.RUNNING) return;
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
    // Showing a toast in response to the score is the point of this effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(`🔓 ${names.join(" & ")} unlocked!`);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setMessage(null), TOAST_MS);
  }, [score, gameState, engineRef]);

  // Drop any toast (and its timer) when leaving the run
  useEffect(() => {
    if (gameState === GameState.RUNNING) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(null);
  }, [gameState]);

  useEffect(() => () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  return message;
}
