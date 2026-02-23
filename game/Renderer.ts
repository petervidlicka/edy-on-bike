import { PlayerState, BackgroundLayer, ObstacleInstance, ObstacleType, TrickType, SkinDefinition, HelmetStyle, BikeStyle } from "./types";
import type { EnvironmentPalette, BackgroundDrawFn } from "./environments/types";
import { getTotalLayerWidth } from "./Background";

// --- Sky ---

function drawSky(ctx: CanvasRenderingContext2D, w: number, groundY: number, palette: EnvironmentPalette) {
  const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
  gradient.addColorStop(0, palette.sky);
  gradient.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, groundY);
}

// --- Clouds ---

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y + h * 0.5, w * 0.3, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.6, y + h * 0.35, w * 0.25, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.45, y + h * 0.3, w * 0.2, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Houses (3 variants inspired by village illustration reference) ---

function drawCottage(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  // Stone-textured wall
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y, w, h);
  // Stone block lines
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  for (let row = 0; row < 4; row++) {
    const ry = y + h * 0.1 + row * h * 0.22;
    ctx.beginPath(); ctx.moveTo(x + 2, ry); ctx.lineTo(x + w - 2, ry); ctx.stroke();
  }

  // Peaked roof
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x + w / 2, y - h * 0.4);
  ctx.lineTo(x + w + 3, y);
  ctx.closePath();
  ctx.fill();

  // Chimney
  ctx.fillRect(x + w * 0.72, y - h * 0.35, w * 0.14, h * 0.25);

  // Arched window
  ctx.fillStyle = palette.windowGlass;
  const ww = w * 0.26;
  const wy = y + h * 0.25;
  ctx.fillRect(x + w * 0.5 - ww / 2, wy + ww * 0.35, ww, ww * 0.65);
  ctx.beginPath();
  ctx.arc(x + w * 0.5, wy + ww * 0.35, ww / 2, Math.PI, 0);
  ctx.fill();

  // Door
  ctx.fillStyle = roofColor;
  ctx.fillRect(x + w * 0.08, y + h * 0.52, w * 0.22, h * 0.48);
}

function drawVillageHouse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  // Wall
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y, w, h);

  // Roof
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x + w / 2, y - h * 0.45);
  ctx.lineTo(x + w + 4, y);
  ctx.closePath();
  ctx.fill();

  // Dormer
  const dX = x + w * 0.35;
  const dW = w * 0.3;
  ctx.fillStyle = wallColor;
  ctx.fillRect(dX, y - h * 0.13, dW, h * 0.13);
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(dX - 2, y - h * 0.13);
  ctx.lineTo(dX + dW / 2, y - h * 0.26);
  ctx.lineTo(dX + dW + 2, y - h * 0.13);
  ctx.closePath();
  ctx.fill();
  // Dormer glass
  ctx.fillStyle = palette.windowGlass;
  ctx.fillRect(dX + dW * 0.25, y - h * 0.1, dW * 0.5, h * 0.07);

  // Main windows (2)
  ctx.fillStyle = palette.windowGlass;
  const ws = Math.min(w * 0.18, 8);
  ctx.fillRect(x + w * 0.15, y + h * 0.28, ws, ws);
  ctx.fillRect(x + w * 0.62, y + h * 0.28, ws, ws);
  // Window dividers
  ctx.strokeStyle = wallColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15 + ws / 2, y + h * 0.28);
  ctx.lineTo(x + w * 0.15 + ws / 2, y + h * 0.28 + ws);
  ctx.moveTo(x + w * 0.62 + ws / 2, y + h * 0.28);
  ctx.lineTo(x + w * 0.62 + ws / 2, y + h * 0.28 + ws);
  ctx.stroke();

  // Door
  ctx.fillStyle = roofColor;
  ctx.fillRect(x + w * 0.38, y + h * 0.55, w * 0.24, h * 0.45);
  // Door knob
  ctx.fillStyle = palette.doorKnob;
  ctx.beginPath();
  ctx.arc(x + w * 0.38 + w * 0.18, y + h * 0.78, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTallHouse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  // Wall
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y, w, h);

  // Peaked roof
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x + w / 2, y - h * 0.3);
  ctx.lineTo(x + w + 3, y);
  ctx.closePath();
  ctx.fill();

  // Chimney
  ctx.fillRect(x + w * 0.76, y - h * 0.25, w * 0.12, h * 0.18);

  // Upper windows (2)
  ctx.fillStyle = palette.windowGlass;
  const ws = Math.min(w * 0.2, 7);
  ctx.fillRect(x + w * 0.18, y + h * 0.12, ws, ws);
  ctx.fillRect(x + w * 0.6, y + h * 0.12, ws, ws);

  // Lower windows (2)
  ctx.fillRect(x + w * 0.18, y + h * 0.42, ws, ws);
  ctx.fillRect(x + w * 0.6, y + h * 0.42, ws, ws);

  // Floor divider line
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h * 0.36);
  ctx.lineTo(x + w - 2, y + h * 0.36);
  ctx.stroke();

  // Door
  ctx.fillStyle = roofColor;
  ctx.fillRect(x + w * 0.35, y + h * 0.7, w * 0.3, h * 0.3);
}

/** Draw a house background element — dispatches to the correct variant. */
export function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, palette: EnvironmentPalette, roofColor?: string, variant?: number
) {
  const roof = roofColor || wallColor;
  switch (variant) {
    case 0: drawCottage(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 1: drawVillageHouse(ctx, x, y, w, h, wallColor, roof, palette); break;
    case 2: drawTallHouse(ctx, x, y, w, h, wallColor, roof, palette); break;
    default: drawVillageHouse(ctx, x, y, w, h, wallColor, roof, palette); break;
  }
}

// --- Conifer trees (layered triangles from reference) ---

export function drawTreeSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette
) {
  // Trunk
  ctx.fillStyle = palette.backgroundTreeTrunk;
  ctx.fillRect(x + w * 0.38, y + h * 0.75, w * 0.24, h * 0.25);

  // Three layered triangular sections (dark green)
  ctx.fillStyle = color;
  // Bottom layer
  ctx.beginPath();
  ctx.moveTo(x - w * 0.05, y + h * 0.8);
  ctx.lineTo(x + w / 2, y + h * 0.38);
  ctx.lineTo(x + w * 1.05, y + h * 0.8);
  ctx.closePath();
  ctx.fill();

  // Middle layer
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.55);
  ctx.lineTo(x + w / 2, y + h * 0.15);
  ctx.lineTo(x + w * 0.92, y + h * 0.55);
  ctx.closePath();
  ctx.fill();

  // Top layer
  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + h * 0.3);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w * 0.82, y + h * 0.3);
  ctx.closePath();
  ctx.fill();

  // Lighter highlight triangles on right side
  ctx.fillStyle = palette.treeHighlight;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h * 0.38);
  ctx.lineTo(x + w * 0.95, y + h * 0.75);
  ctx.lineTo(x + w * 0.6, y + h * 0.75);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h * 0.15);
  ctx.lineTo(x + w * 0.85, y + h * 0.5);
  ctx.lineTo(x + w * 0.55, y + h * 0.5);
  ctx.closePath();
  ctx.fill();
}

// --- Deer (side-view silhouette) ---

export function drawDeer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette
) {
  const legColor = palette.creatureLeg;

  // Body (oval)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.42, w * 0.32, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (4 thin lines)
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.25, y + h * 0.55);
  ctx.lineTo(x + w * 0.23, y + h * 0.92);
  ctx.moveTo(x + w * 0.38, y + h * 0.55);
  ctx.lineTo(x + w * 0.4, y + h * 0.95);
  ctx.moveTo(x + w * 0.62, y + h * 0.55);
  ctx.lineTo(x + w * 0.6, y + h * 0.92);
  ctx.moveTo(x + w * 0.74, y + h * 0.55);
  ctx.lineTo(x + w * 0.76, y + h * 0.95);
  ctx.stroke();

  // Neck + Head
  ctx.fillStyle = color;
  // Neck
  ctx.beginPath();
  ctx.moveTo(x + w * 0.22, y + h * 0.35);
  ctx.lineTo(x + w * 0.14, y + h * 0.15);
  ctx.lineTo(x + w * 0.28, y + h * 0.18);
  ctx.lineTo(x + w * 0.3, y + h * 0.38);
  ctx.closePath();
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(x + w * 0.12, y + h * 0.14, w * 0.1, h * 0.08, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.beginPath();
  ctx.ellipse(x + w * 0.15, y + h * 0.06, w * 0.04, h * 0.06, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Antlers
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.08);
  ctx.lineTo(x + w * 0.06, y);
  ctx.lineTo(x + w * 0.02, y - h * 0.02);
  ctx.moveTo(x + w * 0.06, y);
  ctx.lineTo(x + w * 0.1, y - h * 0.04);
  ctx.stroke();

  // Tail
  ctx.fillStyle = palette.creatureTail;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.82, y + h * 0.35, w * 0.04, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Walking person (simple side-view figure) ---

export function drawWalkingPerson(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette
) {
  // Head
  ctx.fillStyle = palette.player.skin;
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.1, h * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.17);
  ctx.lineTo(x + w * 0.5, y + h * 0.52);
  ctx.stroke();

  // Legs (walking pose)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.52);
  ctx.lineTo(x + w * 0.25, y + h * 0.92);
  ctx.moveTo(x + w * 0.5, y + h * 0.52);
  ctx.lineTo(x + w * 0.75, y + h * 0.92);
  ctx.stroke();

  // Arms (one forward, one back)
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.28);
  ctx.lineTo(x + w * 0.15, y + h * 0.48);
  ctx.moveTo(x + w * 0.5, y + h * 0.28);
  ctx.lineTo(x + w * 0.85, y + h * 0.44);
  ctx.stroke();
}

// --- Ground ---

function drawGround(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, groundY: number, offset: number, palette: EnvironmentPalette) {
  // Ground fill — stretches to bottom of canvas
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, groundY, canvasW, canvasH - groundY);

  // Road surface
  ctx.fillStyle = palette.road;
  ctx.fillRect(0, groundY, canvasW, 20);

  // Dashed road markings
  ctx.strokeStyle = palette.roadLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 15]);
  ctx.lineDashOffset = offset;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 10);
  ctx.lineTo(canvasW, groundY + 10);
  ctx.stroke();
  ctx.setLineDash([]);
}

// --- Background layers ---

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  layers: BackgroundLayer[],
  canvasW: number,
  canvasH: number,
  groundY: number,
  palette: EnvironmentPalette,
  drawers: Record<string, BackgroundDrawFn>
) {
  drawSky(ctx, canvasW, groundY, palette);

  // Layer 0: clouds
  const cloudLayer = layers[0];
  const cloudWidth = getTotalLayerWidth(cloudLayer, canvasW);
  const cloudNorm = cloudLayer.offset % cloudWidth;
  for (const el of cloudLayer.elements) {
    // Check both the natural scroll position and the wrapped copy
    for (const shift of [0, cloudWidth, -cloudWidth]) {
      const drawX = el.x - cloudNorm + shift;
      if (drawX + el.width < 0 || drawX > canvasW) continue;
      drawCloud(ctx, drawX, el.y, el.width, el.height, el.color);
    }
  }

  // Layer 1: buildings & nature — dispatched via drawers map
  const buildingLayer = layers[1];
  const buildingWidth = getTotalLayerWidth(buildingLayer, canvasW);
  const buildingNorm = buildingLayer.offset % buildingWidth;
  for (const el of buildingLayer.elements) {
    for (const shift of [0, buildingWidth, -buildingWidth]) {
      const drawX = el.x - buildingNorm + shift;
      if (drawX + el.width < 0 || drawX > canvasW) continue;
      const drawFn = drawers[el.type];
      if (drawFn) {
        drawFn(ctx, drawX, el.y, el.width, el.height, el.color, palette, el.roofColor, el.variant);
      }
    }
  }

  // Layer 2: ground + road
  drawGround(ctx, canvasW, canvasH, groundY, layers[2].offset, palette);
}

// --- Player (BMX bike + stick-figure rider with helmet) ---
// The bike rotates around the bottom bracket during a bunnyhop (bikeTilt).
// The rider moves independently: leans back → stands up → tucks legs.

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// --- Helmet styles (skin-specific headwear) ---

function drawHelmet(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  helmetStyle: HelmetStyle,
  helmetColor: string
) {
  ctx.fillStyle = helmetColor;

  switch (helmetStyle) {
    case "aero":
      // Teardrop aero helmet with tail
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(headX - 7, headY - 1);
      ctx.lineTo(headX - 12, headY - 3);
      ctx.lineTo(headX - 5, headY - 6);
      ctx.closePath();
      ctx.fill();
      break;

    case "cowboy":
      // Wide brim + dome
      ctx.beginPath();
      ctx.arc(headX, headY - 3, 6, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(headX - 12, headY - 3, 24, 2);
      break;

    case "crown":
      // 3-point crown
      ctx.beginPath();
      ctx.moveTo(headX - 8, headY - 1);
      ctx.lineTo(headX - 7, headY - 8);
      ctx.lineTo(headX - 3, headY - 5);
      ctx.lineTo(headX, headY - 10);
      ctx.lineTo(headX + 3, headY - 5);
      ctx.lineTo(headX + 7, headY - 8);
      ctx.lineTo(headX + 8, headY - 1);
      ctx.closePath();
      ctx.fill();
      break;

    case "cap":
      // Baseball cap
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(headX, headY - 2, 11, 2);
      break;

    case "goggles":
      // Skull cap + reflective goggles band
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, -0.1);
      ctx.fill();
      ctx.fillStyle = "#88ccff";
      ctx.fillRect(headX - 7, headY - 1, 14, 2);
      break;

    default: // standard — BMX half-shell with visor + stripes
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(headX - 8, headY - 1, 16, 2);
      ctx.beginPath();
      ctx.moveTo(headX + 5, headY - 1);
      ctx.lineTo(headX + 10, headY + 2);
      ctx.lineTo(headX + 4, headY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(headX - 1, headY - 1, 5.5, -Math.PI * 0.82, -Math.PI * 0.18);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(headX + 2, headY - 1, 5.5, -Math.PI * 0.82, -Math.PI * 0.18);
      ctx.stroke();
      break;
  }
}

// --- Bike geometry per style ---

interface BikeGeom {
  wheelR: number;
  rearWheelX: number;
  frontWheelX: number;
  wheelY: number;
  pivotX: number;
  pivotY: number;
  seatX: number;
  seatY: number;
  bbX: number;
  bbY: number;
  headX: number;
  headY: number;
}

function getBikeGeometry(bikeStyle: BikeStyle, x: number, y: number): BikeGeom {
  switch (bikeStyle) {
    case "racing":
      // Road bike: shorter wheelbase, taller frame
      return {
        wheelR: 12, rearWheelX: x + 16, frontWheelX: x + 48, wheelY: y + 46,
        pivotX: x + 29, pivotY: y + 43,
        seatX: x + 24, seatY: y + 30,
        bbX: x + 29, bbY: y + 44,
        headX: x + 43, headY: y + 24,
      };
    case "mtb":
      // Mountain bike: bigger wheels, wider wheelbase
      return {
        wheelR: 14, rearWheelX: x + 10, frontWheelX: x + 54, wheelY: y + 44,
        pivotX: x + 27, pivotY: y + 41,
        seatX: x + 22, seatY: y + 32,
        bbX: x + 27, bbY: y + 42,
        headX: x + 45, headY: y + 25,
      };
    default: // bmx, cruiser, fixie, fatTire
      return {
        wheelR: 12, rearWheelX: x + 12, frontWheelX: x + 52, wheelY: y + 46,
        pivotX: x + 27, pivotY: y + 43,
        seatX: x + 23, seatY: y + 35,
        bbX: x + 27, bbY: y + 44,
        headX: x + 45, headY: y + 26,
      };
  }
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rotation: number,
  color: string,
  glow: boolean
) {
  // Glow halo for neon skin
  if (glow) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,165,0,0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,165,0,0.15)";
    ctx.fill();
    ctx.restore();
  }
  // Tire
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();
  // 6 spokes
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const angle = rotation + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 2, cy + Math.sin(angle) * 2);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.stroke();
  }
}

function drawBikeFrame(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  g: BikeGeom,
  x: number,
  y: number
) {
  const c = skin.colors;
  const { seatX, seatY, bbX, bbY, headX, headY, rearWheelX, frontWheelX, wheelY } = g;

  ctx.strokeStyle = c.frame;
  ctx.lineWidth = 2;

  // Main triangle: top tube + down tube + seat tube
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(headX, headY + 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headX, headY + 5); ctx.lineTo(bbX, bbY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(bbX, bbY); ctx.stroke();

  // Rear triangle: chain stays + seat stays
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(seatX, seatY + 1); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();

  // Fork — varies by bike style
  if (skin.bikeStyle === "mtb") {
    // Suspension fork: two parallel stanchion lines with thicker lower legs
    const forkMidY = headY + (wheelY - headY) * 0.55;
    const forkTipX = frontWheelX;
    // Upper stanchions (thin, lighter)
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(headX + 1, headY); ctx.lineTo(headX + 3, forkMidY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(headX + 4, headY); ctx.lineTo(headX + 6, forkMidY); ctx.stroke();
    // Lower fork legs (thicker, frame color)
    ctx.strokeStyle = c.frame;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(headX + 3, forkMidY); ctx.lineTo(forkTipX, wheelY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(headX + 6, forkMidY); ctx.lineTo(forkTipX + 3, wheelY); ctx.stroke();
    // Fork crown (connects the two legs)
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(headX + 2, forkMidY); ctx.lineTo(headX + 7, forkMidY); ctx.stroke();
  } else {
    // Standard rigid fork (two segments)
    const forkMidX = headX + (frontWheelX - headX) * 0.6;
    const forkMidY = headY + (wheelY - headY) * 0.9;
    ctx.beginPath(); ctx.moveTo(headX, headY); ctx.lineTo(forkMidX, forkMidY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(forkMidX, forkMidY); ctx.lineTo(frontWheelX, wheelY); ctx.stroke();
  }

  // Chainring (sprocket circle at BB)
  ctx.fillStyle = c.frame;
  ctx.beginPath();
  ctx.arc(bbX, bbY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bbX, bbY, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Seat post + saddle
  ctx.strokeStyle = c.frame;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(seatX - 1, seatY - 3); ctx.stroke();
  ctx.fillStyle = c.wheel;
  ctx.fillRect(seatX - 6, seatY - 5, 10, 3);

  // Crank arms + pedals
  const pedalLX = bbX - 8;
  const pedalRX = bbX + 8;
  const pedalY = bbY;
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(pedalLX, pedalY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(pedalRX, pedalY); ctx.stroke();
  ctx.fillStyle = c.wheel;
  ctx.fillRect(pedalLX - 3, pedalY - 1, 6, 3);
  ctx.fillRect(pedalRX - 3, pedalY - 1, 6, 3);
}

function drawHandlebars(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  g: BikeGeom
): { gripX: number; gripY: number } {
  const c = skin.colors;
  const { headX, headY } = g;

  if (skin.bikeStyle === "racing") {
    // Road bike drop handlebars
    const stemTopX = headX;
    const stemTopY = headY - 5;
    ctx.strokeStyle = c.wheel;
    ctx.lineWidth = 2;
    // Stem
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(stemTopX, stemTopY);
    ctx.stroke();
    // Drops: curved bar that goes forward then down
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stemTopX - 1, stemTopY);
    ctx.quadraticCurveTo(stemTopX + 6, stemTopY - 3, stemTopX + 5, stemTopY + 3);
    ctx.quadraticCurveTo(stemTopX + 4, stemTopY + 8, stemTopX, stemTopY + 5);
    ctx.stroke();
    // Hoods (grip position at top of drops)
    return { gripX: stemTopX + 4, gripY: stemTopY + 1 };
  }

  if (skin.bikeStyle === "mtb") {
    // Mountain bike flat handlebars — wider flat bar
    const stemTopX = headX;
    const stemTopY = headY - 5;
    ctx.strokeStyle = c.wheel;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(stemTopX, stemTopY);
    ctx.stroke();
    // Wide flat bar
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(stemTopX - 6, stemTopY);
    ctx.lineTo(stemTopX + 4, stemTopY);
    ctx.stroke();
    return { gripX: stemTopX - 4, gripY: stemTopY };
  }

  // Default (BMX/cruiser/fixie/fatTire): stem riser + crossbar
  const stemTopX = headX - 1;
  const stemTopY = headY - 7;
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(headX, headY);
  ctx.lineTo(stemTopX, stemTopY);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(stemTopX - 3, stemTopY);
  ctx.lineTo(stemTopX + 2, stemTopY);
  ctx.stroke();
  return { gripX: stemTopX - 2, gripY: stemTopY };
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, skin: SkinDefinition) {
  const { x, y, wheelRotation, bikeTilt, riderLean, riderCrouch, legTuck, backflipAngle, flipDirection } = player;
  const c = skin.colors;
  const g = getBikeGeometry(skin.bikeStyle, x, y);
  const glowWheels = skin.bikeStyle === "fixie"; // neon skin

  ctx.save();

  // Flip rotation — backflip (CCW) or frontflip (CW) around player center
  if (backflipAngle > 0) {
    const centerX = x + player.width / 2;
    const centerY = y + player.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(-backflipAngle * flipDirection);
    ctx.translate(-centerX, -centerY);
  }

  ctx.translate(g.pivotX, g.pivotY);
  ctx.rotate(-bikeTilt);
  ctx.translate(-g.pivotX, -g.pivotY);

  // ── Wheels ──
  drawWheel(ctx, g.rearWheelX, g.wheelY, g.wheelR, wheelRotation, c.wheel, glowWheels);
  drawWheel(ctx, g.frontWheelX, g.wheelY, g.wheelR, wheelRotation, c.wheel, glowWheels);

  // ── Frame ──
  drawBikeFrame(ctx, skin, g, x, y);

  // ── Handlebars ──
  const { gripX, gripY } = drawHandlebars(ctx, skin, g);

  // ── Rider (standing tall on pedals) ──
  const { bbX, bbY } = g;
  const pedalLX = bbX - 8;
  const pedalRX = bbX + 8;
  const pedalY = bbY;

  const trickProg = player.trickProgress;
  const activeTrick = player.activeTrick;

  // Hip
  const standX = bbX;
  const standY = bbY - 20;
  let hipX = standX - riderLean * 7;
  let hipY = standY - riderCrouch * 10;

  // Torso — slightly more forward lean for road bike
  const torsoLeanOffset = skin.bikeStyle === "racing" ? 0.15 : 0;
  const baseTorsoAngle = Math.atan2(-13, 2) + torsoLeanOffset;
  const torsoLength = 13;
  const adjustedAngle = baseTorsoAngle - riderLean * 1.2;
  let shoulderX = hipX + Math.cos(adjustedAngle) * torsoLength;
  let shoulderY = hipY + Math.sin(adjustedAngle) * torsoLength;

  // Legs
  let footLX = lerp(pedalLX, hipX - 2, legTuck * 0.7);
  let footLY = lerp(pedalY, hipY + 7, legTuck * 0.8);
  let footRX = lerp(pedalRX, hipX + 4, legTuck * 0.7);
  let footRY = lerp(pedalY, hipY + 9, legTuck * 0.8);

  // Knees
  let kneeLX = lerp((hipX + footLX) / 2 + 1, hipX - 3, legTuck * 0.5);
  let kneeLY = lerp((hipY + footLY) / 2 + 1, hipY + 5, legTuck * 0.5);
  let kneeRX = lerp((hipX + footRX) / 2 + 2, hipX + 2, legTuck * 0.5);
  let kneeRY = lerp((hipY + footRY) / 2, hipY + 5, legTuck * 0.5);

  // Arms
  let elbowX = shoulderX + 6;
  let elbowY = shoulderY + 6;
  let drawGripX = gripX;
  let drawGripY = gripY;

  // --- Pose trick modifications ---
  if (activeTrick === TrickType.SUPERMAN && trickProg > 0) {
    hipX = lerp(hipX, hipX - 10, trickProg);
    hipY = lerp(hipY, hipY + 5, trickProg);
    const supermanAngle = lerp(adjustedAngle, -0.3, trickProg);
    shoulderX = hipX + Math.cos(supermanAngle) * torsoLength;
    shoulderY = hipY + Math.sin(supermanAngle) * torsoLength;
    footLX = lerp(pedalLX, hipX - 22, trickProg);
    footLY = lerp(pedalY, hipY + 2, trickProg);
    footRX = lerp(pedalRX, hipX - 20, trickProg);
    footRY = lerp(pedalY, hipY + 4, trickProg);
    kneeLX = lerp(kneeLX, (hipX + footLX) / 2, trickProg);
    kneeLY = lerp(kneeLY, (hipY + footLY) / 2 - 1, trickProg);
    kneeRX = lerp(kneeRX, (hipX + footRX) / 2, trickProg);
    kneeRY = lerp(kneeRY, (hipY + footRY) / 2 + 1, trickProg);
    elbowX = lerp(shoulderX + 6, (shoulderX + gripX) / 2 + 3, trickProg);
    elbowY = lerp(shoulderY + 6, (shoulderY + gripY) / 2 + 2, trickProg);
  }

  if (activeTrick === TrickType.NO_HANDER && trickProg > 0) {
    elbowX = lerp(shoulderX + 6, shoulderX - 4, trickProg);
    elbowY = lerp(shoulderY + 6, shoulderY - 8, trickProg);
    drawGripX = lerp(gripX, shoulderX + 8, trickProg);
    drawGripY = lerp(gripY, shoulderY - 14, trickProg);
  }

  // Draw legs
  ctx.strokeStyle = c.pants;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hipX - 1, hipY + 2);
  ctx.lineTo(kneeLX, kneeLY);
  ctx.lineTo(footLX, footLY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hipX + 2, hipY + 2);
  ctx.lineTo(kneeRX, kneeRY);
  ctx.lineTo(footRX, footRY);
  ctx.stroke();

  // Draw torso
  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Backpack for MTB (trail rider) — drawn behind arms
  if (skin.bikeStyle === "mtb") {
    ctx.fillStyle = "#87ceeb";
    const bpX = (hipX + shoulderX) / 2 - 6;
    const bpY = (hipY + shoulderY) / 2 - 3;
    ctx.beginPath();
    ctx.moveTo(bpX, bpY);
    ctx.lineTo(bpX - 4, bpY + 2);
    ctx.lineTo(bpX - 3, bpY + 10);
    ctx.lineTo(bpX + 3, bpY + 10);
    ctx.lineTo(bpX + 2, bpY);
    ctx.closePath();
    ctx.fill();
    // Strap
    ctx.strokeStyle = "#6ab0d6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(shoulderX - 2, shoulderY + 1);
    ctx.lineTo(bpX, bpY + 2);
    ctx.stroke();
  }

  // Draw arms
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(drawGripX, drawGripY);
  ctx.stroke();

  // Head
  const headPosX = shoulderX + 1;
  const headPosY = shoulderY - 7;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(headPosX, headPosY + 1, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#2e2e2e";
  ctx.beginPath();
  ctx.arc(headPosX + 3, headPosY, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Sunglasses for Shadow Ops
  if (skin.bikeStyle === "fatTire") {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(headPosX - 5, headPosY - 1.5, 11, 3);
    // Glint
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(headPosX + 3, headPosY - 1, 2, 1);
  }

  // Helmet (skin-specific style)
  drawHelmet(ctx, headPosX, headPosY, skin.helmetStyle, c.helmet);

  ctx.restore();
}

export function drawSkinPreview(ctx: CanvasRenderingContext2D, skin: SkinDefinition, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  // Use a wider logical bounding box to capture the full bike geometry
  // (e.g. MTB front wheel extends to ~x=68)
  const logicalW = 75;
  const logicalH = 50;
  const scale = Math.min(w / logicalW, h / logicalH);
  ctx.save();
  ctx.translate((w - logicalW * scale) / 2, (h - logicalH * scale) / 2);
  ctx.scale(scale, scale);
  const mockPlayer: PlayerState = {
    x: 6,
    y: -8,
    width: 50,
    height: 55,
    velocityY: 0,
    jumpCount: 0,
    isOnGround: true,
    wheelRotation: 0,
    bikeTilt: 0,
    riderLean: 0,
    riderCrouch: 0,
    legTuck: 0,
    ridingObstacle: null,
    backflipAngle: 0,
    isBackflipping: false,
    flipDirection: 1,
    activeTrick: TrickType.NONE,
    trickProgress: 0,
    trickPhase: "extend",
    trickCompletions: 0,
    rampBoost: null,
    rampSurfaceAngle: 0,
    targetFlipCount: 0,
  };
  drawPlayer(ctx, mockPlayer, skin);
  ctx.restore();
}

// --- Obstacle draw functions ---

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  ctx.fillStyle = c.rock;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + h * 0.9);
  ctx.lineTo(x + w * 0.02, y + h * 0.55);
  ctx.lineTo(x + w * 0.2, y + h * 0.15);
  ctx.lineTo(x + w * 0.55, y + h * 0.05);
  ctx.lineTo(x + w * 0.88, y + h * 0.2);
  ctx.lineTo(x + w * 0.98, y + h * 0.6);
  ctx.lineTo(x + w * 0.82, y + h * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.rockHighlight;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.12);
  ctx.lineTo(x + w * 0.85, y + h * 0.25);
  ctx.lineTo(x + w * 0.75, y + h * 0.5);
  ctx.lineTo(x + w * 0.45, y + h * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.rockShadow;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.6);
  ctx.lineTo(x + w * 0.35, y + h * 0.55);
  ctx.lineTo(x + w * 0.4, y + h * 0.85);
  ctx.lineTo(x + w * 0.15, y + h * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = c.rockShadow;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + h * 0.3);
  ctx.lineTo(x + w * 0.45, y + h * 0.55);
  ctx.lineTo(x + w * 0.55, y + h * 0.5);
  ctx.stroke();
  ctx.strokeStyle = c.rockShadow;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + h * 0.9);
  ctx.lineTo(x + w * 0.02, y + h * 0.55);
  ctx.lineTo(x + w * 0.2, y + h * 0.15);
  ctx.lineTo(x + w * 0.55, y + h * 0.05);
  ctx.lineTo(x + w * 0.88, y + h * 0.2);
  ctx.lineTo(x + w * 0.98, y + h * 0.6);
  ctx.lineTo(x + w * 0.82, y + h * 0.95);
  ctx.closePath();
  ctx.stroke();
}

function drawSmallTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const cx = x + w / 2;
  ctx.fillStyle = c.treeTrunk;
  ctx.fillRect(cx - w * 0.1, y + h * 0.55, w * 0.2, h * 0.45);
  ctx.strokeStyle = c.treeTrunkShadow;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.04, y + h * 0.58);
  ctx.lineTo(cx - w * 0.02, y + h * 0.95);
  ctx.moveTo(cx + w * 0.05, y + h * 0.6);
  ctx.lineTo(cx + w * 0.04, y + h * 0.9);
  ctx.stroke();
  ctx.fillStyle = c.tree;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.48, w * 0.5, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.08, y + h * 0.32, w * 0.42, h * 0.16, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.05, y + h * 0.18, w * 0.32, h * 0.14, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.treeHighlight;
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.15, y + h * 0.44, w * 0.22, h * 0.1, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.1, y + h * 0.26, w * 0.18, h * 0.08, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.treeTrunkShadow;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.48, w * 0.5, h * 0.18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.05, y + h * 0.18, w * 0.32, h * 0.14, 0.1, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTallTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const cx = x + w / 2;
  ctx.fillStyle = c.treeTrunk;
  ctx.fillRect(cx - w * 0.08, y + h * 0.75, w * 0.16, h * 0.25);
  ctx.strokeStyle = c.treeTrunkShadow;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.02, y + h * 0.77);
  ctx.lineTo(cx - w * 0.01, y + h * 0.98);
  ctx.stroke();
  ctx.fillStyle = c.tree;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.42, w * 0.38, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.14, w * 0.22, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.25, y + h * 0.5, w * 0.15, h * 0.1, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.25, y + h * 0.45, w * 0.15, h * 0.1, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.treeHighlight;
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.12, y + h * 0.38, w * 0.16, h * 0.18, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.08, y + h * 0.12, w * 0.1, h * 0.1, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.treeTrunkShadow;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.42, w * 0.38, h * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGiantTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const cx = x + w / 2;
  ctx.fillStyle = c.giantTreeTrunk;
  ctx.fillRect(cx - w * 0.14, y + h * 0.65, w * 0.28, h * 0.35);
  ctx.strokeStyle = c.giantTreeBark;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.04, y + h * 0.67);
  ctx.lineTo(cx - w * 0.02, y + h * 0.97);
  ctx.moveTo(cx + w * 0.06, y + h * 0.69);
  ctx.lineTo(cx + w * 0.05, y + h * 0.95);
  ctx.stroke();
  ctx.fillStyle = c.giantTreeCanopy;
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.15, y + h * 0.55, w * 0.38, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.15, y + h * 0.52, w * 0.38, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.40, w * 0.48, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.1, y + h * 0.30, w * 0.40, h * 0.14, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.05, y + h * 0.20, w * 0.32, h * 0.12, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.10, w * 0.22, h * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.giantTreeCanopyHighlight;
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.2, y + h * 0.38, w * 0.20, h * 0.10, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.12, y + h * 0.22, w * 0.16, h * 0.08, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.08, y + h * 0.50, w * 0.18, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.giantTreeOutline;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.40, w * 0.48, h * 0.16, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStraightRamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  ctx.fillStyle = c.rampWood;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c.rampWoodHighlight;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + 3);
  ctx.lineTo(x + 3, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = c.rampWoodDark;
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    const lx = x + w * t;
    ctx.beginPath();
    ctx.moveTo(lx, y + h - h * t);
    ctx.lineTo(lx, y + h);
    ctx.stroke();
  }
  ctx.strokeStyle = c.rampWoodDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.55, y + h);
  ctx.lineTo(x + w - 2, y + h * 0.45);
  ctx.stroke();
  ctx.strokeStyle = c.rampWoodDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.stroke();
}

function drawCurvedRamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  ctx.fillStyle = c.rampMetal;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.7, y + h, x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = c.rampMetalDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.7, y + h, x + w, y);
  ctx.stroke();
  ctx.fillStyle = c.rampMetalDark;
  ctx.fillRect(x + w - 3, y, 3, 6);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 0.7;
  for (let i = 1; i < 3; i++) {
    const ly = y + h * (i / 3);
    ctx.beginPath();
    ctx.moveTo(x, ly + h * 0.1);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }
  ctx.strokeStyle = c.rampMetalDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.7, y + h, x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.stroke();
}

function drawShoppingTrolley(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const basketTop = y;
  const basketBottom = y + h - 14;
  const basketLeft = x + 8;
  const basketRight = x + w;
  const bw = basketRight - basketLeft;
  const bh = basketBottom - basketTop;

  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, basketTop + 4);
  ctx.lineTo(basketLeft, basketTop);
  ctx.stroke();
  ctx.strokeStyle = c.trolleyAccent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, basketTop + 2);
  ctx.lineTo(x, basketTop + 10);
  ctx.stroke();

  ctx.fillStyle = c.trolleyBasket;
  ctx.beginPath();
  ctx.moveTo(basketLeft + 2, basketBottom);
  ctx.lineTo(basketLeft, basketTop);
  ctx.lineTo(basketRight, basketTop);
  ctx.lineTo(basketRight - 2, basketBottom);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 0.8;
  for (let i = 1; i <= 3; i++) {
    const gy = basketTop + bh * (i / 4);
    ctx.beginPath();
    ctx.moveTo(basketLeft, gy);
    ctx.lineTo(basketRight, gy);
    ctx.stroke();
  }
  for (let i = 1; i <= 3; i++) {
    const gx = basketLeft + bw * (i / 4);
    ctx.beginPath();
    ctx.moveTo(gx, basketTop);
    ctx.lineTo(gx, basketBottom);
    ctx.stroke();
  }

  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(basketLeft + 2, basketBottom);
  ctx.lineTo(basketLeft, basketTop);
  ctx.lineTo(basketRight, basketTop);
  ctx.lineTo(basketRight - 2, basketBottom);
  ctx.closePath();
  ctx.stroke();

  const wheelR = 5;
  const wy = y + h - wheelR - 1;
  for (const wx of [x + 14, x + w - 8]) {
    ctx.fillStyle = c.trolleyBasket;
    ctx.strokeStyle = c.trolley;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wx, wy, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(a) * wheelR, wy + Math.sin(a) * wheelR);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(basketLeft + 4, basketBottom);
  ctx.lineTo(x + 14, wy - wheelR);
  ctx.moveTo(basketRight - 4, basketBottom);
  ctx.lineTo(x + w - 8, wy - wheelR);
  ctx.stroke();
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;

  // Body (lower)
  ctx.fillStyle = c.car;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 14);
  ctx.lineTo(x + w - 4, y + 14);
  ctx.quadraticCurveTo(x + w, y + 14, x + w, y + 18);
  ctx.lineTo(x + w, y + h - 10);
  ctx.quadraticCurveTo(x + w, y + h - 6, x + w - 4, y + h - 6);
  ctx.lineTo(x + 4, y + h - 6);
  ctx.quadraticCurveTo(x, y + h - 6, x, y + h - 10);
  ctx.lineTo(x, y + 18);
  ctx.quadraticCurveTo(x, y + 14, x + 4, y + 14);
  ctx.fill();

  // Roof
  ctx.fillStyle = c.carRoof;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 14);
  ctx.lineTo(x + 12, y + 4);
  ctx.quadraticCurveTo(x + 14, y, x + 18, y);
  ctx.lineTo(x + w - 18, y);
  ctx.quadraticCurveTo(x + w - 14, y, x + w - 12, y + 4);
  ctx.lineTo(x + w - 16, y + 14);
  ctx.closePath();
  ctx.fill();

  // Windows
  ctx.fillStyle = c.carWindow;
  ctx.fillRect(x + 16, y + 2, 18, 11);
  ctx.fillRect(x + w - 34, y + 2, 18, 11);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(x + 17, y + 3, 6, 4);
  ctx.fillRect(x + w - 33, y + 3, 6, 4);

  // Door line
  ctx.strokeStyle = c.carRoof;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + 14);
  ctx.lineTo(x + w * 0.5, y + h - 10);
  ctx.stroke();

  // Bumpers
  ctx.fillStyle = c.carBumper;
  ctx.fillRect(x - 1, y + h - 10, 6, 3);
  ctx.fillRect(x + w - 5, y + h - 10, 6, 3);

  // Headlight / Taillight
  ctx.fillStyle = c.carHeadlight;
  ctx.beginPath();
  ctx.arc(x + w - 3, y + 20, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.carTaillight;
  ctx.beginPath();
  ctx.arc(x + 3, y + 20, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Wheels
  ctx.fillStyle = c.carWheel;
  ctx.beginPath();
  ctx.arc(x + 16, y + h - 7, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 16, y + h - 7, 9, 0, Math.PI * 2);
  ctx.fill();
  // Hubcaps
  ctx.fillStyle = c.carBumper;
  ctx.beginPath();
  ctx.arc(x + 16, y + h - 7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 16, y + h - 7, 4, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = c.carRoof;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 14);
  ctx.lineTo(x + w - 4, y + 14);
  ctx.quadraticCurveTo(x + w, y + 14, x + w, y + 18);
  ctx.lineTo(x + w, y + h - 10);
  ctx.moveTo(x, y + h - 10);
  ctx.lineTo(x, y + 18);
  ctx.quadraticCurveTo(x, y + 14, x + 4, y + 14);
  ctx.stroke();
}

function drawPersonOnBike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const wheelR = 9;
  const rearWX = x + wheelR + 2;
  const frontWX = x + w - wheelR - 2;
  const wheelY = y + h - wheelR;

  ctx.strokeStyle = c.bikeFrame;
  ctx.lineWidth = 2;
  for (const wx of [rearWX, frontWX]) {
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * 2, wheelY + Math.sin(a) * 2);
      ctx.lineTo(wx + Math.cos(a) * wheelR, wheelY + Math.sin(a) * wheelR);
      ctx.stroke();
    }
    ctx.fillStyle = c.bikeFrame;
    ctx.beginPath();
    ctx.arc(wx, wheelY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
  }

  const pedalX = x + w * 0.45;
  const pedalY = wheelY - 4;
  const seatX = x + w * 0.3;
  const seatY = y + h * 0.52;
  ctx.strokeStyle = c.bikeFrame;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rearWX, wheelY);
  ctx.lineTo(pedalX, pedalY);
  ctx.lineTo(frontWX, wheelY);
  ctx.moveTo(pedalX, pedalY);
  ctx.lineTo(seatX, seatY);
  ctx.moveTo(seatX, seatY);
  ctx.lineTo(frontWX - 2, seatY - 4);
  ctx.stroke();

  ctx.fillStyle = c.bikeRider;
  ctx.fillRect(seatX - 4, seatY - 2, 8, 3);

  const shoulderX = seatX + 6;
  const shoulderY = seatY - 14;
  ctx.strokeStyle = c.bikeRider;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(seatX + 2, seatY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(frontWX - 4, seatY - 6);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(seatX + 2, seatY);
  ctx.lineTo(pedalX - 3, pedalY);
  ctx.moveTo(seatX + 2, seatY);
  ctx.lineTo(pedalX + 3, pedalY);
  ctx.stroke();

  // Head — use palette player skin
  ctx.fillStyle = palette.player.skin;
  ctx.beginPath();
  ctx.arc(shoulderX + 1, shoulderY - 7, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.bikeRider;
  ctx.beginPath();
  ctx.arc(shoulderX + 1, shoulderY - 8, 5.5, Math.PI, 0);
  ctx.fill();
}

function drawBusStop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  ctx.fillStyle = c.busStopFrame;
  ctx.fillRect(x + 4, y + 10, 4, h - 10);
  ctx.fillRect(x + w - 8, y + 10, 4, h - 10);

  ctx.fillStyle = c.busStopRoof;
  ctx.fillRect(x - 2, y, w + 4, 10);
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(x, y + 10, w, 3);

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = c.busStopGlass;
  ctx.fillRect(x + 10, y + 14, w - 20, h - 22);
  ctx.restore();
  ctx.strokeStyle = c.busStopFrame;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 10, y + 14, w - 20, h - 22);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 14);
  ctx.lineTo(x + w / 2, y + h - 8);
  ctx.stroke();

  ctx.fillStyle = c.busStopFrame;
  ctx.fillRect(x + 12, y + h - 14, w - 24, 4);
  ctx.fillRect(x + 14, y + h - 10, 2, 6);
  ctx.fillRect(x + w - 16, y + h - 10, 2, 6);

  ctx.fillStyle = c.busStopSign;
  ctx.beginPath();
  ctx.arc(x + 6, y + 18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 6px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("B", x + 6, y + 18);
}

function drawShippingContainer(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  ctx.fillStyle = c.container;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = c.containerDark;
  ctx.lineWidth = 1;
  for (let i = 1; i < 12; i++) {
    const lx = x + (w / 12) * i;
    ctx.beginPath();
    ctx.moveTo(lx, y + 2);
    ctx.lineTo(lx, y + h - 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(x, y, w, 3);

  ctx.fillStyle = c.containerDoor;
  ctx.fillRect(x + w - 16, y + 4, 14, h - 8);
  ctx.fillStyle = c.containerDark;
  ctx.fillRect(x + w - 10, y + h * 0.4, 3, 8);
  ctx.strokeStyle = c.containerDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w - 9, y + 4);
  ctx.lineTo(x + w - 9, y + h - 4);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(x, y + h - 3, w, 3);

  ctx.strokeStyle = c.containerDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

function drawContainerWithRamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  // Draw the base container
  drawShippingContainer(ctx, x, y, w, h, palette);

  // Draw a curved ramp on top of the right end (last 75px of width)
  const c = palette.obstacle;
  const rampW = 75;
  const rampH = 36;
  const rampX = x + w - rampW;
  const rampY = y - rampH;

  // Ramp surface (metal curved ramp sitting on top of the container)
  ctx.fillStyle = c.rampMetal;
  ctx.beginPath();
  ctx.moveTo(rampX, y);
  ctx.quadraticCurveTo(rampX + rampW * 0.7, y, rampX + rampW, rampY);
  ctx.lineTo(rampX + rampW, y);
  ctx.closePath();
  ctx.fill();

  // Ramp edge stroke
  ctx.strokeStyle = c.rampMetalDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rampX, y);
  ctx.quadraticCurveTo(rampX + rampW * 0.7, y, rampX + rampW, rampY);
  ctx.stroke();

  // Lip at the top
  ctx.fillStyle = c.rampMetalDark;
  ctx.fillRect(rampX + rampW - 3, rampY, 3, 6);

  // Horizontal guide lines
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 0.7;
  for (let i = 1; i < 3; i++) {
    const ly = y - rampH * (i / 3);
    ctx.beginPath();
    ctx.moveTo(rampX, y - (y - ly) * 0.3);
    ctx.lineTo(rampX + rampW, ly);
    ctx.stroke();
  }

  // Outline
  ctx.strokeStyle = c.rampMetalDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rampX, y);
  ctx.quadraticCurveTo(rampX + rampW * 0.7, y, rampX + rampW, rampY);
  ctx.lineTo(rampX + rampW, y);
  ctx.closePath();
  ctx.stroke();
}

export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: ObstacleInstance, palette: EnvironmentPalette) {
  const { type, x, y, width: w, height: h } = obstacle;
  switch (type) {
    case ObstacleType.ROCK:               drawRock(ctx, x, y, w, h, palette); break;
    case ObstacleType.SMALL_TREE:         drawSmallTree(ctx, x, y, w, h, palette); break;
    case ObstacleType.TALL_TREE:          drawTallTree(ctx, x, y, w, h, palette); break;
    case ObstacleType.SHOPPING_TROLLEY:   drawShoppingTrolley(ctx, x, y, w, h, palette); break;
    case ObstacleType.CAR:                drawCar(ctx, x, y, w, h, palette); break;
    case ObstacleType.PERSON_ON_BIKE:     drawPersonOnBike(ctx, x, y, w, h, palette); break;
    case ObstacleType.BUS_STOP:           drawBusStop(ctx, x, y, w, h, palette); break;
    case ObstacleType.SHIPPING_CONTAINER: drawShippingContainer(ctx, x, y, w, h, palette); break;
    case ObstacleType.GIANT_TREE:         drawGiantTree(ctx, x, y, w, h, palette); break;
    case ObstacleType.STRAIGHT_RAMP:      drawStraightRamp(ctx, x, y, w, h, palette); break;
    case ObstacleType.CURVED_RAMP:        drawCurvedRamp(ctx, x, y, w, h, palette); break;
    case ObstacleType.CONTAINER_WITH_RAMP: drawContainerWithRamp(ctx, x, y, w, h, palette); break;
  }
}

// --- Floating bonus text ---

export function drawFloatingText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, opacity);
  ctx.font = "bold 21px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 3;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = "#f0c030";
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ── Background drawer wrappers ──
// These adapt the exported draw functions to the BackgroundDrawFn signature
// so they can be registered in an environment's backgroundDrawers map.

export const SUBURBAN_BACKGROUND_DRAWERS: Record<string, BackgroundDrawFn> = {
  house: (ctx, x, y, w, h, color, palette, roofColor, variant) => {
    drawHouse(ctx, x, y, w, h, color, palette, roofColor, variant);
  },
  tree_silhouette: (ctx, x, y, w, h, color, palette) => {
    drawTreeSilhouette(ctx, x, y, w, h, color, palette);
  },
  deer: (ctx, x, y, w, h, color, palette) => {
    drawDeer(ctx, x, y, w, h, color, palette);
  },
  walking_person: (ctx, x, y, w, h, color, palette) => {
    drawWalkingPerson(ctx, x, y, w, h, color, palette);
  },
};
