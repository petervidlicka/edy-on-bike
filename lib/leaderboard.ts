import { Redis } from "@upstash/redis";

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

// --- In-memory fallback store ---

const memoryStore: LeaderboardEntry[] = [];

function getTopScoresMemory(limit: number): LeaderboardEntry[] {
  return memoryStore.slice(0, limit);
}

function addScoreMemory(name: string, score: number): void {
  const existing = memoryStore.find((e) => e.name === name);
  if (existing) {
    if (score > existing.score) {
      existing.score = score;
    }
  } else {
    memoryStore.push({ name, score });
  }
  memoryStore.sort((a, b) => b.score - a.score);
  memoryStore.splice(100); // keep only top 100 to prevent unbounded growth
}

// --- Public API ---

export async function getTopScores(
  limit: number = 20,
): Promise<LeaderboardEntry[]> {
  const redis = getRedis();
  if (redis) {
    return getTopScoresRedis(redis, limit);
  }
  return getTopScoresMemory(limit);
}

export async function addScore(name: string, score: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    return addScoreRedis(redis, name, score);
  }
  addScoreMemory(name, score);
}
