import { ObstacleInstance, ObstacleType } from "../types";
import type { EnvironmentPalette } from "../environments/types";

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
