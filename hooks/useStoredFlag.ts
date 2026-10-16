/**
 * Boolean settings backed by localStorage, read hydration-safely (same idea as
 * `useSavedSkinState`): server and hydration renders see the default, then React
 * swaps in the stored value. Used for the music / sound / vibration toggles.
 */
import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // writes from other tabs
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "1";
  } catch {
    // Storage blocked (private mode, disabled): behave as if nothing was saved
    return fallback;
  }
}

/**
 * A persisted on/off setting.
 * @param key - localStorage key.
 * @param fallback - Value used on the server, during hydration and when nothing is stored.
 * @returns `[value, toggle]`; toggling saves immediately and updates every subscriber.
 * @example
 * const [musicMuted, toggleMusic] = useStoredFlag("edy-music-muted", false);
 */
export function useStoredFlag(key: string, fallback: boolean): [boolean, () => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(key, read(key, fallback) ? "0" : "1");
    } catch (error) {
      // Not saving is fine, but the toggle then can't take effect either: say so once
      console.warn("Could not save setting", key, error);
      return;
    }
    listeners.forEach((listener) => listener());
  }, [key, fallback]);
  return [value, toggle];
}
