import { SkinId, SkinUnlockState } from "./types";

const STORAGE_KEY = "edy-skin-state";

const DEFAULT_STATE: SkinUnlockState = {
  selectedSkinId: "default",
  bestScore: 0,
  cheatUnlocked: false,
};

export function loadSkinState(): SkinUnlockState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      selectedSkinId: parsed.selectedSkinId ?? "default",
      bestScore: parsed.bestScore ?? 0,
      cheatUnlocked: parsed.cheatUnlocked ?? false,
    };
  } catch {
    return DEFAULT_STATE;
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
