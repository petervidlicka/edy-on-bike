/**
 * Small canvas helpers shared by the biome obstacle renderers (Austria, Tokyo): box
 * mapping, polygons, rounded boxes, contact shadows and round-capped strokes.
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
