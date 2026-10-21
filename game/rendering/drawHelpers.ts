/**
 * Small canvas helpers shared across the renderers (biome obstacles and backdrops, the
 * combo meter): box mapping, polygons, rounded boxes, contact shadows, round-capped
 * strokes, soft glows and deterministic noise.
 */
/** A canvas point as [x, y]. */
export type Pt = [number, number];

/** Maps fractions of the box to canvas points. */
export function boxMapper(x: number, y: number, w: number, h: number): (fx: number, fy: number) => Pt {
  return (fx, fy) => [x + w * fx, y + h * fy];
}

/** Fills a closed polygon through the given points. */
export function fillPoly(ctx: CanvasRenderingContext2D, pts: Pt[], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fill();
}

/**
 * Starts a new path tracing a rounded rectangle (radius clamped to fit), ready to fill,
 * stroke or clip. Built from arcs rather than ctx.roundRect, which older iOS WebViews lack.
 */
export function traceRoundRect(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, r: number) {
  const rad = Math.min(r, rw / 2, rh / 2);
  ctx.beginPath();
  ctx.moveTo(rx + rad, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rad);
  ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rad);
  ctx.arcTo(rx, ry + rh, rx, ry, rad);
  ctx.arcTo(rx, ry, rx + rw, ry, rad);
  ctx.closePath();
}

/** Fills a rounded rectangle (see traceRoundRect). */
export function fillRoundRect(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, r: number, color: string) {
  ctx.fillStyle = color;
  traceRoundRect(ctx, rx, ry, rw, rh, r);
  ctx.fill();
}

/** Soft oval shadow on the snow under an obstacle. */
export function contactShadow(ctx: CanvasRenderingContext2D, cx: number, by: number, rx: number) {
  ctx.fillStyle = "rgba(60,90,130,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, by - 0.5, rx, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Strokes a polyline (limbs, poles) with round caps. */
export function strokeLine(ctx: CanvasRenderingContext2D, pts: Pt[], color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.stroke();
}

/**
 * Soft round glow (lamps, screens, the moon) without shadowBlur, which is slow on phones.
 * Scales the current globalAlpha rather than replacing it, so it fades along with
 * whatever it is drawn into (e.g. a skyline across a biome transition).
 * @param alpha - Opacity at the glow's centre, relative to the current globalAlpha.
 */
export function glow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha = 0.35) {
  // A unit-radius gradient per colour, scaled into place: no gradient is created per frame
  const g = cachedGradient(ctx, `radial|${color}`, () => {
    const unit = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    unit.addColorStop(0, color);
    unit.addColorStop(1, "rgba(0,0,0,0)");
    return unit;
  });
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  ctx.scale(r, r);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Gradients per context (a gradient belongs to the context that made it), keyed by look. */
const gradientCache = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasGradient>>();

/**
 * Returns a gradient built once per context and key. Build it in unit space and position
 * it with translate/scale, so one gradient serves every size and place.
 * @example
 * const fade = cachedGradient(ctx, `down|${color}`, () => { const g = ctx.createLinearGradient(0, 0, 0, 1); ... return g; });
 */
export function cachedGradient(ctx: CanvasRenderingContext2D, key: string, build: () => CanvasGradient): CanvasGradient {
  let byKey = gradientCache.get(ctx);
  if (!byKey) {
    byKey = new Map();
    gradientCache.set(ctx, byKey);
  }
  let gradient = byKey.get(key);
  if (!gradient) {
    gradient = build();
    byKey.set(key, gradient);
  }
  return gradient;
}

/**
 * Deterministic 0..1 noise for a seed and a couple of indices, so procedural scenery
 * (peaks, windows, signs) comes out the same every frame without storing it.
 * @example
 * const h = groundY * (0.12 + hash01(i, 7) * 0.2);
 */
export function hash01(a: number, b = 0, c = 0): number {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
