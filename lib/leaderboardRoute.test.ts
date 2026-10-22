/**
 * The leaderboard route handlers' validation and failure branches, with the store mocked
 * (no Redis: the memory rate limiter runs for real, so each request uses its own IP).
 * Lives under lib/ because the test glob doesn't cover app/.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MAX_LEADERBOARD_NAME_LENGTH } from "./leaderboardConfig";

const store = vi.hoisted(() => ({
  createRun: vi.fn<() => Promise<string>>(),
  consumeRun: vi.fn<(id: string) => Promise<number | null>>(),
  restoreRun: vi.fn<(id: string, startedAt: number) => Promise<void>>(),
  addScore: vi.fn<(name: string, score: number, skin?: string) => Promise<void>>(),
  getTopScores: vi.fn<(limit?: number) => Promise<{ name: string; score: number }[]>>(),
  getTotalPlayers: vi.fn<() => Promise<number>>(),
}));

vi.mock("@/lib/leaderboard", () => ({
  ...store,
  getRedis: () => null,
  REDIS_ENV_CANDIDATES: [],
}));

import { GET, OPTIONS, POST } from "@/app/api/leaderboard/route.web";

const URL = "http://localhost/api/leaderboard";
let requestNo = 0;

/** A POST from a fresh IP, so the per-IP submit limit never trips between tests. */
function post(body: unknown, { raw, ip }: { raw?: string; ip?: string } = {}): Promise<Response> {
  return POST(new NextRequest(URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip ?? `test-${++requestNo}` },
    body: raw ?? JSON.stringify(body),
  }));
}

async function expectBadRequest(response: Response, error: string): Promise<void> {
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error });
}

const validBody = { name: "Edy", score: 120, skin: "Road Racer", runId: "ticket-1" };

beforeEach(() => {
  vi.stubEnv("VERCEL", "");
  store.consumeRun.mockResolvedValue(Date.now() - 60_000);
  store.restoreRun.mockResolvedValue(undefined);
  store.addScore.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  store.consumeRun.mockReset();
  store.restoreRun.mockReset();
  store.addScore.mockReset();
  store.getTopScores.mockReset();
  store.getTotalPlayers.mockReset();
});

describe("OPTIONS", () => {
  it("answers the native app's preflight with CORS headers", async () => {
    const response = await OPTIONS(new NextRequest(URL, { method: "OPTIONS", headers: { origin: "capacitor://localhost" } }));
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("capacitor://localhost");
  });
});

describe("GET", () => {
  it("returns the top scores and player count", async () => {
    store.getTopScores.mockResolvedValue([{ name: "Edy", score: 10 }]);
    store.getTotalPlayers.mockResolvedValue(3);
    const response = await GET(new NextRequest(URL, { headers: { "x-forwarded-for": "get-ok" } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ scores: [{ name: "Edy", score: 10 }], totalPlayers: 3 });
  });

  it("returns a generic 503 when storage fails", async () => {
    store.getTopScores.mockRejectedValue(new Error("redis down"));
    store.getTotalPlayers.mockResolvedValue(0);
    const response = await GET(new NextRequest(URL, { headers: { "x-forwarded-for": "get-fail" } }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "The leaderboard is temporarily unavailable. Please try again later." });
  });
});

describe("POST validation", () => {
  it("rejects a body that isn't JSON or isn't an object", async () => {
    await expectBadRequest(await post(null, { raw: "{not json" }), "Invalid JSON.");
    await expectBadRequest(await post([validBody]), "Request body must be a JSON object.");
    await expectBadRequest(await post(null), "Request body must be a JSON object.");
  });

  it("validates the name with the shared rules", async () => {
    await expectBadRequest(await post({ ...validBody, name: "   " }), "Name is required.");
    await expectBadRequest(await post({ ...validBody, name: 42 }), "Name is required.");
    await expectBadRequest(
      await post({ ...validBody, name: "x".repeat(MAX_LEADERBOARD_NAME_LENGTH + 1) }),
      `Name must be ${MAX_LEADERBOARD_NAME_LENGTH} characters or less.`,
    );
    await expectBadRequest(await post({ ...validBody, name: "sh1t rider" }), "Please pick a different name.");
  });

  it("rejects scores that aren't finite non-negative numbers within the cap", async () => {
    for (const score of [-1, "120", Number.NaN, 100_000]) {
      await expectBadRequest(await post({ ...validBody, score }), "Score out of range.");
    }
  });

  it("requires a run ticket, checked after the name so a typo doesn't spend it", async () => {
    await expectBadRequest(await post({ ...validBody, runId: undefined }), "This run can't be saved. Update the game and play another run.");
    await expectBadRequest(await post({ ...validBody, runId: "x".repeat(65) }), "This run can't be saved. Update the game and play another run.");
    expect(store.consumeRun).not.toHaveBeenCalled();
  });

  it("rejects a used, unknown or expired ticket", async () => {
    store.consumeRun.mockResolvedValue(null);
    await expectBadRequest(await post(validBody), "This run can't be saved (it was already saved or is too old).");
    expect(store.consumeRun).toHaveBeenCalledWith("ticket-1");
  });

  it("rejects a score the run's duration can't explain", async () => {
    store.consumeRun.mockResolvedValue(Date.now()); // the run started just now
    await expectBadRequest(await post({ ...validBody, score: 50_000 }), "That score doesn't add up for this run.");
    expect(store.addScore).not.toHaveBeenCalled();
  });

  it("rate limits repeated submissions from one IP", async () => {
    const ip = "same-ip";
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await post(validBody, { ip })).status);
    expect(statuses.slice(0, 6)).toEqual([200, 200, 200, 200, 200, 200]);
    expect(statuses[6]).toBe(429);
  });
});

describe("POST storage", () => {
  it("stores the cleaned name, floored score and trimmed skin", async () => {
    const response = await post({ ...validBody, name: "  Edy​ Rider ", score: 120.9, skin: "  Road Racer " });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(store.addScore).toHaveBeenCalledWith("Edy Rider", 120, "Road Racer");
  });

  it("drops a skin that is missing or too long", async () => {
    await post({ ...validBody, skin: undefined });
    await post({ ...validBody, skin: "x".repeat(31) });
    expect(store.addScore).toHaveBeenNthCalledWith(1, "Edy", 120, undefined);
    expect(store.addScore).toHaveBeenNthCalledWith(2, "Edy", 120, undefined);
  });

  it("puts the ticket back and answers 503 when storing the score fails", async () => {
    const startedAt = Date.now() - 60_000;
    store.consumeRun.mockResolvedValue(startedAt);
    store.addScore.mockRejectedValue(new Error("redis down"));
    const response = await post(validBody);
    expect(response.status).toBe(503);
    expect(store.restoreRun).toHaveBeenCalledWith("ticket-1", startedAt);
  });

  it("still answers 503 when restoring the ticket fails too", async () => {
    store.addScore.mockRejectedValue(new Error("redis down"));
    store.restoreRun.mockRejectedValue(new Error("still down"));
    const response = await post(validBody);
    expect(response.status).toBe(503);
  });
});
