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
    return result;
  }
  // Fallback: return 'a' when t < 0.5, 'b' when t >= 0.5
  return t < 0.5 ? a : b;
}

export function lerpPalette(
  from: EnvironmentPalette,
  to: EnvironmentPalette,
  t: number
): EnvironmentPalette {
  return lerpValue(
    from as unknown as PaletteValue,
    to as unknown as PaletteValue,
    t
  ) as unknown as EnvironmentPalette;
}
