/**
 * Short input lockout for the game-over screen: kids mash Space through the crash,
 * and without a grace period they'd skip the screen before seeing their score.
 */
import { useEffect, useState } from "react";

/** How long restart input is ignored after the game-over screen appears. */
export const GAME_OVER_LOCKOUT_MS = 700;

/**
 * @param durationMs - Lockout length, counted from mount.
 * @returns True until the lockout has elapsed.
 * @example
 * const locked = useInputLockout(GAME_OVER_LOCKOUT_MS);
 */
export function useInputLockout(durationMs: number): boolean {
  const [locked, setLocked] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLocked(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);
  return locked;
}
