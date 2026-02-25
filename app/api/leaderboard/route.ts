import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getTopScores, getTotalPlayers, addScore } from "@/lib/leaderboard";

// Allow requests from the Capacitor native app (iOS: capacitor://localhost, Android: http://localhost)
const ALLOWED_ORIGINS = [
  "capacitor://localhost",
  "http://localhost",
];

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
  return {};
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

// --- Rate limiting ---
// Production: Redis-backed sliding window (survives serverless cold starts)
// Local dev: in-memory map capped at 1000 entries to prevent memory growth

let ratelimit: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(1, "5 s"),
    prefix: "edy-on-bike:rl",
  });
}

// Fallback for local dev (no Redis)
const rateMap = new Map<string, number>();

async function isRateLimited(ip: string): Promise<boolean> {
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    return !success;
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

export async function GET(request: NextRequest) {
  const [scores, totalPlayers] = await Promise.all([
    getTopScores(20),
    getTotalPlayers(),
  ]);
  return NextResponse.json({ scores, totalPlayers }, { headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);

  // Next.js 16 removed request.ip; use x-forwarded-for set by the hosting platform
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (await isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few seconds." },
      { status: 429, headers: cors },
    );
  }

  let body: { name?: string; score?: number; skin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers: cors });
  }

  const { name, score, skin } = body;

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
}
