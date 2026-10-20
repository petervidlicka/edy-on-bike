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
// Recursively walks the palette object and lerps every hex color string.

type PaletteValue =
  | string
  | { [key: string]: PaletteValue }
  | Array<{ [key: string]: PaletteValue }>;

function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

function lerpValue(a: PaletteValue, b: PaletteValue, t: number): PaletteValue {
  if (isHexColor(a) && isHexColor(b)) {
    return lerpColor(a, b, t);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    // For arrays (e.g. buildings), lerp element-by-element up to min length
    const len = Math.min(a.length, b.length);
    const result: Array<{ [key: string]: PaletteValue }> = [];
    for (let i = 0; i < len; i++) {
      result.push(lerpValue(a[i], b[i], t) as { [key: string]: PaletteValue });
    }
    return result;
  }
  if (typeof a === "object" && typeof b === "object" && a !== null && b !== null && !Array.isArray(a) && !Array.isArray(b)) {
    const result: { [key: string]: PaletteValue } = {};
    for (const key of Object.keys(a)) {
      if (key in b) {
        result[key] = lerpValue(
          (a as Record<string, PaletteValue>)[key],
          (b as Record<string, PaletteValue>)[key],
          t
        );
      } else {
        result[key] = (a as Record<string, PaletteValue>)[key];
      }
    }
    // Biome-only colours (e.g. the incoming biome's obstacle colours) have nothing to
    // blend with; keep them so the new biome's obstacles draw right during the transition
    for (const key of Object.keys(b)) {
      if (!(key in result)) result[key] = (b as Record<string, PaletteValue>)[key];
    }
    return result;
  }
  // Fallback: return 'a' when t < 0.5, 'b' when t >= 0.5
  return t < 0.5 ? a : b;
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
    palette = lerpValue(
      from as unknown as PaletteValue,
      to as unknown as PaletteValue,
      step / PALETTE_STEPS
    ) as unknown as EnvironmentPalette;
    paletteCache.byStep.set(step, palette);
  }
  return palette;
}
