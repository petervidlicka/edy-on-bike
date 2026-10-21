/**
 * Night Tokyo obstacle draw functions. Each draws into its spec box (x, y, w, h) from
 * OBSTACLE_SPECS, standing on the box's bottom edge. Vehicles use the shared vehicle
 * recipe so they match the other biomes' traffic; they're authored facing right and
 * mirrored at draw time as oncoming traffic. Movers face the way they travel: the
 * delivery scooter rides right (with Edy), the umbrella cyclist comes left.
 */
import type { EnvironmentPalette } from "../../environments/types";
import { drawVehicle, type VehicleShape } from "../vehicle";
import { boxMapper, fillPoly, fillRoundRect, contactShadow, strokeLine, glow } from "../drawHelpers";
import { TOKYO_OBSTACLE_COLORS } from "../../environments/obstacleColors";

/** Japanese-capable font stack for the little signs and labels. */
const JP_FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif';

/** Headlight beam spilling forward onto the wet road. */
function headlightBeam(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, length: number, dir: 1 | -1) {
  const g = ctx.createLinearGradient(fromX, fromY, fromX + length * dir, fromY);
  g.addColorStop(0, "rgba(255,242,176,0.35)");
  g.addColorStop(1, "rgba(255,242,176,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY - 1.5);
  ctx.lineTo(fromX + length * dir, fromY - 5);
  ctx.lineTo(fromX + length * dir, fromY + 8);
  ctx.lineTo(fromX, fromY + 2);
  ctx.closePath();
  ctx.fill();
}

/**
 * Fills text centred on (cx, cy) flipped back left-to-right. Taxis are drawn mirrored as
 * oncoming traffic (see ONCOMING_VEHICLES), so their signs would otherwise read backwards.
 */
function fillTextUnmirrored(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, maxWidth: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(-1, 1);
  ctx.fillText(text, 0, 0, maxWidth);
  ctx.restore();
}

// --- Kei car ---

const KEI_CAR_SHAPE: VehicleShape = {
  outline: [[0.03, 0.86], [0.03, 0.08], [0.08, 0.02], [0.8, 0.02], [0.87, 0.1], [0.97, 0.44], [1.0, 0.52], [1.0, 0.86]],
  windows: [[0.07, 0.42], [0.07, 0.1], [0.78, 0.1], [0.9, 0.42]],
  pillars: [0.36, 0.6],
  wheels: [0.2, 0.82],
  wheelR: 6.5,
  claddingFrom: 0.8,
  tailLight: [0.03, 0.46, 0.03, 0.14],
  headLight: [0.95, 0.5, 0.05, 0.08],
};

/** Tall-roof Kei car (Tanto / N-Box style): a box on tiny wheels, with the yellow Kei plate. */
export function drawKeiCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  headlightBeam(ctx, x + w, y + h * 0.56, 34, 1);
  drawVehicle(ctx, x, y, w, h, c, KEI_CAR_SHAPE, {
    body: c.keiCar ?? TOKYO_OBSTACLE_COLORS.keiCar,
    bodyDark: c.keiCarDark ?? TOKYO_OBSTACLE_COLORS.keiCarDark,
    lowerTone: ["#f4f4f0", 0.0, 0.08],
  });
  // Yellow Kei plate on the tail and a sliding-door rail.
  ctx.fillStyle = "#f2d23a";
  ctx.fillRect(x + w * 0.035, y + h * 0.64, w * 0.05, h * 0.09);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x + w * 0.36, y + h * 0.46, w * 0.25, 0.8);
}

// --- Kei truck ---

const KEI_TRUCK_SHAPE: VehicleShape = {
  outline: [[0.0, 0.86], [0.0, 0.52], [0.6, 0.52], [0.62, 0.08], [0.66, 0.02], [0.92, 0.02], [0.97, 0.12], [1.0, 0.46], [1.0, 0.86]],
  windows: [[0.66, 0.42], [0.67, 0.1], [0.9, 0.1], [0.95, 0.42]],
  pillars: [],
  wheels: [0.2, 0.82],
  wheelR: 6.5,
  claddingFrom: 0.78,
  tailLight: [0.0, 0.56, 0.025, 0.1],
  headLight: [0.96, 0.5, 0.04, 0.08],
};

/** Kei truck (Hijet / Carry style): cab-over at the front, a flatbed of produce crates behind. */
export function drawKeiTruck(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const P = boxMapper(x, y, w, h);
  headlightBeam(ctx, x + w, y + h * 0.56, 32, 1);

  // Cargo: two rows of orange crates with cabbages peeking out, behind the bed sides.
  for (let i = 0; i < 4; i++) {
    const cx = x + w * (0.04 + i * 0.135);
    for (let r = 0; r < 2; r++) {
      const cy = y + h * (0.32 - r * 0.2);
      if (r === 1 && i === 3) continue;
      if (r === 1) {
        ctx.fillStyle = "#6ab04a";
        ctx.beginPath();
        ctx.arc(cx + w * 0.035, cy, w * 0.03, Math.PI, 0);
        ctx.arc(cx + w * 0.09, cy, w * 0.028, Math.PI, 0);
        ctx.fill();
      }
      fillRoundRect(ctx, cx, cy, w * 0.125, h * 0.2, 1, r === 0 ? "#e8892a" : "#3a88c8");
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(cx + w * 0.03, cy + h * 0.06, w * 0.065, h * 0.05);
    }
  }

  drawVehicle(ctx, x, y, w, h, c, KEI_TRUCK_SHAPE, {
    body: "#f2f2ee",
    bodyDark: "#c8c8c4",
  });
  // Bed side gate hinges, mirror, yellow plate.
  ctx.fillStyle = "#a8a8a4";
  for (const fx of [0.14, 0.3, 0.46]) ctx.fillRect(x + w * fx, y + h * 0.54, 1, h * 0.2);
  fillPoly(ctx, [P(0.97, 0.18), P(1.03, 0.16), P(1.03, 0.26), P(0.98, 0.26)], "#2a2a2e");
  ctx.fillStyle = "#f2d23a";
  ctx.fillRect(x + w * 0.005, y + h * 0.66, w * 0.05, h * 0.09);
}

// --- Japan taxi ---

const TAXI_SHAPE: VehicleShape = {
  outline: [[0.02, 0.86], [0.03, 0.3], [0.1, 0.2], [0.74, 0.2], [0.86, 0.3], [0.98, 0.5], [1.0, 0.58], [1.0, 0.86]],
  windows: [[0.07, 0.48], [0.11, 0.27], [0.72, 0.27], [0.84, 0.48]],
  pillars: [0.32, 0.54],
  wheels: [0.19, 0.82],
  wheelR: 7,
  claddingFrom: 0.8,
  tailLight: [0.02, 0.5, 0.03, 0.14],
  headLight: [0.95, 0.56, 0.05, 0.08],
};

/**
 * A JPN-style taxi in deep indigo: lit roof lamp, gold stripe and a red 空車 (vacant) sign.
 * Authored facing right and always drawn mirrored as oncoming traffic, so its text is pre-flipped.
 */
export function drawJapanTaxi(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  headlightBeam(ctx, x + w, y + h * 0.62, 36, 1);

  // Roof lamp (andon), glowing.
  glow(ctx, x + w * 0.42, y + h * 0.1, h * 0.35, "#ffe08a", 0.3);
  fillRoundRect(ctx, x + w * 0.34, y + h * 0.02, w * 0.16, h * 0.18, 2, "#ffe48a");
  ctx.fillStyle = "#8a5a10";
  ctx.font = `bold ${Math.max(4, Math.round(h * 0.12))}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fillTextUnmirrored(ctx, "TAXI", x + w * 0.42, y + h * 0.115, w * 0.14);

  drawVehicle(ctx, x, y, w, h, c, TAXI_SHAPE, {
    body: c.taxi ?? TOKYO_OBSTACLE_COLORS.taxi,
    bodyDark: c.taxiDark ?? TOKYO_OBSTACLE_COLORS.taxiDark,
  });
  // Gold belt line and the vacant sign glowing behind the windscreen.
  ctx.fillStyle = "#d4a840";
  ctx.fillRect(x + w * 0.04, y + h * 0.56, w * 0.92, 1.2);
  ctx.fillStyle = "#ff4040";
  ctx.fillRect(x + w * 0.74, y + h * 0.36, w * 0.08, h * 0.1);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.max(3, Math.round(h * 0.08))}px ${JP_FONT}`;
  fillTextUnmirrored(ctx, "空車", x + w * 0.78, y + h * 0.415, w * 0.075);
}

// --- Samurai ---

/** Samurai facing left in red lacquered armour and a crested kabuto, katana raised overhead. */
export function drawSamurai(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const armour = "#a8242a";
  const armourDark = "#6e161a";
  const lacing = "#e8c060";
  const hakama = "#2a2a3a";
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Katana: raised over the head, blade sweeping back.
  strokeLine(ctx, [P(0.42, 0.3), P(0.62, 0.14)], "#2a2016", 2);
  ctx.strokeStyle = "#e4e8ee";
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(...P(0.62, 0.14));
  ctx.quadraticCurveTo(...P(0.86, 0.0), ...P(1.02, -0.02));
  ctx.stroke();
  ctx.fillStyle = "#c8a040";
  ctx.fillRect(x + w * 0.58, y + h * 0.13, w * 0.08, h * 0.03);

  // Hakama legs in a wide stance.
  fillPoly(ctx, [P(0.32, 0.6), P(0.62, 0.6), P(0.86, 0.97), P(0.6, 0.97), P(0.48, 0.74), P(0.38, 0.97), P(0.1, 0.97)], hakama);
  ctx.fillStyle = "#1a1a24";
  ctx.fillRect(x + w * 0.1, y + h * 0.95, w * 0.22, h * 0.03);
  ctx.fillRect(x + w * 0.62, y + h * 0.95, w * 0.24, h * 0.03);

  // Armour: skirt plates, cuirass, shoulder guards, laced in rows.
  fillPoly(ctx, [P(0.22, 0.5), P(0.74, 0.5), P(0.8, 0.68), P(0.16, 0.68)], armourDark);
  fillPoly(ctx, [P(0.28, 0.28), P(0.68, 0.28), P(0.72, 0.54), P(0.24, 0.54)], armour);
  fillPoly(ctx, [P(0.14, 0.27), P(0.34, 0.26), P(0.32, 0.42), P(0.12, 0.42)], armourDark);
  fillPoly(ctx, [P(0.64, 0.26), P(0.84, 0.27), P(0.86, 0.42), P(0.66, 0.42)], armourDark);
  ctx.strokeStyle = lacing;
  ctx.lineWidth = 0.7;
  for (const fy of [0.34, 0.42, 0.5, 0.58, 0.64]) {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.22, y + h * fy);
    ctx.lineTo(x + w * 0.76, y + h * fy);
    ctx.stroke();
  }

  // Arms up to the grip.
  strokeLine(ctx, [P(0.3, 0.3), P(0.3, 0.18), P(0.42, 0.3)], armourDark, 3.2);
  strokeLine(ctx, [P(0.66, 0.3), P(0.56, 0.18), P(0.44, 0.29)], armour, 3.2);

  // Head facing left: face, red half-mask, kabuto dome, flared neck guard, gold crest.
  fillPoly(ctx, [P(0.46, 0.15), P(0.64, 0.16), P(0.7, 0.27), P(0.5, 0.25)], "#3a3a44");
  ctx.strokeStyle = "#e8c060";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(...P(0.5, 0.2));
  ctx.lineTo(...P(0.67, 0.22));
  ctx.stroke();
  ctx.fillStyle = "#e8c09a";
  ctx.beginPath();
  ctx.ellipse(...P(0.43, 0.2), w * 0.1, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  fillPoly(ctx, [P(0.32, 0.21), P(0.48, 0.21), P(0.48, 0.26), P(0.4, 0.27), P(0.33, 0.25)], armourDark);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + w * 0.34, y + h * 0.215, 1.6, 0.8);
  ctx.fillStyle = "#1e1e24";
  ctx.fillRect(x + w * 0.35, y + h * 0.18, w * 0.05, h * 0.015);
  ctx.beginPath();
  ctx.arc(...P(0.37, 0.198), 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a3a44";
  ctx.beginPath();
  ctx.arc(x + w * 0.45, y + h * 0.17, w * 0.14, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x + w * 0.29, y + h * 0.16, w * 0.33, h * 0.025);
  ctx.strokeStyle = "#e8c060";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(...P(0.28, 0.03));
  ctx.quadraticCurveTo(...P(0.33, 0.14), ...P(0.4, 0.13));
  ctx.quadraticCurveTo(...P(0.47, 0.14), ...P(0.54, 0.03));
  ctx.stroke();

  ctx.restore();
}

// --- Giant sushi ---

/** A row of giant maki standing on a wooden geta board; the roll tops make one flat, rideable surface. */
export function drawSushiRolls(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const P = boxMapper(x, y, w, h);
  const fillings = ["#f2826a", "#d8344a", "#f2c84a", "#7ac25a", "#f2826a"];
  const boardTop = y + h * 0.78;

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Geta board on two feet.
  ctx.fillStyle = "#8a6034";
  ctx.fillRect(x + w * 0.08, boardTop + h * 0.12, w * 0.06, y + h - boardTop - h * 0.12);
  ctx.fillRect(x + w * 0.86, boardTop + h * 0.12, w * 0.06, y + h - boardTop - h * 0.12);
  fillRoundRect(ctx, x, boardTop, w, h * 0.14, 2, "#c89a5a");
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 2, boardTop + 1, w - 4, 1);

  // Maki: nori wall with a rice-and-filling top.
  const n = fillings.length;
  const gap = w * 0.02;
  const mw = (w - gap * (n + 1)) / n;
  for (let i = 0; i < n; i++) {
    const mx = x + gap + i * (mw + gap);
    const topH = h * 0.16;
    ctx.fillStyle = "#1e2e22";
    ctx.fillRect(mx, y + topH / 2, mw, boardTop - y - topH / 2);
    ctx.fillStyle = "rgba(120,160,120,0.25)";
    ctx.fillRect(mx + mw * 0.12, y + topH / 2 + 2, mw * 0.08, boardTop - y - topH);
    // Top face: nori ring, rice, filling.
    ctx.fillStyle = "#1e2e22";
    ctx.beginPath();
    ctx.ellipse(mx + mw / 2, y + topH / 2, mw / 2, topH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6f4ec";
    ctx.beginPath();
    ctx.ellipse(mx + mw / 2, y + topH / 2, mw * 0.42, topH * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fillings[i];
    ctx.beginPath();
    ctx.ellipse(mx + mw / 2, y + topH / 2, mw * 0.18, topH * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wasabi and pickled ginger on the board ends.
  ctx.fillStyle = "#8ac84a";
  ctx.beginPath();
  ctx.ellipse(...P(0.035, 0.77), w * 0.022, h * 0.04, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#f4b0b0";
  ctx.beginPath();
  ctx.ellipse(...P(0.965, 0.77), w * 0.022, h * 0.04, 0, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

// --- Vending machine ---

/** A glowing drinks vending machine: lit can display, buttons, coin slot and pickup bay. */
export function drawVendingMachine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cans = ["#d8344a", "#3a7ad8", "#f2c84a", "#2a2a2e", "#5ac27a", "#f2826a"];

  ctx.save();
  glow(ctx, x + w * 0.5, y + h * 0.3, w * 1.4, "#cfe8ff", 0.28);
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.6);

  // Cabinet.
  fillRoundRect(ctx, x, y, w, h, 2, "#e8eef4");
  ctx.fillStyle = "#3a6ab8";
  ctx.fillRect(x, y, w, h * 0.06);
  ctx.fillRect(x, y + h * 0.94, w, h * 0.06);

  // Lit display: three shelves of cans.
  const dx = x + w * 0.1;
  const dw = w * 0.8;
  const dy = y + h * 0.09;
  const dh = h * 0.46;
  ctx.fillStyle = "#fbfdff";
  ctx.fillRect(dx, dy, dw, dh);
  for (let r = 0; r < 3; r++) {
    const sy = dy + dh * (0.06 + r * 0.32);
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = cans[(r * 4 + c) % cans.length];
      ctx.fillRect(dx + dw * (0.06 + c * 0.235), sy, dw * 0.17, dh * 0.2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(dx + dw * (0.08 + c * 0.235), sy + 1, dw * 0.03, dh * 0.16);
    }
    // Price buttons under each shelf.
    ctx.fillStyle = "#3ad86a";
    for (let c = 0; c < 4; c++) ctx.fillRect(dx + dw * (0.1 + c * 0.235), sy + dh * 0.23, dw * 0.09, dh * 0.035);
  }

  // Coin slot and note reader, pickup bay.
  ctx.fillStyle = "#9aa4b0";
  ctx.fillRect(x + w * 0.66, y + h * 0.6, w * 0.18, h * 0.12);
  ctx.fillStyle = "#2a2a2e";
  ctx.fillRect(x + w * 0.73, y + h * 0.62, w * 0.04, h * 0.04);
  ctx.fillStyle = "#1e2228";
  ctx.fillRect(x + w * 0.16, y + h * 0.78, w * 0.68, h * 0.12);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x + w * 0.16, y + h * 0.78, w * 0.68, 1);

  ctx.restore();
}

// --- Sake barrels ---

const SAKE_LABELS = ["酒", "菊", "正", "鶴", "福", "宝", "月", "松"];
const SAKE_INK = ["#c8102e", "#1e3a8a", "#1e1e24", "#c8102e"];

/** Two rows of straw-wrapped sake barrels (komodaru) with painted brand marks; the top row is flat. */
export function drawSakeBarrels(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cols = 4;
  const bw = w / cols;
  const bh = h / 2;

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.52);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = x + c * bw + 1;
      const by = y + h - bh * (r + 1);
      const ww = bw - 2;
      // Straw wrap with a slight belly.
      ctx.fillStyle = "#efe4c8";
      ctx.beginPath();
      ctx.moveTo(bx + 1, by);
      ctx.lineTo(bx + ww - 1, by);
      ctx.quadraticCurveTo(bx + ww + 1.5, by + bh / 2, bx + ww - 1, by + bh);
      ctx.lineTo(bx + 1, by + bh);
      ctx.quadraticCurveTo(bx - 1.5, by + bh / 2, bx + 1, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(160,130,80,0.25)";
      for (let s = 0; s < 6; s++) ctx.fillRect(bx + ww * (0.1 + s * 0.15), by + 2, 0.7, bh - 4);
      // Rope bands top and bottom.
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(bx, by + bh * 0.08, ww, bh * 0.07);
      ctx.fillRect(bx, by + bh * 0.85, ww, bh * 0.07);
      // Painted mark.
      const i = r * cols + c;
      ctx.fillStyle = SAKE_INK[i % SAKE_INK.length];
      ctx.font = `bold ${Math.round(bh * 0.46)}px ${JP_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(SAKE_LABELS[i % SAKE_LABELS.length], bx + ww / 2, by + bh * 0.52);
    }
  }
  ctx.restore();
}

// --- Delivery scooter ---

/** Step-through delivery scooter (Super Cub style) riding right, a red 出前 box on the rack. */
export function drawDeliveryScooter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const P = boxMapper(x, y, w, h);
  const wheelR = h * 0.14;
  const wy = y + h - wheelR;

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);
  headlightBeam(ctx, x + w * 0.96, y + h * 0.5, 28, 1);

  // Wheels.
  for (const fx of [0.2, 0.82]) {
    ctx.fillStyle = "#1e1e22";
    ctx.beginPath();
    ctx.arc(x + w * fx, wy, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9aa0a8";
    ctx.beginPath();
    ctx.arc(x + w * fx, wy, wheelR * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // Delivery box on the rear rack.
  fillRoundRect(ctx, x + w * 0.02, y + h * 0.18, w * 0.32, h * 0.32, 2, "#d8282e");
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.max(4, Math.round(h * 0.14))}px ${JP_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("出前", x + w * 0.18, y + h * 0.35, w * 0.28);
  ctx.fillStyle = "#3a3a40";
  ctx.fillRect(x + w * 0.04, y + h * 0.5, w * 0.3, h * 0.04);

  // Frame: step-through body and leg shield.
  fillPoly(ctx, [P(0.12, 0.56), P(0.46, 0.56), P(0.6, 0.78), P(0.7, 0.36), P(0.8, 0.36), P(0.86, 0.8), P(0.7, 0.86), P(0.2, 0.84)], "#e8e2c8");
  fillPoly(ctx, [P(0.66, 0.4), P(0.78, 0.38), P(0.76, 0.76), P(0.64, 0.8)], "#3a8ac8");
  strokeLine(ctx, [P(0.76, 0.36), P(0.74, 0.2), P(0.86, 0.2)], "#3a3a40", 1.6);
  ctx.fillStyle = "#fff2b0";
  ctx.beginPath();
  ctx.arc(...P(0.92, 0.24), 2, 0, Math.PI * 2);
  ctx.fill();

  // Rider: seated, arms to the bars, white helmet.
  strokeLine(ctx, [P(0.44, 0.5), P(0.6, 0.62), P(0.62, 0.82)], "#2a3a5a", 3.6);
  fillPoly(ctx, [P(0.36, 0.16), P(0.52, 0.14), P(0.56, 0.52), P(0.38, 0.54)], "#3a5a8a");
  strokeLine(ctx, [P(0.5, 0.22), P(0.66, 0.24), P(0.8, 0.2)], "#3a5a8a", 2.6);
  ctx.fillStyle = "#f4f4f6";
  ctx.beginPath();
  ctx.arc(x + w * 0.47, y + h * 0.09, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a3a5a";
  ctx.fillRect(x + w * 0.5, y + h * 0.08, w * 0.08, h * 0.05);

  ctx.restore();
}

// --- Umbrella cyclist ---

/** Commuter on a mamachari coming left, front basket, holding a clear umbrella against the rain. */
export function drawUmbrellaCyclist(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const P = boxMapper(x, y, w, h);
  const wheelR = h * 0.14;
  const wy = y + h - wheelR;

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Wheels (thin spokes).
  for (const fx of [0.18, 0.8]) {
    ctx.strokeStyle = "#1e1e22";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x + w * fx, wy, wheelR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(200,200,210,0.6)";
    ctx.lineWidth = 0.5;
    for (let s = 0; s < 4; s++) {
      const a = (s * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x + w * fx - Math.cos(a) * wheelR, wy - Math.sin(a) * wheelR);
      ctx.lineTo(x + w * fx + Math.cos(a) * wheelR, wy + Math.sin(a) * wheelR);
      ctx.stroke();
    }
  }

  // Step-through frame, basket at the front (left), rear rack.
  strokeLine(ctx, [P(0.18, 0.86), P(0.3, 0.6), P(0.5, 0.86), P(0.8, 0.86), P(0.66, 0.56)], "#c8c8d0", 1.6);
  strokeLine(ctx, [P(0.3, 0.6), P(0.26, 0.5)], "#c8c8d0", 1.6);
  strokeLine(ctx, [P(0.66, 0.56), P(0.86, 0.56)], "#c8c8d0", 1.4);
  fillPoly(ctx, [P(0.04, 0.5), P(0.24, 0.5), P(0.22, 0.64), P(0.06, 0.64)], "#9aa0a8");
  ctx.strokeStyle = "#6a7078";
  ctx.lineWidth = 0.5;
  for (const fx of [0.09, 0.14, 0.19]) {
    ctx.beginPath();
    ctx.moveTo(x + w * fx, y + h * 0.51);
    ctx.lineTo(x + w * fx, y + h * 0.63);
    ctx.stroke();
  }

  // Rider: skirt suit, legs to the pedals, one hand on the bar, the other up to the umbrella.
  strokeLine(ctx, [P(0.6, 0.56), P(0.46, 0.7), P(0.5, 0.86)], "#2a2a34", 2.6);
  fillPoly(ctx, [P(0.5, 0.36), P(0.68, 0.36), P(0.7, 0.6), P(0.48, 0.6)], "#4a4a5a");
  strokeLine(ctx, [P(0.52, 0.4), P(0.36, 0.48), P(0.27, 0.5)], "#4a4a5a", 2.2);
  strokeLine(ctx, [P(0.62, 0.4), P(0.6, 0.28)], "#4a4a5a", 2.2);
  ctx.fillStyle = "#e0b896";
  ctx.beginPath();
  ctx.arc(x + w * 0.58, y + h * 0.29, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1e1612";
  ctx.beginPath();
  ctx.arc(x + w * 0.6, y + h * 0.27, w * 0.085, Math.PI * 1.1, Math.PI * 2.1);
  ctx.fill();

  // Clear umbrella: shaft, translucent canopy, ribs and rim.
  strokeLine(ctx, [P(0.6, 0.3), P(0.6, 0.02)], "#d8dce4", 1);
  ctx.fillStyle = "rgba(220,235,255,0.35)";
  ctx.beginPath();
  ctx.moveTo(...P(0.18, 0.2));
  ctx.quadraticCurveTo(...P(0.6, -0.12), ...P(1.02, 0.2));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  for (const fx of [0.32, 0.46, 0.74, 0.88]) {
    ctx.beginPath();
    ctx.moveTo(...P(0.6, 0.03));
    ctx.lineTo(...P(fx, 0.18));
    ctx.stroke();
  }

  ctx.restore();
}

// --- Kawaii barrier ---

/** Japanese roadworks barrier: a yellow-and-black bar held up by two cheerful frog posts. */
export function drawKawaiiBarrier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Striped bar between the posts.
  const barY = y + h * 0.42;
  const barH = h * 0.16;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + w * 0.12, barY, w * 0.76, barH);
  ctx.clip();
  ctx.fillStyle = "#f2d23a";
  ctx.fillRect(x, barY, w, barH);
  ctx.fillStyle = "#1e1e24";
  for (let sx = x - barH; sx < x + w; sx += barH * 1.6) {
    ctx.beginPath();
    ctx.moveTo(sx, barY + barH);
    ctx.lineTo(sx + barH * 0.8, barY + barH);
    ctx.lineTo(sx + barH * 1.6, barY);
    ctx.lineTo(sx + barH * 0.8, barY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Frog posts: base, body, round head with big eyes and a smile.
  for (const fx of [0.13, 0.87]) {
    const cx = x + w * fx;
    fillRoundRect(ctx, cx - w * 0.11, y + h * 0.9, w * 0.22, h * 0.1, 2, "#3a3a40");
    fillRoundRect(ctx, cx - w * 0.08, y + h * 0.4, w * 0.16, h * 0.52, 4, "#5ac24a");
    ctx.fillStyle = "#e8f4a0";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.66, w * 0.05, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5ac24a";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.28, w * 0.12, h * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const ex of [-0.065, 0.065]) {
      ctx.fillStyle = "#5ac24a";
      ctx.beginPath();
      ctx.arc(cx + w * ex, y + h * 0.13, w * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx + w * ex, y + h * 0.13, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1e1e24";
      ctx.beginPath();
      ctx.arc(cx + w * ex, y + h * 0.14, w * 0.018, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#2a5a2a";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.3, w * 0.05, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,120,140,0.6)";
    ctx.beginPath();
    ctx.arc(cx - w * 0.07, y + h * 0.33, w * 0.018, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.07, y + h * 0.33, w * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
  // Blinking warning lamp on one frog.
  const on = Math.floor(performance.now() / 450) % 2 === 0;
  ctx.fillStyle = on ? "#ff3a3a" : "#7a2020";
  ctx.beginPath();
  ctx.arc(...P(0.87, 0.02), 2, 0, Math.PI * 2);
  ctx.fill();
  if (on) glow(ctx, x + w * 0.87, y + h * 0.02, 9, "#ff3a3a", 0.5);

  ctx.restore();
}

// --- Maneki-neko ---

/** A big beckoning cat: white, red collar with a gold bell, left paw raised, holding a koban coin. */
export function drawManekiNeko(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const P = boxMapper(x, y, w, h);
  const white = "#f8f6f0";
  const shade = "#ddd8cc";

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Body and raised paw.
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(...P(0.5, 0.74), w * 0.42, h * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.ellipse(...P(0.48, 0.72), w * 0.38, h * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  fillRoundRect(ctx, x + w * 0.04, y + h * 0.14, w * 0.2, h * 0.36, 5, white);
  ctx.fillStyle = "#f4a0a8";
  ctx.beginPath();
  ctx.arc(...P(0.14, 0.2), w * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Koban coin in the other paw.
  fillRoundRect(ctx, x + w * 0.5, y + h * 0.62, w * 0.3, h * 0.26, 4, "#e8c040");
  ctx.fillStyle = "#b08a20";
  ctx.font = `bold ${Math.max(4, Math.round(h * 0.14))}px ${JP_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("福", x + w * 0.65, y + h * 0.75);

  // Head with ears, face and whiskers.
  ctx.fillStyle = white;
  ctx.beginPath();
  ctx.ellipse(...P(0.54, 0.3), w * 0.36, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const ex of [0.3, 0.78]) {
    fillPoly(ctx, [P(ex - 0.12, 0.2), P(ex, 0.02), P(ex + 0.12, 0.2)], white);
    fillPoly(ctx, [P(ex - 0.06, 0.18), P(ex, 0.08), P(ex + 0.06, 0.18)], "#f4a0a8");
  }
  ctx.strokeStyle = "#2a2a2e";
  ctx.lineWidth = 1;
  for (const ex of [0.42, 0.66]) {
    ctx.beginPath();
    ctx.arc(x + w * ex, y + h * 0.29, w * 0.05, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  ctx.fillStyle = "#f4a0a8";
  ctx.beginPath();
  ctx.arc(...P(0.54, 0.34), 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 0.5;
  for (const [sx, dir] of [[0.32, -1], [0.76, 1]] as const) {
    for (const dy of [-0.02, 0.02]) {
      ctx.beginPath();
      ctx.moveTo(x + w * sx, y + h * (0.36 + dy));
      ctx.lineTo(x + w * (sx + 0.14 * dir), y + h * (0.35 + dy * 2));
      ctx.stroke();
    }
  }

  // Red collar and gold bell.
  ctx.fillStyle = "#c8102e";
  ctx.fillRect(x + w * 0.24, y + h * 0.48, w * 0.6, h * 0.06);
  ctx.fillStyle = "#e8c040";
  ctx.beginPath();
  ctx.arc(...P(0.54, 0.57), w * 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- Ramen bowl ---

/** A giant bowl of ramen: noodles, chashu, a soft egg, nori and chopsticks, with rising steam. */
export function drawRamenBowl(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const P = boxMapper(x, y, w, h);
  const rimY = y + h * 0.36;

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.46);

  // Steam wisps.
  ctx.strokeStyle = "rgba(240,240,250,0.45)";
  ctx.lineWidth = 1.2;
  const t = performance.now() / 600;
  for (const fx of [0.32, 0.5, 0.68]) {
    ctx.beginPath();
    ctx.moveTo(x + w * fx, rimY - 2);
    ctx.bezierCurveTo(x + w * (fx + 0.06 * Math.sin(t + fx * 9)), rimY - h * 0.3, x + w * (fx - 0.06), rimY - h * 0.45, x + w * fx, rimY - h * 0.6);
    ctx.stroke();
  }

  // Chopsticks resting across the rim, nori sheet standing at the back.
  strokeLine(ctx, [P(0.18, 0.18), P(1.04, 0.0)], "#c89a5a", 1.6);
  strokeLine(ctx, [P(0.2, 0.24), P(1.04, 0.08)], "#b08448", 1.6);
  fillPoly(ctx, [P(0.16, 0.36), P(0.2, 0.06), P(0.32, 0.08), P(0.3, 0.36)], "#1e2e22");

  // Soup surface: noodles, chashu, half egg, spring onion.
  ctx.fillStyle = "#e8b870";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, rimY, w * 0.46, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f4dc90";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w * (0.1 + i * 0.05), rimY + 1);
    ctx.quadraticCurveTo(x + w * (0.3 + i * 0.05), rimY - 3, x + w * (0.5 + i * 0.04), rimY + 1);
    ctx.stroke();
  }
  ctx.fillStyle = "#c88a6a";
  ctx.beginPath();
  ctx.ellipse(...P(0.62, 0.34), w * 0.1, h * 0.07, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6f4ec";
  ctx.beginPath();
  ctx.ellipse(...P(0.8, 0.33), w * 0.07, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f2a82a";
  ctx.beginPath();
  ctx.arc(...P(0.8, 0.33), w * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6ac24a";
  for (const fx of [0.4, 0.45, 0.5]) ctx.fillRect(x + w * fx, rimY - 1, 2, 1.4);

  // Bowl: red with a white wave band, on a foot ring.
  ctx.fillStyle = "#c8282e";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.04, rimY);
  ctx.quadraticCurveTo(x + w * 0.1, y + h * 0.92, x + w * 0.5, y + h * 0.92);
  ctx.quadraticCurveTo(x + w * 0.9, y + h * 0.92, x + w * 0.96, rimY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const fx = 0.1 + i * 0.1;
    const fy = 0.52 + (i % 2 === 0 ? 0 : 0.06);
    if (i === 0) ctx.moveTo(...P(fx, fy));
    else ctx.lineTo(...P(fx, fy));
  }
  ctx.stroke();
  ctx.fillStyle = "#8a1a1e";
  ctx.fillRect(x + w * 0.34, y + h * 0.9, w * 0.32, h * 0.1);

  ctx.restore();
}

// --- Shiba inu ---

/** A shiba inu standing facing left: red-tan coat, white cheeks and chest, curled tail. */
export function drawShibaInu(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const coat = palette.creature;
  const coatDark = palette.creatureLeg;
  const cream = palette.creatureTail;
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.52, y + h, w * 0.4);

  // Far legs.
  strokeLine(ctx, [P(0.32, 0.6), P(0.32, 0.97)], coatDark, 2.4);
  strokeLine(ctx, [P(0.76, 0.6), P(0.78, 0.97)], coatDark, 2.4);

  // Curled tail over the back.
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.arc(...P(0.84, 0.3), w * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.arc(...P(0.84, 0.3), w * 0.045, 0, Math.PI * 2);
  ctx.fill();

  // Body, chest and head.
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(...P(0.56, 0.52), w * 0.32, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.ellipse(...P(0.32, 0.6), w * 0.1, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.ellipse(...P(0.22, 0.3), w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ears.
  fillPoly(ctx, [P(0.16, 0.16), P(0.18, -0.04), P(0.27, 0.12)], coat);
  fillPoly(ctx, [P(0.26, 0.14), P(0.32, -0.02), P(0.36, 0.18)], coat);
  // Muzzle and cheeks in cream, nose and eye.
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.ellipse(...P(0.1, 0.38), w * 0.09, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1e1612";
  ctx.beginPath();
  ctx.arc(...P(0.02, 0.34), 1.2, 0, Math.PI * 2);
  ctx.arc(...P(0.16, 0.26), 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Near legs with white socks.
  for (const fx of [0.28, 0.72]) {
    strokeLine(ctx, [P(fx, 0.6), P(fx - 0.01, 0.97)], coat, 2.8);
    strokeLine(ctx, [P(fx - 0.01, 0.86), P(fx - 0.01, 0.97)], cream, 2.8);
  }

  ctx.restore();
}
