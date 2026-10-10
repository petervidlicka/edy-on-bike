/**
 * Leaderboard settings shared by the API route (server) and the game-over
 * screen (client). This module must stay free of server-only imports
 * (Redis, fs) so client components can import it without bloating the bundle.
 */

/**
 * Number of entries the leaderboard API returns and the game-over screen shows.
 * Keeping one constant stops the API from sending rows the UI never renders.
 */
export const LEADERBOARD_SIZE = 7;
