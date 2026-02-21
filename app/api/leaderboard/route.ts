import { NextRequest, NextResponse } from "next/server";
import { getTopScores, addScore } from "@/lib/leaderboard";

// Simple in-memory rate limiter: 1 submission per 5s per IP
const rateMap = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const last = rateMap.get(ip);
  if (last && now - last < 5000) {
    return true;
  }
  rateMap.set(ip, now);
  return false;
}

export async function GET() {
  const scores = await getTopScores(20);
  return NextResponse.json(scores);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few seconds." },
      { status: 429 },
    );
  }

  let body: { name?: string; score?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { name, score } = body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (name.trim().length > 20) {
    return NextResponse.json(
      { error: "Name must be 20 characters or less." },
      { status: 400 },
    );
  }

  if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
    return NextResponse.json(
      { error: "Score must be a non-negative number." },
      { status: 400 },
    );
  }

  await addScore(name.trim(), Math.floor(score));

  return NextResponse.json({ ok: true });
}
