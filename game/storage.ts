/**
 * Persists the player's skin selection and unlock progress in localStorage.
 * Components should read it through `useSavedSkinState` (hooks/useSavedSkinState.ts),
 * which keeps prerendered pages hydration-safe and re-renders after writes.
 */
import { SkinId, SkinUnlockState } from "./types";

const STORAGE_KEY = "edy-skin-state";

/**
 * Fresh-player state; also what server-rendered markup assumes before localStorage is read.
 * Frozen because it doubles as React's server snapshot — callers get copies from `loadSkinState`.
 */
export const DEFAULT_SKIN_STATE: Readonly<SkinUnlockState> = Object.freeze({
  selectedSkinId: "default",
  bestScore: 0,
  cheatUnlocked: false,
});

/**
 * Reads the saved skin state, falling back to the fresh-player default when
 * nothing is stored, storage is unavailable, or the value is corrupt.
 * @returns A new object on every call, safe for the caller to mutate.
 */
export function loadSkinState(): SkinUnlockState {
  if (typeof window === "undefined") return { ...DEFAULT_SKIN_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SKIN_STATE };
    const parsed = JSON.parse(raw);
    return {
      selectedSkinId: parsed.selectedSkinId ?? "default",
      bestScore: parsed.bestScore ?? 0,
      cheatUnlocked: parsed.cheatUnlocked ?? false,
    };
  } catch {
    return { ...DEFAULT_SKIN_STATE };
  }
}

/**
 * Writes the skin state; silently skipped when storage is full or disabled,
 * since losing cosmetic progress shouldn't interrupt the game.
 * @param state - The complete state to store.
 */
export function saveSkinState(state: SkinUnlockState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or disabled
  }
}

/**
 * Records a finished run, keeping only the highest score (which drives skin unlocks).
 * @param score - The run's final score.
 * @returns The state after the update.
 */
export function updateBestScore(score: number): SkinUnlockState {
  const state = loadSkinState();
  if (score > state.bestScore) {
    state.bestScore = score;
    saveSkinState(state);
  }
  return state;
}

/**
 * Remembers which skin the player picked so it's applied on the next visit.
 * @param id - The chosen skin.
 * @returns The state after the update.
 */
export function selectSkin(id: SkinId): SkinUnlockState {
  const state = loadSkinState();
  state.selectedSkinId = id;
  saveSkinState(state);
  return state;
}

/**
 * Unlocks every skin regardless of best score (IDKFA cheat).
 * @returns The state after the update.
 */
export function activateCheat(): SkinUnlockState {
  const state = loadSkinState();
  state.cheatUnlocked = true;
  saveSkinState(state);
  return state;
}
