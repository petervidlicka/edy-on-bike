/**
 * Snowy Austria backdrop: the far Alpine range (a skyline band) and the ski-village
 * building layer — chalet hotels, an onion-dome church, a ski jump, a chairlift, an
 * après-ski bar, snowy spruces, red deer and Austrian flags.
 */
import type { EnvironmentPalette, BackgroundDrawFn } from "../../environments/types";
import type { ViewBounds } from "../../Camera";
import { drawWalkingPerson } from "./shared";
import { drawRedDeer } from "../redDeer";
import { hash01, drawCachedText, drawFlagPole, fillFlagBand } from "../drawHelpers";
import { sceneTimeMs } from "../sceneClock";

const SNOW = "#f6f9fc";
const SNOW_SHADE = "#d4e0ec";
/** Lettering on the chalet name boards and the bar sign. */
const SIGN_FONT = "bold 5px Arial, sans-serif";

// --- Alpine range (skyline band) ---

/** One mountain ridge's look; heights are fractions of groundY so the range scales with the canvas. */
interface RidgeSpec {
  /** Peak-to-peak distance in px. */
  spacing: number;
  /** Summit height range as fractions of groundY. */
  minH: number;
  maxH: number;
  /** Offsets the hash so the two ridges differ. */
  seed: number;
  rock: string;
  /** Summits taller than this (fraction of groundY) get a snowcap. */
  capLine: number;
  /** Fraction of the cloud parallax this ridge scrolls at. */
  parallax: number;
}

/** Pale, distant ridge. */
const FAR_RIDGE: RidgeSpec = { spacing: 110, minH: 0.3, maxH: 0.52, seed: 11, rock: "#a9bfd6", capLine: 0.36, parallax: 0.6 };
/** Nearer, bluer ridge. */
const NEAR_RIDGE: RidgeSpec = { spacing: 80, minH: 0.16, maxH: 0.32, seed: 47, rock: "#7f9cbb", capLine: 0.24, parallax: 1.2 };

/**
 * One row of peaks: a jagged ridge with snowcaps on the taller summits. Peak heights
 * come from hash01 of the peak index, so the ridge tiles seamlessly as it scrolls.
 */
function drawRidge(ctx: CanvasRenderingContext2D, view: ViewBounds, baseY: number, groundY: number, cloudOffset: number, spec: RidgeSpec) {
  const { spacing, seed, rock } = spec;
  const offset = cloudOffset * spec.parallax;
  const minH = groundY * spec.minH;
  const maxH = groundY * spec.maxH;
  const capLine = groundY * spec.capLine;
  const first = Math.floor((offset + view.left) / spacing) - 1;
  const last = Math.ceil((offset + view.right) / spacing) + 1;
  const peaks: Array<[number, number]> = [];
  for (let i = first; i <= last; i++) {
    // Alternate summits and saddles; nudge x so peaks don't sit on a grid
    const isSummit = i % 2 === 0;
    const r = hash01(i + seed, 1);
    const ph = isSummit ? minH + r * (maxH - minH) : minH * 0.45 + r * minH * 0.4;
    const px = i * spacing - offset + (hash01(i * 3.7 + seed, 1) - 0.5) * spacing * 0.5;
    peaks.push([px, baseY - ph]);
  }

  // Rock body.
  ctx.fillStyle = rock;
  ctx.beginPath();
  ctx.moveTo(peaks[0][0], baseY);
  for (const p of peaks) ctx.lineTo(...p);
  ctx.lineTo(peaks[peaks.length - 1][0], baseY);
  ctx.closePath();
  ctx.fill();

  // Shaded left faces give the ridge some volume.
  ctx.fillStyle = "rgba(30,50,80,0.14)";
  for (let i = 1; i < peaks.length - 1; i++) {
    const [px, py] = peaks[i];
    if (py > peaks[i - 1][1]) continue; // only summits
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(peaks[i - 1][0], peaks[i - 1][1]);
    ctx.lineTo(px - (px - peaks[i - 1][0]) * 0.2, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // Snowcaps: summits above the cap line get a jagged white cap.
  for (let i = 1; i < peaks.length - 1; i++) {
    const [px, py] = peaks[i];
    if (baseY - py < capLine) continue;
    const [lx, ly] = peaks[i - 1];
    const [rx, ry] = peaks[i + 1];
    const depth = Math.min(0.42, (baseY - py - capLine) / (baseY - py) + 0.22);
    const a: [number, number] = [px + (lx - px) * depth, py + (ly - py) * depth];
    const b: [number, number] = [px + (rx - px) * depth, py + (ry - py) * depth];
    ctx.fillStyle = SNOW;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(...b);
    // Jagged lower edge back to the left side
    const teeth = 4;
    for (let t = 1; t < teeth; t++) {
      const f = t / teeth;
      const ex = b[0] + (a[0] - b[0]) * f;
      const ey = b[1] + (a[1] - b[1]) * f + (t % 2 === 0 ? -3 : 4);
      ctx.lineTo(ex, ey);
    }
    ctx.lineTo(...a);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Far Alpine range behind the village: a pale distant ridge and a nearer, bluer one,
 * each scrolling at its own fraction of the cloud parallax.
 */
export function drawAlpineRange(
  ctx: CanvasRenderingContext2D,
  view: ViewBounds,
  groundY: number,
  offset: number
) {
  const baseY = groundY - 16;
  drawRidge(ctx, view, baseY, groundY, offset, FAR_RIDGE);
  drawRidge(ctx, view, baseY, groundY, offset, NEAR_RIDGE);
}

// --- Chalet hotels ---

const CHALET_SIGNS = ["HOTEL", "GASTHOF", "PENSION", ""];
const CHALET_FLOORS = [3, 2, 2, 1];

/**
 * Tyrolean chalet: white plaster floors under timber balconies, a wide low gable with
 * a thick snow load and icicles, and warm lit windows. `variant` picks the size and
 * sign: 0 hotel, 1 gasthof, 2 pension, 3 hut.
 */
function drawChalet(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wall: string, palette: EnvironmentPalette,
  timber = "#6a4a32", variant = 0
) {
  const floors = CHALET_FLOORS[variant] ?? 2;
  const roofH = h * (variant === 3 ? 0.42 : 0.26);
  const wallTop = y + roofH;
  const wallH = h - roofH;
  const floorH = wallH / floors;
  const lit = palette.windowGlass;

  ctx.save();

  // Walls: timber for the hut, plaster otherwise, with a stone plinth.
  ctx.fillStyle = variant === 3 ? timber : wall;
  ctx.fillRect(x, wallTop, w, wallH);
  ctx.fillStyle = "#b8b0a4";
  ctx.fillRect(x, y + h - floorH * 0.18, w, floorH * 0.18);

  // Gable end under the roof, boarded in timber.
  ctx.fillStyle = timber;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.02, wallTop + 1);
  ctx.lineTo(x + w / 2, y + roofH * 0.25);
  ctx.lineTo(x + w * 0.98, wallTop + 1);
  ctx.closePath();
  ctx.fill();
  // Small gable window.
  ctx.fillStyle = lit;
  ctx.fillRect(x + w / 2 - 3, wallTop - roofH * 0.4, 6, roofH * 0.3);

  // Windows per floor with green shutters; balconies on upper floors.
  const cols = Math.max(2, Math.round(w / 18));
  for (let f = 0; f < floors; f++) {
    const fy = wallTop + f * floorH;
    const winH = floorH * 0.42;
    const winW = Math.min(7, (w / cols) * 0.4);
    for (let c = 0; c < cols; c++) {
      const cx = x + (w / cols) * (c + 0.5);
      // Ground floor of the big ones keeps a gap for the door
      if (f === floors - 1 && c === Math.floor(cols / 2) && variant !== 3) continue;
      ctx.fillStyle = lit;
      ctx.fillRect(cx - winW / 2, fy + floorH * 0.22, winW, winH);
      ctx.fillStyle = "#3e6a4a";
      ctx.fillRect(cx - winW / 2 - 2, fy + floorH * 0.22, 1.6, winH);
      ctx.fillRect(cx + winW / 2 + 0.4, fy + floorH * 0.22, 1.6, winH);
    }
    if (f < floors - 1 || (floors === 1 && variant !== 3)) {
      // Balcony along the bottom of the floor: rail, balusters and a snow line
      const by = fy + floorH * 0.7;
      ctx.fillStyle = timber;
      ctx.fillRect(x - 2, by, w + 4, 1.6);
      ctx.fillRect(x - 2, by + floorH * 0.3 - 1.6, w + 4, 1.6);
      for (let bx = x; bx < x + w; bx += 3) ctx.fillRect(bx, by, 1, floorH * 0.3);
      ctx.fillStyle = SNOW;
      ctx.fillRect(x - 2, by - 1, w + 4, 1);
    }
  }

  // Door.
  const doorW = Math.min(10, w * 0.14);
  const doorH = floorH * 0.66;
  ctx.fillStyle = timber;
  ctx.fillRect(x + w / 2 - doorW / 2, y + h - doorH, doorW, doorH);
  ctx.fillStyle = palette.doorKnob;
  ctx.fillRect(x + w / 2 + doorW * 0.22, y + h - doorH * 0.5, 1.4, 1.4);

  // Roof: wide overhang, dark eaves, heavy snow load and icicles.
  const over = w * 0.09;
  ctx.fillStyle = timber;
  ctx.beginPath();
  ctx.moveTo(x - over, wallTop + 2);
  ctx.lineTo(x + w / 2, y + 2);
  ctx.lineTo(x + w + over, wallTop + 2);
  ctx.lineTo(x + w + over, wallTop + 5);
  ctx.lineTo(x + w / 2, y + 5);
  ctx.lineTo(x - over, wallTop + 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x - over - 1, wallTop + 2);
  ctx.quadraticCurveTo(x + w * 0.2, y + roofH * 0.38, x + w / 2, y - 3);
  ctx.quadraticCurveTo(x + w * 0.8, y + roofH * 0.38, x + w + over + 1, wallTop + 2);
  ctx.lineTo(x + w / 2, y + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SNOW_SHADE;
  for (let ix = x - over + 2; ix < x + w + over - 2; ix += 5) {
    const len = 2 + hash01(ix, 1) * 4;
    ctx.beginPath();
    ctx.moveTo(ix, wallTop + 5);
    ctx.lineTo(ix + 1.2, wallTop + 5 + len);
    ctx.lineTo(ix + 2.4, wallTop + 5);
    ctx.closePath();
    ctx.fill();
  }

  // Chimney with snow, and the name board on the bigger houses.
  if (variant !== 2) {
    const chx = x + w * 0.7;
    ctx.fillStyle = "#8a7a6a";
    ctx.fillRect(chx, y + roofH * 0.2, 5, roofH * 0.3);
    ctx.fillStyle = SNOW;
    ctx.fillRect(chx - 1, y + roofH * 0.2 - 1.5, 7, 2);
  }
  const sign = CHALET_SIGNS[variant];
  if (sign && w > 50) {
    const sw = Math.min(w * 0.6, sign.length * 5 + 6);
    const sy = wallTop + floorH * 0.04;
    ctx.fillStyle = "#3e2a1c";
    ctx.fillRect(x + w / 2 - sw / 2, sy, sw, 6);
    drawCachedText(ctx, { text: sign, font: SIGN_FONT, color: "#f2d48a", maxWidth: sw - 3 }, x + w / 2, sy + 3.2);
  }

  ctx.restore();
}

// --- Onion-dome church ---

/** Tyrolean village church: white tower with a clock and a copper onion dome, nave behind. */
function drawOnionChurch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const towerW = w * 0.42;
  const tx = x + w * 0.12;
  const domeTop = y + h * 0.04;
  const towerTop = y + h * 0.34;

  ctx.save();

  // Nave behind the tower with a steep snowy roof.
  const naveTop = y + h * 0.6;
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(x + w * 0.3, naveTop, w * 0.7, y + h - naveTop);
  ctx.fillStyle = "#6a4a3a";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, naveTop + 1);
  ctx.lineTo(x + w * 0.66, naveTop - h * 0.16);
  ctx.lineTo(x + w * 1.02, naveTop + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, naveTop);
  ctx.lineTo(x + w * 0.66, naveTop - h * 0.17);
  ctx.lineTo(x + w * 1.02, naveTop);
  ctx.lineTo(x + w * 0.66, naveTop - h * 0.13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#6a8aa8";
  for (const fx of [0.5, 0.66, 0.82]) ctx.fillRect(x + w * fx, naveTop + h * 0.1, 3, h * 0.14);

  // Tower.
  ctx.fillStyle = "#f8f4ec";
  ctx.fillRect(tx, towerTop, towerW, y + h - towerTop);
  ctx.fillStyle = "#e4ddd0";
  ctx.fillRect(tx + towerW * 0.8, towerTop, towerW * 0.2, y + h - towerTop);
  // Clock face and belfry openings.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(tx + towerW / 2, towerTop + h * 0.08, towerW * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a2a2e";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx + towerW / 2, towerTop + h * 0.08);
  ctx.lineTo(tx + towerW / 2, towerTop + h * 0.08 - towerW * 0.16);
  ctx.moveTo(tx + towerW / 2, towerTop + h * 0.08);
  ctx.lineTo(tx + towerW / 2 + towerW * 0.12, towerTop + h * 0.08);
  ctx.stroke();
  ctx.fillStyle = "#4a3a32";
  ctx.beginPath();
  ctx.ellipse(tx + towerW / 2, towerTop + h * 0.2, towerW * 0.12, h * 0.04, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(tx + towerW * 0.38, towerTop + h * 0.2, towerW * 0.24, h * 0.04);

  // Onion dome: bulb, neck, small lantern and cross.
  const cx = tx + towerW / 2;
  const copper = "#4f8a74";
  ctx.fillStyle = copper;
  ctx.beginPath();
  ctx.moveTo(tx - 1, towerTop);
  ctx.bezierCurveTo(tx - towerW * 0.25, towerTop - h * 0.1, cx - towerW * 0.1, towerTop - h * 0.16, cx, domeTop + h * 0.1);
  ctx.bezierCurveTo(cx + towerW * 0.1, towerTop - h * 0.16, tx + towerW * 1.25, towerTop - h * 0.1, tx + towerW + 1, towerTop);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.ellipse(cx - towerW * 0.2, towerTop - h * 0.07, towerW * 0.08, h * 0.04, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.ellipse(cx, towerTop - h * 0.12, towerW * 0.22, h * 0.02, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = copper;
  ctx.fillRect(cx - 1.5, domeTop + h * 0.04, 3, h * 0.07);
  ctx.beginPath();
  ctx.arc(cx, domeTop + h * 0.04, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d4b040";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, domeTop + h * 0.02);
  ctx.lineTo(cx, domeTop - h * 0.04);
  ctx.moveTo(cx - 2.2, domeTop - h * 0.015);
  ctx.lineTo(cx + 2.2, domeTop - h * 0.015);
  ctx.stroke();

  ctx.restore();
}

// --- Ski jump ---

/** A big ski jump: concrete tower at the top, inrun on struts, take-off table and a white landing hill. */
function drawSkiJump(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const base = y + h;
  ctx.save();

  // Landing hill: a broad white slope from under the table down to the outrun on the left.
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.34, y + h * 0.6);
  ctx.bezierCurveTo(x + w * 0.22, y + h * 0.66, x + w * 0.14, y + h * 0.86, x - w * 0.06, base);
  ctx.lineTo(x + w * 0.62, base);
  ctx.bezierCurveTo(x + w * 0.52, y + h * 0.82, x + w * 0.42, y + h * 0.66, x + w * 0.34, y + h * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SNOW_SHADE;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.36, y + h * 0.62);
  ctx.bezierCurveTo(x + w * 0.42, y + h * 0.7, x + w * 0.5, y + h * 0.84, x + w * 0.62, base);
  ctx.lineTo(x + w * 0.46, base);
  ctx.bezierCurveTo(x + w * 0.42, y + h * 0.84, x + w * 0.4, y + h * 0.72, x + w * 0.36, y + h * 0.62);
  ctx.closePath();
  ctx.fill();
  // Distance lines across the landing slope.
  ctx.strokeStyle = "rgba(200,16,46,0.5)";
  ctx.lineWidth = 0.8;
  for (const f of [0.35, 0.55, 0.75]) {
    const lx = x + w * (0.3 - f * 0.3);
    const ly = y + h * (0.62 + f * 0.36);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + w * 0.16, ly + 1);
    ctx.stroke();
  }

  // Inrun struts.
  ctx.strokeStyle = "#8a96a4";
  ctx.lineWidth = 1.6;
  for (const f of [0.15, 0.35, 0.55, 0.75]) {
    const ix = x + w * (0.36 + f * 0.48);
    const iy = y + h * (0.62 - f * 0.52);
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix + 2, base);
    ctx.stroke();
  }

  // Inrun: a curved deck from the tower down to the table.
  ctx.strokeStyle = "#5a6878";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.84, y + h * 0.1);
  ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.42, x + w * 0.36, y + h * 0.6);
  ctx.stroke();
  ctx.strokeStyle = SNOW;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Tower and its glazed top.
  ctx.fillStyle = "#c4ccd4";
  ctx.fillRect(x + w * 0.82, y + h * 0.06, w * 0.1, h * 0.94);
  ctx.fillStyle = "#9aa6b2";
  ctx.fillRect(x + w * 0.89, y + h * 0.06, w * 0.03, h * 0.94);
  ctx.fillStyle = "#4a5a6a";
  ctx.fillRect(x + w * 0.78, y, w * 0.18, h * 0.08);
  ctx.fillStyle = "#f6d78a";
  for (let i = 0; i < 4; i++) ctx.fillRect(x + w * (0.795 + i * 0.04), y + h * 0.02, w * 0.02, h * 0.035);

  ctx.restore();
}

// --- Chairlift ---

/**
 * Two lift pylons with a sagging cable and chairs gliding along it. The chairs move
 * with wall-clock time; it is scenery only, so it never touches game state.
 */
function drawChairlift(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const base = y + h;
  const leftX = x + w * 0.08;
  const rightX = x + w * 0.92;
  const leftTop = y + h * 0.3;
  const rightTop = y + h * 0.02;
  const sag = h * 0.12;
  const cableAt = (t: number): [number, number] => {
    const cx = leftX + (rightX - leftX) * t;
    const cy = leftTop + (rightTop - leftTop) * t + Math.sin(Math.PI * t) * sag;
    return [cx, cy];
  };

  ctx.save();

  // Pylons with cross arms.
  for (const [px, top] of [[leftX, leftTop], [rightX, rightTop]] as const) {
    ctx.fillStyle = "#7a8694";
    ctx.beginPath();
    ctx.moveTo(px - 3, base);
    ctx.lineTo(px - 1.4, top);
    ctx.lineTo(px + 1.4, top);
    ctx.lineTo(px + 3, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5a6672";
    ctx.fillRect(px - 9, top - 2, 18, 2.4);
    ctx.fillStyle = SNOW;
    ctx.fillRect(px - 9, top - 3, 18, 1);
  }

  // Cable, running on past both pylons.
  ctx.strokeStyle = "#3a4048";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(leftX - w * 0.1, leftTop + h * 0.06);
  for (let i = 0; i <= 20; i++) ctx.lineTo(...cableAt(i / 20));
  ctx.lineTo(rightX + w * 0.1, rightTop - h * 0.04);
  ctx.stroke();

  // Chairs with a rider or two.
  const t0 = (sceneTimeMs() / 1000) * 0.025;
  const riderColors = ["#e4572e", "#2e86ab", "#f2c14e", "#4caf7d"];
  for (let i = 0; i < 5; i++) {
    const t = (i / 5 + t0) % 1;
    if (t < 0.04 || t > 0.96) continue;
    const [cx, cy] = cableAt(t);
    // Hanger, seat with backrest and footrest
    ctx.strokeStyle = "#3a4048";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + 4);
    ctx.lineTo(cx - 7, cy + 8);
    ctx.lineTo(cx - 7, cy + 15);
    ctx.stroke();
    ctx.fillStyle = "#2a3038";
    ctx.fillRect(cx - 8, cy + 15, 15, 2);
    ctx.fillRect(cx - 8, cy + 9, 2, 7);
    if (i % 2 === 0) {
      // Two skiers side by side, skis dangling
      for (const [dx, ci] of [[-3, i], [3, i + 1]] as const) {
        ctx.fillStyle = riderColors[ci % riderColors.length];
        ctx.fillRect(cx + dx - 2.2, cy + 9, 4.4, 6);
        ctx.fillStyle = "#e0b896";
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 7.4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = riderColors[(ci + 2) % riderColors.length];
        ctx.fillRect(cx + dx - 2, cy + 5.2, 4, 1.6);
      }
      ctx.strokeStyle = "#2a8ac8";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 21);
      ctx.lineTo(cx + 9, cy + 19);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// --- Après-ski bar ---

/** A wooden umbrella bar: timber counter, a big red-and-white parasol and a sign. */
function drawApresBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const base = y + h;
  ctx.save();

  // Parasol pole and canopy.
  const cx = x + w * 0.5;
  ctx.fillStyle = "#6a4a32";
  ctx.fillRect(cx - 1, y + h * 0.18, 2, h * 0.5);
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const a = x + (w * i) / segs;
    const b = x + (w * (i + 1)) / segs;
    ctx.fillStyle = i % 2 === 0 ? "#c8102e" : "#ffffff";
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(a - w * 0.04, y + h * 0.26);
    ctx.lineTo(b - w * 0.04, y + h * 0.26);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(cx, y - 1);
  ctx.lineTo(x + w * 0.3, y + h * 0.1);
  ctx.lineTo(x + w * 0.7, y + h * 0.1);
  ctx.closePath();
  ctx.fill();

  // Bar counter with a plank front.
  const counterTop = y + h * 0.62;
  ctx.fillStyle = "#7a5236";
  ctx.fillRect(x + w * 0.08, counterTop, w * 0.84, base - counterTop);
  ctx.fillStyle = "#5a3e2a";
  for (let px = x + w * 0.08; px < x + w * 0.92; px += 5) ctx.fillRect(px, counterTop + 2, 1, base - counterTop - 2);
  ctx.fillStyle = "#4a3222";
  ctx.fillRect(x + w * 0.04, counterTop - 2, w * 0.92, 3);

  // Beer glasses on the counter and the sign.
  ctx.fillStyle = "#f0c040";
  for (const fx of [0.2, 0.3, 0.7]) ctx.fillRect(x + w * fx, counterTop - 6, 3, 4);
  ctx.fillStyle = "#ffffff";
  for (const fx of [0.2, 0.3, 0.7]) ctx.fillRect(x + w * fx, counterTop - 7, 3, 1.4);
  ctx.fillStyle = "#c8102e";
  ctx.fillRect(x + w * 0.26, counterTop + 4, w * 0.48, 7);
  drawCachedText(ctx, { text: "APRÈS SKI", font: SIGN_FONT, color: "#ffffff", maxWidth: w * 0.46 }, cx, counterTop + 7.8);

  ctx.restore();
}

// --- Snowy spruce ---

/** A spruce in four tiers, each tier carrying a snow load on its upper edge. */
function drawSnowPine(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette
) {
  const cx = x + w / 2;
  ctx.save();
  ctx.fillStyle = palette.backgroundTreeTrunk;
  ctx.fillRect(cx - w * 0.07, y + h * 0.86, w * 0.14, h * 0.14);
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const top = y + (h * 0.86 * i) / tiers - (i === 0 ? 0 : h * 0.06);
    const bottom = y + (h * 0.86 * (i + 1)) / tiers + h * 0.04;
    const half = (w / 2) * (0.45 + (0.55 * (i + 1)) / tiers);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx + half, bottom);
    ctx.lineTo(cx - half, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette.treeHighlight;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx + half, bottom);
    ctx.lineTo(cx + half * 0.3, bottom);
    ctx.closePath();
    ctx.fill();
    // Snow on the tier: a thick band along the upper slopes.
    ctx.fillStyle = SNOW;
    ctx.beginPath();
    ctx.moveTo(cx, top - 0.5);
    ctx.lineTo(cx + half * 0.72, top + (bottom - top) * 0.72);
    ctx.quadraticCurveTo(cx + half * 0.4, top + (bottom - top) * 0.62, cx + half * 0.1, top + (bottom - top) * 0.7);
    ctx.quadraticCurveTo(cx - half * 0.3, top + (bottom - top) * 0.56, cx - half * 0.72, top + (bottom - top) * 0.72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// --- Austrian flag ---

/** Red-white-red flag on a white pole, rippling in the wind. */
function drawAustrianFlag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.save();
  drawFlagPole(ctx, x, y, h, "#e8e8ec");
  const fw = w * 1.3;
  const fh = h * 0.24;
  const t = sceneTimeMs() / 300;
  const amp = 1.4;
  fillFlagBand(ctx, x + 1.6, y + 2, fw, fh, 0, 1 / 3, t, amp, color);
  fillFlagBand(ctx, x + 1.6, y + 2, fw, fh, 1 / 3, 2 / 3, t, amp, "#ffffff");
  fillFlagBand(ctx, x + 1.6, y + 2, fw, fh, 2 / 3, 1, t, amp, color);
  ctx.restore();
}

// --- Austria background drawer registry ---

/** Element type → renderer. The chalet reads the element's roofColor as its timber colour. */
export const AUSTRIA_BACKGROUND_DRAWERS: Record<string, BackgroundDrawFn> = {
  chalet: drawChalet,
  onion_church: drawOnionChurch,
  ski_jump: drawSkiJump,
  chairlift: drawChairlift,
  apres_bar: drawApresBar,
  snow_pine: drawSnowPine,
  // The deer takes no element colour; its coat comes from the palette
  bg_red_deer: (ctx, x, y, w, h, _color, palette) => drawRedDeer(ctx, x, y, w, h, palette),
  austrian_flag: drawAustrianFlag,
  walking_person: drawWalkingPerson,
};
