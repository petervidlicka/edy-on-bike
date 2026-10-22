import type { EnvironmentPalette } from "../../environments/types";
import { drawVehicle, type VehicleShape } from "../vehicle";
import { DUBAI_OBSTACLE_COLORS } from "../../environments/obstacleColors";
import { drawSprite, drawCachedText } from "../drawHelpers";

// --- Dubai biome obstacle draw functions ---

/** Dromedary in profile, facing right: long legs, one hump, neck dipping then rising to the head. */
export function drawCamel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const bodyColor = palette.obstacle.camel ?? DUBAI_OBSTACLE_COLORS.camel;
  const legColor = palette.obstacle.camelLeg ?? DUBAI_OBSTACLE_COLORS.camelLeg;
  const saddleColor = palette.obstacle.camelSaddle ?? DUBAI_OBSTACLE_COLORS.camelSaddle;
  const P = (fx: number, fy: number): [number, number] => [x + w * fx, y + h * fy];

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Contact shadow.
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.47, y + h - 0.5, w * 0.36, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs: thigh into a knobbly knee, then a thin cannon bone and a splayed foot pad.
  const leg = (top: [number, number], knee: [number, number], foot: [number, number], color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(...top);
    ctx.lineTo(...knee);
    ctx.stroke();
    ctx.lineWidth = width * 0.62;
    ctx.beginPath();
    ctx.moveTo(...knee);
    ctx.lineTo(...foot);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(knee[0], knee[1], width * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(foot[0] + 0.8, foot[1] - 0.6, 2.1, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  // Far legs (darker, slightly offset).
  leg(P(0.33, 0.52), P(0.31, 0.76), P(0.32, 0.985), legColor, 3.4);
  leg(P(0.66, 0.54), P(0.7, 0.77), P(0.69, 0.985), legColor, 3.2);

  // Tail.
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(...P(0.17, 0.34));
  ctx.quadraticCurveTo(...P(0.12, 0.42), ...P(0.14, 0.58));
  ctx.stroke();

  // Body, hump, neck and head as one silhouette.
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(...P(0.17, 0.34));
  ctx.bezierCurveTo(...P(0.22, 0.2), ...P(0.3, 0.05), ...P(0.42, 0.05));
  ctx.bezierCurveTo(...P(0.54, 0.05), ...P(0.6, 0.22), ...P(0.68, 0.3));
  ctx.bezierCurveTo(...P(0.74, 0.36), ...P(0.8, 0.42), ...P(0.84, 0.32));
  ctx.bezierCurveTo(...P(0.86, 0.24), ...P(0.86, 0.16), ...P(0.89, 0.12));
  ctx.quadraticCurveTo(...P(0.94, 0.09), ...P(0.99, 0.16));
  ctx.quadraticCurveTo(...P(1.0, 0.22), ...P(0.96, 0.24));
  ctx.quadraticCurveTo(...P(0.92, 0.24), ...P(0.9, 0.27));
  ctx.bezierCurveTo(...P(0.88, 0.4), ...P(0.84, 0.52), ...P(0.74, 0.56));
  ctx.bezierCurveTo(...P(0.62, 0.62), ...P(0.38, 0.62), ...P(0.26, 0.56));
  ctx.bezierCurveTo(...P(0.18, 0.52), ...P(0.15, 0.44), ...P(0.17, 0.34));
  ctx.closePath();
  ctx.fill();

  // Belly shading and a light catch along the hump.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(90,60,20,0.18)";
  ctx.fillRect(x, y + h * 0.48, w, h);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,240,210,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(...P(0.3, 0.13));
  ctx.quadraticCurveTo(...P(0.42, 0.06), ...P(0.52, 0.13));
  ctx.stroke();

  // Saddle blanket draped behind the hump.
  ctx.fillStyle = saddleColor;
  ctx.beginPath();
  ctx.moveTo(...P(0.5, 0.12));
  ctx.quadraticCurveTo(...P(0.58, 0.18), ...P(0.62, 0.27));
  ctx.lineTo(...P(0.58, 0.44));
  ctx.lineTo(...P(0.47, 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x + w * 0.475, y + h * 0.38, w * 0.11, h * 0.025);

  // Near legs over the body.
  leg(P(0.27, 0.5), P(0.25, 0.76), P(0.27, 0.985), bodyColor, 3.8);
  leg(P(0.72, 0.52), P(0.75, 0.77), P(0.76, 0.985), bodyColor, 3.6);

  // Ear, eye, nostril.
  ctx.fillStyle = legColor;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.895, y + h * 0.1, 1, 1.6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2e2418";
  ctx.beginPath();
  ctx.arc(x + w * 0.925, y + h * 0.145, 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + w * 0.975, y + h * 0.17, 0.9, 0.6);

  ctx.restore();
}

export function drawSandTrap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const sandColor = palette.obstacle.sand ?? DUBAI_OBSTACLE_COLORS.sand;
  const highlightColor = palette.obstacle.sandHighlight ?? DUBAI_OBSTACLE_COLORS.sandHighlight;
  const shadowColor = palette.obstacle.sandShadow ?? DUBAI_OBSTACLE_COLORS.sandShadow;

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

const LAND_CRUISER_SHAPE: VehicleShape = {
  outline: [[0.01, 0.84], [0.0, 0.4], [0.02, 0.12], [0.06, 0.05], [0.57, 0.04], [0.69, 0.33], [0.96, 0.38], [1.0, 0.5], [0.995, 0.84]],
  windows: [[0.04, 0.35], [0.07, 0.11], [0.55, 0.1], [0.65, 0.35]],
  pillars: [0.24, 0.42],
  wheels: [0.19, 0.8],
  wheelR: 8.5,
  claddingFrom: 0.72,
  tailLight: [0.0, 0.36, 0.03, 0.18],
  headLight: [0.94, 0.41, 0.05, 0.08],
};

/** Toyota Land Cruiser–style full-size 4x4: long bonnet, flat roof, chrome grille. */
export function drawLandCruiser(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  drawVehicle(ctx, x, y, w, h, palette.obstacle, LAND_CRUISER_SHAPE, {
    body: c.car,
    bodyDark: c.carRoof,
    cladding: "#6b6b6b",
  });
  // Chrome grille bars and a roof rack.
  ctx.fillStyle = "#b9bcc0";
  for (let i = 0; i < 3; i++) ctx.fillRect(x + w * 0.97, y + h * (0.53 + i * 0.05), w * 0.03, 0.9);
  ctx.fillStyle = "#555555";
  ctx.fillRect(x + w * 0.1, y + h * 0.01, w * 0.44, 1.4);
  for (const fx of [0.13, 0.33, 0.51]) ctx.fillRect(x + w * fx, y + h * 0.01, 1.2, h * 0.04);
  // Side step.
  ctx.fillStyle = "#3f3f3f";
  ctx.fillRect(x + w * 0.3, y + h * 0.8, w * 0.38, 1.6);
}

const PINK_G_CLASS_SHAPE: VehicleShape = {
  outline: [[0.075, 0.84], [0.065, 0.06], [0.09, 0.02], [0.66, 0.02], [0.685, 0.05], [0.72, 0.37], [0.975, 0.4], [1.0, 0.46], [1.0, 0.84]],
  windows: [[0.11, 0.37], [0.11, 0.09], [0.645, 0.09], [0.68, 0.37]],
  pillars: [0.3, 0.48],
  wheels: [0.25, 0.81],
  wheelR: 8.5,
  claddingFrom: 0.76,
  tailLight: [0.07, 0.42, 0.025, 0.14],
};

/** Pink Mercedes G-Class–style off-roader: a pure box with upright glass, round lamps and a rear spare wheel. */
export function drawPinkGClass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const pink = c.pinkGClass ?? DUBAI_OBSTACLE_COLORS.pinkGClass;
  const pinkDark = c.pinkGClassRoof ?? DUBAI_OBSTACLE_COLORS.pinkGClassRoof;

  // Spare wheel on the rear door, behind the body.
  const sx = x + w * 0.065;
  const sy = y + h * 0.47;
  const sr = h * 0.2;
  ctx.fillStyle = c.carWheel;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pinkDark;
  ctx.beginPath();
  ctx.arc(sx, sy, sr * 0.72, 0, Math.PI * 2);
  ctx.fill();

  drawVehicle(ctx, x, y, w, h, palette.obstacle, PINK_G_CLASS_SHAPE, {
    body: pink,
    bodyDark: pinkDark,
    cladding: "#4a3d44",
  });

  // Round headlamp, fender-top indicator, door hinges, belt trim.
  ctx.fillStyle = c.carHeadlight;
  ctx.beginPath();
  ctx.arc(x + w * 0.975, y + h * 0.5, h * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0a040";
  ctx.fillRect(x + w * 0.9, y + h * 0.37, w * 0.04, h * 0.035);
  ctx.fillStyle = pinkDark;
  for (const fx of [0.13, 0.32, 0.5]) {
    ctx.fillRect(x + w * fx, y + h * 0.44, 1.3, 2);
    ctx.fillRect(x + w * fx, y + h * 0.62, 1.3, 2);
  }
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(x + w * 0.08, y + h * 0.52, w * 0.9, 0.8);
  // Side step.
  ctx.fillStyle = "#3a3036";
  ctx.fillRect(x + w * 0.36, y + h * 0.82, w * 0.34, 1.6);
}

export function drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const green = palette.obstacle.cactus ?? DUBAI_OBSTACLE_COLORS.cactus;
  const highlight = palette.obstacle.cactusHighlight ?? DUBAI_OBSTACLE_COLORS.cactusHighlight;
  const spine = palette.obstacle.cactusSpine ?? DUBAI_OBSTACLE_COLORS.cactusSpine;
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

export function drawDubaiChocolate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const choc = palette.obstacle.chocolate ?? DUBAI_OBSTACLE_COLORS.chocolate;
  const chocDark = palette.obstacle.chocolateDark ?? DUBAI_OBSTACLE_COLORS.chocolateDark;
  const wrapper = palette.obstacle.chocolateWrapper ?? DUBAI_OBSTACLE_COLORS.chocolateWrapper;

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
  drawCachedText(ctx, { text: "DUBAI", font: "bold 10px sans-serif", color: wrapper }, x + w * 0.55, y + h * 0.5);

  // Outline
  ctx.strokeStyle = chocDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

/**
 * Vertical offsets (fraction of ad height) for the billboard's water sparkles.
 * Fixed rather than Math.random() so the sparkles don't flicker every frame.
 */
const BILLBOARD_SPARKLE_OFFSETS = [0.02, 0.05, 0.01, 0.04, 0.06, 0.0, 0.03, 0.05];

export function drawDubaiBillboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const frameColor = palette.obstacle.billboardFrame ?? DUBAI_OBSTACLE_COLORS.billboardFrame;
  const postColor = palette.obstacle.billboardPost ?? DUBAI_OBSTACLE_COLORS.billboardPost;

  // Layout: sign panel on top, short posts below
  const signH = h * 0.81;  // ~75px for 92h — legs are only 19%
  const postStartY = y + signH;
  const postW = 5;
  const postLeftX = x + w * 0.12;
  const postRightX = x + w * 0.88 - postW;

  // --- Support posts (steel I-beams) ---
  ctx.fillStyle = postColor;
  ctx.fillRect(postLeftX, postStartY, postW, h - signH);
  ctx.fillRect(postRightX, postStartY, postW, h - signH);
  // Post highlight edge
  ctx.fillStyle = "#7a7a7a";
  ctx.fillRect(postLeftX + 1, postStartY, 1.5, h - signH);
  ctx.fillRect(postRightX + 1, postStartY, 1.5, h - signH);
  // Post base plates
  ctx.fillStyle = postColor;
  ctx.fillRect(postLeftX - 3, y + h - 3, postW + 6, 3);
  ctx.fillRect(postRightX - 3, y + h - 3, postW + 6, 3);
  // Cross brace between posts
  ctx.strokeStyle = postColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(postLeftX + postW, postStartY + 8);
  ctx.lineTo(postRightX, postStartY + 8);
  ctx.stroke();

  // --- Sign panel background (white) ---
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 2, y + 2, w - 4, signH - 4);

  // --- Ad interior scene: a few hundred fills and three lines of text, all fixed, so
  // it is rasterised once and blitted ---
  drawSprite(ctx, "dubai-ad", x + 4, y + 4, w - 8, signH - 8, drawBillboardAd);

  // --- Sign panel metal frame (on top of everything) ---
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1, y + 1, w - 2, signH - 2);
  // Inner frame line
  ctx.strokeStyle = "#b8b8b8";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, w - 6, signH - 6);
}

/** Skyscraper towers in the billboard ad, as fractions of the ad box. */
const BILLBOARD_TOWERS = [
  { cx: 0.15, tw: 0.08, th: 0.5, color: "#b8d0e0" },
  { cx: 0.32, tw: 0.06, th: 0.55, color: "#c8d8e8" },
  { cx: 0.68, tw: 0.07, th: 0.48, color: "#a8c0d0" },
  { cx: 0.82, tw: 0.05, th: 0.42, color: "#c0d0e0" },
];
/** Palm positions in the billboard ad, as fractions of the ad width. */
const BILLBOARD_PALMS = [0.22, 0.55, 0.88];

/** The "Dubai Horizon" ad artwork in local space (ad box at the origin, ~132×42). */
function drawBillboardAd(ctx: CanvasRenderingContext2D, adW: number, adH: number) {
  const adX = 0;
  const adY = 0;

  // Sky gradient (teal-blue)
  const skyGrad = ctx.createLinearGradient(adX, adY, adX, adY + adH * 0.65);
  skyGrad.addColorStop(0, "#1a6a8a");
  skyGrad.addColorStop(0.5, "#3898b8");
  skyGrad.addColorStop(1, "#68c8d8");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(adX, adY, adW, adH * 0.65);

  // Water strip (teal with reflections)
  ctx.fillStyle = "#2088a0";
  ctx.fillRect(adX, adY + adH * 0.55, adW, adH * 0.15);
  // Water sparkles
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 8; i++) {
    const sx = adX + adW * (0.05 + i * 0.12);
    const sy = adY + adH * (0.6 + BILLBOARD_SPARKLE_OFFSETS[i]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 3, sy);
    ctx.stroke();
  }

  // Sand/ground at bottom
  ctx.fillStyle = "#d4b87a";
  ctx.fillRect(adX, adY + adH * 0.68, adW, adH * 0.32);

  // --- Skyscrapers (4 simplified towers) ---
  for (const t of BILLBOARD_TOWERS) {
    const tx = adX + adW * t.cx - (adW * t.tw) / 2;
    const ty = adY + adH * (0.55 - t.th);
    const ttw = adW * t.tw;
    const tth = adH * t.th;
    ctx.fillStyle = t.color;
    ctx.fillRect(tx, ty, ttw, tth);
    // Windows (tiny dots)
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let wy = 0; wy < tth - 2; wy += 4) {
      for (let wx = 1; wx < ttw - 1; wx += 3) {
        ctx.fillRect(tx + wx, ty + wy + 1, 1.5, 1.5);
      }
    }
  }

  // --- Sail-shaped tower (Burj Al Arab silhouette) ---
  ctx.fillStyle = "#d0e0f0";
  ctx.beginPath();
  ctx.moveTo(adX + adW * 0.48, adY + adH * 0.52);
  ctx.lineTo(adX + adW * 0.46, adY + adH * 0.08);
  ctx.quadraticCurveTo(adX + adW * 0.5, adY + adH * 0.02, adX + adW * 0.56, adY + adH * 0.1);
  ctx.lineTo(adX + adW * 0.54, adY + adH * 0.52);
  ctx.closePath();
  ctx.fill();

  // --- Palm tree silhouettes (3 palms) ---
  for (const px of BILLBOARD_PALMS) {
    const palmX = adX + adW * px;
    const palmBase = adY + adH * 0.62;
    const palmTop = adY + adH * 0.3;
    // Trunk
    ctx.strokeStyle = "#4a6838";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(palmX, palmBase);
    ctx.quadraticCurveTo(palmX + 2, (palmBase + palmTop) / 2, palmX + 1, palmTop);
    ctx.stroke();
    // Fronds (small green fan)
    ctx.fillStyle = "#3a7a38";
    for (let f = 0; f < 5; f++) {
      const angle = -Math.PI * 0.8 + (f * Math.PI * 1.6) / 4;
      ctx.beginPath();
      ctx.moveTo(palmX + 1, palmTop);
      ctx.quadraticCurveTo(
        palmX + 1 + Math.cos(angle) * 6,
        palmTop + Math.sin(angle) * 3,
        palmX + 1 + Math.cos(angle) * 10,
        palmTop + Math.sin(angle) * 6
      );
      ctx.lineTo(palmX + 1, palmTop + 1);
      ctx.closePath();
      ctx.fill();
    }
  }

  // --- Small yacht in water ---
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(adX + adW * 0.4, adY + adH * 0.58);
  ctx.lineTo(adX + adW * 0.44, adY + adH * 0.62);
  ctx.lineTo(adX + adW * 0.36, adY + adH * 0.62);
  ctx.closePath();
  ctx.fill();
  // Mast
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(adX + adW * 0.4, adY + adH * 0.58);
  ctx.lineTo(adX + adW * 0.4, adY + adH * 0.52);
  ctx.stroke();

  // --- Text: project name ---
  ctx.fillStyle = "#1a3a4a";
  ctx.font = `bold ${Math.max(7, adH * 0.18 | 0)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("DUBAI HORIZON", adX + adW * 0.5, adY + adH * 0.72);

  // --- Subtext ---
  ctx.fillStyle = "#8a6a30";
  ctx.font = `${Math.max(5, adH * 0.12 | 0)}px sans-serif`;
  ctx.fillText("RESIDENCES", adX + adW * 0.5, adY + adH * 0.84);

  // --- Decorative Arabic-style line (geometric ornament) ---
  ctx.strokeStyle = "#c8a050";
  ctx.lineWidth = 0.6;
  const ornY = adY + adH * 0.7;
  ctx.beginPath();
  ctx.moveTo(adX + adW * 0.15, ornY);
  ctx.lineTo(adX + adW * 0.85, ornY);
  ctx.stroke();
  // Small diamond ornaments along the line
  ctx.fillStyle = "#c8a050";
  for (let d = 0; d < 5; d++) {
    const dx = adX + adW * (0.25 + d * 0.125);
    ctx.beginPath();
    ctx.moveTo(dx, ornY - 1.5);
    ctx.lineTo(dx + 1.5, ornY);
    ctx.lineTo(dx, ornY + 1.5);
    ctx.lineTo(dx - 1.5, ornY);
    ctx.closePath();
    ctx.fill();
  }

  // --- Crescent + tower logo (top-left of ad) ---
  ctx.fillStyle = "#c8a050";
  // Crescent
  ctx.beginPath();
  ctx.arc(adX + 8, adY + 6, 3.5, 0.3, Math.PI * 2 - 0.3);
  ctx.fill();
  ctx.fillStyle = "#1a6a8a"; // cut-out for crescent shape
  ctx.beginPath();
  ctx.arc(adX + 9.5, adY + 5.5, 2.8, 0, Math.PI * 2);
  ctx.fill();
  // Small star
  ctx.fillStyle = "#c8a050";
  ctx.beginPath();
  ctx.arc(adX + 12, adY + 5, 1, 0, Math.PI * 2);
  ctx.fill();

  // --- "COMING SOON" badge (bottom-right) ---
  ctx.fillStyle = "#c44040";
  ctx.fillRect(adX + adW - 32, adY + adH - 9, 30, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.max(4, adH * 0.1 | 0)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("COMING SOON", adX + adW - 17, adY + adH - 5);
}

const LAMBORGHINI_HURACAN_SHAPE: VehicleShape = {
  angularArches: true,
  outline: [
    [0.0, 0.74], [0.0, 0.27], [0.006, 0.21], [0.18, 0.15], [0.47, 0.05], [0.55, 0.07],
    [0.74, 0.32], [0.86, 0.43], [0.985, 0.58], [1.0, 0.66], [0.985, 0.84],
  ],
  windows: [[0.3, 0.33], [0.42, 0.09], [0.555, 0.1], [0.72, 0.35]],
  pillars: [],
  wheels: [0.2, 0.78],
  wheelR: 6.6,
  claddingFrom: 0.8,
  tailLight: [0.0, 0.29, 0.03, 0.05],
  headLight: [0.9, 0.5, 0.085, 0.04],
};

/**
 * Lamborghini Huracán–style supercar, built from the real car's side-profile proportions
 * (4.52 m long, 2.62 m wheelbase, 1.165 m tall, ~1.0 m front / 0.9 m rear overhang):
 * a single roof arc from the cab-forward screen to a short squared tail, angular
 * flat-topped wheel arches, a big intake ahead of the rear wheel and louvred engine cover.
 */
export function drawLamborghiniHuracan(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const green = c.lamboGreen ?? DUBAI_OBSTACLE_COLORS.lamboGreen;
  const greenDark = c.lamboGreenDark ?? DUBAI_OBSTACLE_COLORS.lamboGreenDark;
  const P = (fx: number, fy: number): [number, number] => [x + w * fx, y + h * fy];
  drawVehicle(ctx, x, y, w, h, c, LAMBORGHINI_HURACAN_SHAPE, {
    body: green,
    bodyDark: greenDark,
    cladding: "#1c201c",
    rim: { color: "#232326", spokes: 5, caliper: "#e7c21b" },
    window: c.lamboWindow ?? DUBAI_OBSTACLE_COLORS.lamboWindow,
  });

  ctx.save();
  ctx.lineJoin = "round";
  // Large side intake ahead of the rear wheel, under the window's rear point.
  ctx.fillStyle = "#151815";
  ctx.beginPath();
  ctx.moveTo(...P(0.25, 0.43));
  ctx.lineTo(...P(0.37, 0.38));
  ctx.lineTo(...P(0.335, 0.6));
  ctx.lineTo(...P(0.27, 0.64));
  ctx.closePath();
  ctx.fill();

  // Signature crease: from the front arch back along the flank, kicking up to the window point.
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(...P(0.9, 0.5));
  ctx.lineTo(...P(0.42, 0.43));
  ctx.lineTo(...P(0.34, 0.33));
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.moveTo(...P(0.9, 0.53));
  ctx.lineTo(...P(0.42, 0.46));
  ctx.stroke();

  // Louvred engine cover.
  ctx.strokeStyle = "rgba(20,24,20,0.7)";
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 4; i++) {
    const t = 0.06 + i * 0.06;
    const ty = 0.21 - (t - 0.006) * 0.35;
    ctx.beginPath();
    ctx.moveTo(...P(t, ty + 0.03));
    ctx.lineTo(...P(t + 0.035, ty + 0.01));
    ctx.stroke();
  }

  // Rear diffuser, mirror and door shut line.
  ctx.fillStyle = "#1c201c";
  ctx.fillRect(...P(0.0, 0.64), w * 0.06, h * 0.12);
  ctx.fillStyle = greenDark;
  ctx.beginPath();
  ctx.ellipse(...P(0.69, 0.3), w * 0.02, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(...P(0.4, 0.34));
  ctx.lineTo(...P(0.42, 0.78));
  ctx.stroke();
  ctx.restore();
}

const FERRARI_458_SHAPE: VehicleShape = {
  outline: [
    [0.0, 0.76], [0.0, 0.28], [0.007, 0.22], [0.13, 0.17], [0.31, 0.09], [0.46, 0.025], [0.56, 0.05],
    [0.72, 0.29], [0.8, 0.32], [0.9, 0.44], [0.98, 0.56], [1.0, 0.64], [0.985, 0.85],
  ],
  windows: [[0.36, 0.22], [0.46, 0.07], [0.555, 0.085], [0.69, 0.3], [0.5, 0.31]],
  pillars: [],
  wheels: [0.183, 0.769],
  wheelR: 6.6,
  claddingFrom: 0.82,
};

/**
 * Ferrari 458–style supercar, laid out from the real car's side-profile proportions
 * (4.53 m long, 2.65 m wheelbase, 1.21 m tall, ~1.05 m front / 0.83 m rear overhang):
 * teardrop side glass, long falling bonnet over muscular front wings, a fastback deck
 * to a short ducktail, the scooped intake behind the door and round twin tail lamps.
 */
export function drawFerrari458(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const red = c.ferrariRed ?? DUBAI_OBSTACLE_COLORS.ferrariRed;
  const redDark = c.ferrariRedDark ?? DUBAI_OBSTACLE_COLORS.ferrariRedDark;
  const P = (fx: number, fy: number): [number, number] => [x + w * fx, y + h * fy];
  drawVehicle(ctx, x, y, w, h, c, FERRARI_458_SHAPE, {
    body: red,
    bodyDark: redDark,
    cladding: "#1e1616",
    rim: { color: "#c3c6ca", spokes: 5, caliper: "#f2c200", thin: true },
    window: "#22303c",
  });

  ctx.save();
  // Round twin tail lamps on the rear face.
  ctx.fillStyle = c.carTaillight;
  for (const fy of [0.33, 0.43]) {
    ctx.beginPath();
    ctx.arc(...P(0.012, fy), h * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  // Long swept headlamp along the top of the front wing.
  ctx.fillStyle = c.carHeadlight;
  ctx.beginPath();
  ctx.moveTo(...P(0.86, 0.4));
  ctx.lineTo(...P(0.975, 0.53));
  ctx.lineTo(...P(0.97, 0.57));
  ctx.lineTo(...P(0.87, 0.45));
  ctx.closePath();
  ctx.fill();
  // Scooped intake behind the door, fed by the rising flank line.
  ctx.fillStyle = "#1a1212";
  ctx.beginPath();
  ctx.moveTo(...P(0.37, 0.38));
  ctx.quadraticCurveTo(...P(0.31, 0.42), ...P(0.29, 0.56));
  ctx.lineTo(...P(0.33, 0.54));
  ctx.quadraticCurveTo(...P(0.34, 0.44), ...P(0.37, 0.38));
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(...P(0.68, 0.62));
  ctx.quadraticCurveTo(...P(0.5, 0.5), ...P(0.37, 0.38));
  ctx.stroke();
  // Front-wing highlight, rear diffuser, mirror.
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.moveTo(...P(0.73, 0.33));
  ctx.quadraticCurveTo(...P(0.85, 0.36), ...P(0.97, 0.56));
  ctx.stroke();
  ctx.fillStyle = "#1e1616";
  ctx.fillRect(...P(0.0, 0.66), w * 0.07, h * 0.12);
  ctx.fillStyle = redDark;
  ctx.beginPath();
  ctx.ellipse(...P(0.685, 0.27), w * 0.02, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const CONVERTIBLE_SHAPE: VehicleShape = {
  outline: [[0.0, 0.8], [0.0, 0.52], [0.04, 0.44], [0.6, 0.44], [0.86, 0.48], [0.97, 0.56], [1.0, 0.64], [0.99, 0.82]],
  windows: [[0.6, 0.44], [0.53, 0.12], [0.555, 0.12], [0.63, 0.44]],
  pillars: [],
  wheels: [0.19, 0.8],
  wheelR: 6.6,
  claddingFrom: 0.84,
  tailLight: [0.0, 0.5, 0.03, 0.08],
  headLight: [0.93, 0.52, 0.06, 0.05],
};

/** Generic open-top roadster: long bonnet, short deck, raked screen and tan leather seats. */
export function drawConvertible(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const body = c.convertible ?? DUBAI_OBSTACLE_COLORS.convertible;
  const bodyDark = c.convertibleDark ?? DUBAI_OBSTACLE_COLORS.convertibleDark;
  const P = (fx: number, fy: number): [number, number] => [x + w * fx, y + h * fy];

  // Seat backs sit in the cockpit, behind the body side.
  ctx.save();
  ctx.fillStyle = "#b07a4a";
  for (const fx of [0.33, 0.45]) {
    ctx.beginPath();
    ctx.ellipse(...P(fx, 0.34), w * 0.035, h * 0.13, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawVehicle(ctx, x, y, w, h, c, CONVERTIBLE_SHAPE, {
    body,
    bodyDark,
    cladding: "#262a30",
    window: "rgba(150,200,225,0.55)",
  });

  ctx.save();
  // Windscreen frame and cockpit opening line.
  ctx.strokeStyle = "#2c2c2c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(...P(0.6, 0.44));
  ctx.lineTo(...P(0.53, 0.12));
  ctx.stroke();
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(...P(0.26, 0.44), w * 0.33, 1.2);
  // Door seam and a chrome side strip.
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(...P(0.36, 0.46));
  ctx.lineTo(...P(0.37, 0.8));
  ctx.moveTo(...P(0.56, 0.46));
  ctx.lineTo(...P(0.55, 0.8));
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(...P(0.05, 0.58), w * 0.88, 0.7);
  ctx.restore();
}

const ROLLS_ROYCE_PHANTOM_SHAPE: VehicleShape = {
  outline: [
    [0.0, 0.79], [0.0, 0.42], [0.06, 0.39], [0.15, 0.36], [0.27, 0.04], [0.57, 0.025],
    [0.69, 0.33], [0.945, 0.37], [1.0, 0.38], [1.0, 0.79],
  ],
  windows: [[0.23, 0.33], [0.29, 0.08], [0.56, 0.07], [0.655, 0.33]],
  pillars: [0.42],
  wheels: [0.217, 0.835],
  wheelR: 7.6,
  claddingFrom: 0.86,
  tailLight: [0.0, 0.44, 0.018, 0.16],
  headLight: [0.965, 0.42, 0.03, 0.07],
};

/**
 * Rolls-Royce Phantom–style limousine, from the real car's proportions (5.76 m long,
 * 3.55 m wheelbase, 1.65 m tall): long flat bonnet, upright Pantheon-style grille,
 * thick C-pillar, rear-hinged coach doors and a two-tone black-over-silver body.
 */
export function drawRollsRoycePhantom(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const P = (fx: number, fy: number): [number, number] => [x + w * fx, y + h * fy];
  drawVehicle(ctx, x, y, w, h, c, ROLLS_ROYCE_PHANTOM_SHAPE, {
    body: "#1b1c21",
    bodyDark: "#0f1013",
    lowerTone: ["#a7abb1", 0.4, 0.82],
    cladding: "#3a3c40",
    window: "#2c3a46",
  });

  ctx.save();
  // Pantheon-style grille: tall chrome frame with vertical vanes.
  ctx.fillStyle = "#d9dbde";
  ctx.fillRect(...P(0.982, 0.4), w * 0.018, h * 0.3);
  ctx.fillStyle = "#8a8d92";
  for (let i = 0; i < 4; i++) ctx.fillRect(...P(0.984, 0.43 + i * 0.065), w * 0.014, 0.6);
  // Chrome belt line and rocker, coach-door seams.
  ctx.fillStyle = "#d9dbde";
  ctx.fillRect(...P(0.02, 0.395), w * 0.95, 0.8);
  ctx.fillRect(...P(0.27, 0.8), w * 0.47, 0.8);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(...P(0.3, 0.34)); ctx.lineTo(...P(0.3, 0.8));
  ctx.moveTo(...P(0.42, 0.34)); ctx.lineTo(...P(0.42, 0.8));
  ctx.moveTo(...P(0.57, 0.34)); ctx.lineTo(...P(0.57, 0.8));
  ctx.stroke();
  // Door handles.
  ctx.fillStyle = "#d9dbde";
  ctx.fillRect(...P(0.32, 0.47), w * 0.02, 0.8);
  ctx.fillRect(...P(0.53, 0.47), w * 0.02, 0.8);
  ctx.restore();
}

const PORSCHE_911_SHAPE: VehicleShape = {
  outline: [
    [0.005, 0.87], [0.0, 0.7], [0.001, 0.48], [0.025, 0.38], [0.08, 0.31], [0.138, 0.24],
    [0.21, 0.15], [0.294, 0.071], [0.34, 0.04], [0.383, 0.017], [0.425, 0.004], [0.465, 0.0],
    [0.505, 0.012], [0.54, 0.04], [0.6, 0.15], [0.69, 0.3], [0.758, 0.32], [0.853, 0.38],
    [0.962, 0.49], [0.99, 0.6], [1.0, 0.68], [0.995, 0.9],
  ],
  windows: [[0.223, 0.27], [0.3, 0.15], [0.4, 0.08], [0.5, 0.08], [0.615, 0.335]],
  pillars: [0.358],
  wheels: [0.209, 0.782],
  wheelR: 7.2,
  claddingFrom: 0.86,
};

/**
 * Porsche 911 GT3 RS–style sports car. Every key point (wheel centres, roofline, glass,
 * door, intakes, wing) is measured from a side-view reference drawing and normalised to
 * the car's length and height, so the silhouette matches the real shape at game scale.
 */
export function drawPorsche911(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const body = c.porsche ?? DUBAI_OBSTACLE_COLORS.porsche;
  const bodyDark = c.porscheDark ?? DUBAI_OBSTACLE_COLORS.porscheDark;
  const carbon = "#1b1f22";
  const P = (fx: number, fy: number): [number, number] => [x + w * fx, y + h * fy];

  // Wing uprights behind the body, from the engine deck up to the wing.
  ctx.save();
  ctx.strokeStyle = carbon;
  ctx.lineCap = "round";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(...P(0.039, 0.36)); ctx.lineTo(...P(0.022, 0.16));
  ctx.moveTo(...P(0.104, 0.25)); ctx.lineTo(...P(0.076, 0.15));
  ctx.stroke();
  ctx.restore();

  drawVehicle(ctx, x, y, w, h, c, PORSCHE_911_SHAPE, {
    body,
    bodyDark,
    cladding: "#22282c",
    rim: { color: "#2a2b2e", spokes: 5 },
    window: "#26343f",
  });

  ctx.save();
  // Slim tail lamp across the rear.
  ctx.fillStyle = c.carTaillight;
  ctx.fillRect(...P(0.02, 0.38), w * 0.075, h * 0.05);
  // Slanted headlamp on the front wing.
  ctx.fillStyle = "#e9eef0";
  ctx.beginPath();
  ctx.ellipse(...P(0.891, 0.47), w * 0.032, h * 0.06, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.carHeadlight;
  ctx.beginPath();
  ctx.ellipse(...P(0.891, 0.47), w * 0.016, h * 0.032, 0.55, 0, Math.PI * 2);
  ctx.fill();
  // RS side intake ahead of the rear wheel.
  ctx.fillStyle = "#151a1d";
  ctx.beginPath();
  ctx.moveTo(...P(0.281, 0.37));
  ctx.lineTo(...P(0.33, 0.38));
  ctx.lineTo(...P(0.346, 0.58));
  ctx.lineTo(...P(0.294, 0.51));
  ctx.closePath();
  ctx.fill();
  // Louvres on top of the front wing, fuel cap, front intake.
  ctx.strokeStyle = "#151a1d";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (const fx of [0.75, 0.765, 0.78]) {
    ctx.moveTo(...P(fx, 0.36));
    ctx.lineTo(...P(fx + 0.008, 0.4));
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(...P(0.707, 0.39), w * 0.02, h * 0.035, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#151a1d";
  ctx.fillRect(...P(0.952, 0.69), w * 0.021, h * 0.13);
  // Door: rear edge curving into the sill, front shut line, handle.
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(...P(0.373, 0.32));
  ctx.quadraticCurveTo(...P(0.36, 0.72), ...P(0.42, 0.8));
  ctx.moveTo(...P(0.645, 0.33));
  ctx.quadraticCurveTo(...P(0.66, 0.55), ...P(0.655, 0.8));
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(...P(0.397, 0.45), w * 0.05, 0.9);
  // Mirror on the door.
  ctx.fillStyle = bodyDark;
  ctx.beginPath();
  ctx.ellipse(...P(0.578, 0.3), w * 0.024, h * 0.04, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Swan-neck wing: main plane with an upper mount hooking over it.
  ctx.fillStyle = carbon;
  ctx.beginPath();
  ctx.moveTo(...P(-0.009, 0.064));
  ctx.lineTo(...P(0.07, 0.083));
  ctx.lineTo(...P(0.076, 0.131));
  ctx.lineTo(...P(0.063, 0.16));
  ctx.lineTo(...P(-0.002, 0.126));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = carbon;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(...P(0.076, 0.1));
  ctx.quadraticCurveTo(...P(0.135, 0.08), ...P(0.127, 0.155));
  ctx.stroke();

  // Front splitter and rear diffuser.
  ctx.fillStyle = carbon;
  ctx.fillRect(...P(0.92, 0.88), w * 0.08, h * 0.035);
  ctx.fillRect(...P(0.0, 0.78), w * 0.05, h * 0.1);
  ctx.restore();
}
