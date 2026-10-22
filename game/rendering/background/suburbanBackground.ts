import type { EnvironmentPalette, BackgroundDrawFn } from "../../environments/types";
import { drawWalkingPerson } from "./shared";
import { boxMapper } from "../drawHelpers";

// --- Houses ---
// Three house types share one detail kit: framed windows with mullions and sills,
// a fascia under overhanging eaves, roof courses, a foundation strip and a door
// with a step. The element box (x, y, w, h) is the wall; the roof rises above it.

const FRAME = "#f4f1ea";

function framedWindow(
  ctx: CanvasRenderingContext2D, wx: number, wy: number, ww: number, wh: number,
  glass: string, mullions: "cross" | "vertical" = "cross",
) {
  ctx.fillStyle = FRAME;
  ctx.fillRect(wx - 1, wy - 1, ww + 2, wh + 2);
  ctx.fillStyle = glass;
  ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(wx, wy, ww * 0.35, wh);
  ctx.fillStyle = FRAME;
  ctx.fillRect(wx + ww / 2 - 0.4, wy, 0.8, wh);
  if (mullions === "cross") ctx.fillRect(wx, wy + wh / 2 - 0.4, ww, 0.8);
  // Sill.
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(wx - 1.5, wy + wh + 1, ww + 3, 1.2);
}

function gableRoof(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, rise: number,
  roof: string, overhang: number,
) {
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - overhang, y + 1);
  ctx.lineTo(x + w / 2, y - rise);
  ctx.lineTo(x + w + overhang, y + 1);
  ctx.closePath();
  ctx.fill();
  // Tile courses.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "rgba(0,0,0,0.14)";
  ctx.lineWidth = 0.6;
  for (let ry = y - rise + 3; ry < y; ry += 2.6) {
    ctx.beginPath();
    ctx.moveTo(x - overhang, ry);
    ctx.lineTo(x + w + overhang, ry);
    ctx.stroke();
  }
  ctx.restore();
  // Fascia board and eave shadow.
  ctx.fillStyle = FRAME;
  ctx.fillRect(x - overhang, y, w + overhang * 2, 1.2);
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.fillRect(x, y + 1.2, w, 2);
}

function wallBase(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wall: string, siding: boolean) {
  ctx.fillStyle = wall;
  ctx.fillRect(x, y, w, h);
  if (siding) {
    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = 0.6;
    for (let sy = y + 3; sy < y + h - 3; sy += 2.4) {
      ctx.beginPath();
      ctx.moveTo(x, sy);
      ctx.lineTo(x + w, sy);
      ctx.stroke();
    }
  }
  // Foundation.
  ctx.fillStyle = "#8a847b";
  ctx.fillRect(x - 0.5, y + h - 2.2, w + 1, 2.2);
}

function door(ctx: CanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number, color: string, knob: string) {
  ctx.fillStyle = FRAME;
  ctx.fillRect(dx - 1, dy - 1, dw + 2, dh + 1);
  ctx.fillStyle = color;
  ctx.fillRect(dx, dy, dw, dh);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(dx + dw * 0.2, dy + dh * 0.12, dw * 0.6, dh * 0.3);
  ctx.fillStyle = knob;
  ctx.beginPath();
  ctx.arc(dx + dw * 0.78, dy + dh * 0.55, 0.8, 0, Math.PI * 2);
  ctx.fill();
  // Step.
  ctx.fillStyle = "#b8b2a8";
  ctx.fillRect(dx - 1.5, dy + dh - 1.2, dw + 3, 1.6);
}

/** Wide single-storey bungalow with an attached garage. */
function drawBungalow(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  wall: string, roof: string, palette: EnvironmentPalette,
) {
  wallBase(ctx, x, y, w, h, wall, true);
  gableRoof(ctx, x, y, w, h * 0.55, roof, 4);

  // Garage on the right.
  const gx = x + w * 0.62;
  const gw = w * 0.32;
  const gy = y + h * 0.32;
  ctx.fillStyle = FRAME;
  ctx.fillRect(gx - 1, gy - 1, gw + 2, y + h - gy - 1);
  ctx.fillStyle = "#e7e2d8";
  ctx.fillRect(gx, gy, gw, y + h - gy - 2.2);
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 0.6;
  for (let py = gy + 3; py < y + h - 3; py += 3) {
    ctx.beginPath();
    ctx.moveTo(gx, py);
    ctx.lineTo(gx + gw, py);
    ctx.stroke();
  }

  framedWindow(ctx, x + w * 0.08, y + h * 0.3, w * 0.16, h * 0.32, palette.windowGlass);
  door(ctx, x + w * 0.34, y + h * 0.36, w * 0.1, h * 0.62, roof, palette.doorKnob);
  framedWindow(ctx, x + w * 0.49, y + h * 0.3, w * 0.08, h * 0.32, palette.windowGlass, "vertical");
}

/** Classic two-storey family house with a brick chimney. */
function drawTwoStorey(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  wall: string, roof: string, palette: EnvironmentPalette,
) {
  // Chimney behind the roof.
  ctx.fillStyle = "#9a5a44";
  ctx.fillRect(x + w * 0.7, y - h * 0.42, w * 0.11, h * 0.36);
  ctx.fillStyle = "#6e3e2e";
  ctx.fillRect(x + w * 0.69, y - h * 0.44, w * 0.13, 1.6);

  wallBase(ctx, x, y, w, h, wall, true);
  gableRoof(ctx, x, y, w, h * 0.45, roof, 3.5);

  // Floor band between storeys.
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(x, y + h * 0.48, w, 1);

  const ww = w * 0.2;
  const wh = h * 0.22;
  framedWindow(ctx, x + w * 0.14, y + h * 0.12, ww, wh, palette.windowGlass);
  framedWindow(ctx, x + w * 0.66, y + h * 0.12, ww, wh, palette.windowGlass);
  framedWindow(ctx, x + w * 0.14, y + h * 0.58, ww, wh, palette.windowGlass);
  door(ctx, x + w * 0.62, y + h * 0.56, w * 0.18, h * 0.42, roof, palette.doorKnob);
  // Porch canopy over the door.
  ctx.fillStyle = roof;
  ctx.fillRect(x + w * 0.58, y + h * 0.52, w * 0.26, 1.6);
}

/** Narrow, tall townhouse with a steep gable and a round attic window. */
function drawTownhouse(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  wall: string, roof: string, palette: EnvironmentPalette,
) {
  wallBase(ctx, x, y, w, h, wall, false);
  gableRoof(ctx, x, y, w, h * 0.42, roof, 2.5);

  // Round attic window in the gable.
  ctx.fillStyle = FRAME;
  ctx.beginPath();
  ctx.arc(x + w / 2, y - h * 0.15, w * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.windowGlass;
  ctx.beginPath();
  ctx.arc(x + w / 2, y - h * 0.15, w * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Corner quoins.
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  for (let qy = y + 2; qy < y + h - 4; qy += 4) {
    ctx.fillRect(x, qy, 2, 2);
    ctx.fillRect(x + w - 2, qy, 2, 2);
  }

  const ww = w * 0.5;
  framedWindow(ctx, x + w * 0.25, y + h * 0.08, ww, h * 0.2, palette.windowGlass, "vertical");
  framedWindow(ctx, x + w * 0.25, y + h * 0.38, ww, h * 0.2, palette.windowGlass, "vertical");
  door(ctx, x + w * 0.32, y + h * 0.68, w * 0.36, h * 0.3, roof, palette.doorKnob);
}

/** Small village church: white nave, slate roof, bell tower with a spire and cross. */
function drawChurch(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  palette: EnvironmentPalette,
) {
  const wall = "#efeae0";
  const roof = "#4f5560";
  const towerW = w * 0.28;
  const naveX = x + towerW;
  const naveW = w - towerW;

  // Nave.
  wallBase(ctx, naveX, y, naveW, h, wall, false);
  gableRoof(ctx, naveX, y, naveW, h * 0.5, roof, 2.5);
  // Tall arched windows along the nave.
  for (let i = 0; i < 3; i++) {
    const wx = naveX + naveW * (0.18 + i * 0.27);
    const ww = naveW * 0.1;
    const wy = y + h * 0.22;
    const wh = h * 0.45;
    ctx.fillStyle = FRAME;
    ctx.beginPath();
    ctx.moveTo(wx - 0.8, wy + wh + 0.8);
    ctx.lineTo(wx - 0.8, wy + ww / 2);
    ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2 + 0.8, Math.PI, 0);
    ctx.lineTo(wx + ww + 0.8, wy + wh + 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = palette.windowGlass;
    ctx.beginPath();
    ctx.moveTo(wx, wy + wh);
    ctx.lineTo(wx, wy + ww / 2);
    ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.closePath();
    ctx.fill();
  }

  // Bell tower, rising well above the nave.
  const towerTop = y - h * 0.7;
  wallBase(ctx, x, towerTop, towerW, y + h - towerTop, wall, false);
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(x + towerW - 1.2, towerTop, 1.2, y + h - towerTop);
  // Belfry opening.
  ctx.fillStyle = "#3a3f47";
  ctx.beginPath();
  const bx = x + towerW * 0.3;
  const bw = towerW * 0.4;
  const by = towerTop + h * 0.12;
  ctx.moveTo(bx, by + h * 0.18);
  ctx.lineTo(bx, by + bw / 2);
  ctx.arc(bx + bw / 2, by + bw / 2, bw / 2, Math.PI, 0);
  ctx.lineTo(bx + bw, by + h * 0.18);
  ctx.closePath();
  ctx.fill();
  // Clock.
  ctx.fillStyle = FRAME;
  ctx.beginPath();
  ctx.arc(x + towerW / 2, towerTop + h * 0.5, towerW * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3a3f47";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + towerW / 2, towerTop + h * 0.5);
  ctx.lineTo(x + towerW / 2, towerTop + h * 0.5 - towerW * 0.15);
  ctx.moveTo(x + towerW / 2, towerTop + h * 0.5);
  ctx.lineTo(x + towerW / 2 + towerW * 0.1, towerTop + h * 0.5);
  ctx.stroke();
  // Arched door at the tower base.
  const dw = towerW * 0.5;
  const dx = x + (towerW - dw) / 2;
  const dy = y + h * 0.5;
  ctx.fillStyle = "#6b4a36";
  ctx.beginPath();
  ctx.moveTo(dx, y + h - 2.2);
  ctx.lineTo(dx, dy + dw / 2);
  ctx.arc(dx + dw / 2, dy + dw / 2, dw / 2, Math.PI, 0);
  ctx.lineTo(dx + dw, y + h - 2.2);
  ctx.closePath();
  ctx.fill();

  // Spire and cross.
  const spireH = h * 0.75;
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 1, towerTop + 0.5);
  ctx.lineTo(x + towerW / 2, towerTop - spireH);
  ctx.lineTo(x + towerW + 1, towerTop + 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(x + towerW / 2, towerTop - spireH);
  ctx.lineTo(x + towerW + 1, towerTop + 0.5);
  ctx.lineTo(x + towerW * 0.7, towerTop + 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = FRAME;
  ctx.fillRect(x - 1, towerTop, towerW + 2, 1.2);
  ctx.fillStyle = "#c9a227";
  const cx = x + towerW / 2;
  const cy = towerTop - spireH;
  ctx.fillRect(cx - 0.5, cy - 5, 1, 5);
  ctx.fillRect(cx - 1.8, cy - 3.8, 3.6, 0.9);
}

/**
 * Draws a house background element. Variants: 0 = wide bungalow, 1 = two-storey
 * house, 2 = narrow townhouse, 3 = small church.
 */
export function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, palette: EnvironmentPalette, roofColor?: string, variant?: number
) {
  const roof = roofColor || wallColor;
  switch (variant) {
    case 0: drawBungalow(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 2: drawTownhouse(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 3: drawChurch(ctx, x, y, w, h, palette); break;
    default: drawTwoStorey(ctx, x, y, w, h, wallColor, roof, palette); break;
  }
}

// --- Conifer trees: layered, drooping branch tiers lit from the right ---

export function drawTreeSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette
) {
  const cx = x + w / 2;

  // Trunk.
  ctx.fillStyle = palette.backgroundTreeTrunk;
  ctx.fillRect(cx - w * 0.07, y + h * 0.78, w * 0.14, h * 0.22);

  const tiers = 6;
  for (let i = tiers - 1; i >= 0; i--) {
    const t = i / (tiers - 1);
    const apexY = y + h * (t * 0.6);
    const baseY = y + h * (0.2 + t * 0.62);
    const half = w * (0.17 + t * 0.35);
    const droop = h * 0.025;

    // Tier with drooping branch tips along its base.
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, apexY);
    ctx.lineTo(cx + half, baseY);
    ctx.lineTo(cx + half * 0.66, baseY - droop);
    ctx.lineTo(cx + half * 0.38, baseY + droop * 0.6);
    ctx.lineTo(cx + half * 0.1, baseY - droop);
    ctx.lineTo(cx - half * 0.2, baseY + droop * 0.6);
    ctx.lineTo(cx - half * 0.5, baseY - droop);
    ctx.lineTo(cx - half * 0.75, baseY + droop * 0.4);
    ctx.lineTo(cx - half, baseY);
    ctx.closePath();
    ctx.fill();

    // Sunlit right flank.
    ctx.fillStyle = palette.treeHighlight;
    ctx.beginPath();
    ctx.moveTo(cx + half * 0.05, apexY + (baseY - apexY) * 0.15);
    ctx.lineTo(cx + half * 0.95, baseY - 0.5);
    ctx.lineTo(cx + half * 0.66, baseY - droop - 0.3);
    ctx.lineTo(cx + half * 0.4, baseY - droop * 0.2);
    ctx.closePath();
    ctx.fill();

    // Shaded left flank.
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.moveTo(cx, apexY);
    ctx.lineTo(cx - half, baseY);
    ctx.lineTo(cx - half * 0.5, baseY - droop);
    ctx.lineTo(cx - half * 0.1, apexY + (baseY - apexY) * 0.5);
    ctx.closePath();
    ctx.fill();
  }
}

// --- Deer: white-tailed deer in profile, facing left ---

export function drawDeer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette
) {
  const P = boxMapper(x, y, w, h);
  const legColor = palette.creatureLeg;
  const pale = palette.creatureTail;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Slender legs: front legs straight, hind legs with the backward hock.
  const leg = (pts: Array<[number, number]>, c: string, lw: number) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    const foot = pts[pts.length - 1];
    ctx.fillStyle = "#3a2e24";
    ctx.fillRect(foot[0] - 1, foot[1] - 0.6, 2, 1.4);
  };
  leg([P(0.33, 0.55), P(0.32, 0.78), P(0.33, 0.97)], legColor, 1.6);
  leg([P(0.74, 0.55), P(0.78, 0.74), P(0.74, 0.97)], legColor, 1.8);

  // Body, neck and head as one silhouette.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...P(0.3, 0.6));
  ctx.bezierCurveTo(...P(0.24, 0.5), ...P(0.24, 0.4), ...P(0.22, 0.32));
  ctx.lineTo(...P(0.16, 0.16));
  ctx.quadraticCurveTo(...P(0.1, 0.12), ...P(0.03, 0.2));
  ctx.quadraticCurveTo(...P(0.0, 0.24), ...P(0.04, 0.27));
  ctx.lineTo(...P(0.13, 0.27));
  ctx.quadraticCurveTo(...P(0.18, 0.28), ...P(0.2, 0.18));
  ctx.lineTo(...P(0.24, 0.12));
  ctx.quadraticCurveTo(...P(0.3, 0.18), ...P(0.33, 0.33));
  ctx.bezierCurveTo(...P(0.5, 0.3), ...P(0.72, 0.28), ...P(0.84, 0.34));
  ctx.bezierCurveTo(...P(0.92, 0.38), ...P(0.9, 0.56), ...P(0.8, 0.6));
  ctx.bezierCurveTo(...P(0.64, 0.64), ...P(0.44, 0.64), ...P(0.3, 0.6));
  ctx.closePath();
  ctx.fill();

  // Pale belly and throat.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = pale;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(x, y + h * 0.56, w, h);
  ctx.beginPath();
  ctx.ellipse(...P(0.16, 0.27), w * 0.04, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Near legs over the body.
  leg([P(0.28, 0.56), P(0.27, 0.8), P(0.28, 0.98)], color, 1.8);
  leg([P(0.8, 0.52), P(0.85, 0.74), P(0.8, 0.98)], color, 2);

  // White tail flag, ear, eye, nose.
  ctx.fillStyle = "#f4efe6";
  ctx.beginPath();
  ctx.ellipse(...P(0.89, 0.37), w * 0.035, h * 0.06, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(...P(0.21, 0.08), w * 0.03, h * 0.07, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2018";
  ctx.beginPath();
  ctx.arc(...P(0.12, 0.18), 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(...P(0.02, 0.23), 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Small antlers.
  ctx.strokeStyle = "#8a7660";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(...P(0.17, 0.12));
  ctx.quadraticCurveTo(...P(0.18, 0.0), ...P(0.1, -0.06));
  ctx.moveTo(...P(0.165, 0.02));
  ctx.lineTo(...P(0.21, -0.04));
  ctx.moveTo(...P(0.13, -0.02));
  ctx.lineTo(...P(0.14, -0.08));
  ctx.stroke();

  ctx.restore();
}

// --- Suburban background drawer registry ---

/** Element type → renderer; every renderer already takes the BackgroundDrawFn arguments. */
export const SUBURBAN_BACKGROUND_DRAWERS: Record<string, BackgroundDrawFn> = {
  house: drawHouse,
  tree_silhouette: drawTreeSilhouette,
  deer: drawDeer,
  walking_person: drawWalkingPerson,
};
