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
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
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

/** Default contact-shadow tint: a cool blue-grey that reads on snow and tarmac alike. */
const SNOW_SHADOW = "rgba(60,90,130,0.18)";

/**
 * Soft oval shadow under an obstacle, centred on (cx, by) just above the ground line.
 * @param ry - Half-height in px (2 by default).
 * @param color - Shadow tint; vehicles use a neutral black.
 */
export function contactShadow(ctx: CanvasRenderingContext2D, cx: number, by: number, rx: number, ry = 2, color = SNOW_SHADOW) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, by - 0.5, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Fills a grid of windows: `cols`×`rows` cells from (ox, oy) on a (cellW, cellH) pitch,
 * each window winW×winH in its cell's top-left. Shared by every tower in every biome.
 * @param color - One fill for all, or a per-cell picker for mixed lit and dark windows.
 */
export function fillWindowGrid(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number,
  cols: number, rows: number,
  cellW: number, cellH: number,
  winW: number, winH: number,
  color: string | ((row: number, col: number) => string),
) {
  if (typeof color === "string") ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (typeof color !== "string") ctx.fillStyle = color(r, c);
      ctx.fillRect(ox + c * cellW, oy + r * cellH, winW, winH);
    }
  }
}

// --- Flags ---

/** Points along a rippling flag's edge. */
const FLAG_STEPS = 8;

/** A flag pole `h` tall at x with a gold finial on top. */
export function drawFlagPole(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1.6, h);
  ctx.fillStyle = "#c8a040";
  ctx.beginPath();
  ctx.arc(x + 0.8, y, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Vertical ripple of a flag at `fx` (0 at the pole, 1 at the fly) for scene time `t`:
 * a travelling wave that grows towards the free edge.
 */
export function flagWave(t: number, amp: number, fx: number): number {
  return Math.sin(t + fx * 5) * amp * fx;
}

/**
 * Fills one horizontal band of a rippling flag whose cloth starts at (x0, y0) and is
 * fw×fh; `from` and `to` are 0–1 fractions of fh. Both the Austrian tricolour and the
 * Hinomaru are bands of this.
 */
export function fillFlagBand(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, fw: number, fh: number,
  from: number, to: number,
  t: number, amp: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i <= FLAG_STEPS; i++) {
    const fx = i / FLAG_STEPS;
    const px = x0 + fx * fw;
    const py = y0 + fh * from + flagWave(t, amp, fx);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  for (let i = FLAG_STEPS; i >= 0; i--) {
    const fx = i / FLAG_STEPS;
    ctx.lineTo(x0 + fx * fw, y0 + fh * to + flagWave(t, amp, fx));
  }
  ctx.closePath();
  ctx.fill();
}

/** Strokes a polyline (limbs, poles) with round caps. */
export function strokeLine(ctx: CanvasRenderingContext2D, pts: Pt[], color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
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
 * Fills the path traced so far with a unit-space gradient placed by translate(x, y),
 * rotate(angle) and scale(sx, sy). Path segments are fixed in canvas space as they are
 * added, so only the gradient moves: one cached unit gradient serves every size and
 * place, instead of a createLinearGradient per fill. A gradient from A to B is a unit
 * gradient along +x under translate(A), rotate(atan2(B − A)), scale(|B − A|).
 * @example
 * ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
 * fillTransformed(ctx, unitRadial, cx, cy, r, r);
 */
export function fillTransformed(ctx: CanvasRenderingContext2D, gradient: CanvasGradient, x: number, y: number, sx: number, sy: number, angle = 0): void {
  ctx.save();
  ctx.translate(x, y);
  if (angle !== 0) ctx.rotate(angle);
  ctx.scale(sx, sy);
  ctx.fillStyle = gradient;
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

// --- Offscreen sprites ---

/**
 * Cached offscreen canvases (static art drawn once, then blitted), bounded so a long
 * run can't grow the set without limit: the oldest entry goes when it fills up.
 */
const spriteCache = new Map<string, HTMLCanvasElement>();
const MAX_CACHED_SPRITES = 160;

/** Supersampling for cached sprites, so small text and 1px detail stay crisp when blitted. */
const SPRITE_SCALE = 2;

/** Draws a sprite's art into its own context; (0, 0) is the art's top-left, `w`×`h` its box. */
export type SpriteDraw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export interface SpriteOptions {
  /** Margin (game px) on every side for art that spills past its box (eaves, bottle necks). */
  pad?: number;
}

/** Adds to a bounded cache, dropping the oldest entry (Map keeps insertion order) when full. */
function putBounded<V>(cache: Map<string, V>, key: string, value: V, max: number): void {
  if (cache.size >= max) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, value);
}

/**
 * Returns an offscreen canvas holding `draw`'s output, built once per key and size
 * (sizes are rounded to whole pixels so near-identical boxes share one sprite).
 * Use it for art that is the same every frame — text, dense window grids, signs — so
 * drawing it costs one drawImage instead of dozens of fills.
 * @returns The sprite, or null where offscreen canvases aren't available (SSR, tests).
 */
export function cachedSprite(key: string, w: number, h: number, draw: SpriteDraw, opts: SpriteOptions = {}): HTMLCanvasElement | null {
  const pad = opts.pad ?? 0;
  const cw = Math.round(w);
  const ch = Math.round(h);
  const fullKey = `${key}|${cw}|${ch}|${pad}`;
  const cached = spriteCache.get(fullKey);
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((cw + pad * 2) * SPRITE_SCALE);
  canvas.height = Math.ceil((ch + pad * 2) * SPRITE_SCALE);
  const octx = canvas.getContext("2d");
  if (!octx) return null;
  octx.scale(SPRITE_SCALE, SPRITE_SCALE);
  octx.translate(pad, pad);
  draw(octx, cw, ch);
  putBounded(spriteCache, fullKey, canvas, MAX_CACHED_SPRITES);
  return canvas;
}

/**
 * Draws static art at (x, y) from a cached sprite (see cachedSprite), falling back to
 * drawing it directly where sprites aren't available. `draw` must not depend on the
 * caller's context state (font, alignment, alpha): it runs in a fresh context.
 * @example
 * drawSprite(ctx, `crate|${red}`, x, y, w, h, (c, cw, ch) => drawCrateArt(c, 0, 0, cw, ch, red));
 */
export function drawSprite(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, w: number, h: number, draw: SpriteDraw, opts: SpriteOptions = {}): void {
  const pad = opts.pad ?? 0;
  const cw = Math.round(w);
  const ch = Math.round(h);
  const sprite = cachedSprite(key, cw, ch, draw, opts);
  if (sprite) {
    ctx.drawImage(sprite, x - pad, y - pad, cw + pad * 2, ch + pad * 2);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  draw(ctx, cw, ch);
  ctx.restore();
}

// --- Cached text labels ---

/** A text label drawn from a cached sprite, anchored with textBaseline "middle". */
export interface TextLabel {
  text: string;
  /** Canvas font string, e.g. `bold 6px Arial, sans-serif` (the px size sets the sprite height). */
  font: string;
  color: string;
  /** Horizontal anchor; "center" if omitted. */
  align?: "left" | "center" | "right";
  /** Squeezes the text to fit, like fillText's maxWidth. */
  maxWidth?: number;
}

interface LabelSprite {
  canvas: HTMLCanvasElement | null;
  w: number;
  h: number;
}

const labelCache = new Map<string, LabelSprite>();
const MAX_CACHED_LABELS = 256;
/** Horizontal breathing room on each side of a label, so glyph overhangs aren't clipped. */
const LABEL_PAD = 2;

/** The px size in a canvas font string, or 10 when it has none. */
function fontPx(font: string): number {
  const m = /(\d+(?:\.\d+)?)px/.exec(font);
  return m ? parseFloat(m[1]) : 10;
}

/** Lays `label` out: text at the sprite's vertical centre, anchored by `align`. */
function paintLabel(ctx: CanvasRenderingContext2D, label: TextLabel, w: number, h: number): void {
  const align = label.align ?? "center";
  ctx.font = label.font;
  ctx.fillStyle = label.color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const ax = align === "left" ? LABEL_PAD : align === "right" ? w - LABEL_PAD : w / 2;
  ctx.fillText(label.text, ax, h / 2, label.maxWidth);
}

/**
 * Fills a text label at (x, y) — the anchor fillText would use with textBaseline
 * "middle" — from a sprite rasterised once per label. Text is costly to lay out every
 * frame on phones, and signs and brand marks are the same every frame.
 * @example
 * drawCachedText(ctx, { text: "STIEGL", font: "bold 6px Arial, sans-serif", color: red, maxWidth: cw * 0.66 }, cx + cw / 2, cy + ch * 0.62);
 */
export function drawCachedText(ctx: CanvasRenderingContext2D, label: TextLabel, x: number, y: number): void {
  const align = label.align ?? "center";
  const key = `${label.text}|${label.font}|${label.color}|${align}|${label.maxWidth ?? ""}`;
  let sprite = labelCache.get(key);
  if (!sprite) {
    ctx.save();
    ctx.font = label.font;
    const measured = ctx.measureText(label.text).width;
    ctx.restore();
    const textW = label.maxWidth === undefined ? measured : Math.min(measured, label.maxWidth);
    const w = Math.ceil(textW) + LABEL_PAD * 2;
    // Room above and below the em box for ascenders, descenders and tall CJK glyphs
    const h = Math.ceil(fontPx(label.font) * 1.6);
    sprite = { canvas: cachedSprite(`label|${key}`, w, h, (c, cw, ch) => paintLabel(c, label, cw, ch)), w, h };
    putBounded(labelCache, key, sprite, MAX_CACHED_LABELS);
  }
  const left = align === "left" ? x - LABEL_PAD : align === "right" ? x - sprite.w + LABEL_PAD : x - sprite.w / 2;
  if (sprite.canvas) {
    ctx.drawImage(sprite.canvas, left, y - sprite.h / 2, sprite.w, sprite.h);
    return;
  }
  ctx.save();
  ctx.translate(left, y - sprite.h / 2);
  paintLabel(ctx, label, sprite.w, sprite.h);
  ctx.restore();
}
