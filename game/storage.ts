import { SkinId, SkinUnlockState } from "./types";

const STORAGE_KEY = "edy-skin-state";

/** Fresh-player state; also what server-rendered markup assumes before localStorage is read. */
export const DEFAULT_SKIN_STATE: SkinUnlockState = {
  selectedSkinId: "default",
  bestScore: 0,
  cheatUnlocked: false,
};

export function loadSkinState(): SkinUnlockState {
  if (typeof window === "undefined") return DEFAULT_SKIN_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SKIN_STATE;
    const parsed = JSON.parse(raw);
    return {
      selectedSkinId: parsed.selectedSkinId ?? "default",
      bestScore: parsed.bestScore ?? 0,
      cheatUnlocked: parsed.cheatUnlocked ?? false,
    };
  } catch {
    return DEFAULT_SKIN_STATE;
  }
}

export function saveSkinState(state: SkinUnlockState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or disabled
  }
}

export function updateBestScore(score: number): SkinUnlockState {
  const state = loadSkinState();
  if (score > state.bestScore) {
    state.bestScore = score;
    saveSkinState(state);
  }
  return state;
}

export function selectSkin(id: SkinId): SkinUnlockState {
  const state = loadSkinState();
  state.selectedSkinId = id;
  saveSkinState(state);
  return state;
}

export function activateCheat(): SkinUnlockState {
  const state = loadSkinState();
  state.cheatUnlocked = true;
  saveSkinState(state);
  return state;
}

/** One saved display name shared by the leaderboard and multiplayer. */
const PLAYER_NAME_KEY = "edy-player-name";

/** @returns The name the player last used, or "" (always "" on the server). */
export function loadPlayerName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
  } catch {
    return ""; // localStorage may be disabled
  }
}

/** Remembers the player's display name so the next form (leaderboard or lobby) is prefilled. */
export function savePlayerName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch {
    // localStorage may be full or disabled
  }
}
