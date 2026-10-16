/**
 * Keyboard and touch controls shared by the single-player and multiplayer game
 * screens, so both map keys to the same moves.
 */
import { useEffect } from "react";
import type { Engine } from "@/game/Engine";
import { GameState } from "@/game/types";

/** How a screen wants raw input mapped onto the engine. */
export interface UseEngineInputOptions {
  /**
   * Let Space or a tap start a run from the idle screen. Single-player only;
   * a multiplayer race is started by the server, not by the player.
   */
  allowIdleStart: boolean;
}

/**
 * Wires Space/tap to jump and the arrow keys to tricks (↓ backflip, ↑ frontflip,
 * ← superman, → no-hander). Ignores input aimed at form fields and buttons so
 * typing a name or pressing an overlay button never makes the rider jump.
 * @param engineRef - The engine to drive; a null ref ignores input.
 * @param canvasRef - Canvas that receives touch input.
 * @param options - Whether a jump may start the run from idle.
 * @example
 * useEngineInput(engineRef, canvasRef, { allowIdleStart: true });
 */
export function useEngineInput(
  engineRef: React.RefObject<Engine | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { allowIdleStart }: UseEngineInputOptions,
): void {
  useEffect(() => {
    const jumpIfAllowed = () => {
      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.getState();
      if (state === GameState.RUNNING || (allowIdleStart && state === GameState.IDLE)) {
        engine.jump();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        jumpIfAllowed();
      }
      if (e.code === "ArrowDown" || e.code === "ArrowUp" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
        e.preventDefault();
        if (e.repeat) return; // prevent key-repeat from queueing extra tricks
        if (e.code === "ArrowDown") engineRef.current?.backflip();
        else if (e.code === "ArrowUp") engineRef.current?.frontflip();
        else if (e.code === "ArrowLeft") engineRef.current?.superman();
        else engineRef.current?.noHander();
      }
    };

    const handleTouch = (e: TouchEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "BUTTON") return;
      e.preventDefault();
      jumpIfAllowed();
    };

    window.addEventListener("keydown", handleKeyDown);
    const canvas = canvasRef.current;
    canvas?.addEventListener("touchstart", handleTouch, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas?.removeEventListener("touchstart", handleTouch);
    };
  }, [engineRef, canvasRef, allowIdleStart]);
}
