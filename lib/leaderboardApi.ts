/**
 * Server-side plumbing shared by the leaderboard route handlers: CORS for the native
 * apps, client IPs, per-endpoint rate limits and the generic outage response.
 * Server-only (uses Redis); route handlers import it, client components must not.
 */
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis, REDIS_ENV_CANDIDATES } from "./leaderboard";

// Origins of the Capacitor native apps. iOS serves the app from capacitor://localhost;
// Android uses https://localhost because Capacitor 6+ defaults androidScheme to "https".
const ALLOWED_ORIGINS = [
  "capacitor://localhost",
  "https://localhost",
];

/**
 * CORS headers for a leaderboard response. Same-origin web requests need none; the
 * native apps' origins are allowed explicitly.
 * @param request - The incoming request; only its Origin header is read.
 */
export function corsHeaders(request: NextRequest): Record<string, string> {
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
 * The caller's IP for rate limiting. Next.js 16 removed request.ip; the hosting platform
 * sets x-forwarded-for.
 */
export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Requests allowed per IP per window, per endpoint. */
const LIMITS = {
  /** Board reads: the game-over screen loads once and reloads after a save. */
  read: { requests: 30, windowSec: 60 },
  /** Score saves: generous enough for a household or classroom sharing one IP. */
  submit: { requests: 6, windowSec: 60 },
  /** Run tickets: one per run started. */
  run: { requests: 30, windowSec: 60 },
} as const;

/** Which endpoint a request counts against. */
export type RateLimitBucket = keyof typeof LIMITS;

// undefined = not created yet; null = Redis not configured
let limiters: Record<RateLimitBucket, Ratelimit> | null | undefined;

/**
 * Production: Redis-backed sliding windows (survive serverless cold starts), on the same
 * lazily created client as the store, so the two can never disagree about whether Redis
 * is available. Null without credentials.
 */
function getLimiters(): Record<RateLimitBucket, Ratelimit> | null {
  if (limiters === undefined) {
    const redis = getRedis();
    if (redis) {
      const make = (bucket: RateLimitBucket) =>
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(LIMITS[bucket].requests, `${LIMITS[bucket].windowSec} s`),
          prefix: `edy-on-bike:rl:${bucket}`,
        });
      limiters = { read: make("read"), submit: make("submit"), run: make("run") };
    } else {
      limiters = null;
    }
  }
  return limiters;
}

// Local dev without Redis: per-process fixed windows, capped to prevent memory growth
const memoryWindows = new Map<string, { startedAt: number; count: number }>();
let warnedMissingRedis = false;

/**
 * Counts one request against `bucket` for this IP.
 * @returns True when the caller is over the limit and should get a 429.
 */
export async function isRateLimited(bucket: RateLimitBucket, ip: string): Promise<boolean> {
  const redisLimiters = getLimiters();
  if (redisLimiters) {
    const { success } = await redisLimiters[bucket].limit(ip);
    return !success;
  }
  if (process.env.VERCEL && !warnedMissingRedis) {
    warnedMissingRedis = true;
    const pairs = REDIS_ENV_CANDIDATES.map(([url, token]) => `${url}/${token}`).join(", ");
    console.error(
      "[leaderboard] Redis is not configured: rate limiting is per-instance and scores go to the " +
        `local file store, which does not persist on Vercel. Set one of these env var pairs: ${pairs}.`,
    );
  }
  if (memoryWindows.size > 1000) memoryWindows.clear();
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const { requests, windowSec } = LIMITS[bucket];
  const window = memoryWindows.get(key);
  if (!window || now - window.startedAt >= windowSec * 1000) {
    memoryWindows.set(key, { startedAt: now, count: 1 });
    return false;
  }
  window.count++;
  return window.count > requests;
}

/** 429 with a message players can act on. */
export function tooManyRequests(cors: Record<string, string>) {
  return NextResponse.json(
    { error: "Too many requests. Try again in a minute." },
    { status: 429, headers: cors },
  );
}

/** 400 with a message players can act on. */
export function badRequest(cors: Record<string, string>, error: string) {
  return NextResponse.json({ error }, { status: 400, headers: cors });
}

/** Logs a storage failure and returns a generic 503 (details stay in the server log). */
export function unavailable(cors: Record<string, string>, error: unknown, method: string) {
  console.error(`[leaderboard] ${method} failed`, error);
  return NextResponse.json(
    { error: "The leaderboard is temporarily unavailable. Please try again later." },
    { status: 503, headers: cors },
  );
}
