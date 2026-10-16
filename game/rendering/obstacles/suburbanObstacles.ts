import type { EnvironmentPalette } from "../../environments/types";
import { drawVehicle } from "../vehicle";

// --- Suburban biome obstacle draw functions ---

export function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawSmallTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawTallTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawGiantTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawStraightRamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawCurvedRamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawShoppingTrolley(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;

  // Side-view supermarket trolley: push handle at the back (left), a wire basket
  // that tapers toward the nose, a frame with a bottom rack, and four small casters
  // (two visible). Everything is derived from w/h so the sprite scales with its spec.
  const casterR = h * 0.09;
  const wheelY = y + h - casterR;
  const railY = y + h * 0.8;
  const rackY = y + h * 0.7;

  // Basket outline: wide at the top, front edge slanting back toward the bottom.
  const topBack = { x: x + w * 0.22, y: y + h * 0.16 };
  const topFront = { x: x + w, y: y + h * 0.12 };
  const botFront = { x: x + w * 0.84, y: y + h * 0.58 };
  const botBack = { x: x + w * 0.3, y: y + h * 0.58 };
  const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Frame: back leg, front leg and the lower rail the casters hang from.
  const rearWheelX = x + w * 0.3;
  const frontWheelX = x + w * 0.86;
  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(topBack.x, topBack.y);
  ctx.lineTo(rearWheelX, railY);
  ctx.lineTo(frontWheelX, railY);
  ctx.lineTo(botFront.x, botFront.y);
  ctx.stroke();

  // Bottom rack (for crates) between the legs.
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.32, rackY);
  ctx.lineTo(x + w * 0.84, rackY);
  for (let i = 0; i <= 5; i++) {
    const rx = x + w * (0.34 + i * 0.1);
    ctx.moveTo(rx, rackY);
    ctx.lineTo(rx, railY);
  }
  ctx.stroke();

  // See-through basket body.
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = c.trolleyBasket;
  ctx.beginPath();
  ctx.moveTo(topBack.x, topBack.y);
  ctx.lineTo(topFront.x, topFront.y);
  ctx.lineTo(botFront.x, botFront.y);
  ctx.lineTo(botBack.x, botBack.y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Wire mesh: verticals follow the taper, horizontals follow the sides.
  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    const a = lerp(topBack, topFront, t);
    const b = lerp(botBack, botFront, t);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    const a = lerp(topBack, botBack, t);
    const b = lerp(topFront, botFront, t);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();

  // Basket rim, with a thicker top edge.
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(topBack.x, topBack.y);
  ctx.lineTo(botBack.x, botBack.y);
  ctx.lineTo(botFront.x, botFront.y);
  ctx.lineTo(topFront.x, topFront.y);
  ctx.stroke();
  ctx.strokeStyle = c.trolleyBasket;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(topBack.x, topBack.y);
  ctx.lineTo(topFront.x, topFront.y);
  ctx.stroke();

  // Push handle: rises back from the basket, ends in a plastic grip.
  const gripX = x + w * 0.04;
  const gripY = y + h * 0.04;
  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(topBack.x, topBack.y);
  ctx.lineTo(gripX + 1, gripY + 1);
  ctx.stroke();
  ctx.strokeStyle = c.trolleyAccent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(gripX - 1, gripY);
  ctx.lineTo(gripX + 4, gripY + 1.2);
  ctx.stroke();

  // Casters: short swivel fork plus a small dark wheel.
  for (const wx of [rearWheelX, frontWheelX]) {
    ctx.strokeStyle = c.trolley;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(wx, railY);
    ctx.lineTo(wx, wheelY);
    ctx.stroke();
    ctx.fillStyle = c.carWheel;
    ctx.beginPath();
    ctx.arc(wx, wheelY, casterR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.trolley;
    ctx.beginPath();
    ctx.arc(wx, wheelY, casterR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- Road vehicles ---
// Shared side-view recipe lives in ../vehicle.ts.

/** Small hatchback — the most common traffic obstacle. */
export function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  drawVehicle(ctx, x, y, w, h, palette.obstacle, {
    body: c.car,
    bodyDark: c.carRoof,
    outline: [[0.02, 0.84], [0.0, 0.52], [0.04, 0.34], [0.2, 0.06], [0.56, 0.04], [0.73, 0.35], [0.96, 0.43], [1.0, 0.6], [0.99, 0.84]],
    windows: [[0.1, 0.36], [0.23, 0.13], [0.54, 0.12], [0.67, 0.36]],
    pillars: [0.4],
    wheels: [0.2, 0.8],
    wheelR: 7,
    claddingFrom: 0.74,
    tailLight: [0.005, 0.4, 0.04, 0.14],
    headLight: [0.95, 0.47, 0.045, 0.1],
  });
}

/** Tall, boxy SUV — wider and higher than the hatchback. */
export function drawSuv(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  drawVehicle(ctx, x, y, w, h, palette.obstacle, {
    body: c.suv ?? c.car,
    bodyDark: c.suvDark ?? c.carRoof,
    outline: [[0.01, 0.84], [0.0, 0.36], [0.03, 0.08], [0.09, 0.02], [0.61, 0.02], [0.75, 0.31], [0.97, 0.37], [1.0, 0.52], [0.99, 0.84]],
    windows: [[0.05, 0.33], [0.08, 0.1], [0.59, 0.09], [0.7, 0.33]],
    pillars: [0.27, 0.47],
    wheels: [0.19, 0.81],
    wheelR: 8.5,
    claddingFrom: 0.68,
    tailLight: [0.0, 0.34, 0.03, 0.16],
    headLight: [0.955, 0.4, 0.04, 0.08],
  });
  // Roof rails.
  ctx.fillStyle = c.suvDark ?? c.carRoof;
  ctx.fillRect(x + w * 0.12, y, w * 0.44, 1.4);
}

/** Delivery van — long cargo box, short nose, parcel logo on the side. */
export function drawDeliveryVan(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const accent = c.vanAccent ?? c.trolleyAccent;
  drawVehicle(ctx, x, y, w, h, palette.obstacle, {
    body: c.van ?? c.car,
    bodyDark: c.vanDark ?? c.carRoof,
    outline: [[0.01, 0.86], [0.0, 0.08], [0.03, 0.01], [0.74, 0.01], [0.87, 0.36], [0.98, 0.45], [1.0, 0.6], [0.99, 0.86]],
    windows: [[0.73, 0.36], [0.73, 0.08], [0.77, 0.08], [0.85, 0.36]],
    pillars: [],
    wheels: [0.17, 0.82],
    wheelR: 8.5,
    claddingFrom: 0.74,
    tailLight: [0.0, 0.5, 0.025, 0.14],
    headLight: [0.955, 0.48, 0.04, 0.08],
  });

  // Livery stripe, sliding-door seam and a simple parcel logo.
  ctx.fillStyle = accent;
  ctx.fillRect(x + w * 0.01, y + h * 0.55, w * 0.7, h * 0.07);
  ctx.strokeStyle = c.vanDark ?? c.carRoof;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.06);
  ctx.lineTo(x + w * 0.5, y + h * 0.74);
  ctx.stroke();

  const bx = x + w * 0.2;
  const by = y + h * 0.17;
  const bs = h * 0.26;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(bx, by + bs * 0.25);
  ctx.lineTo(bx + bs * 0.5, by);
  ctx.lineTo(bx + bs, by + bs * 0.25);
  ctx.lineTo(bx + bs, by + bs);
  ctx.lineTo(bx, by + bs);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = c.van ?? c.car;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx + bs * 0.5, by + bs * 0.12);
  ctx.lineTo(bx + bs * 0.5, by + bs);
  ctx.stroke();
}

/** Another cyclist riding the same way — a diamond-frame road bike with a rider. */
export function drawPersonOnBike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const wheelR = h * 0.155;
  const wheelY = y + h - wheelR;
  const rear = { x: x + wheelR + 0.5, y: wheelY };
  const front = { x: x + w - wheelR - 0.5, y: wheelY };
  const bb = { x: x + w * 0.47, y: wheelY + 0.5 };
  const seat = { x: x + w * 0.35, y: y + h * 0.5 };
  const headTop = { x: x + w * 0.73, y: y + h * 0.52 };
  const headBottom = { x: x + w * 0.76, y: y + h * 0.63 };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Wheels: dark tyre, thin spokes, hub.
  for (const p of [rear, front]) {
    ctx.strokeStyle = c.carWheel;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, wheelR - 0.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(60,60,60,0.45)";
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(a) * (wheelR - 1.8), p.y + Math.sin(a) * (wheelR - 1.8));
    }
    ctx.stroke();
    ctx.fillStyle = c.bikeFrame;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far leg first so the frame and near leg overlap it.
  const hip = { x: seat.x + 0.5, y: seat.y - 1.5 };
  const crank = 3.2;
  const pedalNear = { x: bb.x + crank * 0.8, y: bb.y - crank * 0.6 };
  const pedalFar = { x: bb.x - crank * 0.8, y: bb.y + crank * 0.6 };
  ctx.strokeStyle = palette.player.pants;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(bb.x - 1, bb.y - 8);
  ctx.lineTo(pedalFar.x, pedalFar.y);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Diamond frame: chainstay, seatstay, seat tube, top tube, down tube, fork.
  ctx.strokeStyle = c.bikeFrame;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(rear.x, rear.y);
  ctx.lineTo(bb.x, bb.y);
  ctx.lineTo(seat.x, seat.y + 2);
  ctx.lineTo(rear.x, rear.y);
  ctx.moveTo(seat.x + 0.4, seat.y + 3.5);
  ctx.lineTo(headTop.x, headTop.y);
  ctx.lineTo(headBottom.x, headBottom.y);
  ctx.lineTo(bb.x, bb.y);
  ctx.moveTo(headBottom.x, headBottom.y);
  ctx.lineTo(front.x, front.y);
  ctx.stroke();

  // Stem, handlebar and saddle.
  ctx.strokeStyle = c.carWheel;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(headTop.x, headTop.y);
  ctx.lineTo(headTop.x + 0.6, headTop.y - 2);
  ctx.lineTo(headTop.x + 3.2, headTop.y - 1.6);
  ctx.lineTo(headTop.x + 3.6, headTop.y + 0.8);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(seat.x - 2.6, seat.y - 0.6);
  ctx.lineTo(seat.x + 2.4, seat.y - 0.2);
  ctx.stroke();

  // Chainring.
  ctx.strokeStyle = c.carWheel;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(bb.x, bb.y, 2.4, 0, Math.PI * 2);
  ctx.stroke();

  // Rider: torso leaning toward the bars, near leg, arm, head with helmet.
  const shoulder = { x: x + w * 0.58, y: y + h * 0.27 };
  ctx.strokeStyle = c.bikeRider;
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(shoulder.x, shoulder.y);
  ctx.stroke();

  ctx.strokeStyle = palette.player.pants;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(bb.x + 3.5, bb.y - 9.5);
  ctx.lineTo(pedalNear.x, pedalNear.y);
  ctx.stroke();

  ctx.strokeStyle = c.bikeRider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shoulder.x, shoulder.y);
  ctx.lineTo(shoulder.x + 3.2, shoulder.y + 5);
  ctx.stroke();
  ctx.strokeStyle = palette.player.skin;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(shoulder.x + 3.2, shoulder.y + 5);
  ctx.lineTo(headTop.x + 3.2, headTop.y - 1.6);
  ctx.stroke();

  const head = { x: shoulder.x + 3, y: shoulder.y - 5.2 };
  ctx.fillStyle = palette.player.skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.trolleyAccent;
  ctx.beginPath();
  ctx.ellipse(head.x - 0.4, head.y - 1.2, 4.4, 3, -0.15, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

export function drawBusStop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawShippingContainer(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawContainerWithRamp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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
