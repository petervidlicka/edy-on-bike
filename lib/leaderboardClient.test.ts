/**
 * The browser-side client: malformed rows are dropped, and every failure surfaces as a
 * LeaderboardError with a message fit to show the player.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLeaderboard, LeaderboardError, startRun, submitScore } from "./leaderboardClient";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchLeaderboard", () => {
  it("keeps only well-formed rows and defaults the player count", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      scores: [
        { name: "Edy", score: 10 },
        { name: 1, score: 2 },
        { name: "No score" },
        "junk",
        null,
        { name: "Bad skin", score: 5, skin: 7 },
        { name: "Racer", score: 3, skin: "Road Racer" },
      ],
      totalPlayers: "lots",
    })));
    await expect(fetchLeaderboard()).resolves.toEqual({
      scores: [
        { name: "Edy", score: 10 },
        { name: "Racer", score: 3, skin: "Road Racer" },
      ],
      totalPlayers: 0,
    });
  });

  it("uses the API's own error text when the response carries one", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "Nope." }, 503)));
    await expect(fetchLeaderboard()).rejects.toMatchObject({ name: "LeaderboardError", message: "Nope." });
  });

  it("falls back to a status-based message for a non-JSON error page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 429 })));
    await expect(fetchLeaderboard()).rejects.toThrow("Too many requests. Try again in a few seconds.");
  });

  it("turns a dropped connection into a LeaderboardError that keeps the cause", async () => {
    const cause = new TypeError("Failed to fetch");
    vi.stubGlobal("fetch", vi.fn(async () => { throw cause; }));
    const error = await fetchLeaderboard().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(LeaderboardError);
    expect((error as LeaderboardError).cause).toBe(cause);
  });

  it("passes the abort signal through to fetch", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ scores: [], totalPlayers: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await fetchLeaderboard(controller.signal);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { signal: controller.signal });
  });
});

describe("startRun", () => {
  it("returns the ticket id", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ runId: "abc" })));
    await expect(startRun()).resolves.toBe("abc");
  });

  it("never throws: an unreadable or failed response yields null", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ runId: 42 })));
    await expect(startRun()).resolves.toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    await expect(startRun()).resolves.toBeNull();
  });
});

describe("submitScore", () => {
  it("posts the entry as JSON and resolves on success", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await submitScore({ name: "Edy", score: 12, skin: "Racer", runId: "abc" });
    expect(fetchMock).toHaveBeenCalledWith("/api/leaderboard", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "Edy", score: 12, skin: "Racer", runId: "abc" }),
    }));
  });

  it("rejects with the API's message when the score was not stored", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "Please pick a different name." }, 400)));
    await expect(submitScore({ name: "x", score: 1, skin: "s", runId: "r" }))
      .rejects.toThrow("Please pick a different name.");
  });
});
