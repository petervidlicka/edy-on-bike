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

// --- Pedestrians (shared across biomes) ---

const SKIN_TONES = ["#f1c9a5", "#d9a87e", "#b07a52", "#7a5034"];
const HAIR_COLORS = ["#5a3c24", "#2b2018", "#c98b3c", "#1c1612"];
const TOPS = ["#e4572e", "#2e86ab", "#f2c14e", "#4caf7d", "#d1495b", "#8e6cbd", "#ff8c42", "#3bb3c3"];
const BOTTOMS = ["#3d405b", "#4a6fa5", "#2f2f2f", "#8d6e63", "#5c6b73", "#b04a6a"];

/** Pedestrian kinds; the element variant packs kind + 3 × skin-tone index. */
export const PEDESTRIAN_KINDS = ["man", "woman", "child"] as const;

/**
 * Picks a random pedestrian for a background layer: kind, skin tone and a colourful
 * outfit. Children are shorter, so the caller should use the returned height.
 *
 * @returns Fields to spread into a walking_person BackgroundElement.
 */
export function pickPedestrian(rng: () => number = Math.random) {
  const kind = Math.floor(rng() * 3);
  const skin = Math.floor(rng() * SKIN_TONES.length);
  return {
    variant: kind + 3 * skin,
    color: TOPS[Math.floor(rng() * TOPS.length)],
    roofColor: BOTTOMS[Math.floor(rng() * BOTTOMS.length)],
    width: kind === 2 ? 11 : 14,
    height: kind === 2 ? 22 : 32,
  };
}

/**
 * Side-view walking figure facing right, mid-stride. `color` is the top, `bottomColor`
 * the trousers or skirt; `variant` selects man / woman / child and the skin tone.
 */
export function drawWalkingPerson(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, _palette: EnvironmentPalette,
  bottomColor = "#3d405b", variant = 0
) {
  const kind = variant % 3;
  const skinIdx = Math.floor(variant / 3) % SKIN_TONES.length;
  const skin = SKIN_TONES[skinIdx];
  const hair = HAIR_COLORS[skinIdx];
  const isWoman = kind === 1;
  const isChild = kind === 2;

  const cx = x + w * 0.5;
  const headR = h * (isChild ? 0.11 : 0.08);
  const headY = y + headR + h * 0.01;
  const shoulderY = headY + headR + h * 0.04;
  const hipY = y + h * (isChild ? 0.56 : 0.53);
  const footY = y + h * 0.97;
  const torsoW = w * (isChild ? 0.42 : 0.4);
  const limb = Math.max(1.4, w * 0.15);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Back arm and back leg (slightly darker, behind the body).
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = skin;
  ctx.lineWidth = limb * 0.75;
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY + 1);
  ctx.lineTo(cx - w * 0.28, hipY - h * 0.02);
  ctx.stroke();
  ctx.strokeStyle = isWoman ? skin : bottomColor;
  ctx.lineWidth = isWoman ? limb * 0.7 : limb;
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx - w * 0.08, (hipY + footY) / 2 + 1);
  ctx.lineTo(cx - w * 0.26, footY - 1);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Front leg.
  ctx.strokeStyle = isWoman ? skin : bottomColor;
  ctx.lineWidth = isWoman ? limb * 0.7 : limb;
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + w * 0.16, (hipY + footY) / 2);
  ctx.lineTo(cx + w * 0.22, footY - 1);
  ctx.stroke();

  // Shoes.
  ctx.fillStyle = "#2a2a2a";
  for (const fx of [-0.26, 0.22]) {
    ctx.beginPath();
    ctx.ellipse(cx + w * fx + 1, footY - 0.6, limb * 0.75, limb * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torso (top).
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - torsoW / 2, shoulderY + 1);
  ctx.quadraticCurveTo(cx, shoulderY - 1, cx + torsoW / 2, shoulderY + 1);
  ctx.lineTo(cx + torsoW * 0.45, hipY);
  ctx.lineTo(cx - torsoW * 0.45, hipY);
  ctx.closePath();
  ctx.fill();

  // Skirt for the woman.
  if (isWoman) {
    ctx.fillStyle = bottomColor;
    ctx.beginPath();
    ctx.moveTo(cx - torsoW * 0.45, hipY - 1);
    ctx.lineTo(cx + torsoW * 0.45, hipY - 1);
    ctx.lineTo(cx + w * 0.38, hipY + h * 0.2);
    ctx.lineTo(cx - w * 0.38, hipY + h * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  // Front arm: sleeve then forearm.
  ctx.strokeStyle = color;
  ctx.lineWidth = limb;
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY + 1);
  ctx.lineTo(cx + w * 0.12, shoulderY + h * 0.1);
  ctx.stroke();
  ctx.strokeStyle = skin;
  ctx.lineWidth = limb * 0.75;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.12, shoulderY + h * 0.1);
  ctx.lineTo(cx + w * 0.26, hipY - h * 0.03);
  ctx.stroke();

  // Head, hair.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx + w * 0.04, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(cx + w * 0.02, headY - headR * 0.15, headR * 1.02, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  if (isWoman) {
    // Longer hair falling behind to the shoulders.
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.9, headY - headR * 0.2);
    ctx.quadraticCurveTo(cx - headR * 1.4, headY + headR * 1.4, cx - headR * 0.2, shoulderY + h * 0.06);
    ctx.lineTo(cx + headR * 0.1, headY);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(cx - headR * 0.9, headY - headR * 0.3, headR * 0.6, headR * 0.9);
  }

  ctx.restore();
}
