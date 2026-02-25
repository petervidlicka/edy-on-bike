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
  // Grass verge — sits above the road, grounds the buildings
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, groundY - 22, canvasW, 22);

  // Ground fill — stretches to bottom of canvas
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

// Museum of the Future: torus/oval shape
function drawMuseumOfFuture(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  const cx = x + w / 2;
  const cy = y + h * 0.5;

  // Outer ring
  ctx.fillStyle = wallColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.48, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner void (sky color to simulate hole)
  ctx.fillStyle = palette.sky;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.28, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Surface decoration lines (Arabic calligraphy suggestion)
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 5; i++) {
    const angle = -0.4 + i * 0.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * (0.35 + i * 0.02), h * (0.32 + i * 0.02), angle, 0.3, 2.8);
    ctx.stroke();
  }

  // Outline
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.48, h * 0.45, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Base/pedestal
  ctx.fillStyle = roofColor;
  ctx.fillRect(cx - w * 0.3, y + h * 0.88, w * 0.6, h * 0.12);
}

// Burj Al Arab: sail shape
function drawBurjAlArab(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  const cx = x + w / 2;

  // Sail shape — two curves meeting at top (widened right side for distinctive profile)
  ctx.fillStyle = wallColor;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.3, y + h);
  ctx.quadraticCurveTo(cx - w * 0.35, y + h * 0.3, cx, y + h * 0.02);
  ctx.quadraticCurveTo(cx + w * 0.48, y + h * 0.15, cx + w * 0.45, y + h);
  ctx.closePath();
  ctx.fill();

  // Sail outline for visibility
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.3, y + h);
  ctx.quadraticCurveTo(cx - w * 0.35, y + h * 0.3, cx, y + h * 0.02);
  ctx.quadraticCurveTo(cx + w * 0.48, y + h * 0.15, cx + w * 0.45, y + h);
  ctx.stroke();

  // Cross-bracing structure lines
  ctx.strokeStyle = roofColor;
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    const ly = y + h * t;
    const leftX = cx - w * 0.3 * (1 - t * 0.6);
    const rightX = cx + w * 0.45 * (1 - t * 0.5);
    ctx.beginPath();
    ctx.moveTo(leftX, ly);
    ctx.lineTo(rightX, ly);
    ctx.stroke();
  }

  // Helipad on top
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.06, w * 0.1, h * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base island
  ctx.fillStyle = roofColor;
  ctx.fillRect(cx - w * 0.35, y + h * 0.95, w * 0.7, h * 0.05);

  // Window reflections
  ctx.fillStyle = palette.windowGlass;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.1, y + h * 0.3);
  ctx.quadraticCurveTo(cx + w * 0.1, y + h * 0.4, cx + w * 0.15, y + h * 0.8);
  ctx.lineTo(cx + w * 0.05, y + h * 0.8);
  ctx.quadraticCurveTo(cx, y + h * 0.45, cx - w * 0.1, y + h * 0.3);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Dubai Frame: two pillars connected at top
function drawDubaiFrame(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, palette: EnvironmentPalette
) {
  const pillarW = w * 0.2;

  // Left pillar
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y + h * 0.08, pillarW, h * 0.92);

  // Right pillar
  ctx.fillRect(x + w - pillarW, y + h * 0.08, pillarW, h * 0.92);

  // Top bridge
  ctx.fillStyle = roofColor;
  ctx.fillRect(x, y, w, h * 0.1);

  // Glass bridge windows
  ctx.fillStyle = palette.windowGlass;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(x + pillarW + 2, y + h * 0.02, w - pillarW * 2 - 4, h * 0.06);
  ctx.globalAlpha = 1;

  // Pillar windows
  ctx.strokeStyle = palette.windowGlass;
  ctx.lineWidth = 0.4;
  for (let i = 0; i < 10; i++) {
    const wy = y + h * 0.12 + i * h * 0.085;
    ctx.beginPath();
    ctx.moveTo(x + 2, wy);
    ctx.lineTo(x + pillarW - 2, wy);
    ctx.moveTo(x + w - pillarW + 2, wy);
    ctx.lineTo(x + w - 2, wy);
    ctx.stroke();
  }

  // Gold accent on bridge
  ctx.fillStyle = roofColor;
  ctx.fillRect(x, y + h * 0.08, w, 2);
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

export function drawPalmTree(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, palette: EnvironmentPalette
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
  const frondAngles = [-2.2, -1.8, -1.2, -0.6, 0.2, 0.8, 1.4, 2.0];
  for (const angle of frondAngles) {
    const len = w * 0.7 + Math.random() * w * 0.2;
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

export const DUBAI_BACKGROUND_DRAWERS: Record<string, BackgroundDrawFn> = {
  skyscraper: (ctx, x, y, w, h, color, palette, roofColor, variant) => {
    drawSkyscraper(ctx, x, y, w, h, color, palette, roofColor, variant);
  },
  palm_tree: (ctx, x, y, w, h, color, palette) => {
    drawPalmTree(ctx, x, y, w, h, color, palette);
  },
  bg_camel: (ctx, x, y, w, h, color, palette) => {
    drawBackgroundCamel(ctx, x, y, w, h, color, palette);
  },
  walking_person: (ctx, x, y, w, h, color, palette) => {
    drawWalkingPerson(ctx, x, y, w, h, color, palette);
  },
};
