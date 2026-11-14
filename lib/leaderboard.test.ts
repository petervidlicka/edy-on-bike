/**
 * Run tickets on the in-memory path (no Redis): single use, expiry, and restoring a
 * ticket after a failed save.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REDIS_VARS = [
  "storage_KV_REST_API_URL", "storage_KV_REST_API_TOKEN",
  "KV_REST_API_URL", "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN",
];

const RUN_TTL_MS = 3 * 60 * 60 * 1000;

/** Fresh module per test: the ticket map is module state. */
async function loadStore() {
  vi.resetModules();
  return import("./leaderboard");
}

beforeEach(() => {
  for (const name of REDIS_VARS) vi.stubEnv(name, "");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("getRedisConfig / getRedis without credentials", () => {
  it("reports Redis as not configured", async () => {
    const { getRedisConfig, getRedis } = await loadStore();
    expect(getRedisConfig()).toBeNull();
    expect(getRedis()).toBeNull();
  });

  it("takes URL and token from the same pair, in priority order", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "upstash-token");
    vi.stubEnv("KV_REST_API_URL", "https://kv.example"); // no token: incomplete pair is skipped
    const { getRedisConfig } = await loadStore();
    expect(getRedisConfig()).toEqual({ url: "https://upstash.example", token: "upstash-token" });
  });
});

describe("run tickets (memory path)", () => {
  it("redeems a ticket once, returning when the run started", async () => {
    const { createRun, consumeRun } = await loadStore();
    const startedAt = Date.now();
    const id = await createRun();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    vi.advanceTimersByTime(45_000);
    expect(await consumeRun(id)).toBe(startedAt);
    expect(await consumeRun(id)).toBeNull();
  });

  it("rejects unknown and expired tickets", async () => {
    const { createRun, consumeRun } = await loadStore();
    expect(await consumeRun("not-a-ticket")).toBeNull();
    const id = await createRun();
    vi.advanceTimersByTime(RUN_TTL_MS + 1);
    expect(await consumeRun(id)).toBeNull();
  });

  it("restores a redeemed ticket so a failed save can be retried, still single use", async () => {
    const { createRun, consumeRun, restoreRun } = await loadStore();
    const id = await createRun();
    const startedAt = await consumeRun(id);
    expect(startedAt).not.toBeNull();
    await restoreRun(id, startedAt as number);
    expect(await consumeRun(id)).toBe(startedAt);
    expect(await consumeRun(id)).toBeNull();
  });

  it("does not restore a ticket whose lifetime has run out", async () => {
    const { createRun, consumeRun, restoreRun } = await loadStore();
    const id = await createRun();
    const startedAt = (await consumeRun(id)) as number;
    vi.advanceTimersByTime(RUN_TTL_MS + 1);
    await restoreRun(id, startedAt);
    expect(await consumeRun(id)).toBeNull();
  });
});
