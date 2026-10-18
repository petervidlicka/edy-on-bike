/**
 * React bindings for `lib/gamepad`: subscribe a component to gamepad presses, and
 * know whether a controller is connected so the UI can swap touch/keyboard hints.
 */
import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import { addGamepadPressListener, anyGamepadConnected, type GamepadPressEvent } from "@/lib/gamepad";

/** How a component wants gamepad presses delivered. */
export interface UseGamepadPressOptions {
  /** Run before non-capture listeners, so an overlay can claim the press with `stopImmediatePropagation()`. */
  capture?: boolean;
}

/**
 * Calls `onPress` for every fresh gamepad button press while mounted. Always sees
 * the latest props, so callers don't need to memoize the handler.
 * @param onPress - Receives the press event; `e.detail.button` names the button.
 * @param options - Listener phase.
 * @example
 * useGamepadPress((e) => { if (e.detail.button === "A") onRestart(); }, { capture: true });
 */
export function useGamepadPress(
  onPress: (e: GamepadPressEvent) => void,
  { capture = false }: UseGamepadPressOptions = {},
): void {
  const handle = useEffectEvent(onPress);
  useEffect(() => addGamepadPressListener((e) => handle(e), { capture }), [capture]);
}

function subscribeConnection(onChange: () => void): () => void {
  window.addEventListener("gamepadconnected", onChange);
  window.addEventListener("gamepaddisconnected", onChange);
  return () => {
    window.removeEventListener("gamepadconnected", onChange);
    window.removeEventListener("gamepaddisconnected", onChange);
  };
}

/**
 * Whether a controller is connected, for showing "Press Ⓐ" instead of "Press Space"
 * and hiding the on-screen touch controls. False on the server and during hydration.
 * @returns True once a pad has been seen (browsers reveal a pad only after its first press).
 * @example
 * const hasGamepad = useGamepadConnected();
 */
export function useGamepadConnected(): boolean {
  return useSyncExternalStore(subscribeConnection, anyGamepadConnected, () => false);
}
