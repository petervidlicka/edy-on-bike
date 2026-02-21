import { PlayerState, BackgroundLayer, ObstacleInstance, ObstacleType, SkinDefinition, HelmetStyle } from "./types";
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

function drawHelmet(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  helmetStyle: HelmetStyle,
  helmetColor: string
) {
  ctx.fillStyle = helmetColor;

  switch (helmetStyle) {
    case "aero":
      // Teardrop aero helmet with tail
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, 0);
      ctx.fill();
      // Tail extension
      ctx.beginPath();
      ctx.moveTo(headX - 7, headY - 1);
      ctx.lineTo(headX - 12, headY - 3);
      ctx.lineTo(headX - 5, headY - 6);
      ctx.closePath();
      ctx.fill();
      break;

    case "cowboy":
      // Wide brim + dome
      ctx.beginPath();
      ctx.arc(headX, headY - 3, 6, Math.PI, 0);
      ctx.fill();
      // Wide brim
      ctx.fillRect(headX - 12, headY - 3, 24, 2);
      break;

    case "crown":
      // 3-point crown
      ctx.beginPath();
      ctx.moveTo(headX - 8, headY - 1);
      ctx.lineTo(headX - 7, headY - 8);
      ctx.lineTo(headX - 3, headY - 5);
      ctx.lineTo(headX, headY - 10);
      ctx.lineTo(headX + 3, headY - 5);
      ctx.lineTo(headX + 7, headY - 8);
      ctx.lineTo(headX + 8, headY - 1);
      ctx.closePath();
      ctx.fill();
      break;

    case "cap":
      // Baseball cap
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, 0);
      ctx.fill();
      // Visor (forward-facing brim)
      ctx.fillRect(headX, headY - 2, 11, 2);
      break;

    case "goggles":
      // Skull cap
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, -0.1);
      ctx.fill();
      // Reflective goggles band
      ctx.fillStyle = "#88ccff";
      ctx.fillRect(headX - 7, headY - 1, 14, 2);
      break;

    default: // standard — BMX half-shell with visor + stripes
      // Main dome
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, 0);
      ctx.fill();
      // Helmet brim
      ctx.fillRect(headX - 8, headY - 1, 16, 2);
      // Visor/peak extending forward-down
      ctx.beginPath();
      ctx.moveTo(headX + 5, headY - 1);
      ctx.lineTo(headX + 10, headY + 2);
      ctx.lineTo(headX + 4, headY + 2);
      ctx.closePath();
      ctx.fill();
      // Stripe accents across dome
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(headX - 1, headY - 1, 5.5, -Math.PI * 0.82, -Math.PI * 0.18);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(headX + 2, headY - 1, 5.5, -Math.PI * 0.82, -Math.PI * 0.18);
      ctx.stroke();
      break;
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, skin: SkinDefinition) {
  const { x, y, wheelRotation, bikeTilt, riderLean, riderCrouch, legTuck, backflipAngle, flipDirection } = player;
  const c = skin.colors;

  // BMX proportions matched to Figma reference — long wheelbase, low frame
  const wheelR = 12;
  const rearWheelX = x + 12;
  const frontWheelX = x + 52;
  const wheelY = y + 46;

  // Pivot near the bottom bracket for bunnyhop rotation
  const pivotX = x + 27;
  const pivotY = y + 43;

  ctx.save();

  // Flip rotation — backflip (CCW) or frontflip (CW) around player center
  if (backflipAngle > 0) {
    const centerX = x + player.width / 2;
    const centerY = y + player.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(-backflipAngle * flipDirection);
    ctx.translate(-centerX, -centerY);
  }

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

  const seatX = x + 23;       // seat cluster
  const seatY = y + 35;       // seat cluster height
  const bbX = x + 27;         // bottom bracket
  const bbY = wheelY - 2;     // y + 44
  const headX_f = x + 45;     // head tube top
  const headY_f = y + 26;     // head tube top

  // Main triangle: top tube + down tube + seat tube
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(headX_f, headY_f + 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headX_f, headY_f + 5); ctx.lineTo(bbX, bbY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(bbX, bbY); ctx.stroke();

  // Rear triangle: chain stays + seat stays
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(seatX, seatY + 1); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();

  // Fork (two segments — steep ~17° from vertical, matching Figma)
  ctx.beginPath(); ctx.moveTo(headX_f, headY_f); ctx.lineTo(x + 51, y + 45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 51, y + 45); ctx.lineTo(frontWheelX, wheelY); ctx.stroke();

  // Chainring (sprocket circle at BB)
  ctx.fillStyle = c.frame;
  ctx.beginPath();
  ctx.arc(bbX, bbY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bbX, bbY, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Seat post + saddle
  ctx.strokeStyle = c.frame;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(seatX - 1, seatY - 3); ctx.stroke();
  ctx.fillStyle = c.wheel;
  ctx.fillRect(seatX - 6, seatY - 5, 10, 3);

  // Crank arms (horizontal — BMX standing stance)
  const pedalLX = bbX - 8;
  const pedalRX = bbX + 8;
  const pedalY = bbY;
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(pedalLX, pedalY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(pedalRX, pedalY); ctx.stroke();
  // Pedal platforms
  ctx.fillStyle = c.wheel;
  ctx.fillRect(pedalLX - 3, pedalY - 1, 6, 3);
  ctx.fillRect(pedalRX - 3, pedalY - 1, 6, 3);

  // Handlebar stem riser + crossbar
  const stemTopX = headX_f - 1;
  const stemTopY = headY_f - 7;
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
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

  // Grip point (where rider's hands go)
  const gripX = stemTopX - 2;
  const gripY = stemTopY;

  // ── Rider (standing tall on pedals — matched to Figma proportions) ──

  // Hip: centered over BB, standing tall
  const standX = bbX;
  const standY = bbY - 20;
  const hipX = standX - riderLean * 7;
  const hipY = standY - riderCrouch * 10;

  // Torso: nearly upright (~81° from horizontal)
  const baseTorsoAngle = Math.atan2(-13, 2);
  const torsoLength = 13;
  const adjustedAngle = baseTorsoAngle - riderLean * 1.2;
  const shoulderX = hipX + Math.cos(adjustedAngle) * torsoLength;
  const shoulderY = hipY + Math.sin(adjustedAngle) * torsoLength;

  // Legs: both feet on pedals; tuck pulls toward chest during jump
  const footLX = lerp(pedalLX, hipX - 2, legTuck * 0.7);
  const footLY = lerp(pedalY, hipY + 7, legTuck * 0.8);
  const footRX = lerp(pedalRX, hipX + 4, legTuck * 0.7);
  const footRY = lerp(pedalY, hipY + 9, legTuck * 0.8);

  // Knees: natural bend — right knee bows forward, left knee back
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

  // Arms — two segments: upper arm → elbow → forearm → grip
  const elbowX = shoulderX + 6;
  const elbowY = shoulderY + 6;
  ctx.strokeStyle = c.skin;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(gripX, gripY);
  ctx.stroke();

  // Head (face oval — slightly wider than tall)
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

  // Helmet (skin-specific style)
  drawHelmet(ctx, headPosX, headPosY, skin.helmetStyle, c.helmet);

  ctx.restore();
}

export function drawSkinPreview(ctx: CanvasRenderingContext2D, skin: SkinDefinition, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const scale = Math.min(w / 50, h / 55);
  ctx.save();
  ctx.translate((w - 50 * scale) / 2, (h - 55 * scale) / 2);
  ctx.scale(scale, scale);
  const mockPlayer: PlayerState = {
    x: 0,
    y: 0,
    width: 50,
    height: 55,
    velocityY: 0,
    jumpCount: 0,
    isOnGround: true,
    wheelRotation: 0,
    bikeTilt: 0,
    riderLean: 0,
    riderCrouch: 0,
    legTuck: 0,
    ridingObstacle: null,
    backflipAngle: 0,
    isBackflipping: false,
    flipDirection: 1,
  };
  drawPlayer(ctx, mockPlayer, skin);
  ctx.restore();
}

// --- Obstacle draw functions ---

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  // Irregular polygon body
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
  // Highlight patch (upper-right)
  ctx.fillStyle = c.rockHighlight;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.12);
  ctx.lineTo(x + w * 0.85, y + h * 0.25);
  ctx.lineTo(x + w * 0.75, y + h * 0.5);
  ctx.lineTo(x + w * 0.45, y + h * 0.4);
  ctx.closePath();
  ctx.fill();
  // Shadow patch (lower-left)
  ctx.fillStyle = c.rockShadow;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.6);
  ctx.lineTo(x + w * 0.35, y + h * 0.55);
  ctx.lineTo(x + w * 0.4, y + h * 0.85);
  ctx.lineTo(x + w * 0.15, y + h * 0.9);
  ctx.closePath();
  ctx.fill();
  // Crack lines
  ctx.strokeStyle = c.rockShadow;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + h * 0.3);
  ctx.lineTo(x + w * 0.45, y + h * 0.55);
  ctx.lineTo(x + w * 0.55, y + h * 0.5);
  ctx.stroke();
  // Outline
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

function drawSmallTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  const cx = x + w / 2;
  // Trunk with bark texture
  ctx.fillStyle = c.treeTrunk;
  ctx.fillRect(cx - w * 0.1, y + h * 0.55, w * 0.2, h * 0.45);
  // Bark lines
  ctx.strokeStyle = c.treeTrunkShadow;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.04, y + h * 0.58);
  ctx.lineTo(cx - w * 0.02, y + h * 0.95);
  ctx.moveTo(cx + w * 0.05, y + h * 0.6);
  ctx.lineTo(cx + w * 0.04, y + h * 0.9);
  ctx.stroke();
  // Canopy — three overlapping rounded blobs (lush deciduous, contrasts with background conifers)
  // Bottom blob
  ctx.fillStyle = c.tree;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.48, w * 0.5, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Middle blob
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.08, y + h * 0.32, w * 0.42, h * 0.16, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // Top blob
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.05, y + h * 0.18, w * 0.32, h * 0.14, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Highlight blobs (light-facing right side)
  ctx.fillStyle = c.treeHighlight;
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.15, y + h * 0.44, w * 0.22, h * 0.1, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.1, y + h * 0.26, w * 0.18, h * 0.08, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Outline
  ctx.strokeStyle = c.treeTrunkShadow;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.48, w * 0.5, h * 0.18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.05, y + h * 0.18, w * 0.32, h * 0.14, 0.1, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTallTree(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  const cx = x + w / 2;

  // Slender trunk (narrower than small tree, takes ~25% of height)
  ctx.fillStyle = c.treeTrunk;
  ctx.fillRect(cx - w * 0.08, y + h * 0.75, w * 0.16, h * 0.25);
  // Bark line
  ctx.strokeStyle = c.treeTrunkShadow;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.02, y + h * 0.77);
  ctx.lineTo(cx - w * 0.01, y + h * 0.98);
  ctx.stroke();

  // Tall narrow canopy — cypress/poplar silhouette (two elongated blobs)
  // Main body: tall narrow oval
  ctx.fillStyle = c.tree;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.42, w * 0.38, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  // Top pointed section
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.14, w * 0.22, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Side wisps (small blobs left and right to break the silhouette)
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.25, y + h * 0.5, w * 0.15, h * 0.1, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.25, y + h * 0.45, w * 0.15, h * 0.1, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Highlight (right-facing light)
  ctx.fillStyle = c.treeHighlight;
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.12, y + h * 0.38, w * 0.16, h * 0.18, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + w * 0.08, y + h * 0.12, w * 0.1, h * 0.1, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Outline (just the outer body)
  ctx.strokeStyle = c.treeTrunkShadow;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.42, w * 0.38, h * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawShoppingTrolley(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  const basketTop = y;
  const basketBottom = y + h - 14;
  const basketLeft = x + 8;
  const basketRight = x + w;
  const bw = basketRight - basketLeft;
  const bh = basketBottom - basketTop;

  // Handle bar with orange grip
  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, basketTop + 4);
  ctx.lineTo(basketLeft, basketTop);
  ctx.stroke();
  // Orange grip
  ctx.strokeStyle = c.trolleyAccent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, basketTop + 2);
  ctx.lineTo(x, basketTop + 10);
  ctx.stroke();

  // Basket body (slight trapezoid — wider at top)
  ctx.fillStyle = c.trolleyBasket;
  ctx.beginPath();
  ctx.moveTo(basketLeft + 2, basketBottom);
  ctx.lineTo(basketLeft, basketTop);
  ctx.lineTo(basketRight, basketTop);
  ctx.lineTo(basketRight - 2, basketBottom);
  ctx.closePath();
  ctx.fill();

  // Wire grid pattern
  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 0.8;
  // Horizontal wires
  for (let i = 1; i <= 3; i++) {
    const gy = basketTop + bh * (i / 4);
    ctx.beginPath();
    ctx.moveTo(basketLeft, gy);
    ctx.lineTo(basketRight, gy);
    ctx.stroke();
  }
  // Vertical wires
  for (let i = 1; i <= 3; i++) {
    const gx = basketLeft + bw * (i / 4);
    ctx.beginPath();
    ctx.moveTo(gx, basketTop);
    ctx.lineTo(gx, basketBottom);
    ctx.stroke();
  }

  // Basket frame outline
  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(basketLeft + 2, basketBottom);
  ctx.lineTo(basketLeft, basketTop);
  ctx.lineTo(basketRight, basketTop);
  ctx.lineTo(basketRight - 2, basketBottom);
  ctx.closePath();
  ctx.stroke();

  // Wheels with spokes
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
    // Spokes
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(a) * wheelR, wy + Math.sin(a) * wheelR);
      ctx.stroke();
    }
  }

  // Legs connecting basket to wheels
  ctx.strokeStyle = c.trolley;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(basketLeft + 4, basketBottom);
  ctx.lineTo(x + 14, wy - wheelR);
  ctx.moveTo(basketRight - 4, basketBottom);
  ctx.lineTo(x + w - 8, wy - wheelR);
  ctx.stroke();
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;

  // Body (lower) — terracotta red
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

  // Roof — darker red with sloped profile
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

  // Windows — light blue with reflective highlight
  ctx.fillStyle = c.carWindow;
  ctx.fillRect(x + 16, y + 2, 18, 11);
  ctx.fillRect(x + w - 34, y + 2, 18, 11);
  // Window reflection
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
  ctx.fillStyle = "#e8d06a";
  ctx.beginPath();
  ctx.arc(x + w - 3, y + 20, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c44040";
  ctx.beginPath();
  ctx.arc(x + 3, y + 20, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Wheels
  ctx.fillStyle = "#2e2e2c";
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

function drawPersonOnBike(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  const wheelR = 9;
  const rearWX = x + wheelR + 2;
  const frontWX = x + w - wheelR - 2;
  const wheelY = y + h - wheelR;

  // Wheels with spokes
  ctx.strokeStyle = c.bikeFrame;
  ctx.lineWidth = 2;
  for (const wx of [rearWX, frontWX]) {
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2);
    ctx.stroke();
    // Spokes
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * 2, wheelY + Math.sin(a) * 2);
      ctx.lineTo(wx + Math.cos(a) * wheelR, wheelY + Math.sin(a) * wheelR);
      ctx.stroke();
    }
    // Center dot
    ctx.fillStyle = c.bikeFrame;
    ctx.beginPath();
    ctx.arc(wx, wheelY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
  }

  // Frame (diamond shape)
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

  // Seat
  ctx.fillStyle = c.bikeRider;
  ctx.fillRect(seatX - 4, seatY - 2, 8, 3);

  // Rider torso — plum/indigo shirt
  const shoulderX = seatX + 6;
  const shoulderY = seatY - 14;
  ctx.strokeStyle = c.bikeRider;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(seatX + 2, seatY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Arms
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(frontWX - 4, seatY - 6);
  ctx.stroke();

  // Legs (to pedals)
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(seatX + 2, seatY);
  ctx.lineTo(pedalX - 3, pedalY);
  ctx.moveTo(seatX + 2, seatY);
  ctx.lineTo(pedalX + 3, pedalY);
  ctx.stroke();

  // Head — skin tone
  ctx.fillStyle = COLORS.player.skin;
  ctx.beginPath();
  ctx.arc(shoulderX + 1, shoulderY - 7, 5, 0, Math.PI * 2);
  ctx.fill();
  // Helmet
  ctx.fillStyle = c.bikeRider;
  ctx.beginPath();
  ctx.arc(shoulderX + 1, shoulderY - 8, 5.5, Math.PI, 0);
  ctx.fill();
}

function drawBusStop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  // Two vertical posts
  ctx.fillStyle = c.busStopFrame;
  ctx.fillRect(x + 4, y + 10, 4, h - 10);
  ctx.fillRect(x + w - 8, y + 10, 4, h - 10);

  // Roof (flat top — landing surface)
  ctx.fillStyle = c.busStopRoof;
  ctx.fillRect(x - 2, y, w + 4, 10);
  // Roof overhang shadow
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(x, y + 10, w, 3);

  // Glass back panel
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = c.busStopGlass;
  ctx.fillRect(x + 10, y + 14, w - 20, h - 22);
  ctx.restore();
  // Glass panel frame
  ctx.strokeStyle = c.busStopFrame;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 10, y + 14, w - 20, h - 22);
  // Glass divider
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 14);
  ctx.lineTo(x + w / 2, y + h - 8);
  ctx.stroke();

  // Bench
  ctx.fillStyle = c.busStopFrame;
  ctx.fillRect(x + 12, y + h - 14, w - 24, 4);
  // Bench legs
  ctx.fillRect(x + 14, y + h - 10, 2, 6);
  ctx.fillRect(x + w - 16, y + h - 10, 2, 6);

  // Bus stop sign (circle on left post)
  ctx.fillStyle = c.busStopSign;
  ctx.beginPath();
  ctx.arc(x + 6, y + 18, 5, 0, Math.PI * 2);
  ctx.fill();
  // Sign letter "B"
  ctx.fillStyle = "#fff";
  ctx.font = "bold 6px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("B", x + 6, y + 18);
}

function drawShippingContainer(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const c = COLORS.obstacle;
  // Main body
  ctx.fillStyle = c.container;
  ctx.fillRect(x, y, w, h);

  // Corrugated ridges (vertical lines)
  ctx.strokeStyle = c.containerDark;
  ctx.lineWidth = 1;
  for (let i = 1; i < 12; i++) {
    const lx = x + (w / 12) * i;
    ctx.beginPath();
    ctx.moveTo(lx, y + 2);
    ctx.lineTo(lx, y + h - 2);
    ctx.stroke();
  }

  // Top edge highlight
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(x, y, w, 3);

  // Door end (right side)
  ctx.fillStyle = c.containerDoor;
  ctx.fillRect(x + w - 16, y + 4, 14, h - 8);
  // Door handle
  ctx.fillStyle = c.containerDark;
  ctx.fillRect(x + w - 10, y + h * 0.4, 3, 8);
  // Door seam
  ctx.strokeStyle = c.containerDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w - 9, y + 4);
  ctx.lineTo(x + w - 9, y + h - 4);
  ctx.stroke();

  // Bottom shadow
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(x, y + h - 3, w, 3);

  // Outline
  ctx.strokeStyle = c.containerDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
}

export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: ObstacleInstance) {
  const { type, x, y, width: w, height: h } = obstacle;
  switch (type) {
    case ObstacleType.ROCK:               drawRock(ctx, x, y, w, h); break;
    case ObstacleType.SMALL_TREE:         drawSmallTree(ctx, x, y, w, h); break;
    case ObstacleType.TALL_TREE:          drawTallTree(ctx, x, y, w, h); break;
    case ObstacleType.SHOPPING_TROLLEY:   drawShoppingTrolley(ctx, x, y, w, h); break;
    case ObstacleType.CAR:                drawCar(ctx, x, y, w, h); break;
    case ObstacleType.PERSON_ON_BIKE:     drawPersonOnBike(ctx, x, y, w, h); break;
    case ObstacleType.BUS_STOP:           drawBusStop(ctx, x, y, w, h); break;
    case ObstacleType.SHIPPING_CONTAINER: drawShippingContainer(ctx, x, y, w, h); break;
  }
}

// --- Floating bonus text ---

export function drawFloatingText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, opacity);
  ctx.font = "bold 21px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Dark outline
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 3;
  ctx.strokeText(text, x, y);
  // Gold fill
  ctx.fillStyle = "#f0c030";
  ctx.fillText(text, x, y);
  ctx.restore();
}
