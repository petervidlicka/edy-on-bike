/**
 * Reads the player's saved skin unlocks (localStorage) in prerendered pages
 * without a hydration mismatch: the server snapshot is the fresh-player default,
 * and React swaps in the stored state right after hydration.
 */
import { useCallback, useSyncExternalStore } from "react";
import type { SkinId, SkinUnlockState } from "@/game/types";
import { DEFAULT_SKIN_STATE, loadSkinState, selectSkin } from "@/game/storage";

const listeners = new Set<() => void>();
let cached: { key: string; state: SkinUnlockState } | null = null;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** loadSkinState() returns a new object each call; keep one per stored value so React doesn't loop. */
function getSnapshot(): SkinUnlockState {
  const state = loadSkinState();
  const key = JSON.stringify(state);
  if (cached?.key !== key) cached = { key, state };
  return cached.state;
}

function getServerSnapshot(): SkinUnlockState {
  return DEFAULT_SKIN_STATE;
}

/**
 * The player's saved skin selection and unlock progress, plus a setter that
 * persists the selection (shared with single-player).
 * @returns `[state, chooseSkin]`
 * @example
 * const [skinState, chooseSkin] = useSavedSkinState();
 * <SkinPicker bestScore={skinState.bestScore} onSelectSkin={chooseSkin} ... />
 */
export function useSavedSkinState(): [SkinUnlockState, (id: SkinId) => void] {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const chooseSkin = useCallback((id: SkinId) => {
    selectSkin(id);
    listeners.forEach((notify) => notify());
  }, []);
  return [state, chooseSkin];
}
