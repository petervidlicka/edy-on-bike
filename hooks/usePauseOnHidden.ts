/** Shared pause/resume wiring for game screens (single-player and multiplayer). */
import { useCallback, useEffect } from "react";
import type { Engine } from "@/game/Engine";
import { isPortraitPhone, subscribeOrientation } from "@/lib/platform";

/** How a screen wants hidden-tab pauses handled. */
export interface UsePauseOnHiddenOptions {
  /**
   * When the tab is hidden, also hold a "user" pause so coming back shows the
   * pause menu instead of throwing the player straight back into the run.
   * Single-player only; a multiplayer race keeps running on the server.
   */
  promoteToUserPause?: boolean;
}

/**
 * Pauses the engine while the tab is hidden or a phone is held in portrait (the same
 * test the OrientationGuard overlay uses, so the two can't disagree).
 * In multiplayer a long pause gets the player counted out by the server.
 * @param engineRef - Ref to the running Engine; a null ref is ignored.
 * @param options - Whether a hidden tab should become a user pause.
 * @example
 * usePauseOnHidden(engineRef, { promoteToUserPause: true });
 */
export function usePauseOnHidden(
  engineRef: React.RefObject<Engine | null>,
  { promoteToUserPause = false }: UsePauseOnHiddenOptions = {},
): void {
  const checkPause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (document.hidden) {
      // Added first so the pause-change callback already sees the user pause.
      if (promoteToUserPause) engine.pause("user"); // ignored outside RUNNING/AMBULANCE
      engine.pause("hidden");
    } else {
      engine.resume("hidden");
    }

    if (isPortraitPhone()) engine.pause("orientation");
    else engine.resume("orientation");
  }, [engineRef, promoteToUserPause]);

  useEffect(() => {
    document.addEventListener("visibilitychange", checkPause);
    const unsubscribeOrientation = subscribeOrientation(checkPause);
    return () => {
      document.removeEventListener("visibilitychange", checkPause);
      unsubscribeOrientation();
    };
  }, [checkPause]);
}
