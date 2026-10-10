/**
 * Reads the `?obstacles=debug` URL flag in prerendered pages without a
 * hydration mismatch: the server snapshot is "off", and React swaps in the
 * real URL value right after hydration.
 */
import { useSyncExternalStore } from "react";

const PARAM = "obstacles";
const VALUE = "debug";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Back/forward navigation can change the query string
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function getSnapshot(): boolean {
  return new URLSearchParams(window.location.search).get(PARAM) === VALUE;
}

function getServerSnapshot(): boolean {
  return false;
}

/** Flips the flag in the URL (so a reload keeps it) and re-renders subscribers. */
function toggleDebugObstacles(): void {
  const url = getSnapshot() ? window.location.pathname : `?${PARAM}=${VALUE}`;
  window.history.replaceState(null, "", url);
  // replaceState fires no event, so tell subscribers ourselves
  listeners.forEach((listener) => listener());
}

/**
 * Whether the fixed debug obstacle sequence is on, driven by `?obstacles=debug`
 * so a test setup survives reloads and can be shared as a link.
 * @returns `[enabled, toggle]`. `enabled` is `false` during server and hydration renders.
 * @example
 * const [debugObstacles, toggleDebugObstacles] = useDebugObstaclesFlag();
 * <button onClick={toggleDebugObstacles}>Debug: {debugObstacles ? "ON" : "OFF"}</button>
 */
export function useDebugObstaclesFlag(): [boolean, () => void] {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [enabled, toggleDebugObstacles];
}
