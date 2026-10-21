/**
 * Night Tokyo backdrop: the night sky band (stars, moon, Mt Fuji, a distant skyline),
 * neon reflections on the wet road, and the street layer — neon towers, a konbini, an
 * izakaya, Tokyo Tower, Skytree, a pagoda, a torii, a big-screen building, an elevated
 * train line, night sakura, street lamps, flags and pedestrians under umbrellas.
 *
 * Neon signs glow through shadowBlur, which is far too slow per frame on phones, so each
 * sign is drawn once into an offscreen canvas and reused (see getNeonSign).
 */
import type { EnvironmentPalette, BackgroundDrawFn } from "../../environments/types";
import type { ViewBounds } from "../../Camera";
import { drawWalkingPerson } from "./shared";
import { glow, hash01 } from "../drawHelpers";

const JP_FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif';

const NEON = ["#ff3d8b", "#3de8ff", "#ffd23d", "#5dff7a", "#b45dff", "#ff5a3d", "#ff9a3d"];
const SIGN_TEXTS = ["ラーメン", "寿司", "居酒屋", "カラオケ", "ホテル", "焼鳥", "喫茶", "ゲーム", "東京", "酒場", "薬"];
const BILLBOARD_TEXTS = ["TOKYO", "カラオケ", "NEON", "ゲーム", "24H"];

// --- Cached neon signs ---

const signCache = new Map<string, HTMLCanvasElement>();
/** Supersampling for the cached signs so tiny glyphs stay crisp when scaled down. */
const SIGN_SCALE = 2;

/**
 * Returns an offscreen canvas holding a glowing neon sign: a dark panel with a neon
 * border and the text in neon, laid out top-to-bottom when vertical. Built once per
 * look and cached, so drawing a sign each frame is a single drawImage.
 * @param text - Sign text (Japanese or Latin).
 * @param color - Neon colour.
 * @param vertical - Stack the characters top to bottom.
 * @param fontPx - Glyph size in game pixels.
 */
function getNeonSign(text: string, color: string, vertical: boolean, fontPx: number): HTMLCanvasElement {
  const key = `${text}|${color}|${vertical ? 1 : 0}|${fontPx}`;
  const cached = signCache.get(key);
  if (cached) return cached;

  const pad = 4;
  const glowPad = 6;
  const chars = [...text];
  const panelW = vertical ? fontPx + pad * 2 : chars.length * fontPx * 0.95 + pad * 2;
  const panelH = vertical ? chars.length * (fontPx + 1) + pad * 2 : fontPx + pad * 2;
  const c = document.createElement("canvas");
  c.width = Math.ceil((panelW + glowPad * 2) * SIGN_SCALE);
  c.height = Math.ceil((panelH + glowPad * 2) * SIGN_SCALE);
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.scale(SIGN_SCALE, SIGN_SCALE);
  ctx.translate(glowPad, glowPad);

  // Panel and neon border tube.
  ctx.fillStyle = "rgba(12,10,24,0.88)";
  ctx.fillRect(0, 0, panelW, panelH);
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(1.5, 1.5, panelW - 3, panelH - 3);

  // Glyphs: drawn twice, glow then a whiter core, like a lit tube.
  ctx.font = `bold ${fontPx}px ${JP_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [fill, blur] of [[color, 8], ["#ffffff", 2]] as const) {
    ctx.fillStyle = fill;
    ctx.shadowBlur = blur;
    ctx.globalAlpha = fill === "#ffffff" ? 0.55 : 1;
    if (vertical) {
      chars.forEach((ch, i) => ctx.fillText(ch, panelW / 2, pad + (fontPx + 1) * i + fontPx / 2 + 0.5));
    } else {
      ctx.fillText(text, panelW / 2, panelH / 2 + 0.5, panelW - pad * 2);
    }
  }
  ctx.globalAlpha = 1;

  signCache.set(key, c);
  return c;
}

/** Draws a cached sign with its panel's top-left at (x, y); `flicker` seeds an occasional blink-off. */
function drawNeonSign(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, vertical: boolean, fontPx: number, flicker: number) {
  // About one sign in six has a dodgy tube that cuts out now and then
  if (flicker < 0.16 && Math.sin(performance.now() / 70 + flicker * 999) > 0.93) return;
  const sign = getNeonSign(text, color, vertical, fontPx);
  const glowPad = 6;
  ctx.drawImage(sign, x - glowPad, y - glowPad, sign.width / SIGN_SCALE, sign.height / SIGN_SCALE);
}

/** Blinking red aviation light on a rooftop or mast. */
function aviationLight(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  const on = Math.floor(performance.now() / 700 + seed) % 2 === 0;
  ctx.fillStyle = on ? "#ff3a3a" : "#5a1a1a";
  ctx.beginPath();
  ctx.arc(x, y, 1.4, 0, Math.PI * 2);
  ctx.fill();
  if (on) glow(ctx, x, y, 7, "#ff3a3a", 0.6);
}

// --- Night sky (skyline band) ---

/**
 * Night sky behind the street: twinkling stars and a moon fixed in the sky, Mt Fuji far
 * off, and a distant skyline of lit windows; the last two scroll at slow parallax.
 */
export function drawTokyoNightSky(ctx: CanvasRenderingContext2D, view: ViewBounds, groundY: number, offset: number) {
  const t = performance.now() / 1000;
  const viewW = view.right - view.left;
  const skyTop = Math.min(0, view.top);
  // Fade alpha set by drawBackground across a biome transition; every opacity here scales it
  const fade = ctx.globalAlpha;

  // Stars in the upper sky, spread over the whole view (it widens when the camera zooms out).
  ctx.fillStyle = "#ffffff";
  const starCount = Math.floor(viewW / 9);
  for (let i = 0; i < starCount; i++) {
    const sx = view.left + hash01(i, 1) * viewW;
    const sy = skyTop + hash01(i, 2) * (groundY * 0.45 - skyTop);
    ctx.globalAlpha = fade * (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * (1 + hash01(i, 3) * 2) + i)));
    ctx.fillRect(sx, sy, hash01(i, 4) < 0.15 ? 1.6 : 1, hash01(i, 4) < 0.15 ? 1.6 : 1);
  }
  ctx.globalAlpha = fade;

  // Moon with a soft halo.
  const mx = view.left + viewW * 0.82;
  const my = groundY * 0.18;
  glow(ctx, mx, my, groundY * 0.16, "#fff4d8", 0.35);
  ctx.fillStyle = "#fbf2d8";
  ctx.beginPath();
  ctx.arc(mx, my, groundY * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(200,180,140,0.25)";
  ctx.beginPath();
  ctx.arc(mx - groundY * 0.012, my - groundY * 0.008, groundY * 0.01, 0, Math.PI * 2);
  ctx.arc(mx + groundY * 0.016, my + groundY * 0.014, groundY * 0.007, 0, Math.PI * 2);
  ctx.fill();

  const baseY = groundY - 16;

  // Mt Fuji: one broad cone with a snowcap, repeating far apart.
  const fujiSpan = groundY * 4;
  const fujiOffset = (offset * 0.3) % fujiSpan;
  const firstFuji = Math.floor(view.left / fujiSpan) - 1;
  for (let k = firstFuji; k * fujiSpan < view.right + fujiSpan; k++) {
    const fx = groundY * 0.8 - fujiOffset + k * fujiSpan;
    if (fx + groundY * 0.7 < view.left || fx - groundY * 0.7 > view.right) continue;
    const half = groundY * 0.62;
    const peakY = baseY - groundY * 0.42;
    ctx.fillStyle = "#2a2a52";
    ctx.beginPath();
    ctx.moveTo(fx - half, baseY);
    ctx.quadraticCurveTo(fx - half * 0.3, baseY - groundY * 0.2, fx - half * 0.12, peakY);
    ctx.lineTo(fx + half * 0.12, peakY);
    ctx.quadraticCurveTo(fx + half * 0.3, baseY - groundY * 0.2, fx + half, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c8cce8";
    ctx.beginPath();
    ctx.moveTo(fx - half * 0.12, peakY);
    ctx.lineTo(fx + half * 0.12, peakY);
    ctx.lineTo(fx + half * 0.26, peakY + groundY * 0.08);
    for (let i = 1; i < 6; i++) {
      const f = i / 6;
      ctx.lineTo(fx + half * (0.26 - 0.52 * f), peakY + groundY * (0.08 + (i % 2 === 0 ? -0.015 : 0.02)));
    }
    ctx.lineTo(fx - half * 0.26, peakY + groundY * 0.08);
    ctx.closePath();
    ctx.fill();
  }

  // Distant skyline: blocky silhouettes with a scatter of lit windows.
  const blockW = 26;
  const off = offset * 0.55;
  const first = Math.floor((off + view.left) / blockW) - 1;
  const last = Math.ceil((off + view.right) / blockW) + 1;
  for (let i = first; i <= last; i++) {
    const bx = i * blockW - off;
    const bh = groundY * (0.12 + hash01(i, 7) * 0.2);
    ctx.fillStyle = "#1a1838";
    ctx.fillRect(bx, baseY - bh, blockW + 1, bh);
    ctx.fillStyle = "#ffd890";
    for (let k = 0; k < 6; k++) {
      if (hash01(i, k, 9) > 0.5) continue;
      ctx.globalAlpha = fade * 0.5;
      ctx.fillRect(bx + 3 + hash01(i, k, 11) * (blockW - 6), baseY - bh + 4 + hash01(i, k, 13) * (bh - 8), 1.4, 1.4);
    }
    ctx.globalAlpha = fade;
  }
}

// --- Wet road reflections (road overlay) ---

/**
 * Neon smears and streetlight shine on the wet road. Positions come from hash01 of a
 * cell index, scrolled at the building layer's pace so they read as reflections of it.
 */
export function drawNeonReflections(ctx: CanvasRenderingContext2D, view: ViewBounds, groundY: number, offset: number) {
  const cell = 46;
  // Fade alpha set by drawBackground across a biome transition; every opacity here scales it
  const fade = ctx.globalAlpha;
  // Road offset accumulates at 0.6 of world speed; buildings scroll at 0.4
  const off = offset * (0.4 / 0.6);
  const first = Math.floor((off + view.left) / cell) - 1;
  const last = Math.ceil((off + view.right) / cell) + 1;
  for (let i = first; i <= last; i++) {
    const r = hash01(i, 21);
    if (r > 0.7) continue;
    const rx = i * cell - off + hash01(i, 22) * cell * 0.6;
    const color = NEON[Math.floor(hash01(i, 23) * NEON.length)];
    const len = 8 + hash01(i, 24) * 12;
    const g = ctx.createLinearGradient(0, groundY, 0, groundY + len);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = fade * 0.35;
    ctx.fillStyle = g;
    ctx.fillRect(rx, groundY, 3 + hash01(i, 25) * 5, len);
  }
  // White shimmer streaks along the wet surface.
  ctx.globalAlpha = fade * 0.18;
  ctx.fillStyle = "#ffffff";
  const sheen = offset % 90;
  for (let sx = Math.floor(view.left / 90) * 90 - sheen; sx < view.right; sx += 90) ctx.fillRect(sx, groundY + 15, 26, 1);
  ctx.globalAlpha = fade;
}

// --- Neon building ---

/**
 * A street tower at night: lit and dark windows, one or two vertical neon signs on the
 * side, sometimes a rooftop billboard, and an aviation light on the tall ones. `seed`
 * keeps the windows and signs the same while the building scrolls.
 */
function drawNeonBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wall: string, roof: string, seed: number) {
  ctx.save();
  ctx.fillStyle = wall;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = roof;
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(x + w - 3, y, 3, h);

  // Window grid.
  const cols = Math.max(2, Math.floor((w - 6) / 8));
  const rows = Math.max(3, Math.floor((h - 14) / 9));
  const gx = (w - 6) / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = hash01(seed, r, c);
      ctx.fillStyle = v < 0.32 ? "#ffd890" : v < 0.46 ? "#bfe4ff" : "#2a2e48";
      ctx.fillRect(x + 3 + c * gx + gx * 0.2, y + 8 + r * 9, gx * 0.6, 5);
    }
  }

  // Vertical signs hanging off one or both edges.
  const signs = hash01(seed, 31) < 0.4 ? 2 : 1;
  for (let s = 0; s < signs; s++) {
    const text = SIGN_TEXTS[Math.floor(hash01(seed, 32 + s) * SIGN_TEXTS.length)];
    const color = NEON[Math.floor(hash01(seed, 34 + s) * NEON.length)];
    const fontPx = 7;
    const onLeft = s === 0 ? hash01(seed, 36) < 0.5 : hash01(seed, 36) >= 0.5;
    const signX = onLeft ? x - 4 : x + w - 11;
    const signY = y + h * (0.12 + hash01(seed, 37 + s) * 0.2);
    drawNeonSign(ctx, signX, signY, text, color, true, fontPx, hash01(seed, 39 + s));
  }

  // Rooftop billboard on some, antenna and aviation light on the tall ones.
  if (hash01(seed, 41) < 0.3 && w > 50) {
    const text = BILLBOARD_TEXTS[Math.floor(hash01(seed, 42) * BILLBOARD_TEXTS.length)];
    const color = NEON[Math.floor(hash01(seed, 43) * NEON.length)];
    ctx.fillStyle = "#3a3a46";
    ctx.fillRect(x + w * 0.3, y - 4, 1.4, 4);
    ctx.fillRect(x + w * 0.7, y - 4, 1.4, 4);
    drawNeonSign(ctx, x + w * 0.16, y - 17, text, color, false, 7, hash01(seed, 44));
  } else if (h > 150) {
    ctx.fillStyle = "#4a4a56";
    ctx.fillRect(x + w * 0.6, y - 16, 1.4, 16);
    aviationLight(ctx, x + w * 0.6 + 0.7, y - 17, seed);
  }

  ctx.restore();
}

// --- Konbini ---

/** A 24-hour convenience store: bright glass front, striped fascia, shelves inside. */
function drawKonbini(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  glow(ctx, x + w / 2, y + h * 0.7, w * 0.8, "#e8f6ff", 0.22);
  ctx.fillStyle = "#e8ecf0";
  ctx.fillRect(x, y, w, h);
  // Fascia with colour stripes and the sign.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h * 0.3);
  ctx.fillStyle = "#2a9a5a";
  ctx.fillRect(x, y + h * 0.3, w, h * 0.04);
  ctx.fillStyle = "#3a6ad8";
  ctx.fillRect(x, y + h * 0.34, w, h * 0.04);
  ctx.fillStyle = "#3a6ad8";
  ctx.font = `bold ${Math.round(h * 0.18)}px ${JP_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("コンビニ 24H", x + w / 2, y + h * 0.16, w * 0.9);
  // Glass front with shelves and a sliding door.
  ctx.fillStyle = "#f6fcff";
  ctx.fillRect(x + 3, y + h * 0.42, w - 6, h * 0.58);
  ctx.fillStyle = "#c8d8e4";
  for (const fy of [0.56, 0.72, 0.88]) ctx.fillRect(x + 6, y + h * fy, w * 0.55, 1.4);
  ctx.fillStyle = "#f2a83a";
  for (let i = 0; i < 8; i++) ctx.fillRect(x + 8 + i * (w * 0.065), y + h * 0.5, 2.4, 3);
  ctx.strokeStyle = "#9aa8b4";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + w * 0.68, y + h * 0.46, w * 0.24, h * 0.54);
  ctx.restore();
}

// --- Izakaya ---

/** A small izakaya: dark timber front, glowing red lanterns, an indigo noren over the door. */
function drawIzakaya(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  ctx.save();
  // Tiled awning and timber front.
  ctx.fillStyle = "#3a2a22";
  ctx.fillRect(x, y + h * 0.18, w, h * 0.82);
  ctx.fillStyle = "#24242c";
  ctx.beginPath();
  ctx.moveTo(x - 4, y + h * 0.24);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x + w - 3, y);
  ctx.lineTo(x + w + 4, y + h * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3a3a46";
  for (let tx = x; tx < x + w; tx += 4) ctx.fillRect(tx, y + 2, 1, h * 0.2);

  // Warm interior through a lattice window.
  ctx.fillStyle = "#ffcf80";
  ctx.fillRect(x + w * 0.08, y + h * 0.42, w * 0.34, h * 0.36);
  ctx.fillStyle = "#3a2a22";
  for (let i = 1; i < 4; i++) ctx.fillRect(x + w * (0.08 + i * 0.085), y + h * 0.42, 1, h * 0.36);
  ctx.fillRect(x + w * 0.08, y + h * 0.6, w * 0.34, 1);

  // Noren curtain with 酒.
  const nx = x + w * 0.54;
  const nw = w * 0.36;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "#24346a";
    ctx.fillRect(nx + (nw / 3) * i + 0.5, y + h * 0.34, nw / 3 - 1, h * 0.3);
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(h * 0.18)}px ${JP_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("酒", nx + nw / 2, y + h * 0.47);
  ctx.fillStyle = "#ffcf80";
  ctx.fillRect(nx, y + h * 0.64, nw, h * 0.36);

  // Red lanterns, gently swaying.
  const sway = Math.sin(performance.now() / 800 + seed) * 0.8;
  for (const fx of [0.12, 0.32, 0.96]) {
    const lx = x + w * fx + sway;
    const ly = y + h * 0.3;
    glow(ctx, lx, ly, 10, "#ff5a3a", 0.5);
    ctx.fillStyle = "#e8302a";
    ctx.beginPath();
    ctx.ellipse(lx, ly, 3.4, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e1e24";
    ctx.fillRect(lx - 2, ly - 5, 4, 1);
    ctx.fillRect(lx - 2, ly + 4, 4, 1);
    ctx.fillStyle = "rgba(255,230,180,0.6)";
    ctx.fillRect(lx - 3, ly - 1, 6, 0.6);
  }
  ctx.restore();
}

// --- Tokyo Tower ---

/** Tokyo Tower lit orange at night: splayed lattice legs, two observation decks, an antenna. */
function drawTokyoTower(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const base = y + h;
  const orange = "#ff7a32";
  // Half-width of the tower at a height fraction from the top (0 = tip, 1 = base)
  const halfAt = (f: number) => w * 0.5 * Math.pow(f, 1.6) + 1.2;

  ctx.save();
  glow(ctx, cx, y + h * 0.5, h * 0.45, "#ff8a3a", 0.18);

  // Lattice body: legs plus cross-bracing.
  ctx.strokeStyle = orange;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const steps = 22;
  for (let i = 0; i < steps; i++) {
    const f0 = 0.12 + (i / steps) * 0.88;
    const f1 = 0.12 + ((i + 1) / steps) * 0.88;
    const y0 = y + h * f0;
    const y1 = y + h * f1;
    ctx.moveTo(cx - halfAt(f0), y0);
    ctx.lineTo(cx - halfAt(f1), y1);
    ctx.moveTo(cx + halfAt(f0), y0);
    ctx.lineTo(cx + halfAt(f1), y1);
    ctx.moveTo(cx - halfAt(f0), y0);
    ctx.lineTo(cx + halfAt(f1), y1);
    ctx.moveTo(cx + halfAt(f0), y0);
    ctx.lineTo(cx - halfAt(f1), y1);
  }
  ctx.stroke();
  // White bands near the top, like the real paint scheme.
  ctx.fillStyle = "#f4f0ea";
  for (const f of [0.2, 0.3]) ctx.fillRect(cx - halfAt(f), y + h * f, halfAt(f) * 2, h * 0.03);
  // Arch between the legs at the base.
  ctx.fillStyle = "#1e1a2a";
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.32, base);
  ctx.quadraticCurveTo(cx, base - h * 0.2, cx + w * 0.32, base);
  ctx.closePath();
  ctx.fill();

  // Observation decks, glazed and lit.
  for (const [f, dh] of [[0.56, 0.05], [0.28, 0.03]] as const) {
    const hw = halfAt(f) + 3;
    ctx.fillStyle = "#3a2a3a";
    ctx.fillRect(cx - hw, y + h * f, hw * 2, h * dh);
    ctx.fillStyle = "#ffe0a0";
    ctx.fillRect(cx - hw + 1, y + h * f + 1, hw * 2 - 2, h * dh * 0.5);
  }

  // Antenna and its light.
  ctx.fillStyle = "#f4f0ea";
  ctx.fillRect(cx - 0.8, y, 1.6, h * 0.13);
  aviationLight(ctx, cx, y, 3);
  ctx.restore();
}

// --- Tokyo Skytree ---

/** Tokyo Skytree: a very tall, slender lattice lit in blue and violet, two ring decks, a long mast. */
function drawSkytree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const halfAt = (f: number) => w * 0.5 * (0.18 + 0.82 * Math.pow(f, 2.2));

  ctx.save();
  glow(ctx, cx, y + h * 0.45, h * 0.35, "#7a6aff", 0.16);

  // Shaft: a pale core inside a violet-lit lattice.
  const top = 0.16;
  ctx.fillStyle = "#d8e0f4";
  ctx.beginPath();
  ctx.moveTo(cx - halfAt(top) * 0.6, y + h * top);
  ctx.lineTo(cx + halfAt(top) * 0.6, y + h * top);
  ctx.lineTo(cx + halfAt(1) * 0.55, y + h);
  ctx.lineTo(cx - halfAt(1) * 0.55, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8a7aff";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  const steps = 26;
  for (let i = 0; i < steps; i++) {
    const f0 = top + (i / steps) * (1 - top);
    const f1 = top + ((i + 1) / steps) * (1 - top);
    ctx.moveTo(cx - halfAt(f0), y + h * f0);
    ctx.lineTo(cx + halfAt(f1), y + h * f1);
    ctx.moveTo(cx + halfAt(f0), y + h * f0);
    ctx.lineTo(cx - halfAt(f1), y + h * f1);
  }
  ctx.moveTo(cx - halfAt(top), y + h * top);
  ctx.lineTo(cx - halfAt(1), y + h);
  ctx.moveTo(cx + halfAt(top), y + h * top);
  ctx.lineTo(cx + halfAt(1), y + h);
  ctx.stroke();

  // Two ring decks.
  for (const [f, ringH] of [[0.42, 0.035], [0.27, 0.02]] as const) {
    const hw = halfAt(f) + 4;
    ctx.fillStyle = "#3a3a5a";
    ctx.fillRect(cx - hw, y + h * f, hw * 2, h * ringH);
    ctx.fillStyle = "#c8e4ff";
    ctx.fillRect(cx - hw + 1, y + h * f + 1, hw * 2 - 2, h * ringH * 0.45);
  }

  // Mast.
  ctx.fillStyle = "#e8ecf4";
  ctx.fillRect(cx - 1, y, 2, h * top);
  aviationLight(ctx, cx, y, 5);
  ctx.restore();
}

// --- Pagoda ---

/** Five-storey pagoda: red walls, dark roofs with upturned eaves, a bronze spire. */
function drawPagoda(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const spireH = h * 0.2;
  const tiers = 5;
  const tierH = (h - spireH) / tiers;

  ctx.save();
  glow(ctx, cx, y + h * 0.6, w * 0.9, "#ff8a5a", 0.12);
  for (let i = 0; i < tiers; i++) {
    const ty = y + spireH + i * tierH;
    const roofHalf = w * (0.32 + i * 0.045);
    const wallHalf = roofHalf * 0.62;
    // Wall with a lit window.
    ctx.fillStyle = "#b8302a";
    ctx.fillRect(cx - wallHalf, ty + tierH * 0.3, wallHalf * 2, tierH * 0.7);
    ctx.fillStyle = "#ffcf80";
    ctx.fillRect(cx - wallHalf * 0.3, ty + tierH * 0.45, wallHalf * 0.6, tierH * 0.35);
    // Roof with upturned tips.
    ctx.fillStyle = "#24242c";
    ctx.beginPath();
    ctx.moveTo(cx - roofHalf - 2, ty + tierH * 0.2);
    ctx.quadraticCurveTo(cx - roofHalf * 0.6, ty + tierH * 0.38, cx - wallHalf, ty + tierH * 0.12);
    ctx.lineTo(cx + wallHalf, ty + tierH * 0.12);
    ctx.quadraticCurveTo(cx + roofHalf * 0.6, ty + tierH * 0.38, cx + roofHalf + 2, ty + tierH * 0.2);
    ctx.lineTo(cx + roofHalf * 0.8, ty + tierH * 0.36);
    ctx.lineTo(cx - roofHalf * 0.8, ty + tierH * 0.36);
    ctx.closePath();
    ctx.fill();
  }
  // Spire with rings.
  ctx.fillStyle = "#a88a4a";
  ctx.fillRect(cx - 1, y, 2, spireH + tierH * 0.2);
  for (let r = 0; r < 5; r++) ctx.fillRect(cx - 3, y + spireH * (0.25 + r * 0.13), 6, 1);
  ctx.restore();
}

// --- Torii ---

/** A vermilion torii gate: two posts, the lower nuki beam and the black-capped kasagi on top. */
function drawTorii(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const red = "#e8402a";
  ctx.save();
  glow(ctx, x + w / 2, y + h * 0.4, w * 0.7, "#ff6a3a", 0.12);
  // Posts.
  ctx.fillStyle = red;
  ctx.fillRect(x + w * 0.18, y + h * 0.16, w * 0.09, h * 0.84);
  ctx.fillRect(x + w * 0.73, y + h * 0.16, w * 0.09, h * 0.84);
  ctx.fillStyle = "#1e1e24";
  ctx.fillRect(x + w * 0.16, y + h * 0.92, w * 0.13, h * 0.08);
  ctx.fillRect(x + w * 0.71, y + h * 0.92, w * 0.13, h * 0.08);
  // Nuki (lower beam) and the shimaki under the top.
  ctx.fillStyle = red;
  ctx.fillRect(x + w * 0.08, y + h * 0.34, w * 0.84, h * 0.08);
  ctx.fillRect(x + w * 0.04, y + h * 0.12, w * 0.92, h * 0.08);
  // Kasagi: black top beam curving up at the ends.
  ctx.fillStyle = "#1e1e24";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.04, y + h * 0.02);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.12, x + w * 1.04, y + h * 0.02);
  ctx.lineTo(x + w * 1.0, y + h * 0.12);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.2, x, y + h * 0.12);
  ctx.closePath();
  ctx.fill();
  // Gakuzuka plaque.
  ctx.fillStyle = "#1e1e24";
  ctx.fillRect(x + w * 0.45, y + h * 0.18, w * 0.1, h * 0.16);
  ctx.restore();
}

// --- Big-screen building ---

/** A corner building with a huge video screen cycling colour and text (Shibuya-style). */
function drawBigScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wall: string, seed: number) {
  const t = performance.now() / 1000;
  ctx.save();
  ctx.fillStyle = wall;
  ctx.fillRect(x, y, w, h);
  // Lit floors below the screen.
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = hash01(seed, r, c) < 0.5 ? "#ffd890" : "#2a2e48";
      ctx.fillRect(x + 4 + c * ((w - 8) / 8), y + h * 0.62 + r * 9, (w - 8) / 8 - 3, 4);
    }
  }
  // Screen: animated gradient with a bold line of text.
  const sx = x + w * 0.08;
  const sy = y + h * 0.1;
  const sw = w * 0.84;
  const sh = h * 0.42;
  glow(ctx, sx + sw / 2, sy + sh / 2, sw * 0.9, "#7a9aff", 0.2);
  const hue = (t * 40) % 360;
  const g = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
  g.addColorStop(0, `hsl(${hue}, 85%, 55%)`);
  g.addColorStop(1, `hsl(${(hue + 120) % 360}, 85%, 45%)`);
  ctx.fillStyle = g;
  ctx.fillRect(sx, sy, sw, sh);
  const lines = ["東京", "TOKYO", "♪ ♪ ♪", "ラーメン"];
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(sh * 0.36)}px ${JP_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(lines[Math.floor(t / 2.5) % lines.length], sx + sw / 2, sy + sh / 2, sw * 0.9);
  ctx.strokeStyle = "#0e0e18";
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, sw, sh);
  // Ticker strip.
  ctx.fillStyle = "#0e0e18";
  ctx.fillRect(sx, sy + sh + 4, sw, 7);
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, sy + sh + 4, sw, 7);
  ctx.clip();
  ctx.fillStyle = "#ffd23d";
  ctx.font = `bold 6px ${JP_FONT}`;
  ctx.textAlign = "left";
  const ticker = "ようこそ東京へ  WELCOME TO TOKYO  ";
  const tw = ctx.measureText(ticker).width;
  const tx = sx - ((t * 30) % tw);
  ctx.fillText(ticker + ticker + ticker, tx, sy + sh + 8);
  ctx.restore();
  aviationLight(ctx, x + w * 0.85, y - 1, seed);
  ctx.restore();
}

// --- Elevated train line ---

/**
 * A concrete viaduct with a commuter train sliding across it now and then: silver cars
 * with a green stripe and lit windows. Train position comes from wall-clock time.
 */
function drawTrainViaduct(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const deckY = y + h * 0.5;
  ctx.save();
  // Pillars and deck.
  ctx.fillStyle = "#4a4a56";
  for (let px = x + 18; px < x + w - 10; px += 56) ctx.fillRect(px, deckY, 9, y + h - deckY);
  ctx.fillStyle = "#5a5a68";
  ctx.fillRect(x, deckY, w, h * 0.12);
  ctx.fillStyle = "#3a3a46";
  ctx.fillRect(x, deckY + h * 0.12, w, 2);
  // Catenary posts.
  ctx.fillStyle = "#6a6a78";
  for (let px = x + 30; px < x + w; px += 80) ctx.fillRect(px, y, 1.4, deckY - y);
  ctx.fillRect(x, y + 3, w, 0.8);

  // Train: five cars crossing every ~9 s.
  const carW = 58;
  const trainW = carW * 5;
  const period = 9;
  const t = (performance.now() / 1000) % period;
  const travel = (w + trainW * 2) * (t / (period * 0.6));
  if (t < period * 0.6) {
    const tx = x + w + trainW - travel;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, deckY - y);
    ctx.clip();
    for (let i = 0; i < 5; i++) {
      const cx = tx + i * carW;
      const ty = y + h * 0.12;
      const th = deckY - ty;
      ctx.fillStyle = "#c8ccd4";
      ctx.fillRect(cx + 1, ty, carW - 2, th);
      ctx.fillStyle = "#4ab04a";
      ctx.fillRect(cx + 1, ty + th * 0.68, carW - 2, th * 0.12);
      ctx.fillStyle = "#ffe8b0";
      for (let k = 0; k < 4; k++) ctx.fillRect(cx + 5 + k * 13, ty + th * 0.2, 9, th * 0.32);
    }
    // Headlight on the lead car.
    glow(ctx, tx, y + h * 0.36, 12, "#fff2b0", 0.6);
    ctx.restore();
  }
  ctx.restore();
}

// --- Night sakura ---

/** A cherry tree in bloom, lit from below: dark trunk and soft pink clusters. */
function drawSakura(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, palette: EnvironmentPalette, seed: number) {
  ctx.save();
  ctx.strokeStyle = palette.backgroundTreeTrunk;
  ctx.lineCap = "round";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h);
  ctx.lineTo(x + w * 0.48, y + h * 0.55);
  ctx.lineTo(x + w * 0.3, y + h * 0.35);
  ctx.moveTo(x + w * 0.48, y + h * 0.55);
  ctx.lineTo(x + w * 0.7, y + h * 0.32);
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const bx = x + w * (0.12 + hash01(seed, i, 1) * 0.76);
    const by = y + h * (0.06 + hash01(seed, i, 2) * 0.42);
    const r = 4 + hash01(seed, i, 3) * 5;
    ctx.fillStyle = i % 3 === 0 ? "#ffd0e4" : color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- Japan flag ---

/** Hinomaru on a white pole, rippling. */
function drawJapanFlag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.save();
  ctx.fillStyle = "#d8d8e0";
  ctx.fillRect(x, y, 1.6, h);
  ctx.fillStyle = "#c8a040";
  ctx.beginPath();
  ctx.arc(x + 0.8, y, 1.4, 0, Math.PI * 2);
  ctx.fill();
  const fw = w * 1.4;
  const fh = h * 0.3;
  const t = performance.now() / 300;
  const wave = (fx: number) => Math.sin(t + fx * 5) * 1.3 * fx;
  ctx.fillStyle = "#f6f6f8";
  ctx.beginPath();
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const fx = i / steps;
    const px = x + 1.6 + fx * fw;
    if (i === 0) ctx.moveTo(px, y + 2 + wave(fx));
    else ctx.lineTo(px, y + 2 + wave(fx));
  }
  for (let i = steps; i >= 0; i--) {
    const fx = i / steps;
    ctx.lineTo(x + 1.6 + fx * fw, y + 2 + fh + wave(fx));
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 1.6 + fw * 0.5, y + 2 + fh / 2 + wave(0.5), fh * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- Street lamp ---

/** A curved street lamp throwing a warm cone of light down through the rain. */
function drawStreetLamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.save();
  // Light cone.
  const g = ctx.createLinearGradient(0, y + 6, 0, y + h);
  g.addColorStop(0, "rgba(255,226,160,0.32)");
  g.addColorStop(1, "rgba(255,226,160,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.9, y + 6);
  ctx.lineTo(x + w * 0.9 + 16, y + h);
  ctx.lineTo(x + w * 0.9 - 16, y + h);
  ctx.closePath();
  ctx.fill();
  // Pole and curved arm.
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h);
  ctx.lineTo(x + 2, y + 6);
  ctx.quadraticCurveTo(x + 2, y, x + w * 0.9, y + 3);
  ctx.stroke();
  glow(ctx, x + w * 0.9, y + 5, 10, "#ffe2a0", 0.7);
  ctx.fillStyle = "#fff4d0";
  ctx.fillRect(x + w * 0.9 - 3, y + 3, 6, 2.6);
  ctx.restore();
}

// --- Pedestrian under an umbrella ---

const UMBRELLA_COLORS = ["rgba(220,235,255,0.45)", "#d8344a", "#2a2a34", "#3a7ad8", "#f2c84a"];

/** A pedestrian (shared figure) holding an umbrella; most are the clear plastic kind. */
function drawUmbrellaPerson(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette, bottomColor?: string, variant = 0
) {
  drawWalkingPerson(ctx, x, y, w, h, color, palette, bottomColor, variant);
  const cx = x + w * 0.62;
  const top = y - h * 0.12;
  ctx.save();
  ctx.strokeStyle = "#d8dce4";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx, y + h * 0.36);
  ctx.lineTo(cx, top);
  ctx.stroke();
  const pick = variant % 7 < 4 ? 0 : 1 + (variant % 4);
  ctx.fillStyle = UMBRELLA_COLORS[pick];
  ctx.beginPath();
  ctx.moveTo(cx - w * 1.0, top + h * 0.14);
  ctx.quadraticCurveTo(cx, top - h * 0.12, cx + w * 1.0, top + h * 0.14);
  ctx.closePath();
  ctx.fill();
  if (pick === 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.stroke();
  }
  ctx.restore();
}

// --- Tokyo background drawer registry ---

export const TOKYO_BACKGROUND_DRAWERS: Record<string, BackgroundDrawFn> = {
  neon_building: (ctx, x, y, w, h, color, _palette, roofColor, variant = 0) => {
    drawNeonBuilding(ctx, x, y, w, h, color, roofColor ?? color, variant);
  },
  konbini: (ctx, x, y, w, h) => {
    drawKonbini(ctx, x, y, w, h);
  },
  izakaya: (ctx, x, y, w, h, _color, _palette, _roofColor, variant = 0) => {
    drawIzakaya(ctx, x, y, w, h, variant);
  },
  tokyo_tower: (ctx, x, y, w, h) => {
    drawTokyoTower(ctx, x, y, w, h);
  },
  skytree: (ctx, x, y, w, h) => {
    drawSkytree(ctx, x, y, w, h);
  },
  pagoda: (ctx, x, y, w, h) => {
    drawPagoda(ctx, x, y, w, h);
  },
  torii: (ctx, x, y, w, h) => {
    drawTorii(ctx, x, y, w, h);
  },
  big_screen: (ctx, x, y, w, h, color, _palette, _roofColor, variant = 0) => {
    drawBigScreen(ctx, x, y, w, h, color, variant);
  },
  train_viaduct: (ctx, x, y, w, h) => {
    drawTrainViaduct(ctx, x, y, w, h);
  },
  sakura: (ctx, x, y, w, h, color, palette, _roofColor, variant = 0) => {
    drawSakura(ctx, x, y, w, h, color, palette, variant);
  },
  japan_flag: (ctx, x, y, w, h, color) => {
    drawJapanFlag(ctx, x, y, w, h, color);
  },
  street_lamp: (ctx, x, y, w, h, color) => {
    drawStreetLamp(ctx, x, y, w, h, color);
  },
  umbrella_person: (ctx, x, y, w, h, color, palette, bottomColor, variant) => {
    drawUmbrellaPerson(ctx, x, y, w, h, color, palette, bottomColor, variant);
  },
  walking_person: (ctx, x, y, w, h, color, palette, bottomColor, variant) => {
    drawWalkingPerson(ctx, x, y, w, h, color, palette, bottomColor, variant);
  },
};
