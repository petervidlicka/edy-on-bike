/**
 * Small canvas helpers shared by the biome obstacle and backdrop renderers (Austria,
 * Tokyo): box mapping, polygons, rounded boxes, contact shadows, round-capped strokes,
 * soft glows and deterministic noise.
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
 * Fills a rounded rectangle. Built from arcs rather than ctx.roundRect, which older
 * iOS WebViews lack.
 */
export function fillRoundRect(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, r: number, color: string) {
  const rad = Math.min(r, rw / 2, rh / 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(rx + rad, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rad);
  ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rad);
  ctx.arcTo(rx, ry + rh, rx, ry, rad);
  ctx.arcTo(rx, ry, rx + rw, ry, rad);
  ctx.closePath();
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
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
