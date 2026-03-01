import { useCallback, useEffect } from "react";
import type { Engine } from "@/game/Engine";

export function usePauseOnHidden(engineRef: React.RefObject<Engine | null>): void {
  const checkPause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const isHidden = document.hidden;
    const isPortraitMobile =
      window.matchMedia("(orientation: portrait)").matches &&
      window.matchMedia("(pointer: coarse)").matches;
    if (isHidden || isPortraitMobile) {
      engine.pause();
    } else {
      engine.resume();
    }
  }, [engineRef]);

  useEffect(() => {
    document.addEventListener("visibilitychange", checkPause);
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", checkPause);
    window.addEventListener("orientationchange", checkPause);
    return () => {
      document.removeEventListener("visibilitychange", checkPause);
      mq.removeEventListener("change", checkPause);
      window.removeEventListener("orientationchange", checkPause);
    };
  }, [checkPause]);
}
