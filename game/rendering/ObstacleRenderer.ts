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

// --- Dubai biome obstacles ---

function drawCamel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const bodyColor = palette.obstacle.camel ?? "#c8a060";
  const legColor = palette.obstacle.camelLeg ?? "#a08040";
  const saddleColor = palette.obstacle.camelSaddle ?? "#c44040";

  // Legs (4 thick strokes)
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.58);
  ctx.lineTo(x + w * 0.18, y + h * 0.92);
  ctx.moveTo(x + w * 0.32, y + h * 0.6);
  ctx.lineTo(x + w * 0.34, y + h * 0.95);
  ctx.moveTo(x + w * 0.58, y + h * 0.58);
  ctx.lineTo(x + w * 0.56, y + h * 0.92);
  ctx.moveTo(x + w * 0.7, y + h * 0.6);
  ctx.lineTo(x + w * 0.72, y + h * 0.95);
  ctx.stroke();

  // Hooves
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.16, y + h * 0.92);
  ctx.lineTo(x + w * 0.2, y + h * 0.95);
  ctx.moveTo(x + w * 0.32, y + h * 0.95);
  ctx.lineTo(x + w * 0.36, y + h * 0.98);
  ctx.moveTo(x + w * 0.54, y + h * 0.92);
  ctx.lineTo(x + w * 0.58, y + h * 0.95);
  ctx.moveTo(x + w * 0.7, y + h * 0.95);
  ctx.lineTo(x + w * 0.74, y + h * 0.98);
  ctx.stroke();

  // Body (large oval)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.48, y + h * 0.48, w * 0.3, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hump
  ctx.beginPath();
  ctx.ellipse(x + w * 0.48, y + h * 0.3, w * 0.12, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Saddle blanket
  ctx.fillStyle = saddleColor;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y + h * 0.35);
  ctx.lineTo(x + w * 0.6, y + h * 0.35);
  ctx.lineTo(x + w * 0.58, y + h * 0.52);
  ctx.lineTo(x + w * 0.37, y + h * 0.52);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.4);
  ctx.lineTo(x + w * 0.1, y + h * 0.12);
  ctx.lineTo(x + w * 0.22, y + h * 0.14);
  ctx.lineTo(x + w * 0.28, y + h * 0.42);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.ellipse(x + w * 0.08, y + h * 0.1, w * 0.08, h * 0.06, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.beginPath();
  ctx.ellipse(x + w * 0.14, y + h * 0.04, w * 0.025, h * 0.04, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.arc(x + w * 0.07, y + h * 0.09, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.78, y + h * 0.42);
  ctx.quadraticCurveTo(x + w * 0.88, y + h * 0.38, x + w * 0.85, y + h * 0.52);
  ctx.stroke();
}

function drawSandTrap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const sandColor = palette.obstacle.sand ?? "#d8c078";
  const highlightColor = palette.obstacle.sandHighlight ?? "#e8d498";
  const shadowColor = palette.obstacle.sandShadow ?? "#b09858";

  // Wide sand drift across the road — long, low dune shape
  // Main body
  ctx.fillStyle = sandColor;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.15, y + h * 0.3, x + w * 0.35, y + h * 0.1);
  ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.05, x + w * 0.65, y + h * 0.15);
  ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.4, x + w, y + h);
  ctx.closePath();
  ctx.fill();

  // Highlight band (sun-facing right slope)
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.05);
  ctx.quadraticCurveTo(x + w * 0.6, y + h * 0.1, x + w * 0.75, y + h * 0.4);
  ctx.lineTo(x + w * 0.85, y + h * 0.6);
  ctx.lineTo(x + w * 0.7, y + h * 0.55);
  ctx.quadraticCurveTo(x + w * 0.58, y + h * 0.2, x + w * 0.5, y + h * 0.05);
  ctx.closePath();
  ctx.fill();

  // Shadow (left windward side)
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.08, y + h * 0.6, x + w * 0.2, y + h * 0.25);
  ctx.lineTo(x + w * 0.15, y + h * 0.4);
  ctx.quadraticCurveTo(x + w * 0.06, y + h * 0.75, x + w * 0.02, y + h);
  ctx.closePath();
  ctx.fill();

  // Wind ripple lines
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h * 0.65);
  ctx.lineTo(x + w * 0.3, y + h * 0.5);
  ctx.moveTo(x + w * 0.35, y + h * 0.7);
  ctx.lineTo(x + w * 0.55, y + h * 0.55);
  ctx.moveTo(x + w * 0.6, y + h * 0.7);
  ctx.lineTo(x + w * 0.8, y + h * 0.55);
  ctx.stroke();

  // Outline
  ctx.strokeStyle = shadowColor;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.15, y + h * 0.3, x + w * 0.35, y + h * 0.1);
  ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.05, x + w * 0.65, y + h * 0.15);
  ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.4, x + w, y + h);
  ctx.stroke();
}

function drawLandCruiser(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const bodyColor = "#f0ece8"; // Pearl white
  const bodyDark = "#d0ccc8";
  const chrome = "#c8c8c8";
  const wheelR = 10;
  const wheelY = y + h - wheelR;
  const bodyTop = y + 13;
  const bodyBottom = y + h - wheelR - 2;
  const roofTop = y + 2;

  // --- Wheel arches (rounded, larger than G-Class) ---
  ctx.fillStyle = "#1a1a1a";
  for (const wx of [x + 18, x + w - 18]) {
    ctx.beginPath();
    ctx.arc(wx, bodyBottom + 1, wheelR + 3, Math.PI, 0);
    ctx.fill();
  }

  // --- Main body (boxy but with slight contour) ---
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(x + 3, bodyTop);
  ctx.lineTo(x + w - 2, bodyTop);
  // Front bumper curves down slightly
  ctx.quadraticCurveTo(x + w + 1, bodyTop, x + w + 1, bodyTop + 4);
  ctx.lineTo(x + w + 1, bodyBottom);
  ctx.lineTo(x - 1, bodyBottom);
  ctx.lineTo(x - 1, bodyTop + 3);
  ctx.quadraticCurveTo(x - 1, bodyTop, x + 3, bodyTop);
  ctx.closePath();
  ctx.fill();

  // --- Lower body trim / cladding (dark gray) ---
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(x, bodyBottom - 4, w, 4);

  // --- Roof (slightly angled windshield) ---
  ctx.fillStyle = bodyDark;
  ctx.beginPath();
  ctx.moveTo(x + 8, bodyTop);
  ctx.lineTo(x + 6, roofTop + 2);
  ctx.lineTo(x + w - 14, roofTop);
  // Windshield angle — front slopes slightly
  ctx.lineTo(x + w - 8, bodyTop);
  ctx.closePath();
  ctx.fill();

  // --- Roof rails (chrome bars on top) ---
  ctx.strokeStyle = chrome;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 10, roofTop);
  ctx.lineTo(x + w - 16, roofTop - 1);
  ctx.stroke();
  // Rail supports
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 14, roofTop);
  ctx.lineTo(x + 14, roofTop + 3);
  ctx.moveTo(x + w - 20, roofTop - 1);
  ctx.lineTo(x + w - 20, roofTop + 3);
  ctx.moveTo(x + w * 0.5, roofTop);
  ctx.lineTo(x + w * 0.5, roofTop + 3);
  ctx.stroke();

  // --- Windows ---
  ctx.fillStyle = c.carWindow;
  // Rear quarter window
  ctx.fillRect(x + 10, roofTop + 3, 14, bodyTop - roofTop - 4);
  // Rear door window
  ctx.fillRect(x + 26, roofTop + 3, 16, bodyTop - roofTop - 4);
  // Front door window
  ctx.fillRect(x + w * 0.56, roofTop + 2, 16, bodyTop - roofTop - 3);
  // Windshield (angled)
  ctx.beginPath();
  ctx.moveTo(x + w - 14, roofTop + 2);
  ctx.lineTo(x + w - 8, bodyTop);
  ctx.lineTo(x + w - 4, bodyTop);
  ctx.lineTo(x + w - 10, roofTop + 2);
  ctx.closePath();
  ctx.fill();
  // Window glare
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x + 11, roofTop + 4, 5, 3);
  ctx.fillRect(x + w * 0.57, roofTop + 3, 5, 3);

  // --- B-pillar, C-pillar ---
  ctx.fillStyle = bodyDark;
  ctx.fillRect(x + 24, roofTop + 2, 3, bodyTop - roofTop);
  ctx.fillRect(x + w * 0.54, roofTop + 2, 3, bodyTop - roofTop);

  // --- Front grille (prominent Toyota chrome grille) ---
  ctx.fillStyle = chrome;
  ctx.fillRect(x + w - 2, bodyTop + 3, 3, bodyBottom - bodyTop - 10);
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 0.7;
  // Horizontal grille slats
  for (let i = 1; i <= 4; i++) {
    const gy = bodyTop + 3 + (bodyBottom - bodyTop - 10) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(x + w - 2, gy);
    ctx.lineTo(x + w + 1, gy);
    ctx.stroke();
  }

  // --- Headlights (angular, LED-style) ---
  ctx.fillStyle = c.carHeadlight;
  // Upper headlight
  ctx.beginPath();
  ctx.moveTo(x + w - 1, bodyTop + 3);
  ctx.lineTo(x + w + 1, bodyTop + 3);
  ctx.lineTo(x + w + 1, bodyTop + 8);
  ctx.lineTo(x + w - 3, bodyTop + 8);
  ctx.closePath();
  ctx.fill();
  // Lower headlight
  ctx.beginPath();
  ctx.moveTo(x + w - 1, bodyBottom - 10);
  ctx.lineTo(x + w + 1, bodyBottom - 10);
  ctx.lineTo(x + w + 1, bodyBottom - 5);
  ctx.lineTo(x + w - 3, bodyBottom - 5);
  ctx.closePath();
  ctx.fill();

  // --- DRL strip (thin LED line connecting headlights) ---
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + w, bodyTop + 8);
  ctx.lineTo(x + w, bodyBottom - 10);
  ctx.stroke();

  // --- Door lines ---
  ctx.strokeStyle = bodyDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.36, bodyTop);
  ctx.lineTo(x + w * 0.36, bodyBottom - 4);
  ctx.moveTo(x + w * 0.64, bodyTop);
  ctx.lineTo(x + w * 0.64, bodyBottom - 4);
  ctx.stroke();

  // --- Door handles (chrome) ---
  ctx.fillStyle = chrome;
  ctx.fillRect(x + w * 0.39, bodyTop + (bodyBottom - bodyTop) * 0.38, 6, 2.5);
  ctx.fillRect(x + w * 0.67, bodyTop + (bodyBottom - bodyTop) * 0.38, 6, 2.5);

  // --- Side body crease line (character line) ---
  ctx.strokeStyle = bodyDark;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x + 4, bodyTop + (bodyBottom - bodyTop) * 0.45);
  ctx.lineTo(x + w - 4, bodyTop + (bodyBottom - bodyTop) * 0.42);
  ctx.stroke();

  // --- Rear bumper + taillight ---
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(x - 2, bodyBottom - 5, 4, 8);
  ctx.fillStyle = c.carTaillight;
  ctx.fillRect(x - 1, bodyTop + 4, 3, 8);
  ctx.fillRect(x - 1, bodyBottom - 12, 3, 8);

  // --- Wheels (large, modern alloy) ---
  ctx.fillStyle = c.carWheel;
  ctx.beginPath();
  ctx.arc(x + 18, wheelY, wheelR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 18, wheelY, wheelR, 0, Math.PI * 2);
  ctx.fill();
  // Alloy rims
  ctx.fillStyle = chrome;
  ctx.beginPath();
  ctx.arc(x + 18, wheelY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 18, wheelY, 5, 0, Math.PI * 2);
  ctx.fill();
  // Multi-spoke pattern
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1;
  for (const wx of [x + 18, x + w - 18]) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * 2.5, wheelY + Math.sin(a) * 2.5);
      ctx.lineTo(wx + Math.cos(a) * (wheelR - 1.5), wheelY + Math.sin(a) * (wheelR - 1.5));
      ctx.stroke();
    }
  }

  // --- Body outline ---
  ctx.strokeStyle = bodyDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 3, bodyTop);
  ctx.lineTo(x + w - 2, bodyTop);
  ctx.lineTo(x + w + 1, bodyTop + 4);
  ctx.lineTo(x + w + 1, bodyBottom);
  ctx.lineTo(x - 1, bodyBottom);
  ctx.lineTo(x - 1, bodyTop + 3);
  ctx.closePath();
  ctx.stroke();
}

function drawDesertBuggy(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const frameColor = palette.obstacle.buggyFrame ?? "#2e2e2e";
  const cageColor = palette.obstacle.buggyCage ?? "#4a4a4a";
  const wheelColor = palette.obstacle.buggyWheel ?? "#3a3a3a";

  // Large exposed wheels
  const wheelR = 10;
  const rearWX = x + wheelR + 3;
  const frontWX = x + w - wheelR - 3;
  const wheelY = y + h - wheelR;

  ctx.fillStyle = wheelColor;
  for (const wx of [rearWX, frontWX]) {
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = cageColor;
    ctx.beginPath();
    ctx.arc(wx, wheelY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cageColor;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * 3.5, wheelY + Math.sin(a) * 3.5);
      ctx.lineTo(wx + Math.cos(a) * (wheelR - 1), wheelY + Math.sin(a) * (wheelR - 1));
      ctx.stroke();
    }
    ctx.fillStyle = wheelColor;
  }

  // Roll cage frame
  const cageY = y + 4;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rearWX - 2, wheelY - wheelR);
  ctx.lineTo(rearWX - 2, cageY + 4);
  ctx.lineTo(rearWX + 6, cageY);
  ctx.lineTo(frontWX - 6, cageY);
  ctx.lineTo(frontWX + 2, cageY + 4);
  ctx.lineTo(frontWX + 2, wheelY - wheelR);
  ctx.stroke();

  // Cross braces
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = cageColor;
  ctx.beginPath();
  ctx.moveTo(rearWX - 2, cageY + 4);
  ctx.lineTo(rearWX + 8, wheelY - wheelR);
  ctx.moveTo(rearWX + 8, cageY + 4);
  ctx.lineTo(rearWX - 2, wheelY - wheelR);
  ctx.stroke();

  // Bottom rail
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(rearWX, wheelY - wheelR + 2);
  ctx.lineTo(frontWX, wheelY - wheelR + 2);
  ctx.stroke();

  // Seat
  ctx.fillStyle = cageColor;
  const cageH = h - wheelR - 6;
  ctx.fillRect(x + w * 0.3, cageY + cageH * 0.4, w * 0.2, cageH * 0.25);

  // Steering wheel area
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(frontWX - 10, cageY + cageH * 0.35, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Headlight
  ctx.fillStyle = "#e8d06a";
  ctx.beginPath();
  ctx.arc(frontWX + 2, cageY + cageH * 0.6, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPinkGClass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const pink = palette.obstacle.pinkGClass ?? "#e87a9f";
  const pinkDark = palette.obstacle.pinkGClassRoof ?? "#d06888";
  const c = palette.obstacle;
  const wheelR = 9;
  const wheelY = y + h - wheelR;
  const bodyTop = y + 13;
  const bodyBottom = y + h - wheelR - 3;
  const roofTop = y + 1;

  // --- Wheel arches (squared off, drawn before body) ---
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + 9, bodyBottom - 2, 20, wheelR + 5);
  ctx.fillRect(x + w - 29, bodyBottom - 2, 20, wheelR + 5);

  // --- Main body (extremely boxy rectangle) ---
  ctx.fillStyle = pink;
  ctx.fillRect(x + 2, bodyTop, w - 4, bodyBottom - bodyTop);

  // --- Roof (flat, very angular) ---
  ctx.fillStyle = pinkDark;
  // Roof slab
  ctx.fillRect(x + 10, roofTop, w - 20, bodyTop - roofTop);
  // A-pillar (rear)
  ctx.fillRect(x + 10, roofTop, 5, bodyTop - roofTop + 2);
  // B-pillar (center)
  ctx.fillRect(x + w * 0.46, roofTop, 4, bodyTop - roofTop + 2);
  // C-pillar (front)
  ctx.fillRect(x + w - 15, roofTop, 5, bodyTop - roofTop + 2);

  // --- Windows (two separate panes) ---
  ctx.fillStyle = c.carWindow;
  // Rear window
  ctx.fillRect(x + 16, roofTop + 2, w * 0.28, bodyTop - roofTop - 3);
  // Front window
  ctx.fillRect(x + w * 0.50, roofTop + 2, w * 0.24, bodyTop - roofTop - 3);
  // Window glare
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x + 17, roofTop + 3, 7, 4);
  ctx.fillRect(x + w * 0.51, roofTop + 3, 7, 4);

  // --- Flat hood area (front of body above grille) ---
  ctx.fillStyle = pink;
  ctx.fillRect(x + w - 15, bodyTop, 13, 4);

  // --- Front grille (vertical chrome slats) ---
  ctx.fillStyle = "#c8c8c8";
  ctx.fillRect(x + w - 3, bodyTop + 2, 3, bodyBottom - bodyTop - 6);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 0.8;
  for (let i = 1; i <= 5; i++) {
    const gy = bodyTop + 2 + (bodyBottom - bodyTop - 6) * (i / 6);
    ctx.beginPath();
    ctx.moveTo(x + w - 3, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }

  // --- Headlights (round — iconic G-Class feature) ---
  ctx.fillStyle = c.carHeadlight;
  ctx.strokeStyle = "#c8c8c8";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x + w - 1, bodyTop + 8, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w - 1, bodyBottom - 8, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- Front turn signal (small amber below headlight) ---
  ctx.fillStyle = "#e8a030";
  ctx.fillRect(x + w - 3, bodyTop + 13, 3, 2);
  ctx.fillRect(x + w - 3, bodyBottom - 13, 3, 2);

  // --- Door lines (vertical — flat panel construction) ---
  ctx.strokeStyle = pinkDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.38, bodyTop);
  ctx.lineTo(x + w * 0.38, bodyBottom);
  ctx.moveTo(x + w * 0.62, bodyTop);
  ctx.lineTo(x + w * 0.62, bodyBottom);
  ctx.stroke();

  // --- External door hinges (iconic G-Class detail) ---
  ctx.fillStyle = "#888";
  ctx.fillRect(x + w * 0.38 - 1, bodyTop + 4, 3, 4);
  ctx.fillRect(x + w * 0.38 - 1, bodyBottom - 8, 3, 4);
  ctx.fillRect(x + w * 0.62 - 1, bodyTop + 4, 3, 4);
  ctx.fillRect(x + w * 0.62 - 1, bodyBottom - 8, 3, 4);

  // --- Door handles (chrome) ---
  ctx.fillStyle = "#c8c8c8";
  ctx.fillRect(x + w * 0.42, bodyTop + (bodyBottom - bodyTop) * 0.4, 6, 2.5);
  ctx.fillRect(x + w * 0.65, bodyTop + (bodyBottom - bodyTop) * 0.4, 6, 2.5);

  // --- Side indicator on fender ---
  ctx.fillStyle = "#e8a030";
  ctx.fillRect(x + w * 0.28, bodyTop + 4, 4, 2);

  // --- Running board / side step ---
  ctx.fillStyle = "#888";
  ctx.fillRect(x + 18, bodyBottom, w - 36, 3);

  // --- Taillights (vertical rectangles — rear of G-Class) ---
  ctx.fillStyle = c.carTaillight;
  ctx.fillRect(x, bodyTop + 4, 3, 8);
  ctx.fillRect(x, bodyBottom - 12, 3, 8);

  // --- Rear bumper ---
  ctx.fillStyle = "#888";
  ctx.fillRect(x - 1, bodyBottom - 3, 4, 6);

  // --- Spare tire on rear door (very visible from side) ---
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x + 2, bodyTop + (bodyBottom - bodyTop) * 0.5, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 2, bodyTop + (bodyBottom - bodyTop) * 0.5, 9, 0, Math.PI * 2);
  ctx.stroke();
  // Spare tire hub
  ctx.fillStyle = "#888";
  ctx.beginPath();
  ctx.arc(x + 2, bodyTop + (bodyBottom - bodyTop) * 0.5, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // --- Wheels (large, boxy arches) ---
  ctx.fillStyle = c.carWheel;
  ctx.beginPath();
  ctx.arc(x + 19, wheelY, wheelR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 19, wheelY, wheelR, 0, Math.PI * 2);
  ctx.fill();
  // Chrome hubcaps (multi-spoke)
  ctx.fillStyle = "#c8c8c8";
  ctx.beginPath();
  ctx.arc(x + 19, wheelY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 19, wheelY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Spoke lines
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 0.7;
  for (const wx of [x + 19, x + w - 19]) {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * 2, wheelY + Math.sin(a) * 2);
      ctx.lineTo(wx + Math.cos(a) * (wheelR - 1), wheelY + Math.sin(a) * (wheelR - 1));
      ctx.stroke();
    }
  }

  // --- Body outline ---
  ctx.strokeStyle = pinkDark;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x + 2, bodyTop, w - 4, bodyBottom - bodyTop);
}

function drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const green = palette.obstacle.cactus ?? "#3a7a38";
  const highlight = palette.obstacle.cactusHighlight ?? "#4a9a48";
  const spine = palette.obstacle.cactusSpine ?? "#2a5a28";
  const cx = x + w / 2;
  const trunkW = w * 0.38;

  // Main trunk
  ctx.fillStyle = green;
  ctx.beginPath();
  ctx.moveTo(cx - trunkW / 2, y + h);
  ctx.lineTo(cx - trunkW / 2, y + h * 0.08);
  ctx.quadraticCurveTo(cx, y - h * 0.02, cx + trunkW / 2, y + h * 0.08);
  ctx.lineTo(cx + trunkW / 2, y + h);
  ctx.closePath();
  ctx.fill();

  // Right arm (at ~35% height)
  const armY = y + h * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx + trunkW / 2, armY);
  ctx.lineTo(x + w * 0.85, armY);
  ctx.quadraticCurveTo(x + w * 0.92, armY, x + w * 0.88, armY - h * 0.22);
  ctx.lineTo(x + w * 0.78, armY - h * 0.2);
  ctx.quadraticCurveTo(x + w * 0.82, armY - h * 0.02, x + w * 0.78, armY);
  ctx.lineTo(cx + trunkW / 2, armY + h * 0.06);
  ctx.closePath();
  ctx.fill();

  // Left arm (at ~55% height)
  const armY2 = y + h * 0.55;
  ctx.beginPath();
  ctx.moveTo(cx - trunkW / 2, armY2);
  ctx.lineTo(x + w * 0.15, armY2);
  ctx.quadraticCurveTo(x + w * 0.08, armY2, x + w * 0.12, armY2 - h * 0.18);
  ctx.lineTo(x + w * 0.22, armY2 - h * 0.16);
  ctx.quadraticCurveTo(x + w * 0.18, armY2 - h * 0.02, x + w * 0.22, armY2);
  ctx.lineTo(cx - trunkW / 2, armY2 + h * 0.06);
  ctx.closePath();
  ctx.fill();

  // Highlight stripe
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.moveTo(cx + trunkW * 0.1, y + h * 0.1);
  ctx.lineTo(cx + trunkW * 0.35, y + h * 0.12);
  ctx.lineTo(cx + trunkW * 0.35, y + h * 0.95);
  ctx.lineTo(cx + trunkW * 0.1, y + h * 0.95);
  ctx.closePath();
  ctx.fill();

  // Vertical ribbing
  ctx.strokeStyle = spine;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - trunkW * 0.15, y + h * 0.1);
  ctx.lineTo(cx - trunkW * 0.15, y + h * 0.95);
  ctx.moveTo(cx + trunkW * 0.15, y + h * 0.1);
  ctx.lineTo(cx + trunkW * 0.15, y + h * 0.95);
  ctx.stroke();

  // Outline
  ctx.strokeStyle = spine;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - trunkW / 2, y + h);
  ctx.lineTo(cx - trunkW / 2, y + h * 0.08);
  ctx.quadraticCurveTo(cx, y - h * 0.02, cx + trunkW / 2, y + h * 0.08);
  ctx.lineTo(cx + trunkW / 2, y + h);
  ctx.stroke();
}

function drawDubaiChocolate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const choc = palette.obstacle.chocolate ?? "#5a3a20";
  const chocDark = palette.obstacle.chocolateDark ?? "#3a2210";
  const wrapper = palette.obstacle.chocolateWrapper ?? "#d4a844";

  // Main chocolate body
  ctx.fillStyle = choc;
  ctx.fillRect(x, y, w, h);

  // Chocolate segment grid
  ctx.strokeStyle = chocDark;
  ctx.lineWidth = 1.2;
  const cols = 8;
  const rows = 3;
  for (let i = 1; i < cols; i++) {
    const lx = x + (w / cols) * i;
    ctx.beginPath();
    ctx.moveTo(lx, y + 3);
    ctx.lineTo(lx, y + h - 3);
    ctx.stroke();
  }
  for (let i = 1; i < rows; i++) {
    const ly = y + (h / rows) * i;
    ctx.beginPath();
    ctx.moveTo(x + 3, ly);
    ctx.lineTo(x + w - 3, ly);
    ctx.stroke();
  }

  // Top highlight
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x, y, w, 4);

  // Bottom shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(x, y + h - 4, w, 4);

  // Gold wrapper peeled back on left end
  ctx.fillStyle = wrapper;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 28, y);
  ctx.lineTo(x + 22, y - 12);
  ctx.lineTo(x + 8, y - 14);
  ctx.lineTo(x - 4, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#c09838";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 2);
  ctx.lineTo(x + 14, y - 12);
  ctx.stroke();

  // Bottom wrapper edge
  ctx.fillStyle = wrapper;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + 24, y + h);
  ctx.lineTo(x + 18, y + h + 8);
  ctx.lineTo(x + 4, y + h + 6);
  ctx.lineTo(x - 2, y + h + 3);
  ctx.closePath();
  ctx.fill();

  // "DUBAI" label
  ctx.fillStyle = wrapper;
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DUBAI", x + w * 0.55, y + h * 0.5);

  // Outline
  ctx.strokeStyle = chocDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

function drawLamborghiniHuracan(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const green = palette.obstacle.lamboGreen ?? "#2d8a35";
  const greenDark = palette.obstacle.lamboGreenDark ?? "#1e6a25";
  const windowColor = palette.obstacle.lamboWindow ?? "#2a3a4a";
  const c = palette.obstacle;
  const wheelR = 7;
  const wheelY = y + h - wheelR;
  const bodyBottom = y + h - wheelR - 1;

  // --- Wheel arches (low profile) ---
  ctx.fillStyle = "#1a1a1a";
  for (const wx of [x + 16, x + w - 16]) {
    ctx.beginPath();
    ctx.arc(wx, bodyBottom + 2, wheelR + 2, Math.PI, 0);
    ctx.fill();
  }

  // --- Main body (very low, wedge-shaped) ---
  ctx.fillStyle = green;
  ctx.beginPath();
  // Rear — slightly angled up
  ctx.moveTo(x, bodyBottom);
  ctx.lineTo(x, y + h * 0.38);
  // Rear deck rises to roofline
  ctx.lineTo(x + w * 0.12, y + h * 0.22);
  // Roof (very low, flat)
  ctx.lineTo(x + w * 0.32, y + h * 0.1);
  // Windshield angle (very aggressive rake)
  ctx.lineTo(x + w * 0.52, y + 1);
  // Hood slopes down — wedge shape
  ctx.lineTo(x + w * 0.85, y + h * 0.2);
  // Front nose (very low)
  ctx.lineTo(x + w, y + h * 0.35);
  ctx.lineTo(x + w, bodyBottom);
  ctx.closePath();
  ctx.fill();

  // --- Side air intake (large angular scoop) ---
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.42, y + h * 0.42);
  ctx.lineTo(x + w * 0.58, y + h * 0.32);
  ctx.lineTo(x + w * 0.58, y + h * 0.55);
  ctx.lineTo(x + w * 0.42, y + h * 0.62);
  ctx.closePath();
  ctx.fill();

  // --- Body crease line (sharp Lamborghini character line) ---
  ctx.strokeStyle = greenDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + h * 0.45);
  ctx.lineTo(x + w * 0.4, y + h * 0.42);
  ctx.moveTo(x + w * 0.6, y + h * 0.38);
  ctx.lineTo(x + w - 3, y + h * 0.4);
  ctx.stroke();

  // --- Window (very low, angular) ---
  ctx.fillStyle = windowColor;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + h * 0.2);
  ctx.lineTo(x + w * 0.32, y + h * 0.12);
  ctx.lineTo(x + w * 0.5, y + 3);
  ctx.lineTo(x + w * 0.48, y + h * 0.18);
  ctx.lineTo(x + w * 0.32, y + h * 0.25);
  ctx.closePath();
  ctx.fill();
  // Window glare
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.44, y + 6);
  ctx.lineTo(x + w * 0.48, y + 4);
  ctx.lineTo(x + w * 0.46, y + h * 0.18);
  ctx.lineTo(x + w * 0.42, y + h * 0.2);
  ctx.closePath();
  ctx.fill();

  // --- Rear engine vent ---
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.04, y + h * 0.28);
  ctx.lineTo(x + w * 0.14, y + h * 0.22);
  ctx.lineTo(x + w * 0.14, y + h * 0.35);
  ctx.lineTo(x + w * 0.04, y + h * 0.38);
  ctx.closePath();
  ctx.fill();

  // --- Front splitter (low) ---
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + w * 0.78, bodyBottom - 2, w * 0.22 + 1, 3);

  // --- Rear diffuser ---
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x - 1, bodyBottom - 2, w * 0.12, 3);

  // --- Headlights (angular LED) ---
  ctx.fillStyle = c.carHeadlight;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.85, y + h * 0.2);
  ctx.lineTo(x + w - 1, y + h * 0.34);
  ctx.lineTo(x + w - 4, y + h * 0.34);
  ctx.lineTo(x + w * 0.84, y + h * 0.24);
  ctx.closePath();
  ctx.fill();

  // --- Taillights (Y-shaped Lamborghini style — simplified) ---
  ctx.fillStyle = c.carTaillight;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + h * 0.32);
  ctx.lineTo(x + 4, y + h * 0.28);
  ctx.lineTo(x + 4, y + h * 0.42);
  ctx.lineTo(x + 1, y + h * 0.45);
  ctx.closePath();
  ctx.fill();

  // --- Rear spoiler (small lip) ---
  ctx.fillStyle = greenDark;
  ctx.fillRect(x - 1, y + h * 0.3, 3, 2);

  // --- Wheels (low profile) ---
  ctx.fillStyle = c.carWheel;
  ctx.beginPath();
  ctx.arc(x + 16, wheelY, wheelR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 16, wheelY, wheelR, 0, Math.PI * 2);
  ctx.fill();
  // Sport alloy rims
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.arc(x + 16, wheelY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 16, wheelY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Y-spoke pattern
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 0.8;
  for (const wx of [x + 16, x + w - 16]) {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * 1.5, wheelY + Math.sin(a) * 1.5);
      ctx.lineTo(wx + Math.cos(a) * (wheelR - 1), wheelY + Math.sin(a) * (wheelR - 1));
      ctx.stroke();
    }
  }

  // --- Body outline ---
  ctx.strokeStyle = greenDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, bodyBottom);
  ctx.lineTo(x, y + h * 0.38);
  ctx.lineTo(x + w * 0.12, y + h * 0.22);
  ctx.lineTo(x + w * 0.32, y + h * 0.1);
  ctx.lineTo(x + w * 0.52, y + 1);
  ctx.lineTo(x + w * 0.85, y + h * 0.2);
  ctx.lineTo(x + w, y + h * 0.35);
  ctx.lineTo(x + w, bodyBottom);
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
    case ObstacleType.CAMEL:              drawCamel(ctx, x, y, w, h, palette); break;
    case ObstacleType.SAND_TRAP:          drawSandTrap(ctx, x, y, w, h, palette); break;
    case ObstacleType.LAND_CRUISER:       drawLandCruiser(ctx, x, y, w, h, palette); break;
    case ObstacleType.DESERT_BUGGY:       drawDesertBuggy(ctx, x, y, w, h, palette); break;
    case ObstacleType.PINK_G_CLASS:       drawPinkGClass(ctx, x, y, w, h, palette); break;
    case ObstacleType.CACTUS:             drawCactus(ctx, x, y, w, h, palette); break;
    case ObstacleType.DUBAI_CHOCOLATE:    drawDubaiChocolate(ctx, x, y, w, h, palette); break;
    case ObstacleType.LAMBORGHINI_HURACAN: drawLamborghiniHuracan(ctx, x, y, w, h, palette); break;
  }
}
