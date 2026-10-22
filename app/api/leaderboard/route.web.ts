/**
 * Public leaderboard API: GET returns the top scores, POST submits a score.
 * Called same-origin by the web app and cross-origin by the Capacitor apps.
 * A score must carry the ticket from POST /api/leaderboard/run (issued when the run
 * started), which bounds it by how long the run lasted and makes it single-use.
 */
import { NextRequest, NextResponse } from "next/server";
import { getTopScores, getTotalPlayers, addScore, consumeRun, restoreRun } from "@/lib/leaderboard";
import { LEADERBOARD_SIZE, MAX_LEADERBOARD_NAME_LENGTH } from "@/lib/leaderboardConfig";
import { cleanPlayerName, isPlayerNameAllowed } from "@/lib/playerName";
import { maxPlausibleScore, MAX_SCORE } from "@/game/scoreBounds";
import {
  badRequest, clientIp, corsHeaders, isRateLimited, tooManyRequests, unavailable,
} from "@/lib/leaderboardApi";

/**
 * CORS preflight for the native apps' JSON POSTs.
 *
 * @param request - The incoming preflight request.
 * @returns An empty 204 with CORS headers for allowed origins.
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/**
 * Top scores plus the total number of players.
 *
 * @param request - The incoming request; its Origin and client IP are used.
 * @returns `{ scores, totalPlayers }`, a 429 when polled too fast, or a 503 if storage fails.
 */
export async function GET(request: NextRequest) {
  const cors = corsHeaders(request);
  try {
    // Each read costs several Redis commands; a refresh loop shouldn't drain the quota
    if (await isRateLimited("read", clientIp(request))) return tooManyRequests(cors);
    const [scores, totalPlayers] = await Promise.all([
      getTopScores(LEADERBOARD_SIZE),
      getTotalPlayers(),
    ]);
    return NextResponse.json({ scores, totalPlayers }, { headers: cors });
  } catch (error) {
    return unavailable(cors, error, "GET");
  }
}

/**
 * Submits a score for a display name. Each name keeps only its best score.
 *
 * @param request - JSON body `{ name: string, score: number, runId: string, skin?: string }`.
 * @returns `{ ok: true }`, a 400/429 with a user-facing message, or a 503 if storage fails.
 */
export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);

  try {
    if (await isRateLimited("submit", clientIp(request))) return tooManyRequests(cors);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest(cors, "Invalid JSON.");
    }

    // Valid JSON can still be null, an array or a primitive
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return badRequest(cors, "Request body must be a JSON object.");
    }

    const { name: rawName, score, skin, runId } = body as Record<string, unknown>;

    const name = typeof rawName === "string" ? cleanPlayerName(rawName) : "";
    if (name.length === 0) return badRequest(cors, "Name is required.");
    if (name.length > MAX_LEADERBOARD_NAME_LENGTH) {
      return badRequest(cors, `Name must be ${MAX_LEADERBOARD_NAME_LENGTH} characters or less.`);
    }
    if (!isPlayerNameAllowed(name)) return badRequest(cors, "Please pick a different name.");

    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
      return badRequest(cors, "Score out of range.");
    }

    // Checked last, so a name typo doesn't use up the run's one submission
    if (typeof runId !== "string" || runId.length === 0 || runId.length > 64) {
      return badRequest(cors, "This run can't be saved. Update the game and play another run.");
    }
    const startedAt = await consumeRun(runId);
    if (startedAt === null) {
      return badRequest(cors, "This run can't be saved (it was already saved or is too old).");
    }
    if (score > maxPlausibleScore(Date.now() - startedAt)) {
      console.warn(`[leaderboard] Rejected implausible score ${score} after ${Date.now() - startedAt}ms`);
      return badRequest(cors, "That score doesn't add up for this run.");
    }

    const skinStr = typeof skin === "string" && skin.trim().length <= 30 ? skin.trim() : undefined;
    try {
      await addScore(name, Math.floor(score), skinStr);
    } catch (error) {
      // The form keeps the player on screen to retry, so the ticket has to survive the failure
      await restoreRun(runId, startedAt).catch((restoreError: unknown) => {
        console.error("[leaderboard] Could not restore run ticket after a failed save", restoreError);
      });
      throw error;
    }

    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (error) {
    return unavailable(cors, error, "POST");
  }
}
