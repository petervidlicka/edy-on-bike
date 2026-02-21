import { PlayerState, BackgroundLayer, ObstacleInstance, ObstacleType } from "./types";
import { COLORS } from "./constants";
import { getTotalLayerWidth } from "./Background";

// --- Sky ---

function drawSky(ctx: CanvasRenderingContext2D, w: number, groundY: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, groundY);
  gradient.addColorStop(0, COLORS.sky);
  gradient.addColorStop(1, COLORS.skyBottom);
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

// --- Houses ---

function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  wallColor: string,
  roofColor: string
) {
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y, w, h);

  // Roof (triangle)
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x + w / 2, y - h * 0.45);
  ctx.lineTo(x + w + 4, y);
  ctx.closePath();
  ctx.fill();

  // Windows
  ctx.fillStyle = "#b8c0c8";
  const winSize = Math.min(w * 0.2, 8);
  ctx.fillRect(x + w * 0.3 - winSize / 2, y + h * 0.3, winSize, winSize);
  ctx.fillRect(x + w * 0.7 - winSize / 2, y + h * 0.3, winSize, winSize);

  // Door
  ctx.fillStyle = roofColor;
  ctx.fillRect(x + w * 0.4, y + h * 0.55, w * 0.2, h * 0.45);
}

// --- Tree silhouettes ---

function drawTreeSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(x + w * 0.35, y + h * 0.5, w * 0.3, h * 0.5);

  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.55);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h * 0.55);
  ctx.closePath();
  ctx.fill();
}

// --- Ground ---

function drawGround(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, groundY: number, offset: number) {
  // Ground fill — stretches to bottom of canvas
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, groundY, canvasW, canvasH - groundY);

  // Road surface
  ctx.fillStyle = COLORS.road;
  ctx.fillRect(0, groundY, canvasW, 20);

  // Dashed road markings
  ctx.strokeStyle = COLORS.roadLine;
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
  groundY: number
) {
  drawSky(ctx, canvasW, groundY);

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

  // Layer 1: houses & trees
  const buildingLayer = layers[1];
  const buildingWidth = getTotalLayerWidth(buildingLayer, canvasW);
  const buildingNorm = buildingLayer.offset % buildingWidth;
  for (const el of buildingLayer.elements) {
    // Check both the natural scroll position and the wrapped copy so elements
    // slide off the left edge instead of teleporting back to the right
    for (const shift of [0, buildingWidth, -buildingWidth]) {
      const drawX = el.x - buildingNorm + shift;
      if (drawX + el.width < 0 || drawX > canvasW) continue;
      if (el.type === "house") {
        drawHouse(ctx, drawX, el.y, el.width, el.height, el.color, el.roofColor || el.color);
      } else {
        drawTreeSilhouette(ctx, drawX, el.y, el.width, el.height, el.color);
      }
    }
  }

  // Layer 2: ground + road
  drawGround(ctx, canvasW, canvasH, groundY, layers[2].offset);
}

// --- Player (BMX bike + stick-figure rider with helmet) ---

export function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState) {
  const { x, y, wheelRotation } = player;
  const c = COLORS.player;

  const wheelR = 10;
  const rearWheelX = x + 10;
  const frontWheelX = x + 40;
  const wheelY = y + 45;

  // --- Wheels ---
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(rearWheelX, wheelY, wheelR, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const angle = wheelRotation + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(rearWheelX, wheelY);
    ctx.lineTo(rearWheelX + Math.cos(angle) * wheelR, wheelY + Math.sin(angle) * wheelR);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(frontWheelX, wheelY, wheelR, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const angle = wheelRotation + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(frontWheelX, wheelY);
    ctx.lineTo(frontWheelX + Math.cos(angle) * wheelR, wheelY + Math.sin(angle) * wheelR);
    ctx.stroke();
  }

  // --- Frame ---
  ctx.strokeStyle = c.frame;
  ctx.lineWidth = 2.5;

  const seatX = x + 16;
  const seatY = y + 28;
  const pedalX = x + 22;
  const pedalY = wheelY - 2;
  const handlebarBaseX = x + 34;
  const handlebarBaseY = y + 26;

  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(pedalX, pedalY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pedalX, pedalY); ctx.lineTo(frontWheelX, wheelY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pedalX, pedalY); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(handlebarBaseX, handlebarBaseY); ctx.lineTo(frontWheelX, wheelY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(handlebarBaseX, handlebarBaseY); ctx.stroke();

  // Seat
  ctx.fillStyle = c.wheel;
  ctx.fillRect(seatX - 5, seatY - 2, 10, 3);

  // Handlebars
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(handlebarBaseX - 2, handlebarBaseY - 6);
  ctx.lineTo(handlebarBaseX + 3, handlebarBaseY);
  ctx.lineTo(handlebarBaseX + 6, handlebarBaseY - 3);
  ctx.stroke();

  // --- Rider ---
  ctx.strokeStyle = c.pants;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pedalX - 2, pedalY); ctx.lineTo(seatX + 2, seatY + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pedalX + 4, pedalY); ctx.lineTo(seatX + 4, seatY + 2); ctx.stroke();

  // Torso
  const torsoBaseX = seatX + 2;
  const torsoBaseY = seatY - 1;
  const shoulderX = torsoBaseX + 6;
  const shoulderY = torsoBaseY - 14;

  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(torsoBaseX, torsoBaseY); ctx.lineTo(shoulderX, shoulderY); ctx.stroke();

  // Arms
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(shoulderX, shoulderY); ctx.lineTo(handlebarBaseX + 1, handlebarBaseY - 3); ctx.stroke();

  // Head
  const headX = shoulderX + 1;
  const headY = shoulderY - 8;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(headX, headY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = c.helmet;
  ctx.beginPath();
  ctx.arc(headX, headY - 1, 6, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(headX - 7, headY - 1, 14, 2);
}

// --- Obstacle draw functions ---

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  // Main body — slightly irregular ellipse
  ctx.fillStyle = c.rock;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.55, w * 0.5, h * 0.5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Shadow patch
  ctx.fillStyle = c.rockShadow;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.35, y + h * 0.7, w * 0.28, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSmallTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  // Trunk
  ctx.fillStyle = c.treeTrunk;
  ctx.fillRect(x + w * 0.38, y + h * 0.52, w * 0.24, h * 0.48);
  // Canopy (two stacked triangles for a fuller look)
  ctx.fillStyle = c.tree;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.58);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h * 0.75);
  ctx.lineTo(x + w / 2, y + h * 0.3);
  ctx.lineTo(x + w * 0.9, y + h * 0.75);
  ctx.closePath();
  ctx.fill();
}

function drawShoppingTrolley(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  const basketTop = y;
  const basketBottom = y + h - 14;
  const basketLeft = x + 8;
  const basketRight = x + w;

  // Handle bar
  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, basketTop + 4);
  ctx.lineTo(basketLeft, basketTop);
  ctx.stroke();

  // Basket frame (wireframe style)
  ctx.strokeRect(basketLeft, basketTop, basketRight - basketLeft, basketBottom - basketTop);

  // Basket cross-hatch lines (horizontal)
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(basketLeft, basketTop + (basketBottom - basketTop) * 0.33);
  ctx.lineTo(basketRight, basketTop + (basketBottom - basketTop) * 0.33);
  ctx.moveTo(basketLeft, basketTop + (basketBottom - basketTop) * 0.66);
  ctx.lineTo(basketRight, basketTop + (basketBottom - basketTop) * 0.66);
  ctx.stroke();

  // Wheels
  ctx.fillStyle = c.trolleyBasket;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 14, y + h - 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w - 8, y + h - 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;

  // Body (lower)
  ctx.fillStyle = c.car;
  ctx.fillRect(x, y + 14, w, h - 22);

  // Roof
  ctx.fillRect(x + 12, y, w - 24, 16);

  // Windows
  ctx.fillStyle = c.carWindow;
  ctx.fillRect(x + 14, y + 2, 20, 11);
  ctx.fillRect(x + w - 34, y + 2, 20, 11);

  // Bumpers
  ctx.fillStyle = c.rockShadow;
  ctx.fillRect(x, y + h - 8, 6, 4);
  ctx.fillRect(x + w - 6, y + h - 8, 6, 4);

  // Wheels
  ctx.fillStyle = "#2e2e2c";
  ctx.beginPath();
  ctx.arc(x + 16, y + h - 7, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 16, y + h - 7, 9, 0, Math.PI * 2);
  ctx.fill();
  // Hubcaps
  ctx.fillStyle = "#6a6a68";
  ctx.beginPath();
  ctx.arc(x + 16, y + h - 7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 16, y + h - 7, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPersonOnBike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  const wheelR = 9;
  const rearWX = x + wheelR + 2;
  const frontWX = x + w - wheelR - 2;
  const wheelY = y + h - wheelR;

  // Wheels
  ctx.strokeStyle = c.bikeRider;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(rearWX, wheelY, wheelR, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(frontWX, wheelY, wheelR, 0, Math.PI * 2); ctx.stroke();

  // Frame (simplified diamond)
  const pedalX = x + w * 0.45;
  const pedalY = wheelY - 4;
  const seatX = x + w * 0.3;
  const seatY = y + h * 0.52;
  ctx.beginPath();
  ctx.moveTo(rearWX, wheelY);
  ctx.lineTo(pedalX, pedalY);
  ctx.lineTo(frontWX, wheelY);
  ctx.moveTo(pedalX, pedalY);
  ctx.lineTo(seatX, seatY);
  ctx.moveTo(seatX, seatY);
  ctx.lineTo(frontWX - 2, seatY - 4);
  ctx.stroke();

  // Rider torso
  const shoulderX = seatX + 6;
  const shoulderY = seatY - 14;
  ctx.strokeStyle = c.bikeRider;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(seatX + 2, seatY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Arms
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(frontWX - 4, seatY - 6);
  ctx.stroke();

  // Head
  ctx.fillStyle = c.bikeRider;
  ctx.beginPath();
  ctx.arc(shoulderX + 1, shoulderY - 7, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: ObstacleInstance) {
  const { type, x, y, width: w, height: h } = obstacle;
  switch (type) {
    case ObstacleType.ROCK:             drawRock(ctx, x, y, w, h); break;
    case ObstacleType.SMALL_TREE:       drawSmallTree(ctx, x, y, w, h); break;
    case ObstacleType.SHOPPING_TROLLEY: drawShoppingTrolley(ctx, x, y, w, h); break;
    case ObstacleType.CAR:              drawCar(ctx, x, y, w, h); break;
    case ObstacleType.PERSON_ON_BIKE:   drawPersonOnBike(ctx, x, y, w, h); break;
  }
}
