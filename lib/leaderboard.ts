import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

export interface LeaderboardEntry {
  name: string;
  score: number;
  skin?: string;
}

const LEADERBOARD_KEY = "edy-on-bike:leaderboard";
const SKIN_HASH_KEY = "edy-on-bike:leaderboard:skins";

// --- Upstash Redis store ---

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new Redis({
      url,
      token,
    });
  }
  return null;
}

async function getTopScoresRedis(
  redis: Redis,
  limit: number,
): Promise<LeaderboardEntry[]> {
  const raw = await redis.zrange<string[]>(LEADERBOARD_KEY, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  // zrange with withScores returns [member, score, member, score, ...]
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    entries.push({
      name: raw[i],
      score: Number(raw[i + 1]),
    });
  }

  // Fetch skin metadata from companion hash
  if (entries.length > 0) {
    const skinMap = await redis.hgetall<Record<string, string>>(SKIN_HASH_KEY) ?? {};
    for (const entry of entries) {
      if (skinMap[entry.name]) {
        entry.skin = skinMap[entry.name];
      }
    }
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

export async function getTopScores(
  limit: number = 20,
): Promise<LeaderboardEntry[]> {
  const redis = getRedis();
  if (redis) {
    return getTopScoresRedis(redis, limit);
  }
  return getTopScoresFile(limit);
}

export async function addScore(name: string, score: number, skin?: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    return addScoreRedis(redis, name, score, skin);
  }
  addScoreFile(name, score, skin);
}
