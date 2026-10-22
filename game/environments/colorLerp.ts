/**
 * Colour blending for biome transitions: hex helpers, easing, and a cached deep blend
 * of two biome palettes.
 */
import type { EnvironmentPalette } from "./types";

// ── Hex ↔ RGB conversion ──

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    clamp(r).toString(16).padStart(2, "0") +
    clamp(g).toString(16).padStart(2, "0") +
    clamp(b).toString(16).padStart(2, "0")
  );
}

// ── Single color lerp ──

export function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(
    ar + (br - ar) * t,
    ag + (bg - ag) * t,
    ab + (bb - ab) * t
  );
}

// ── Easing ──

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Deep palette lerp ──
// Walks both palettes structurally and blends every pair of hex colour strings.

function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Blends two values of the same shape: hex colours are mixed, arrays element by element
 * (to the shorter length, e.g. the building schemes), objects key by key. Anything
 * else switches from `a` to `b` halfway. Keys only one side has are kept as they are:
 * biome-only colours (the incoming biome's obstacles) have nothing to blend with, and
 * keeping them lets those obstacles draw right during the transition.
 */
function lerpValue(a: unknown, b: unknown, t: number): unknown {
  if (isHexColor(a) && isHexColor(b)) {
    return lerpColor(a, b, t);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.min(a.length, b.length);
    const result: unknown[] = [];
    for (let i = 0; i < len; i++) {
      result.push(lerpValue(a[i], b[i], t));
    }
    return result;
  }
  if (isRecord(a) && isRecord(b)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(a)) {
      result[key] = key in b ? lerpValue(a[key], b[key], t) : a[key];
    }
    for (const key of Object.keys(b)) {
      if (!(key in result)) result[key] = b[key];
    }
    return result;
  }
  return t < 0.5 ? a : b;
}

/**
 * A blend of two palettes has the palette's shape, because `lerpValue` mirrors the
 * structure of `from` (and `to` only adds keys to it); this is the one place that fact
 * is asserted.
 */
function lerpPaletteShape(from: EnvironmentPalette, to: EnvironmentPalette, t: number): EnvironmentPalette {
  return lerpValue(from, to, t) as EnvironmentPalette;
}

/**
 * Blend steps per transition. Neighbouring steps differ by under one RGB unit on most
 * colours, so the fade still looks continuous.
 */
const PALETTE_STEPS = 128;

/** Blended palettes for the transition in progress, keyed by step. */
let paletteCache: { from: EnvironmentPalette; to: EnvironmentPalette; byStep: Map<number, EnvironmentPalette> } | null = null;

/**
 * Blends every colour in two biome palettes (biome-only keys are kept as they are).
 * Called every frame during a biome change, so `t` is rounded to PALETTE_STEPS and each
 * step is computed once, instead of re-parsing ~100 colours per frame on mobile.
 * @param t - 0 = `from`, 1 = `to`.
 * @example lerpPalette(SUBURBAN.palette, DUBAI.palette, 0.5)
 */
export function lerpPalette(
  from: EnvironmentPalette,
  to: EnvironmentPalette,
  t: number
): EnvironmentPalette {
  const step = Math.round(Math.min(1, Math.max(0, t)) * PALETTE_STEPS);
  if (!paletteCache || paletteCache.from !== from || paletteCache.to !== to) {
    paletteCache = { from, to, byStep: new Map() };
  }
  let palette = paletteCache.byStep.get(step);
  if (!palette) {
    palette = lerpPaletteShape(from, to, step / PALETTE_STEPS);
    paletteCache.byStep.set(step, palette);
  }
  return palette;
}
