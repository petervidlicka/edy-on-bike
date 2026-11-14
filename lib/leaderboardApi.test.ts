/**
 * Covers the route plumbing without Redis: CORS for the native origins, the client IP
 * header, and the in-memory rate limiter used in local dev.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const REDIS_VARS = [
  "storage_KV_REST_API_URL", "storage_KV_REST_API_TOKEN",
  "KV_REST_API_URL", "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN",
];

/** Fresh module per test: the limiter's memory windows and lazy client are module state. */
async function loadApi() {
  vi.resetModules();
  return import("./leaderboardApi");
}

function request(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/leaderboard", { headers });
}

beforeEach(() => {
  for (const name of REDIS_VARS) vi.stubEnv(name, "");
  vi.stubEnv("VERCEL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("corsHeaders", () => {
  it("allows the native app origins and always varies on Origin", async () => {
    const { corsHeaders } = await loadApi();
    for (const origin of ["capacitor://localhost", "https://localhost"]) {
      const headers = corsHeaders(request({ origin }));
      expect(headers).toMatchObject({
        Vary: "Origin",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
    }
  });

  it("sets no allow headers for other origins or same-origin requests", async () => {
    const { corsHeaders } = await loadApi();
    expect(corsHeaders(request({ origin: "https://evil.example" }))).toEqual({ Vary: "Origin" });
    expect(corsHeaders(request())).toEqual({ Vary: "Origin" });
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for hop", async () => {
    const { clientIp } = await loadApi();
    expect(clientIp(request({ "x-forwarded-for": " 203.0.113.9 , 10.0.0.1" }))).toBe("203.0.113.9");
  });

  it("falls back to 'unknown' without the header", async () => {
    const { clientIp } = await loadApi();
    expect(clientIp(request())).toBe("unknown");
  });
});

describe("isRateLimited (memory path, no Redis)", () => {
  it("allows the configured number of requests per window and blocks the next", async () => {
    const { isRateLimited } = await loadApi();
    for (let i = 0; i < 6; i++) expect(await isRateLimited("submit", "ip-a")).toBe(false);
    expect(await isRateLimited("submit", "ip-a")).toBe(true);
  });

  it("counts each IP and each bucket separately", async () => {
    const { isRateLimited } = await loadApi();
    for (let i = 0; i < 6; i++) await isRateLimited("submit", "ip-a");
    expect(await isRateLimited("submit", "ip-a")).toBe(true);
    expect(await isRateLimited("submit", "ip-b")).toBe(false);
    expect(await isRateLimited("read", "ip-a")).toBe(false);
  });

  it("opens a new window once the old one has elapsed", async () => {
    vi.useFakeTimers();
    const { isRateLimited } = await loadApi();
    for (let i = 0; i < 6; i++) await isRateLimited("submit", "ip-a");
    expect(await isRateLimited("submit", "ip-a")).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(await isRateLimited("submit", "ip-a")).toBe(false);
  });
});
