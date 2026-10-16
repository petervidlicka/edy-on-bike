"use client";

/**
 * "Next unlock" progress strip shared by the start and game-over screens: a mini preview
 * of the locked bike, the points still missing, and a fill bar. With `animateFrom` it
 * animates from the previous best to `bestScore`, celebrating each bike it crosses.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { SkinDefinition } from "@/game/types";
import { SKINS, getNextUnlock } from "@/game/skins";
import { drawSkinPreview } from "@/game/rendering";

interface UnlockProgressProps {
  /** Score the bar ends at (the saved best). */
  bestScore: number;
  cheatUnlocked: boolean;
  /** When set, animates from this previous best up to `bestScore`. */
  animateFrom?: number;
}

const PREVIEW_W = 72;
const PREVIEW_H = 79;
const FILL_MS = 800;
const CELEBRATE_MS = 1100;

/** One bar segment: from `startBest` to `endBest` within one tier (skin null = all unlocked). */
interface Stage {
  skin: SkinDefinition | null;
  startBest: number;
  endBest: number;
  startPct: number;
  endPct: number;
  /** True when this stage fills the bar completely and unlocks `skin`. */
  celebrate: boolean;
}

function pctFor(skin: SkinDefinition, best: number, previousThreshold: number): number {
  return Math.min(1, Math.max(0, (best - previousThreshold) / (skin.unlockScore - previousThreshold)));
}

/** Splits a from→to climb into one stage per tier crossed. */
function buildStages(from: number, to: number): Stage[] {
  const stages: Stage[] = [];
  let cur = from;
  for (let i = 0; i <= SKINS.length; i++) {
    const next = getNextUnlock(cur, false);
    if (!next) {
      stages.push({ skin: null, startBest: cur, endBest: cur, startPct: 1, endPct: 1, celebrate: false });
      break;
    }
    const startPct = next.progress;
    if (to >= next.skin.unlockScore) {
      stages.push({ skin: next.skin, startBest: cur, endBest: next.skin.unlockScore, startPct, endPct: 1, celebrate: true });
      cur = next.skin.unlockScore;
    } else {
      stages.push({
        skin: next.skin, startBest: cur, endBest: to, startPct,
        endPct: pctFor(next.skin, to, next.previousThreshold), celebrate: false,
      });
      break;
    }
  }
  return stages;
}

function MiniBike({ skin }: { skin: SkinDefinition }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawSkinPreview(ctx, skin, PREVIEW_W, PREVIEW_H);
  }, [skin]);
  return (
    <canvas
      ref={canvasRef}
      width={PREVIEW_W}
      height={PREVIEW_H}
      style={{ width: 36, height: 40, flexShrink: 0, imageRendering: "pixelated" }}
    />
  );
}

/**
 * @param props - Best score, cheat state and optional animation start.
 * @example
 * <UnlockProgress bestScore={570} cheatUnlocked={false} />
 * <UnlockProgress bestScore={newBest} cheatUnlocked={false} animateFrom={previousBest} />
 */
export function UnlockProgress({ bestScore, cheatUnlocked, animateFrom }: UnlockProgressProps) {
  const stages = useMemo(
    () => buildStages(Math.min(animateFrom ?? bestScore, bestScore), bestScore),
    [animateFrom, bestScore]
  );
  const [index, setIndex] = useState(0);
  const [filled, setFilled] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const stage = stages[Math.min(index, stages.length - 1)];

  // Drive one stage: fill the bar, then (if it completed a tier) celebrate and move on
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Next frame, so the bar mounts at its start width first and the transition runs
    timers.push(setTimeout(() => setFilled(true), 50));
    if (stage.celebrate) {
      timers.push(setTimeout(() => setCelebrating(true), 50 + FILL_MS));
      timers.push(
        setTimeout(() => {
          setCelebrating(false);
          setFilled(false);
          setIndex((i) => i + 1);
        }, 50 + FILL_MS + CELEBRATE_MS)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  if (cheatUnlocked) return null;

  const glass = {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.3rem 0.8rem",
    minWidth: "min(80vw, 320px)",
    background: "rgba(255,255,255,0.22)",
    backdropFilter: "blur(24px) saturate(200%)",
    WebkitBackdropFilter: "blur(24px) saturate(200%)",
    border: celebrating ? "1.5px solid rgba(234,179,8,0.8)" : "1.5px solid rgba(255,255,255,0.55)",
    borderRadius: "14px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8)",
    fontFamily: "var(--font-nunito), Arial, sans-serif",
    transition: "border-color 0.2s",
  } as const;

  if (!stage.skin) {
    return (
      <div style={{ ...glass, justifyContent: "center", color: "#92400e", fontSize: "0.85rem", fontWeight: 800 }}>
        All bikes unlocked! 🏆
      </div>
    );
  }

  const shownBest = filled ? stage.endBest : stage.startBest;
  const remaining = stage.skin.unlockScore - shownBest;
  const pct = (filled ? stage.endPct : stage.startPct) * 100;

  return (
    <div style={glass}>
      <div style={{ opacity: celebrating ? 1 : 0.7, transform: celebrating ? "scale(1.25)" : "none", transition: "transform 0.3s" }}>
        <MiniBike skin={stage.skin} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, color: celebrating ? "#92400e" : "#1e293b", fontSize: "0.78rem", fontWeight: 700, lineHeight: 1.2 }}>
          {celebrating
            ? `🔓 ${stage.skin.name} unlocked!`
            : remaining > 0
              ? `${remaining} more point${remaining === 1 ? "" : "s"} to unlock ${stage.skin.name}`
              : `${stage.skin.name} unlocked!`}
        </p>
        <div style={{ height: 6, marginTop: 4, borderRadius: 3, background: "rgba(30,41,59,0.15)", overflow: "hidden" }}>
          <div
            key={index}
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 3,
              background: celebrating ? "#eab308" : "#3b82f6",
              transition: filled ? `width ${FILL_MS}ms ease-out` : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
