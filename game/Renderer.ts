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

// --- Houses (3 variants inspired by village illustration reference) ---

function drawCottage(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string
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
  ctx.fillStyle = "#b0c0cc";
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
  wallColor: string, roofColor: string
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
  ctx.fillStyle = "#b0c0cc";
  ctx.fillRect(dX + dW * 0.25, y - h * 0.1, dW * 0.5, h * 0.07);

  // Main windows (2)
  ctx.fillStyle = "#b0c0cc";
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
  ctx.fillStyle = "#c8c0b8";
  ctx.beginPath();
  ctx.arc(x + w * 0.38 + w * 0.18, y + h * 0.78, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTallHouse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string
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
  ctx.fillStyle = "#b0c0cc";
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

function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  wallColor: string, roofColor: string, variant: number
) {
  switch (variant) {
    case 0: drawCottage(ctx, x, y, w, h, wallColor, roofColor); break;
    case 1: drawVillageHouse(ctx, x, y, w, h, wallColor, roofColor); break;
    case 2: drawTallHouse(ctx, x, y, w, h, wallColor, roofColor); break;
    default: drawVillageHouse(ctx, x, y, w, h, wallColor, roofColor); break;
  }
}

// --- Conifer trees (layered triangles from reference) ---

function drawTreeSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string
) {
  // Trunk
  ctx.fillStyle = "#7a6a5a";
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
  ctx.fillStyle = COLORS.treeHighlight;
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

function drawDeer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string
) {
  const legColor = "#7a6048";

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
  ctx.fillStyle = "#c0a880";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.82, y + h * 0.35, w * 0.04, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Walking person (simple side-view figure) ---

function drawWalkingPerson(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string
) {
  // Head
  ctx.fillStyle = "#c8a882";
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
      switch (el.type) {
        case "house":
          drawHouse(ctx, drawX, el.y, el.width, el.height, el.color, el.roofColor || el.color, el.variant ?? 1);
          break;
        case "tree_silhouette":
          drawTreeSilhouette(ctx, drawX, el.y, el.width, el.height, el.color);
          break;
        case "deer":
          drawDeer(ctx, drawX, el.y, el.width, el.height, el.color);
          break;
        case "walking_person":
          drawWalkingPerson(ctx, drawX, el.y, el.width, el.height, el.color);
          break;
      }
    }
  }

  // Layer 2: ground + road
  drawGround(ctx, canvasW, canvasH, groundY, layers[2].offset);
}

// --- Player (BMX bike + stick-figure rider with helmet) ---
// The bike rotates around the bottom bracket during a bunnyhop (bikeTilt).
// The rider moves independently: leans back → stands up → tucks legs.

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState) {
  const { x, y, wheelRotation, bikeTilt, riderLean, riderCrouch, legTuck } = player;
  const c = COLORS.player;

  // BMX proportions matched to Figma reference — long wheelbase, low frame
  const wheelR = 12;
  const rearWheelX = x + 12;
  const frontWheelX = x + 52;
  const wheelY = y + 46;

  // Pivot near the bottom bracket for bunnyhop rotation
  const pivotX = x + 27;
  const pivotY = y + 43;

  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(-bikeTilt);
  ctx.translate(-pivotX, -pivotY);

  // ── Wheels (6 spokes + center dot, matching Figma) ──
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2.5;

  // Rear wheel — tire + center dot + 6 spokes
  ctx.beginPath();
  ctx.arc(rearWheelX, wheelY, wheelR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = c.wheel;
  ctx.beginPath();
  ctx.arc(rearWheelX, wheelY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const angle = wheelRotation + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(rearWheelX + Math.cos(angle) * 2, wheelY + Math.sin(angle) * 2);
    ctx.lineTo(rearWheelX + Math.cos(angle) * wheelR, wheelY + Math.sin(angle) * wheelR);
    ctx.stroke();
  }

  // Front wheel — tire + center dot + 6 spokes
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(frontWheelX, wheelY, wheelR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = c.wheel;
  ctx.beginPath();
  ctx.arc(frontWheelX, wheelY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const angle = wheelRotation + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(frontWheelX + Math.cos(angle) * 2, wheelY + Math.sin(angle) * 2);
    ctx.lineTo(frontWheelX + Math.cos(angle) * wheelR, wheelY + Math.sin(angle) * wheelR);
    ctx.stroke();
  }

  // ── Frame (from Figma reference — steeper fork, proper BMX geometry) ──
  ctx.strokeStyle = c.frame;
  ctx.lineWidth = 2;

  const seatX = x + 23;       // seat cluster (was x+20)
  const seatY = y + 35;       // seat cluster height (was y+34)
  const bbX = x + 27;         // bottom bracket (was x+28)
  const bbY = wheelY - 2;     // y + 44
  const headX_f = x + 45;     // head tube top (was x+42) — more forward
  const headY_f = y + 26;     // head tube top (was y+32) — much higher

  // Main triangle: top tube + down tube + seat tube
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(headX_f, headY_f + 3); ctx.stroke();   // top tube → (x+45, y+29)
  ctx.beginPath(); ctx.moveTo(headX_f, headY_f + 5); ctx.lineTo(bbX, bbY); ctx.stroke();       // down tube from (x+45, y+31)
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(bbX, bbY); ctx.stroke();               // seat tube

  // Rear triangle: chain stays + seat stays
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();           // chain stays
  ctx.beginPath(); ctx.moveTo(seatX, seatY + 1); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();   // seat stays

  // Fork (two segments — steep ~17° from vertical, matching Figma)
  ctx.beginPath(); ctx.moveTo(headX_f, headY_f); ctx.lineTo(x + 51, y + 45); ctx.stroke();      // main fork blade
  ctx.beginPath(); ctx.moveTo(x + 51, y + 45); ctx.lineTo(frontWheelX, wheelY); ctx.stroke();    // fork dropout

  // Chainring (sprocket circle at BB — smaller to match Figma proportions)
  ctx.fillStyle = c.frame;
  ctx.beginPath();
  ctx.arc(bbX, bbY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bbX, bbY, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Seat post (extends above cluster) + saddle
  ctx.strokeStyle = c.frame;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(seatX - 1, seatY - 3); ctx.stroke();
  ctx.fillStyle = c.wheel;
  ctx.fillRect(seatX - 6, seatY - 5, 10, 3);

  // Crank arms (horizontal — BMX standing stance, wider from Figma)
  const pedalLX = bbX - 8;    // left pedal (x+19)
  const pedalRX = bbX + 8;    // right pedal (x+35)
  const pedalY = bbY;         // both at same height (y+44)
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(pedalLX, pedalY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(pedalRX, pedalY); ctx.stroke();
  // Pedal platforms
  ctx.fillStyle = c.wheel;
  ctx.fillRect(pedalLX - 3, pedalY - 1, 6, 3);
  ctx.fillRect(pedalRX - 3, pedalY - 1, 6, 3);

  // Handlebar stem riser + crossbar (from Figma: rises ~7px above headtube)
  const stemTopX = headX_f - 1;     // x + 44
  const stemTopY = headY_f - 7;     // y + 19
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
  // Stem riser (slightly back from headtube top)
  ctx.beginPath();
  ctx.moveTo(headX_f, headY_f);
  ctx.lineTo(stemTopX, stemTopY);
  ctx.stroke();
  // Handlebar crossbar (grips)
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(stemTopX - 3, stemTopY);
  ctx.lineTo(stemTopX + 2, stemTopY);
  ctx.stroke();

  // Grip point (where rider's hands go — left end of crossbar)
  const gripX = stemTopX - 2;   // x + 42
  const gripY = stemTopY;       // y + 19

  // ── Rider (standing tall on pedals — matched to Figma proportions) ──

  // Hip: centered over BB, standing tall (20px above pedals vs old 14px)
  const standX = bbX;             // x + 27
  const standY = bbY - 20;       // y + 24 (was bbY - 14 = y + 30)
  const hipX = standX - riderLean * 7;
  const hipY = standY - riderCrouch * 10;

  // Torso: nearly upright (~81° from horizontal) matching Figma
  const baseTorsoAngle = Math.atan2(-13, 2);   // ≈ -81° (was atan2(-15, 11) ≈ -54°)
  const torsoLength = 13;                       // shorter, more upright (was 19)
  const adjustedAngle = baseTorsoAngle - riderLean * 1.2;
  const shoulderX = hipX + Math.cos(adjustedAngle) * torsoLength;
  const shoulderY = hipY + Math.sin(adjustedAngle) * torsoLength;

  // Legs: both feet on pedals; tuck pulls toward chest during jump
  const footLX = lerp(pedalLX, hipX - 2, legTuck * 0.7);
  const footLY = lerp(pedalY, hipY + 7, legTuck * 0.8);
  const footRX = lerp(pedalRX, hipX + 4, legTuck * 0.7);
  const footRY = lerp(pedalY, hipY + 9, legTuck * 0.8);

  // Knees: natural bend from Figma — right knee bows forward, left knee back
  const kneeLX = lerp((hipX + footLX) / 2 + 1, hipX - 3, legTuck * 0.5);
  const kneeLY = lerp((hipY + footLY) / 2 + 1, hipY + 5, legTuck * 0.5);
  const kneeRX = lerp((hipX + footRX) / 2 + 2, hipX + 2, legTuck * 0.5);
  const kneeRY = lerp((hipY + footRY) / 2, hipY + 5, legTuck * 0.5);

  ctx.strokeStyle = c.pants;
  ctx.lineWidth = 3;
  // Left leg: hip → knee → foot (on left/rear pedal)
  ctx.beginPath();
  ctx.moveTo(hipX - 1, hipY + 2);
  ctx.lineTo(kneeLX, kneeLY);
  ctx.lineTo(footLX, footLY);
  ctx.stroke();
  // Right leg: hip → knee → foot (on right/front pedal)
  ctx.beginPath();
  ctx.moveTo(hipX + 2, hipY + 2);
  ctx.lineTo(kneeRX, kneeRY);
  ctx.lineTo(footRX, footRY);
  ctx.stroke();

  // Torso
  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Arms — two segments: upper arm → elbow → forearm → grip (from Figma)
  const elbowX = shoulderX + 6;
  const elbowY = shoulderY + 6;
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(gripX, gripY);
  ctx.stroke();

  // Head (face oval — slightly wider than tall, matching Figma)
  const headPosX = shoulderX + 1;
  const headPosY = shoulderY - 7;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(headPosX, headPosY + 1, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye (small dot, facing forward)
  ctx.fillStyle = "#2e2e2e";
  ctx.beginPath();
  ctx.arc(headPosX + 3, headPosY, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Helmet (BMX half-shell from Figma — dome + visor + stripes)
  ctx.fillStyle = c.helmet;
  // Main dome — full coverage over top of head
  ctx.beginPath();
  ctx.arc(headPosX, headPosY - 1, 7.5, Math.PI, 0);
  ctx.fill();
  // Helmet brim
  ctx.fillRect(headPosX - 8, headPosY - 1, 16, 2);
  // Visor/peak extending forward-down
  ctx.beginPath();
  ctx.moveTo(headPosX + 5, headPosY - 1);
  ctx.lineTo(headPosX + 10, headPosY + 2);
  ctx.lineTo(headPosX + 4, headPosY + 2);
  ctx.closePath();
  ctx.fill();
  // Stripe accents across dome
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(headPosX - 1, headPosY - 1, 5.5, -Math.PI * 0.82, -Math.PI * 0.18);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(headPosX + 2, headPosY - 1, 5.5, -Math.PI * 0.82, -Math.PI * 0.18);
  ctx.stroke();

  ctx.restore();
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
