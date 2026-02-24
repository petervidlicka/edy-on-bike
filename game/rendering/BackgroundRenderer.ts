import { BackgroundLayer } from "../types";
import type { EnvironmentPalette, BackgroundDrawFn } from "../environments/types";
import { getTotalLayerWidth } from "../Background";

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
