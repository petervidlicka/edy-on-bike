/**
 * Run tickets for the leaderboard: the game asks for one when a run starts and sends it
 * back with the score (see POST /api/leaderboard).
 */
import { NextRequest, NextResponse } from "next/server";
import { createRun } from "@/lib/leaderboard";
import { clientIp, corsHeaders, isRateLimited, tooManyRequests, unavailable } from "@/lib/leaderboardApi";

/**
 * CORS preflight for the native apps.
 *
 * @param request - The incoming preflight request.
 * @returns An empty 204 with CORS headers for allowed origins.
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/**
 * Starts a run.
 *
 * @param request - The incoming request; no body.
 * @returns `{ runId }`, a 429 when called too fast, or a 503 if storage fails.
 */
export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
  try {
    if (await isRateLimited("run", clientIp(request))) return tooManyRequests(cors);
    const runId = await createRun();
    return NextResponse.json({ runId }, { headers: cors });
  } catch (error) {
    return unavailable(cors, error, "POST run");
  }
}
