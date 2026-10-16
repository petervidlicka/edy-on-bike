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
 * @returns The board, its status, and a reload function.
 * @example
 * const { status, entries, reload } = useGameOverLeaderboard();
 */
export function useGameOverLeaderboard(): GameOverLeaderboard {
  const [status, setStatus] = useState<LeaderboardStatus>("loading");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const reload = useCallback(async () => {
    try {
      const data = await fetchLeaderboard();
      if (!mountedRef.current) return;
      setEntries(data.scores);
      setTotalPlayers(data.totalPlayers);
      setError(null);
      setStatus("ready");
    } catch (err) {
      console.error("[leaderboard] Loading scores failed", err);
      if (!mountedRef.current) return;
      setError(err instanceof LeaderboardError ? err.message : "Couldn't load the leaderboard. Please try again later.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Promise chain (not a direct reload() call) so state is only set from a callback
    fetchLeaderboard().then(
      (data) => {
        if (!mountedRef.current) return;
        setEntries(data.scores);
        setTotalPlayers(data.totalPlayers);
        setStatus("ready");
      },
      (err: unknown) => {
        console.error("[leaderboard] Loading scores failed", err);
        if (!mountedRef.current) return;
        setError(err instanceof LeaderboardError ? err.message : "Couldn't load the leaderboard. Please try again later.");
        setStatus("error");
      },
    );
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { status, entries, totalPlayers, error, reload };
}
