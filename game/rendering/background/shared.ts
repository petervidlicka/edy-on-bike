import { BackgroundLayer } from "../../types";
import type { EnvironmentPalette, BackgroundDrawFn } from "../../environments/types";
import { getTotalLayerWidth } from "../../Background";

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

// --- Walking person (simple side-view figure, shared across biomes) ---

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
