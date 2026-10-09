/**
 * Leaderboard storage: an Upstash Redis sorted set in production, with a
 * JSON-file fallback for local development when no Redis credentials exist.
 */
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";
import { LEADERBOARD_SIZE } from "./leaderboardConfig";

/** One row of the public leaderboard, as returned by the API. */
export interface LeaderboardEntry {
  name: string;
  score: number;
  skin?: string;
}

/** Upstash REST credentials. */
export interface RedisConfig {
  url: string;
  token: string;
}

const LEADERBOARD_KEY = "edy-on-bike:leaderboard";
const SKIN_HASH_KEY = "edy-on-bike:leaderboard:skins";

// --- Upstash Redis store ---

/**
 * Reads Upstash credentials, accepting both the Vercel KV / Marketplace names
 * (`KV_REST_API_*`) and the plain Upstash names (`UPSTASH_REDIS_REST_*`).
 * The store and the API rate limiter both use this, so they can never
 * disagree about whether Redis is available.
 *
 * @returns The REST URL and token, or `null` when Redis is not configured.
 */
export function getRedisConfig(): RedisConfig | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
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
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function writeFileStore(entries: LeaderboardEntry[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch {
    // non-fatal — fall through silently
  }
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
