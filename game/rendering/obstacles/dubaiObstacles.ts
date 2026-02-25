import type { EnvironmentPalette } from "../../environments/types";

// --- Dubai biome obstacle draw functions ---

export function drawCamel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawSandTrap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawLandCruiser(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const c = palette.obstacle;
  const bodyColor = "#f0ece8"; // Pearl white
  const bodyDark = "#d0ccc8";
  const chrome = "#c8c8c8";
  const wheelR = 10;
  const wheelY = y + h - wheelR;
  const bodyTop = y + 13;
  const bodyBottom = y + h - wheelR - 2;
  const roofTop = y + 2;

  // Mirror horizontally so the car faces left (direction of travel),
  // and shift up 10px to compensate for the universal road-sink offset
  // (which would otherwise push the wheels halfway through the road).
  ctx.save();
  ctx.translate(2 * x + w, -10);
  ctx.scale(-1, 1);

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

  ctx.restore();
}

export function drawPinkGClass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const pink = palette.obstacle.pinkGClass ?? "#e87a9f";
  const pinkDark = palette.obstacle.pinkGClassRoof ?? "#d06888";
  const c = palette.obstacle;
  const wheelR = 9;
  const wheelY = y + h - wheelR;
  const bodyTop = y + 13;
  const bodyBottom = y + h - wheelR - 3;
  const roofTop = y + 1;

  // Mirror horizontally so the car faces left (direction of travel),
  // and shift up 10px to compensate for the universal road-sink offset
  // (which would otherwise push the wheels halfway through the road).
  ctx.save();
  ctx.translate(2 * x + w, -10);
  ctx.scale(-1, 1);

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

  ctx.restore();
}

export function drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawDubaiChocolate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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

export function drawDubaiBillboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const frameColor = palette.obstacle.billboardFrame ?? "#a0a0a0";
  const postColor = palette.obstacle.billboardPost ?? "#5a5a5a";

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

  // --- Ad interior scene ---
  const adX = x + 4;
  const adY = y + 4;
  const adW = w - 8; // ~132
  const adH = signH - 8; // ~42

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
    const sy = adY + adH * 0.6 + Math.random() * adH * 0.06;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 3, sy);
    ctx.stroke();
  }

  // Sand/ground at bottom
  ctx.fillStyle = "#d4b87a";
  ctx.fillRect(adX, adY + adH * 0.68, adW, adH * 0.32);

  // --- Skyscrapers (4 simplified towers) ---
  const towers = [
    { cx: 0.15, tw: 0.08, th: 0.5, color: "#b8d0e0" },
    { cx: 0.32, tw: 0.06, th: 0.55, color: "#c8d8e8" },
    { cx: 0.68, tw: 0.07, th: 0.48, color: "#a8c0d0" },
    { cx: 0.82, tw: 0.05, th: 0.42, color: "#c0d0e0" },
  ];
  for (const t of towers) {
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
  const palmPositions = [0.22, 0.55, 0.88];
  for (const px of palmPositions) {
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

  // --- Sign panel metal frame (on top of everything) ---
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1, y + 1, w - 2, signH - 2);
  // Inner frame line
  ctx.strokeStyle = "#b8b8b8";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, w - 6, signH - 6);

  // Reset text alignment
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

export function drawLamborghiniHuracan(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
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
