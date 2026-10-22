/**
 * Fetches the leaderboard as soon as the game-over screen mounts, so the screen can
 * pick its layout (name form vs. one-tap replay) before the player has to act.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLeaderboard, LeaderboardError } from "@/lib/leaderboardClient";
import type { LeaderboardEntry } from "@/lib/leaderboardClient";

/** Loading state of the board; "error" covers offline and API outages alike. */
export type LeaderboardStatus = "loading" | "ready" | "error";

/** What the game-over screen needs from the board. */
export interface GameOverLeaderboard {
  status: LeaderboardStatus;
  entries: LeaderboardEntry[];
  totalPlayers: number;
  /** Player-facing failure text; null unless status is "error". */
  error: string | null;
  /** Fetches again (e.g. after saving a score) and resolves when state is updated. */
  reload: () => Promise<void>;
}

/**
 * Loads the leaderboard on mount and exposes a reload for after a save.
 * Failures are surfaced as state, never thrown, so an outage can't block replaying.
 * The in-flight request is aborted on unmount (and by a newer reload), so a late
 * response can never set state on a screen that's gone.
 * @returns The board, its status, and a reload function.
 * @example
 * const { status, entries, reload } = useGameOverLeaderboard();
 */
export function useGameOverLeaderboard(): GameOverLeaderboard {
  const [status, setStatus] = useState<LeaderboardStatus>("loading");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** Controller of the request in flight; aborted by the next load and on unmount. */
  const controllerRef = useRef<AbortController | null>(null);

  // Shared by the first load and later reloads
  const load = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return fetchLeaderboard(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        setEntries(data.scores);
        setTotalPlayers(data.totalPlayers);
        setError(null);
        setStatus("ready");
      },
      (err: unknown) => {
        // An abort is ours (unmount or a newer reload), not a failure to report
        if (controller.signal.aborted) return;
        console.error("[leaderboard] Loading scores failed", err);
        setError(err instanceof LeaderboardError ? err.message : "Couldn't load the leaderboard. Please try again later.");
        setStatus("error");
      },
    );
  }, []);

  useEffect(() => {
    void load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { status, entries, totalPlayers, error, reload: load };
}
