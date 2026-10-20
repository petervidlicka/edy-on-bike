/**
 * Leaderboard settings shared by the API route (server) and the game-over
 * screen (client). This module must stay free of server-only imports
 * (Redis, fs) so client components can import it without bloating the bundle.
 */

/** One row of the public leaderboard, as the API returns it and the game-over screen renders it. */
export interface LeaderboardEntry {
  name: string;
  score: number;
  skin?: string;
}

/** Longest display name the leaderboard stores. */
export const MAX_LEADERBOARD_NAME_LENGTH = 20;

/**
 * Number of entries the leaderboard API returns and the game-over screen shows.
 * Keeping one constant stops the API from sending rows the UI never renders.
 */
export const LEADERBOARD_SIZE = 7;

/**
 * Whether a finished run would earn a spot on the board, so the game-over screen
 * only asks for a name when saving is worthwhile.
 * @param score - The run's final score.
 * @param topScores - Current board rows (at most LEADERBOARD_SIZE, order not relied on).
 * @returns True for a positive score that fits in an unfilled board or beats the lowest listed score.
 * @example
 * scoreQualifies(120, [{ score: 300 }]); // true — the board still has room
 */
export function scoreQualifies(score: number, topScores: ReadonlyArray<{ score: number }>): boolean {
  if (score <= 0) return false;
  if (topScores.length < LEADERBOARD_SIZE) return true;
  return score > Math.min(...topScores.map((entry) => entry.score));
}
