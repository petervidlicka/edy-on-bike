/**
 * Reads the player's saved skin unlocks (localStorage) in prerendered pages
 * without a hydration mismatch: the server snapshot is the fresh-player default,
 * and React swaps in the stored state right after hydration.
 *
 * All writes must go through this module (the hook's setter, `recordBestScore`,
 * `unlockAllSkins`) so subscribed components re-render with the new state.
 */
import { useSyncExternalStore } from "react";
import type { SkinId, SkinUnlockState } from "@/game/types";
import {
  DEFAULT_SKIN_STATE,
  activateCheat,
  loadSkinState,
  selectSkin,
  updateBestScore,
} from "@/game/storage";

const listeners = new Set<() => void>();

// Parsed once and reused until the next write: getSnapshot runs on every render
// (GameCanvas re-renders on each score tick) and must return a stable object.
let cached: SkinUnlockState | null = null;

/** Drops the cached state and tells every subscriber to re-read it. */
function notify(): void {
  cached = null;
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // The `storage` event only fires for writes made in other tabs.
  if (listeners.size === 1) window.addEventListener("storage", notify);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.removeEventListener("storage", notify);
      // Nobody hears other tabs' writes now, so re-read on the next mount.
      cached = null;
    }
  };
}

function getSnapshot(): SkinUnlockState {
  cached ??= loadSkinState();
  return cached;
}

function getServerSnapshot(): SkinUnlockState {
  return DEFAULT_SKIN_STATE;
}

/** Persists the selected skin and re-renders subscribers. */
function chooseSkin(id: SkinId): void {
  selectSkin(id);
  notify();
}

/**
 * Saves a finished run's score (if it beats the best) and re-renders subscribers,
 * so newly earned skins unlock in the picker without a reload.
 * Plain function rather than a hook so engine callbacks can call it.
 * @param score - The run's final score.
 * @example
 * onGameOver: (finalScore) => recordBestScore(finalScore)
 */
export function recordBestScore(score: number): void {
  updateBestScore(score);
  notify();
}

/**
 * Unlocks every skin (IDKFA cheat) and re-renders subscribers.
 * @example
 * useCheatCode("IDKFA", unlockAllSkins);
 */
export function unlockAllSkins(): void {
  activateCheat();
  notify();
}

/**
 * The player's saved skin selection and unlock progress, plus a setter that
 * persists the selection. Server and hydration renders see `DEFAULT_SKIN_STATE`.
 * @returns `[state, chooseSkin]`
 * @example
 * const [skinState, chooseSkin] = useSavedSkinState();
 * <SkinPicker bestScore={skinState.bestScore} onSelectSkin={chooseSkin} ... />
 */
export function useSavedSkinState(): [SkinUnlockState, (id: SkinId) => void] {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [state, chooseSkin];
}
