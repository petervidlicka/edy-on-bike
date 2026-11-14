/**
 * Connects game events and the player's vibration setting to `lib/haptics`, so both
 * the single-player and multiplayer screens buzz the same way. The engine itself
 * stays platform-free.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { GameEvent } from "@/game/events";
import { canVibrate, haptic, setHapticsEnabled } from "@/lib/haptics";
import { useStoredFlag } from "./useStoredFlag";

/** Multiplier from which a clean landing gets the heavy thump. */
const BIG_MULTIPLIER = 3;

const noopSubscribe = () => () => {};

/**
 * Whether the vibration toggle should be shown. False on the server and during
 * hydration, so prerendered markup matches.
 * @returns True on devices that can vibrate.
 */
export function useCanVibrate(): boolean {
  return useSyncExternalStore(noopSubscribe, canVibrate, () => false);
}

/**
 * Persisted vibration setting plus an event handler that buzzes for landings and crashes.
 * One buzz per landing: `trickLanded` decides the strength, so `comboChanged`
 * (which fires on the same landing) is deliberately ignored.
 * @returns `onGameEvent` for `useGameEngine`, and the setting with its toggle.
 * @example
 * const { onGameEvent, vibrationOn, toggleVibration } = useHapticFeedback();
 */
export function useHapticFeedback(): {
  onGameEvent: (event: GameEvent) => void;
  vibrationOn: boolean;
  toggleVibration: () => void;
} {
  const [vibrationOff, toggleVibration] = useStoredFlag("edy-vibration-off", false);
  const vibrationOn = !vibrationOff;

  useEffect(() => {
    setHapticsEnabled(vibrationOn);
  }, [vibrationOn]);

  const onGameEvent = useCallback((event: GameEvent) => {
    switch (event.type) {
      case "trickLanded":
        if (event.sketchy) haptic("tap");
        else haptic(event.big || event.multiplier >= BIG_MULTIPLIER ? "bigLand" : "land");
        break;
      case "crash":
        haptic("crash");
        break;
      case "revive":
        haptic("success");
        break;
      default:
        break;
    }
  }, []);

  return { onGameEvent, vibrationOn, toggleVibration };
}
