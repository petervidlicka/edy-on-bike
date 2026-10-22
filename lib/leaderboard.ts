/**
 * Leaderboard storage: an Upstash Redis sorted set in production, with a
 * JSON-file fallback for local development when no Redis credentials exist.
 */
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { LEADERBOARD_SIZE } from "./leaderboardConfig";
import type { LeaderboardEntry } from "./leaderboardConfig";

/** Upstash REST credentials. */
export interface RedisConfig {
  url: string;
  token: string;
}

const LEADERBOARD_KEY = "edy-on-bike:leaderboard";
const SKIN_HASH_KEY = "edy-on-bike:leaderboard:skins";
const RUN_KEY_PREFIX = "edy-on-bike:run:";

/** How long a run ticket stays redeemable; longer than any real run, pauses included. */
const RUN_TTL_SECONDS = 3 * 60 * 60;

// --- Upstash Redis store ---

/**
 * Env var name pairs for the Upstash REST URL and token, in priority order.
 * `storage_KV_*` comes first: the current Vercel Marketplace connection uses
 * that prefix, while the unprefixed `KV_*` vars are left over from a deleted
 * database. Then the plain Upstash names (`UPSTASH_REDIS_REST_*`).
 */
const REDIS_ENV_CANDIDATES = [
  ["storage_KV_REST_API_URL", "storage_KV_REST_API_TOKEN"],
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
] as const;

/**
 * Reads Upstash credentials from the first complete env var pair in
 * {@link REDIS_ENV_CANDIDATES}. URL and token are taken from the same pair so
 * a new URL is never combined with a stale token. The store and the API rate
 * limiter both use this, so they can never disagree about whether Redis is
 * available.
 *
 * @returns The REST URL and token, or `null` when Redis is not configured.
 */
export function getRedisConfig(): RedisConfig | null {
  for (const [urlVar, tokenVar] of REDIS_ENV_CANDIDATES) {
    const url = process.env[urlVar];
    const token = process.env[tokenVar];
    if (url && token) return { url, token };
  }
  return null;
}

// undefined = not created yet; null = Redis not configured
let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient === undefined) {
    const config = getRedisConfig();
    // Names are arbitrary player input. With automatic deserialization the client
    // JSON-parses every reply, so a stored name like "true" or "123" would come
    // back as a boolean or number instead of the string the player typed.
    redisClient = config ? new Redis({ ...config, automaticDeserialization: false }) : null;
  }
  return redisClient;
}

async function getTopScoresRedis(
  redis: Redis,
  limit: number,
): Promise<LeaderboardEntry[]> {
  const raw = await redis.zrange<string[]>(LEADERBOARD_KEY, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  // zrange with withScores returns [member, score, member, score, ...] as raw strings
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const score = Number(raw[i + 1]);
    if (!Number.isFinite(score)) continue;
    entries.push({ name: String(raw[i]), score });
  }

  // Fetch skin metadata only for the entries we retrieved (avoids full hash scan)
  if (entries.length > 0) {
    const names = entries.map((e) => e.name);
    // Without automatic deserialization, hmget returns the raw reply: one value per
    // requested field, in order, with null for fields that have no skin stored.
    const skins = (await redis.hmget(SKIN_HASH_KEY, ...names)) as unknown as (string | null)[] | null;
    entries.forEach((entry, i) => {
      const skin = skins?.[i];
      if (typeof skin === "string" && skin.length > 0) entry.skin = skin;
    });
  }

  return entries;
}

async function addScoreRedis(
  redis: Redis,
  name: string,
  score: number,
  skin?: string,
): Promise<void> {
  // Only update if the new score is greater than existing (GT flag)
  await redis.zadd(LEADERBOARD_KEY, { gt: true }, { score, member: name });
  // Store skin in companion hash (always update — ZADD with GT may have accepted)
  if (skin) {
    const currentScore = await redis.zscore(LEADERBOARD_KEY, name);
    if (currentScore !== null && Number(currentScore) <= score) {
      await redis.hset(SKIN_HASH_KEY, { [name]: skin });
    }
  }
}

// --- File-based fallback store (persists across hot-reloads in local dev) ---

const DATA_FILE = path.join(process.cwd(), "data", "leaderboard.json");

function readFileStore(): LeaderboardEntry[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as LeaderboardEntry[];
  } catch (error) {
    // A corrupt dev file shouldn't take the game-over screen down; start from an empty board
    console.error(`[leaderboard] Ignoring unreadable ${DATA_FILE}`, error);
    return [];
  }
}

/** Throws on failure, so the API reports an error instead of claiming the score was saved. */
function writeFileStore(entries: LeaderboardEntry[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

function getTopScoresFile(limit: number): LeaderboardEntry[] {
  return readFileStore().slice(0, limit);
}

function addScoreFile(name: string, score: number, skin?: string): void {
  const entries = readFileStore();
  const existing = entries.find((e) => e.name === name);
  if (existing) {
    if (score > existing.score) {
      existing.score = score;
      if (skin) existing.skin = skin;
    }
  } else {
    entries.push({ name, score, skin });
  }
  entries.sort((a, b) => b.score - a.score);
  entries.splice(100); // keep top 100
  writeFileStore(entries);
}

// --- Public API ---

/**
 * Highest scores first, from Redis when configured, otherwise the local file store.
 *
 * @param limit - Maximum number of entries to return.
 * @returns Entries with string names and finite numeric scores.
 */
export async function getTopScores(
  limit: number = LEADERBOARD_SIZE,
): Promise<LeaderboardEntry[]> {
  const redis = getRedis();
  if (redis) {
    return getTopScoresRedis(redis, limit);
  }
  return getTopScoresFile(limit);
}

/**
 * Number of distinct names that have ever submitted a score.
 *
 * @returns The size of the leaderboard set.
 */
export async function getTotalPlayers(): Promise<number> {
  const redis = getRedis();
  if (redis) {
    return Number(await redis.zcard(LEADERBOARD_KEY));
  }
  return readFileStore().length;
}

// --- Run tickets ---

/** In-memory tickets for local dev without Redis (single process, so a Map is enough). */
const memoryRuns = new Map<string, number>();

/**
 * Registers a run that just started. The ticket must accompany its score, so a score can
 * only be submitted once and is checked against how long the run actually lasted.
 * @returns The ticket id to send back with the score.
 */
export async function createRun(): Promise<string> {
  const id = randomUUID();
  const redis = getRedis();
  if (redis) {
    await redis.set(`${RUN_KEY_PREFIX}${id}`, String(Date.now()), { ex: RUN_TTL_SECONDS });
  } else {
    const cutoff = Date.now() - RUN_TTL_SECONDS * 1000;
    for (const [runId, startedAt] of memoryRuns) if (startedAt < cutoff) memoryRuns.delete(runId);
    memoryRuns.set(id, Date.now());
  }
  return id;
}

/**
 * Redeems a run ticket (single use).
 * @returns When the run started (ms since epoch), or null for an unknown, expired or used ticket.
 */
export async function consumeRun(id: string): Promise<number | null> {
  const redis = getRedis();
  if (redis) {
    const startedAt = await redis.getdel<string>(`${RUN_KEY_PREFIX}${id}`);
    const ms = Number(startedAt);
    return startedAt !== null && Number.isFinite(ms) ? ms : null;
  }
  const startedAt = memoryRuns.get(id);
  memoryRuns.delete(id);
  return startedAt !== undefined && Date.now() - startedAt < RUN_TTL_SECONDS * 1000 ? startedAt : null;
}

/**
 * Puts a redeemed ticket back, with the lifetime it had left. For when storing the score
 * fails after `consumeRun`: the player is told to retry, so the retry has to find the ticket.
 * Redemption stays atomic (GETDEL), so a ticket is still never accepted twice.
 * @param id - The ticket id that `consumeRun` just redeemed.
 * @param startedAt - What `consumeRun` returned for it.
 */
export async function restoreRun(id: string, startedAt: number): Promise<void> {
  const remainingSeconds = Math.floor(RUN_TTL_SECONDS - (Date.now() - startedAt) / 1000);
  if (remainingSeconds <= 0) return;
  const redis = getRedis();
  if (redis) {
    await redis.set(`${RUN_KEY_PREFIX}${id}`, String(startedAt), { ex: remainingSeconds });
  } else {
    memoryRuns.set(id, startedAt);
  }
}

/**
 * Records a score, keeping each name's best only.
 *
 * @param name - Display name, already validated and trimmed by the API route.
 * @param score - Non-negative integer score.
 * @param skin - Optional bike skin shown next to the name.
 */
export async function addScore(name: string, score: number, skin?: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    return addScoreRedis(redis, name, score, skin);
  }
  addScoreFile(name, score, skin);
}
