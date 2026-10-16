/**
 * Browser-side calls to the leaderboard API. One place resolves the API base URL
 * (relative on the web, absolute in the mobile build) and turns failed responses
 * into errors with messages fit to show players.
 */

/**
 * Empty on the web (same-origin relative URL); the static mobile build has no
 * API routes of its own, so it points NEXT_PUBLIC_API_URL at the deployed site.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Full URL of the leaderboard endpoint for this build. */
export const LEADERBOARD_URL = `${API_BASE}/api/leaderboard`;

/** A leaderboard request that failed; `message` is safe to show to the player. */
export class LeaderboardError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "LeaderboardError";
  }
}

/** One row as the game-over screen renders it. */
export interface LeaderboardEntry {
  name: string;
  score: number;
  skin?: string;
}

/** Top scores plus how many distinct players have ever submitted. */
export interface LeaderboardData {
  scores: LeaderboardEntry[];
  totalPlayers: number;
}

// Rows come from the network; drop anything malformed rather than let one bad
// entry throw during render and take down the whole game-over screen.
function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.name === "string" &&
    typeof row.score === "number" &&
    (row.skin === undefined || typeof row.skin === "string")
  );
}

/** Prefers the API's own `{ error }` text, which is already written for players. */
async function errorFromResponse(res: Response): Promise<LeaderboardError> {
  try {
    const body: unknown = await res.json();
    if (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string") {
      return new LeaderboardError(body.error);
    }
  } catch {
    // Non-JSON error page (proxy, platform outage): fall through to a status-based message
  }
  if (res.status === 429) return new LeaderboardError("Too many requests. Try again in a few seconds.");
  return new LeaderboardError("The leaderboard is temporarily unavailable. Please try again later.");
}

/** Wraps fetch so a dropped connection reads as an actionable message, not a TypeError. */
async function request(init?: RequestInit): Promise<Response> {
  try {
    return await fetch(LEADERBOARD_URL, init);
  } catch (err) {
    throw new LeaderboardError("Couldn't reach the leaderboard. Check your connection and try again.", { cause: err });
  }
}

/**
 * Loads the current top scores.
 * @returns Only well-formed rows; a missing count reads as 0.
 * @throws LeaderboardError when the request fails or the API returns an error status.
 */
export async function fetchLeaderboard(): Promise<LeaderboardData> {
  const res = await request();
  if (!res.ok) throw await errorFromResponse(res);
  const data: unknown = await res.json().catch((err: unknown) => {
    throw new LeaderboardError("The leaderboard sent an unreadable response. Please try again later.", { cause: err });
  });
  const { scores, totalPlayers } = (data ?? {}) as { scores?: unknown; totalPlayers?: unknown };
  return {
    scores: Array.isArray(scores) ? scores.filter(isLeaderboardEntry) : [],
    totalPlayers: typeof totalPlayers === "number" ? totalPlayers : 0,
  };
}

/**
 * Submits a finished run.
 * @throws LeaderboardError when the score was not stored (rate limit, validation, outage).
 * @example
 * await submitScore({ name: "Edy", score: 1200, skin: "Racer" });
 */
export async function submitScore(entry: { name: string; score: number; skin: string }): Promise<void> {
  const res = await request({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw await errorFromResponse(res);
}
