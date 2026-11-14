/**
 * Keyboard, touch and gamepad controls shared by the single-player and multiplayer
 * game screens, so both map every input to the same moves.
 */
import { useEffect } from "react";
import type { Engine } from "@/game/Engine";
import { GameState } from "@/game/types";
import { addGamepadPressListener, type GamepadPressEvent } from "@/lib/gamepad";
import { isButton, isTyping } from "@/lib/dom";

/** The four trick directions, shared by the arrow keys, the D-pad and the left stick. */
type TrickDirection = "Up" | "Down" | "Left" | "Right";

const ARROW_KEY_TRICKS: Partial<Record<string, TrickDirection>> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};

/** How a screen wants raw input mapped onto the engine. */
export interface UseEngineInputOptions {
  /**
   * Let Space or a tap start a run from the idle screen. Single-player only;
   * a multiplayer race is started by the server, not by the player.
   */
  allowIdleStart: boolean;
  /**
   * Let Esc, P or the gamepad Menu button pause the run. Single-player only; a multiplayer race can't be
   * paused by the player. While paused (for any reason) all other input is ignored.
   */
  allowPause?: boolean;
}

/**
 * Wires Space/tap/gamepad A to jump (and, while the rider is crashing, to skip the crash animation)
 * and the arrow keys, D-pad or left stick to tricks (↓ backflip, ↑ frontflip, ← superman, → no-hander).
 * Ignores input aimed at form fields and buttons so typing a name or pressing an overlay button never
 * makes the rider jump. Overlays claim gamepad presses in the capture phase, as they do keys.
 * @param engineRef - The engine to drive; a null ref ignores input.
 * @param canvasRef - Canvas that receives touch input.
 * @param options - Whether a jump may start the run from idle, and whether Esc/P may pause.
 * @example
 * useEngineInput(engineRef, canvasRef, { allowIdleStart: true });
 */
export function useEngineInput(
  engineRef: React.RefObject<Engine | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { allowIdleStart, allowPause = false }: UseEngineInputOptions,
): void {
  useEffect(() => {
    const jumpIfAllowed = (isKeyRepeat = false) => {
      const engine = engineRef.current;
      if (!engine || engine.isPaused()) return;
      const state = engine.getState();
      if (state === GameState.RUNNING || (allowIdleStart && state === GameState.IDLE)) {
        engine.jump();
      } else if (state === GameState.CRASHING && !isKeyRepeat) {
        // A fresh press skips the crash animation (the engine decides if it may); a held key must not
        engine.jump();
      }
    };

    const trick = (direction: TrickDirection) => {
      const engine = engineRef.current;
      if (!engine || engine.isPaused()) return;
      if (direction === "Down") engine.backflip();
      else if (direction === "Up") engine.frontflip();
      else if (direction === "Left") engine.superman();
      else engine.noHander();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      // Esc/P only pause here; resuming is the pause menu's job (it shows the countdown).
      if (allowPause && (e.code === "Escape" || e.code === "KeyP") && !e.repeat) {
        if (!isTyping(e.target)) engine?.pause("user");
        return;
      }
      if (e.code === "Space") {
        if (isTyping(e.target)) return;
        e.preventDefault();
        jumpIfAllowed(e.repeat);
      }
      const direction = ARROW_KEY_TRICKS[e.code];
      if (direction) {
        e.preventDefault();
        if (e.repeat) return; // prevent key-repeat from queueing extra tricks
        trick(direction);
      }
    };

    // Gamepad presses never repeat, so a held button can't skip the crash or queue tricks
    const handleGamepad = (e: GamepadPressEvent) => {
      const { button } = e.detail;
      if (button === "A") jumpIfAllowed();
      else if (button === "Start" && allowPause) engineRef.current?.pause("user");
      else if (button === "Up" || button === "Down" || button === "Left" || button === "Right") trick(button);
    };

    const handleTouch = (e: TouchEvent) => {
      if (isTyping(e.target) || isButton(e.target)) return;
      e.preventDefault();
      jumpIfAllowed();
    };

    window.addEventListener("keydown", handleKeyDown);
    const removeGamepad = addGamepadPressListener(handleGamepad);
    const canvas = canvasRef.current;
    canvas?.addEventListener("touchstart", handleTouch, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      removeGamepad();
      canvas?.removeEventListener("touchstart", handleTouch);
    };
  }, [engineRef, canvasRef, allowIdleStart, allowPause]);
}
