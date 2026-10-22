/**
 * Live score and speed as a tiny external store. The Engine reports a new score
 * 15–30 times a second during a run; holding that in React state re-rendered the
 * whole game screen per tick. Here the Engine's callbacks write the store and only
 * the components that display the numbers subscribe (via `useSyncExternalStore`),
 * so the rest of the HUD stays put between ticks.
 */
import { useSyncExternalStore } from "react";
import { INITIAL_SPEED } from "@/game/constants";

/** Read/write handle on the live run numbers; one per Engine instance. */
export interface EngineStats {
  getScore(): number;
  getSpeed(): number;
  /** Written by the Engine's `onScoreUpdate`; notifies subscribers only when the value changes. */
  setScore(score: number): void;
  /** Written by the Engine's `onSpeedUpdate`; notifies subscribers only when the value changes. */
  setSpeed(speed: number): void;
  /** Stable, so it can be handed straight to `useSyncExternalStore`. */
  subscribe(listener: () => void): () => void;
}

/**
 * Creates a store starting at score 0 and the base speed, matching what a fresh
 * Engine reports (and what the server render shows).
 * @example
 * const [stats] = useState(createEngineStats);
 * new Engine(canvas, { onScoreUpdate: stats.setScore, ... });
 */
export function createEngineStats(): EngineStats {
  let score = 0;
  let speed = INITIAL_SPEED;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    getScore: () => score,
    getSpeed: () => speed,
    setScore: (next) => {
      if (next === score) return;
      score = next;
      notify();
    },
    setSpeed: (next) => {
      if (next === speed) return;
      speed = next;
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * The live score; re-renders the calling component on every score tick, so use it
 * in the smallest component that shows the number.
 * @example
 * const score = useEngineScore(stats);
 */
export function useEngineScore(stats: EngineStats): number {
  return useSyncExternalStore(stats.subscribe, stats.getScore, stats.getScore);
}

/**
 * The live speed (for the HUD's multiplier). Same re-render cost as `useEngineScore`.
 * @example
 * const multiplier = (useEngineSpeed(stats) / INITIAL_SPEED).toFixed(1);
 */
export function useEngineSpeed(stats: EngineStats): number {
  return useSyncExternalStore(stats.subscribe, stats.getSpeed, stats.getSpeed);
}
