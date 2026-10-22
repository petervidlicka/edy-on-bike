/**
 * The one-time "tap for fullscreen" hint for mobile browsers, and its fallback
 * ("Add to Home Screen") where the Fullscreen API is missing or refused. The native
 * apps and installed PWAs are already fullscreen and never see it.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { getFullscreenElement, isPortrait, isStandalone, isTouchDevice, subscribeOrientation } from "@/lib/platform";

/** What the hint should show, if anything. */
export type FullscreenPromptMode = "hidden" | "fullscreen" | "install";

/** How long a hint stays up before it dismisses itself. */
const PROMPT_MS = 6000;

/** What the hint component needs: the mode, and the two things a tap can do. */
export interface FullscreenPrompt {
  mode: FullscreenPromptMode;
  /** Try the Fullscreen API on the container; falls back to the install hint if it fails. */
  requestFullscreen: () => void;
  /** Hide the hint now. */
  dismiss: () => void;
}

/**
 * Shows the fullscreen hint on a touch device in landscape that isn't fullscreen or
 * standalone, re-evaluating on every rotation, and hides it as soon as the page goes fullscreen.
 * @param containerRef - The element to make fullscreen (falls back to the document).
 * @example
 * const prompt = useFullscreenPrompt(containerRef);
 * {prompt.mode !== "hidden" && <FullscreenHint prompt={prompt} />}
 */
export function useFullscreenPrompt(containerRef: RefObject<HTMLElement | null>): FullscreenPrompt {
  const [mode, setMode] = useState<FullscreenPromptMode>("hidden");
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    setMode("hidden");
  }, []);

  const showTimed = useCallback(
    (next: FullscreenPromptMode) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      setMode(next);
      dismissTimer.current = setTimeout(() => setMode("hidden"), PROMPT_MS);
    },
    [],
  );

  const requestFullscreen = useCallback(() => {
    if (getFullscreenElement()) {
      dismiss();
      return;
    }
    const el = containerRef.current ?? document.documentElement;

    if (el.requestFullscreen) {
      // API exists but may be rejected (iPhone Safari): then suggest installing instead
      el.requestFullscreen().then(dismiss, () => showTimed("install"));
      return;
    }
    if (el.webkitRequestFullscreen) {
      try {
        el.webkitRequestFullscreen();
        // No promise: the fullscreenchange listener below hides the hint
      } catch {
        showTimed("install");
      }
      return;
    }
    showTimed("install");
  }, [containerRef, dismiss, showTimed]);

  useEffect(() => {
    const check = () => {
      if (!isPortrait() && isTouchDevice() && !getFullscreenElement() && !isStandalone()) {
        showTimed("fullscreen");
      } else {
        dismiss();
      }
    };
    check();
    const unsubscribeOrientation = subscribeOrientation(check);

    const onFullscreenChange = () => {
      if (getFullscreenElement()) dismiss();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    return () => {
      unsubscribeOrientation();
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      dismiss();
    };
  }, [dismiss, showTimed]);

  return { mode, requestFullscreen, dismiss };
}
