import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

export interface LeaderboardEntry {
  name: string;
  score: number;
}

const LEADERBOARD_KEY = "edy-on-bike:leaderboard";

// --- Upstash Redis store ---

function getRedis(): Redis | null {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
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
  return entries;
}

async function addScoreRedis(
  redis: Redis,
  name: string,
  score: number,
): Promise<void> {
  // Only update if the new score is greater than existing (GT flag)
  await redis.zadd(LEADERBOARD_KEY, { gt: true }, { score, member: name });
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

function addScoreFile(name: string, score: number): void {
  const entries = readFileStore();
  const existing = entries.find((e) => e.name === name);
  if (existing) {
    if (score > existing.score) existing.score = score;
  } else {
    entries.push({ name, score });
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

export async function addScore(name: string, score: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    return addScoreRedis(redis, name, score);
  }
  addScoreFile(name, score);
}
