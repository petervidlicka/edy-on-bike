/**
 * Reads the saved display name (shared with the leaderboard) in prerendered pages
 * without a hydration mismatch: the server snapshot is "" and React swaps in the
 * stored name right after hydration.
 */
import { useSyncExternalStore } from "react";
import { loadPlayerName } from "@/game/storage";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange); // saved from another tab
  return () => window.removeEventListener("storage", onChange);
}

function getServerSnapshot(): string {
  return "";
}

/**
 * The name the player last used, for prefilling name inputs.
 * @returns The saved name, or "" if none (and during server rendering).
 * @example
 * const savedName = useSavedPlayerName();
 * const name = typedName ?? savedName;
 */
export function useSavedPlayerName(): string {
  return useSyncExternalStore(subscribe, loadPlayerName, getServerSnapshot);
}
