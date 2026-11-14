/**
 * Boolean settings backed by localStorage, read hydration-safely (same idea as
 * `useSavedSkinState`): server and hydration renders see the default, then React
 * swaps in the stored value. Used for the music / sound / vibration toggles.
 */
import { useCallback, useSyncExternalStore } from "react";

/** Subscribers per key, so toggling music doesn't wake the sound and vibration readers. */
const listenersByKey = new Map<string, Set<() => void>>();

function notify(key: string): void {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

/** Writes from other tabs: the event names the key, or null when the whole store was cleared. */
function onStorage(event: StorageEvent): void {
  if (event.key === null) listenersByKey.forEach((_, key) => notify(key));
  else notify(event.key);
}

function subscribeKey(key: string, onChange: () => void): () => void {
  let listeners = listenersByKey.get(key);
  if (!listeners) {
    listeners = new Set();
    listenersByKey.set(key, listeners);
  }
  listeners.add(onChange);
  if (listenersByKey.size === 1 && listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) listenersByKey.delete(key);
    if (listenersByKey.size === 0) window.removeEventListener("storage", onStorage);
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
 * @returns `[value, toggle]`; toggling saves immediately and updates every subscriber of that key.
 * @example
 * const [musicMuted, toggleMusic] = useStoredFlag("edy-music-muted", false);
 */
export function useStoredFlag(key: string, fallback: boolean): [boolean, () => void] {
  const subscribe = useCallback((onChange: () => void) => subscribeKey(key, onChange), [key]);
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
    notify(key);
  }, [key, fallback]);
  return [value, toggle];
}
