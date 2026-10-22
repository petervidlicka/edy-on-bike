import type { EnvironmentPalette, BackgroundDrawFn } from "../../environments/types";
import { drawWalkingPerson } from "./shared";
import { drawSprite } from "../drawHelpers";

// --- Dubai background elements ---

// Burj Khalifa: stepped/tapered tower with spire
function drawBurjKhalifa(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  const cx = x + w / 2;
  // Base section (widest)
  ctx.fillStyle = wallColor;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.45, y + h);
  ctx.lineTo(cx - w * 0.35, y + h * 0.55);
  ctx.lineTo(cx + w * 0.35, y + h * 0.55);
  ctx.lineTo(cx + w * 0.45, y + h);
  ctx.closePath();
  ctx.fill();

  // Mid section
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.3, y + h * 0.55);
  ctx.lineTo(cx - w * 0.2, y + h * 0.3);
  ctx.lineTo(cx + w * 0.2, y + h * 0.3);
  ctx.lineTo(cx + w * 0.3, y + h * 0.55);
  ctx.closePath();
  ctx.fill();

  // Upper section
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.15, y + h * 0.3);
  ctx.lineTo(cx - w * 0.08, y + h * 0.12);
  ctx.lineTo(cx + w * 0.08, y + h * 0.12);
  ctx.lineTo(cx + w * 0.15, y + h * 0.3);
  ctx.closePath();
  ctx.fill();

  // Spire
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.03, y + h * 0.12);
  ctx.lineTo(cx, y);
  ctx.lineTo(cx + w * 0.03, y + h * 0.12);
  ctx.closePath();
  ctx.fill();

  // Window lines
  ctx.strokeStyle = palette.windowGlass;
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 10; i++) {
    const ly = y + h * (0.15 + i * 0.08);
    if (ly > y + h) break;
    const t = (ly - y) / h;
    const halfW = w * (0.08 + t * 0.37);
    ctx.beginPath();
    ctx.moveTo(cx - halfW, ly);
    ctx.lineTo(cx + halfW, ly);
    ctx.stroke();
  }
}

// Museum of the Future: a stainless-steel torus with an off-centre void, its skin
// pierced by flowing Arabic-calligraphy windows, sitting on a green landscaped mound.
function drawMuseumOfFuture(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  _wallColor: string, _roofColor: string, palette: EnvironmentPalette
) {
  const cx = x + w * 0.5;

  // Landscaped mound and glass podium under the ring.
  ctx.fillStyle = "#7fa35a";
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.97, w * 0.5, h * 0.12, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = palette.windowGlass;
  ctx.fillRect(cx - w * 0.18, y + h * 0.84, w * 0.36, h * 0.08);

  // The ring: 46 clipped calligraphy strokes plus shading, all fixed, so it is rasterised once
  drawSprite(ctx, "museum-ring", x, y, w, h, drawMuseumRing);
}

/** The Museum of the Future's torus in local space (element box at the origin). */
function drawMuseumRing(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const x = 0;
  const y = 0;
  const cx = x + w * 0.5;
  const cy = y + h * 0.44;
  const rx = w * 0.46;
  const ry = h * 0.41;
  const tilt = -0.12;
  const hx = cx + w * 0.04;
  const hy = cy - h * 0.03;
  const hrx = w * 0.25;
  const hry = h * 0.19;

  // The ring itself: outer ellipse minus the void, so sky shows through.
  const ring = () => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, tilt, 0, Math.PI * 2);
    ctx.ellipse(hx, hy, hrx, hry, tilt - 0.08, 0, Math.PI * 2);
  };
  ctx.fillStyle = "#cdd3d8";
  ring();
  ctx.fill("evenodd");

  ctx.save();
  ring();
  ctx.clip("evenodd");
  // Brushed-steel shading: darker underside, bright band across the top.
  const shade = ctx.createLinearGradient(0, cy - ry * 0.2, 0, cy + ry);
  shade.addColorStop(0, "rgba(70,80,92,0)");
  shade.addColorStop(1, "rgba(70,80,92,0.4)");
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.06, cy - ry * 0.72, rx * 0.7, ry * 0.12, tilt, 0, Math.PI * 2);
  ctx.fill();

  // Calligraphy windows: short flowing strokes that follow the ring.
  ctx.strokeStyle = "#3b5161";
  ctx.lineCap = "round";
  for (let i = 0; i < 46; i++) {
    const t = (i / 46) * Math.PI * 2;
    const band = 0.35 + 0.5 * ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
    const len = 0.18 + 0.22 * ((Math.sin(i * 78.233) * 9631.17) % 1 + 1) % 1;
    const r1x = hrx + (rx - hrx) * band;
    const r1y = hry + (ry - hry) * band;
    ctx.lineWidth = 0.5 + (i % 3) * 0.25;
    ctx.beginPath();
    ctx.ellipse(cx + (hx - cx) * (1 - band), cy + (hy - cy) * (1 - band), r1x, r1y, tilt, t, t + len);
    ctx.stroke();
    if (i % 4 === 0) {
      // Little dots and flicks like diacritics.
      const px = cx + Math.cos(t + len / 2) * r1x * 0.97;
      const py = cy + Math.sin(t + len / 2) * r1y * 0.92;
      ctx.fillStyle = "#3b5161";
      ctx.fillRect(px, py, 0.9, 0.9);
    }
  }
  ctx.restore();

  // Crisp rims on the outer edge and the void.
  ctx.strokeStyle = "#a9b2ba";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, tilt, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#8f99a3";
  ctx.beginPath();
  ctx.ellipse(hx, hy, hrx, hry, tilt - 0.08, 0, Math.PI * 2);
  ctx.stroke();
}

// Burj Al Arab: a straight spine at the back (left) with its mast rising above the
// top, a billowing sail curving out to the front, the white fabric atrium, the big
// exoskeleton cross-braces and the cantilevered helipad near the crown.
function drawBurjAlArab(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  _wallColor: string, _roofColor: string, palette: EnvironmentPalette
) {
  const spineX = x + w * 0.22;
  const topY = y + h * 0.07;
  const baseY = y + h * 0.95;
  const frontX = x + w * 0.96;
  const white = "#f3f2ee";
  const steel = "#b8c0c8";

  const sail = () => {
    ctx.beginPath();
    ctx.moveTo(spineX, baseY);
    ctx.lineTo(spineX, topY);
    ctx.bezierCurveTo(x + w * 0.62, y + h * 0.1, frontX + w * 0.02, y + h * 0.5, frontX, baseY);
    ctx.closePath();
  };

  // Sail body.
  ctx.fillStyle = white;
  sail();
  ctx.fill();

  ctx.save();
  sail();
  ctx.clip();
  // Glass room wing along the spine.
  ctx.fillStyle = palette.windowGlass;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(spineX, topY, w * 0.2, baseY - topY);
  ctx.globalAlpha = 1;
  // Floor lines across the wing.
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 0.5;
  for (let fy = topY + 4; fy < baseY; fy += 4) {
    ctx.beginPath();
    ctx.moveTo(spineX, fy);
    ctx.lineTo(spineX + w * 0.2, fy);
    ctx.stroke();
  }
  // Soft shading on the fabric toward the front edge.
  ctx.fillStyle = "rgba(160,175,190,0.18)";
  ctx.fillRect(x + w * 0.62, topY, w * 0.4, baseY - topY);
  ctx.restore();

  // Exoskeleton: two big X braces down the sail.
  ctx.strokeStyle = steel;
  ctx.lineWidth = 1.1;
  const braces: Array<[number, number]> = [[0.3, 0.6], [0.6, 0.92]];
  for (const [t0, t1] of braces) {
    const ya = y + h * t0;
    const yb = y + h * t1;
    ctx.beginPath();
    ctx.moveTo(spineX + w * 0.2, ya);
    ctx.lineTo(x + w * 0.9, yb);
    ctx.moveTo(x + w * 0.82, ya + h * 0.04);
    ctx.lineTo(spineX + w * 0.2, yb);
    ctx.stroke();
  }

  // Sail outline.
  ctx.strokeStyle = "#c9ced3";
  ctx.lineWidth = 0.8;
  sail();
  ctx.stroke();

  // Mast rising above the crown along the spine.
  ctx.strokeStyle = steel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(spineX, baseY);
  ctx.lineTo(spineX, y);
  ctx.stroke();

  // Helipad: a thin disc cantilevered off the back near the top.
  ctx.fillStyle = steel;
  ctx.fillRect(spineX - w * 0.14, y + h * 0.165, w * 0.14, 1);
  ctx.fillStyle = "#e7e9ec";
  ctx.beginPath();
  ctx.ellipse(spineX - w * 0.16, y + h * 0.16, w * 0.15, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Island base.
  ctx.fillStyle = "#d9c79a";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.55, baseY + h * 0.03, w * 0.5, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Dubai Frame: two gold-clad towers joined by a glass sky bridge on top and a podium
// at the base, framing open sky in between. Its real proportions are ~0.6 wide : 1 tall.
function drawDubaiFrame(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  _wallColor: string, _roofColor: string, palette: EnvironmentPalette
) {
  const gold = "#d6a93a";
  const goldDark = "#a67c20";
  const goldLight = "#f2d27a";
  const pillarW = w * 0.17;
  const bridgeH = h * 0.1;
  const podiumH = h * 0.06;

  const goldPanel = (px: number, py: number, pw: number, ph: number) => {
    ctx.fillStyle = gold;
    ctx.fillRect(px, py, pw, ph);
    // Perforated lattice pattern.
    ctx.fillStyle = goldDark;
    const step = 3.2;
    for (let yy = py + 2; yy < py + ph - 1; yy += step) {
      for (let xx = px + 1.5 + ((yy - py) / step % 2 ? step / 2 : 0); xx < px + pw - 1; xx += step) {
        ctx.fillRect(xx, yy, 0.9, 0.9);
      }
    }
    // Sheen down one edge.
    ctx.fillStyle = goldLight;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(px + pw * 0.12, py, pw * 0.14, ph);
    ctx.globalAlpha = 1;
  };

  // Towers.
  goldPanel(x, y, pillarW, h);
  goldPanel(x + w - pillarW, y, pillarW, h);

  // Glass sky bridge with gold frame.
  ctx.fillStyle = palette.windowGlass;
  ctx.fillRect(x + pillarW, y + h * 0.015, w - pillarW * 2, bridgeH);
  ctx.strokeStyle = goldDark;
  ctx.lineWidth = 0.6;
  for (let i = 1; i < 6; i++) {
    const bx = x + pillarW + ((w - pillarW * 2) * i) / 6;
    ctx.beginPath();
    ctx.moveTo(bx, y + h * 0.015);
    ctx.lineTo(bx, y + h * 0.015 + bridgeH);
    ctx.stroke();
  }
  ctx.fillStyle = gold;
  ctx.fillRect(x + pillarW, y + h * 0.015, w - pillarW * 2, 1.4);
  ctx.fillRect(x + pillarW, y + h * 0.015 + bridgeH - 1.4, w - pillarW * 2, 1.4);

  // Podium.
  ctx.fillStyle = palette.windowGlass;
  ctx.fillRect(x + pillarW, y + h - podiumH, w - pillarW * 2, podiumH);
  ctx.fillStyle = gold;
  ctx.fillRect(x + pillarW, y + h - podiumH, w - pillarW * 2, 1.4);

  // Tower edge lines.
  ctx.strokeStyle = goldDark;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, pillarW, h);
  ctx.strokeRect(x + w - pillarW, y, pillarW, h);
}

// ── Generic skyscraper variants (0-4) ──

// Variant 1: Stepped/setback tower — wider at base, 2-3 tiers narrowing upward
function drawSteppedSkyscraper(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  // 3 tiers — each narrower
  const tiers = [
    { top: y + h * 0.6, bottom: y + h, widthRatio: 1.0 },
    { top: y + h * 0.25, bottom: y + h * 0.6, widthRatio: 0.72 },
    { top: y, bottom: y + h * 0.25, widthRatio: 0.45 },
  ];
  for (const tier of tiers) {
    const tw = w * tier.widthRatio;
    const tx = x + (w - tw) / 2;
    const th = tier.bottom - tier.top;
    ctx.fillStyle = wallColor;
    ctx.fillRect(tx, tier.top, tw, th);
    // Window grid per tier
    ctx.fillStyle = palette.windowGlass;
    const cols = Math.max(2, Math.floor(tw / 9));
    const rows = Math.max(2, Math.floor(th / 12));
    const winW = (tw - 4) / cols - 2;
    const winH = (th - 4) / rows - 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillRect(tx + 2 + c * (winW + 2), tier.top + 3 + r * (winH + 2), winW, winH);
      }
    }
    // Ledge at tier boundary
    ctx.fillStyle = roofColor;
    ctx.fillRect(tx, tier.top, tw, 2);
  }
  // Outline
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 0.6;
  for (const tier of tiers) {
    const tw = w * tier.widthRatio;
    const tx = x + (w - tw) / 2;
    ctx.strokeRect(tx, tier.top, tw, tier.bottom - tier.top);
  }
}

// Variant 2: Dome-topped tower — rectangular body with rounded dome cap
function drawDomeTopTower(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  const cx = x + w / 2;
  const domeH = h * 0.12;
  const bodyTop = y + domeH;
  const bodyH = h - domeH;

  // Dome
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.ellipse(cx, bodyTop, w / 2, domeH, 0, Math.PI, 0);
  ctx.fill();

  // Body
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, bodyTop, w, bodyH);

  // Window grid
  ctx.fillStyle = palette.windowGlass;
  const cols = Math.max(2, Math.floor(w / 8));
  const rows = Math.max(4, Math.floor(bodyH / 10));
  const winW = (w - 6) / cols - 2;
  const winH = (bodyH - 8) / rows - 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(x + 3 + c * (winW + 2), bodyTop + 5 + r * (winH + 2), winW, winH);
    }
  }

  // Outline
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, bodyTop, w, bodyH);
}

// Variant 3: Angled/pointed crown tower
function drawAngledTower(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  const cx = x + w / 2;
  const crownH = h * 0.1;
  const bodyTop = y + crownH;
  const bodyH = h - crownH;

  // Crown — angular pointed shape
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x, bodyTop);
  ctx.lineTo(cx, y);
  ctx.lineTo(x + w, bodyTop);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, bodyTop, w, bodyH);

  // Window grid
  ctx.fillStyle = palette.windowGlass;
  const cols = Math.max(2, Math.floor(w / 8));
  const rows = Math.max(4, Math.floor(bodyH / 10));
  const winW = (w - 6) / cols - 2;
  const winH = (bodyH - 8) / rows - 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(x + 3 + c * (winW + 2), bodyTop + 5 + r * (winH + 2), winW, winH);
    }
  }

  // Outline
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, bodyTop, w, bodyH);
}

// Variant 4: Wide flat-topped commercial tower — horizontal window bands
function drawWideFlatTower(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  // Body
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y, w, h);

  // Horizontal window bands (instead of grid)
  ctx.fillStyle = palette.windowGlass;
  const bands = Math.max(3, Math.floor(h / 14));
  const bandH = 4;
  const bandGap = (h - 8) / bands;
  for (let i = 0; i < bands; i++) {
    const by = y + 4 + i * bandGap;
    ctx.fillRect(x + 3, by, w - 6, bandH);
  }

  // Rooftop bar
  ctx.fillStyle = roofColor;
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x + w * 0.1, y - 3, w * 0.8, 4);

  // Outline
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, w, h);
}

// Variant 0: Generic skyscraper: tall rectangle with window grid
function drawGenericSkyscraper(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  // Main body
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y, w, h);

  // Window grid
  ctx.fillStyle = palette.windowGlass;
  const cols = Math.max(2, Math.floor(w / 8));
  const rows = Math.max(4, Math.floor(h / 10));
  const winW = (w - 6) / cols - 2;
  const winH = (h - 10) / rows - 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + 3 + c * (winW + 2);
      const wy = y + 6 + r * (winH + 2);
      ctx.fillRect(wx, wy, winW, winH);
    }
  }

  // Rooftop structure
  ctx.fillStyle = roofColor;
  ctx.fillRect(x + w * 0.35, y - h * 0.04, w * 0.3, h * 0.05);
  // Antenna
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y - h * 0.08);
  ctx.stroke();

  // Outline
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, w, h);
}

/** Draw a skyscraper — dispatches to the correct variant. */
function drawSkyscraper(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, palette: EnvironmentPalette, roofColor?: string, variant?: number
) {
  const roof = roofColor || wallColor;
  switch (variant) {
    // Generic variants (0-4)
    case 0: drawGenericSkyscraper(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 1: drawSteppedSkyscraper(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 2: drawDomeTopTower(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 3: drawAngledTower(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 4: drawWideFlatTower(ctx, x, y, w, h, wallColor, roof, palette); break;
    // Landmark variants (5-8)
    case 5: drawBurjKhalifa(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 6: drawMuseumOfFuture(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 7: drawBurjAlArab(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 8: drawDubaiFrame(ctx, x, y, w, h, wallColor, roof, palette); break;
    default: drawGenericSkyscraper(ctx, x, y, w, h, wallColor, roof, palette); break;
  }
}

// --- Palm tree (background) ---

/** Frond directions (radians) radiating from the palm crown. */
const FROND_ANGLES = [-2.2, -1.8, -1.2, -0.6, 0.2, 0.8, 1.4, 2.0];
/**
 * Per-frond length variation (fraction of tree width). Fixed rather than
 * Math.random() so fronds don't flicker — this runs every frame.
 */
const FROND_LENGTH_JITTER = [0.12, 0.04, 0.18, 0.08, 0.15, 0.02, 0.1, 0.16];

export function drawPalmTree(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette,
  /** Offsets into FROND_LENGTH_JITTER so palms differ from each other. */
  variant = 0
) {
  const cx = x + w / 2;
  const trunkColor = palette.backgroundTreeTrunk;
  const frondColor = color;

  // Curved trunk (gentle S-curve)
  ctx.strokeStyle = trunkColor;
  ctx.lineWidth = w * 0.18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, y + h);
  ctx.quadraticCurveTo(cx - w * 0.15, y + h * 0.6, cx + w * 0.05, y + h * 0.22);
  ctx.stroke();

  // Trunk segment lines
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = w * 0.2;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, y + h);
  ctx.quadraticCurveTo(cx - w * 0.15, y + h * 0.6, cx + w * 0.05, y + h * 0.22);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crown position
  const crownX = cx + w * 0.05;
  const crownY = y + h * 0.2;

  // Fronds (8 arcs radiating from crown)
  ctx.strokeStyle = frondColor;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  for (let i = 0; i < FROND_ANGLES.length; i++) {
    const angle = FROND_ANGLES[i];
    const len = w * (0.7 + FROND_LENGTH_JITTER[(i + variant) % FROND_LENGTH_JITTER.length]);
    const endX = crownX + Math.cos(angle) * len;
    const endY = crownY + Math.sin(angle) * len * 0.6;
    const cpX = crownX + Math.cos(angle) * len * 0.5;
    const cpY = crownY + Math.sin(angle) * len * 0.2 - h * 0.05;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();

    // Leaf detail (small lines along frond)
    const midX = (crownX + endX) / 2;
    const midY = (cpY + endY) / 2;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX + 3, midY + 4);
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX - 3, midY + 4);
    ctx.stroke();
    ctx.lineWidth = 1.5;
  }

  // Coconuts
  ctx.fillStyle = "#6a5a3a";
  ctx.beginPath();
  ctx.arc(crownX - 3, crownY + 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(crownX + 4, crownY + 3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = "butt";
}

// --- Background camel (simpler than obstacle version) ---

export function drawBackgroundCamel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette
) {
  const legColor = palette.creatureLeg;

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.48, w * 0.3, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hump
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.3, w * 0.1, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.25, y + h * 0.58);
  ctx.lineTo(x + w * 0.23, y + h * 0.92);
  ctx.moveTo(x + w * 0.38, y + h * 0.58);
  ctx.lineTo(x + w * 0.4, y + h * 0.95);
  ctx.moveTo(x + w * 0.62, y + h * 0.58);
  ctx.lineTo(x + w * 0.6, y + h * 0.92);
  ctx.moveTo(x + w * 0.74, y + h * 0.58);
  ctx.lineTo(x + w * 0.76, y + h * 0.95);
  ctx.stroke();

  // Neck + Head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.22, y + h * 0.38);
  ctx.lineTo(x + w * 0.14, y + h * 0.15);
  ctx.lineTo(x + w * 0.26, y + h * 0.18);
  ctx.lineTo(x + w * 0.28, y + h * 0.4);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.ellipse(x + w * 0.12, y + h * 0.14, w * 0.08, h * 0.06, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.fillStyle = palette.creatureTail;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.82, y + h * 0.42, w * 0.04, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Dubai background drawer registry ---

export const DUBAI_BACKGROUND_DRAWERS: Record<string, BackgroundDrawFn> = {
  skyscraper: (ctx, x, y, w, h, color, palette, roofColor, variant) => {
    drawSkyscraper(ctx, x, y, w, h, color, palette, roofColor, variant);
  },
  palm_tree: (ctx, x, y, w, h, color, palette, _roofColor, variant) => {
    drawPalmTree(ctx, x, y, w, h, color, palette, variant);
  },
  bg_camel: (ctx, x, y, w, h, color, palette) => {
    drawBackgroundCamel(ctx, x, y, w, h, color, palette);
  },
  walking_person: (ctx, x, y, w, h, color, palette, bottomColor, variant) => {
    drawWalkingPerson(ctx, x, y, w, h, color, palette, bottomColor, variant);
  },
};
