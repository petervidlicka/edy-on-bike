/**
 * Public leaderboard API: GET returns the top scores, POST submits a score.
 * Called same-origin by the web app and cross-origin by the Capacitor apps.
 */
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getTopScores, getTotalPlayers, addScore, getRedisConfig } from "@/lib/leaderboard";
import { LEADERBOARD_SIZE } from "@/lib/leaderboardConfig";

// Origins of the Capacitor native apps. iOS serves the app from capacitor://localhost;
// Android uses https://localhost because Capacitor 6+ defaults androidScheme to "https".
const ALLOWED_ORIGINS = [
  "capacitor://localhost",
  "https://localhost",
];

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  // The response depends on Origin, so any cache in front of it must key on it
  const headers: Record<string, string> = { Vary: "Origin" };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return headers;
}

/**
 * CORS preflight for the native apps' JSON POSTs.
 *
 * @param request - The incoming preflight request.
 * @returns An empty 204 with CORS headers for allowed origins.
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

// --- Rate limiting ---
// Production: Redis-backed sliding window (survives serverless cold starts)
// Local dev: in-memory map capped at 1000 entries to prevent memory growth

const redisConfig = getRedisConfig();

// The limiter gets its own client with default deserialization; the store's client
// turns it off so player names always come back as strings.
const ratelimit = redisConfig
  ? new Ratelimit({
      redis: new Redis(redisConfig),
      limiter: Ratelimit.slidingWindow(1, "5 s"),
      prefix: "edy-on-bike:rl",
    })
  : null;

// Fallback for local dev (no Redis)
const rateMap = new Map<string, number>();
let warnedMissingRedis = false;

async function isRateLimited(ip: string): Promise<boolean> {
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    return !success;
  }
  if (process.env.VERCEL && !warnedMissingRedis) {
    warnedMissingRedis = true;
    console.error(
      "[leaderboard] Redis is not configured: rate limiting is per-instance and scores go to the " +
        "local file store, which does not persist on Vercel. Set KV_REST_API_URL/KV_REST_API_TOKEN " +
        "or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  // In-memory fallback: cap map size to prevent memory growth
  if (rateMap.size > 1000) rateMap.clear();
  const now = Date.now();
  const last = rateMap.get(ip);
  if (last && now - last < 5000) return true;
  rateMap.set(ip, now);
  return false;
}

const MAX_SCORE = 99999;

function unavailable(cors: Record<string, string>, error: unknown, method: string) {
  console.error(`[leaderboard] ${method} failed`, error);
  return NextResponse.json(
    { error: "The leaderboard is temporarily unavailable. Please try again later." },
    { status: 503, headers: cors },
  );
}

/**
 * Top scores plus the total number of players.
 *
 * @param request - The incoming request; only its Origin header is used.
 * @returns `{ scores, totalPlayers }`, or a 503 with CORS headers if storage fails.
 */
export async function GET(request: NextRequest) {
  const cors = corsHeaders(request);
  try {
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
 * @param request - JSON body `{ name: string, score: number, skin?: string }`.
 * @returns `{ ok: true }`, a 400/429 with a user-facing message, or a 503 if storage fails.
 */
export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);

  // Next.js 16 removed request.ip; use x-forwarded-for set by the hosting platform
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  try {
    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a few seconds." },
        { status: 429, headers: cors },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers: cors });
    }

    // Valid JSON can still be null, an array or a primitive
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400, headers: cors },
      );
    }

    const { name, score, skin } = body as Record<string, unknown>;

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required." }, { status: 400, headers: cors });
    }

    if (name.trim().length > 20) {
      return NextResponse.json(
        { error: "Name must be 20 characters or less." },
        { status: 400, headers: cors },
      );
    }

    if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
      return NextResponse.json(
        { error: "Score must be a non-negative number." },
        { status: 400, headers: cors },
      );
    }

    if (score > MAX_SCORE) {
      return NextResponse.json(
        { error: "Score out of range." },
        { status: 400, headers: cors },
      );
    }

    const skinStr = typeof skin === "string" && skin.trim().length <= 30 ? skin.trim() : undefined;
    await addScore(name.trim(), Math.floor(score), skinStr);

    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (error) {
    return unavailable(cors, error, "POST");
  }
}
