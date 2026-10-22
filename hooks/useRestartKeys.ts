/**
 * Capture-phase Space/Enter/R (and gamepad A/Menu) handler for game-over views whose
 * primary action is "play again". Capture + stopImmediatePropagation keeps the press
 * from also reaching the engine's jump handler on the same event.
 */
import { useEffect } from "react";
import { useGamepadPress } from "@/hooks/useGamepad";
import { isButton, isTyping } from "@/lib/dom";

/**
 * Mount in at most one game-over view at a time; two capture listeners would both fire.
 * @param onAction - Called once per fresh key press when not locked.
 * @param locked - While true, keys are swallowed but do nothing (input lockout).
 * @example
 * useRestartKeys(onRestart, locked);
 */
export function useRestartKeys(onAction: () => void, locked: boolean): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter" && e.code !== "KeyR") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping(e.target)) return;
      e.stopImmediatePropagation();
      // A focused button handles Space/Enter natively, so links like "Home" stay keyboard-reachable
      if (isButton(e.target) && e.code !== "KeyR") return;
      e.preventDefault();
      if (e.repeat || locked) return;
      onAction();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [onAction, locked]);

  useGamepadPress(
    (e) => {
      if (e.detail.button !== "A" && e.detail.button !== "Start") return;
      e.stopImmediatePropagation();
      if (!locked) onAction();
    },
    { capture: true },
  );
}
