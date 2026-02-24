import { PlayerState, TrickType, SkinDefinition, HelmetStyle, BikeStyle } from "../types";

// --- Player (BMX bike + stick-figure rider with helmet) ---
// The bike rotates around the bottom bracket during a bunnyhop (bikeTilt).
// The rider moves independently: leans back → stands up → tucks legs.

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// --- Helmet styles (skin-specific headwear) ---

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
      ctx.fillRect(headX, headY - 2, 11, 2);
      break;

    case "goggles":
      // Skull cap + reflective goggles band
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, -0.1);
      ctx.fill();
      ctx.fillStyle = "#88ccff";
      ctx.fillRect(headX - 7, headY - 1, 14, 2);
      break;

    default: // standard — BMX half-shell with visor + stripes
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 7.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(headX - 8, headY - 1, 16, 2);
      ctx.beginPath();
      ctx.moveTo(headX + 5, headY - 1);
      ctx.lineTo(headX + 10, headY + 2);
      ctx.lineTo(headX + 4, headY + 2);
      ctx.closePath();
      ctx.fill();
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

// --- Bike geometry per style ---

interface BikeGeom {
  wheelR: number;
  rearWheelX: number;
  frontWheelX: number;
  wheelY: number;
  pivotX: number;
  pivotY: number;
  seatX: number;
  seatY: number;
  bbX: number;
  bbY: number;
  headX: number;
  headY: number;
}

function getBikeGeometry(bikeStyle: BikeStyle, x: number, y: number): BikeGeom {
  switch (bikeStyle) {
    case "racing":
      // Road bike: shorter wheelbase, taller frame
      return {
        wheelR: 12, rearWheelX: x + 16, frontWheelX: x + 48, wheelY: y + 46,
        pivotX: x + 29, pivotY: y + 43,
        seatX: x + 24, seatY: y + 30,
        bbX: x + 29, bbY: y + 44,
        headX: x + 43, headY: y + 24,
      };
    case "mtb":
      // Mountain bike: bigger wheels, wider wheelbase, taller frame
      return {
        wheelR: 14, rearWheelX: x + 10, frontWheelX: x + 54, wheelY: y + 44,
        pivotX: x + 27, pivotY: y + 41,
        seatX: x + 22, seatY: y + 30,
        bbX: x + 27, bbY: y + 42,
        headX: x + 45, headY: y + 22,
      };
    default: // bmx, cruiser, fixie, fatTire
      return {
        wheelR: 12, rearWheelX: x + 12, frontWheelX: x + 52, wheelY: y + 46,
        pivotX: x + 27, pivotY: y + 43,
        seatX: x + 23, seatY: y + 35,
        bbX: x + 27, bbY: y + 44,
        headX: x + 45, headY: y + 26,
      };
  }
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rotation: number,
  color: string,
  glow: boolean,
  spokeCount: number = 6,
  spokeWidth: number = 1.2,
  spokeColor?: string,
  knobby: boolean = false
) {
  // Glow halo for neon skin
  if (glow) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,165,0,0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,165,0,0.15)";
    ctx.fill();
    ctx.restore();
  }
  // Tire
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Knobby tire treads (MTB)
  if (knobby) {
    ctx.lineWidth = 1.5;
    const knobCount = 16;
    for (let i = 0; i < knobCount; i++) {
      const angle = rotation + (i * Math.PI * 2) / knobCount;
      const innerR = r - 1;
      const outerR = r + 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();
    }
  }
  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();
  // Spokes
  ctx.strokeStyle = spokeColor ?? color;
  ctx.lineWidth = spokeWidth;
  for (let i = 0; i < spokeCount; i++) {
    const angle = rotation + (i * Math.PI * 2) / spokeCount;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 2, cy + Math.sin(angle) * 2);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.stroke();
  }
}

function drawBikeFrame(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  g: BikeGeom,
  x: number,
  y: number
) {
  const c = skin.colors;
  const { seatX, seatY, bbX, bbY, headX, headY, rearWheelX, frontWheelX, wheelY } = g;

  ctx.strokeStyle = c.frame;
  ctx.lineWidth = 2;

  // Main triangle: top tube + down tube + seat tube
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(headX, headY + 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headX, headY + 5); ctx.lineTo(bbX, bbY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(bbX, bbY); ctx.stroke();

  // Rear triangle: chain stays + seat stays
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(seatX, seatY + 1); ctx.lineTo(rearWheelX, wheelY); ctx.stroke();

  // Fork — varies by bike style
  if (skin.bikeStyle === "mtb") {
    // Suspension fork: two parallel stanchion lines with thicker lower legs
    const forkMidY = headY + (wheelY - headY) * 0.55;
    const forkTipX = frontWheelX;
    // Upper stanchions (thin, lighter)
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(headX + 1, headY); ctx.lineTo(headX + 3, forkMidY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(headX + 4, headY); ctx.lineTo(headX + 6, forkMidY); ctx.stroke();
    // Lower fork legs (thicker, frame color)
    ctx.strokeStyle = c.frame;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(headX + 3, forkMidY); ctx.lineTo(forkTipX, wheelY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(headX + 6, forkMidY); ctx.lineTo(forkTipX + 3, wheelY); ctx.stroke();
    // Fork crown (connects the two legs)
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(headX + 2, forkMidY); ctx.lineTo(headX + 7, forkMidY); ctx.stroke();
  } else {
    // Standard rigid fork (two segments)
    const forkMidX = headX + (frontWheelX - headX) * 0.6;
    const forkMidY = headY + (wheelY - headY) * 0.9;
    ctx.beginPath(); ctx.moveTo(headX, headY); ctx.lineTo(forkMidX, forkMidY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(forkMidX, forkMidY); ctx.lineTo(frontWheelX, wheelY); ctx.stroke();
  }

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

  // Crank arms + pedals
  const pedalLX = bbX - 8;
  const pedalRX = bbX + 8;
  const pedalY = bbY;
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(pedalLX, pedalY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bbX, bbY); ctx.lineTo(pedalRX, pedalY); ctx.stroke();
  ctx.fillStyle = c.wheel;
  ctx.fillRect(pedalLX - 3, pedalY - 1, 6, 3);
  ctx.fillRect(pedalRX - 3, pedalY - 1, 6, 3);
}

function drawHandlebars(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  g: BikeGeom
): { gripX: number; gripY: number } {
  const c = skin.colors;
  const { headX, headY } = g;

  if (skin.bikeStyle === "racing") {
    // Road bike drop handlebars
    const stemTopX = headX;
    const stemTopY = headY - 5;
    ctx.strokeStyle = c.wheel;
    ctx.lineWidth = 2;
    // Stem
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(stemTopX, stemTopY);
    ctx.stroke();
    // Drops: curved bar that goes forward then down (lowered)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stemTopX - 1, stemTopY);
    ctx.quadraticCurveTo(stemTopX + 6, stemTopY - 1, stemTopX + 5, stemTopY + 5);
    ctx.quadraticCurveTo(stemTopX + 4, stemTopY + 10, stemTopX, stemTopY + 7);
    ctx.stroke();
    // Hoods (grip position at top of drops)
    return { gripX: stemTopX + 4, gripY: stemTopY + 3 };
  }

  if (skin.bikeStyle === "mtb") {
    // Mountain bike flat handlebars — wider flat bar
    const stemTopX = headX;
    const stemTopY = headY - 5;
    ctx.strokeStyle = c.wheel;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(stemTopX, stemTopY);
    ctx.stroke();
    // Wide flat bar
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(stemTopX - 6, stemTopY);
    ctx.lineTo(stemTopX + 4, stemTopY);
    ctx.stroke();
    return { gripX: stemTopX - 4, gripY: stemTopY };
  }

  // Default (BMX/cruiser/fixie/fatTire): stem riser + crossbar
  const stemTopX = headX - 1;
  const stemTopY = headY - 7;
  ctx.strokeStyle = c.wheel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(headX, headY);
  ctx.lineTo(stemTopX, stemTopY);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(stemTopX - 3, stemTopY);
  ctx.lineTo(stemTopX + 2, stemTopY);
  ctx.stroke();
  return { gripX: stemTopX - 2, gripY: stemTopY };
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, skin: SkinDefinition) {
  const { x, y, wheelRotation, bikeTilt, riderLean, riderCrouch, legTuck, backflipAngle, flipDirection } = player;
  const c = skin.colors;
  const g = getBikeGeometry(skin.bikeStyle, x, y);
  const glowWheels = skin.bikeStyle === "fixie"; // neon skin

  ctx.save();

  // Flip rotation — backflip (CCW) or frontflip (CW) around player center
  if (backflipAngle > 0) {
    const centerX = x + player.width / 2;
    const centerY = y + player.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(-backflipAngle * flipDirection);
    ctx.translate(-centerX, -centerY);
  }

  const trickProg = player.trickProgress;
  const activeTrick = player.activeTrick;

  // Bike tilt — extra dip during superman (rear wheel drops)
  let effectiveBikeTilt = bikeTilt;
  if (activeTrick === TrickType.SUPERMAN && trickProg > 0) {
    effectiveBikeTilt += 0.175 * trickProg;
  }

  ctx.translate(g.pivotX, g.pivotY);
  ctx.rotate(-effectiveBikeTilt);
  ctx.translate(-g.pivotX, -g.pivotY);

  // ── Wheels ──
  let spokeCount = 6;
  let spokeWidth = 1.2;
  let spokeColor: string | undefined;
  let knobby = false;
  switch (skin.bikeStyle) {
    case "racing":  spokeCount = 5; break;
    case "mtb":     knobby = true; break;
    case "cruiser": spokeCount = 3; spokeWidth = 3.6; spokeColor = c.frame; break;
    case "fatTire": spokeCount = 8; spokeColor = "#aaaaaa"; break;
  }
  drawWheel(ctx, g.rearWheelX, g.wheelY, g.wheelR, wheelRotation, c.wheel, glowWheels, spokeCount, spokeWidth, spokeColor, knobby);
  drawWheel(ctx, g.frontWheelX, g.wheelY, g.wheelR, wheelRotation, c.wheel, glowWheels, spokeCount, spokeWidth, spokeColor, knobby);

  // ── Frame ──
  drawBikeFrame(ctx, skin, g, x, y);

  // ── Handlebars ──
  const { gripX, gripY } = drawHandlebars(ctx, skin, g);

  // ── Rider (standing tall on pedals) ──
  const { bbX, bbY } = g;
  const pedalLX = bbX - 8;
  const pedalRX = bbX + 8;
  const pedalY = bbY;

  // Hip
  const standX = bbX;
  const standY = bbY - 20;
  let hipX = standX - riderLean * 7;
  let hipY = standY - riderCrouch * 10;

  // Torso — slightly more forward lean for road bike
  const torsoLeanOffset = skin.bikeStyle === "racing" ? 0.15 : 0;
  const baseTorsoAngle = Math.atan2(-13, 2) + torsoLeanOffset;
  const torsoLength = 13;
  const adjustedAngle = baseTorsoAngle - riderLean * 1.2;
  let shoulderX = hipX + Math.cos(adjustedAngle) * torsoLength;
  let shoulderY = hipY + Math.sin(adjustedAngle) * torsoLength;

  // Legs
  let footLX = lerp(pedalLX, hipX - 2, legTuck * 0.7);
  let footLY = lerp(pedalY, hipY + 7, legTuck * 0.8);
  let footRX = lerp(pedalRX, hipX + 4, legTuck * 0.7);
  let footRY = lerp(pedalY, hipY + 9, legTuck * 0.8);

  // Knees
  let kneeLX = lerp((hipX + footLX) / 2 + 1, hipX - 3, legTuck * 0.5);
  let kneeLY = lerp((hipY + footLY) / 2 + 1, hipY + 5, legTuck * 0.5);
  let kneeRX = lerp((hipX + footRX) / 2 + 2, hipX + 2, legTuck * 0.5);
  let kneeRY = lerp((hipY + footRY) / 2, hipY + 5, legTuck * 0.5);

  // Arms
  let elbowX = shoulderX + 6;
  let elbowY = shoulderY + 6;
  let drawGripX = gripX;
  let drawGripY = gripY;

  // --- Pose trick modifications ---
  if (activeTrick === TrickType.SUPERMAN && trickProg > 0) {
    hipX = lerp(hipX, hipX - 10, trickProg);
    hipY = lerp(hipY, hipY + 5, trickProg);
    const supermanAngle = lerp(adjustedAngle, -0.3, trickProg);
    shoulderX = hipX + Math.cos(supermanAngle) * torsoLength;
    shoulderY = hipY + Math.sin(supermanAngle) * torsoLength;
    footLX = lerp(pedalLX, hipX - 22, trickProg);
    footLY = lerp(pedalY, hipY + 2, trickProg);
    footRX = lerp(pedalRX, hipX - 20, trickProg);
    footRY = lerp(pedalY, hipY + 4, trickProg);
    kneeLX = lerp(kneeLX, (hipX + footLX) / 2, trickProg);
    kneeLY = lerp(kneeLY, (hipY + footLY) / 2 - 1, trickProg);
    kneeRX = lerp(kneeRX, (hipX + footRX) / 2, trickProg);
    kneeRY = lerp(kneeRY, (hipY + footRY) / 2 + 1, trickProg);
    elbowX = lerp(shoulderX + 6, (shoulderX + gripX) / 2 + 3, trickProg);
    elbowY = lerp(shoulderY + 6, (shoulderY + gripY) / 2 + 2, trickProg);
  }

  if (activeTrick === TrickType.NO_HANDER && trickProg > 0) {
    // Hands move behind rider's back (simulating behind-the-back clap)
    elbowX = lerp(shoulderX + 6, hipX - 5, trickProg);
    elbowY = lerp(shoulderY + 6, (shoulderY + hipY) / 2, trickProg);
    drawGripX = lerp(gripX, hipX - 8, trickProg);
    drawGripY = lerp(gripY, hipY - 3, trickProg);
  }

  // Draw legs
  ctx.strokeStyle = c.pants;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hipX - 1, hipY + 2);
  ctx.lineTo(kneeLX, kneeLY);
  ctx.lineTo(footLX, footLY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hipX + 2, hipY + 2);
  ctx.lineTo(kneeRX, kneeRY);
  ctx.lineTo(footRX, footRY);
  ctx.stroke();

  // Draw torso
  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  // Backpack for MTB (trail rider) — drawn behind arms
  if (skin.bikeStyle === "mtb") {
    ctx.fillStyle = "#87ceeb";
    const bpX = (hipX + shoulderX) / 2 - 6;
    const bpY = (hipY + shoulderY) / 2 - 3;
    ctx.beginPath();
    ctx.moveTo(bpX, bpY);
    ctx.lineTo(bpX - 4, bpY + 2);
    ctx.lineTo(bpX - 3, bpY + 10);
    ctx.lineTo(bpX + 3, bpY + 10);
    ctx.lineTo(bpX + 2, bpY);
    ctx.closePath();
    ctx.fill();
    // Strap
    ctx.strokeStyle = "#6ab0d6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(shoulderX - 2, shoulderY + 1);
    ctx.lineTo(bpX, bpY + 2);
    ctx.stroke();
  }

  // Draw arms — long sleeves (shirt color), skin-colored hands
  ctx.strokeStyle = c.shirt;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(drawGripX, drawGripY);
  ctx.stroke();
  // Hands
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(drawGripX, drawGripY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headPosX = shoulderX + 1;
  const headPosY = shoulderY - 7;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(headPosX, headPosY + 1, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = "#2e2e2e";
  ctx.beginPath();
  ctx.arc(headPosX + 3, headPosY, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Sunglasses for Shadow Ops
  if (skin.bikeStyle === "fatTire") {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(headPosX - 5, headPosY - 1.5, 11, 3);
    // Glint
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(headPosX + 3, headPosY - 1, 2, 1);
  }

  // Helmet (skin-specific style)
  drawHelmet(ctx, headPosX, headPosY, skin.helmetStyle, c.helmet);

  ctx.restore();
}

export function drawSkinPreview(ctx: CanvasRenderingContext2D, skin: SkinDefinition, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  // Use a wider logical bounding box to capture the full bike geometry
  // (e.g. MTB front wheel extends to ~x=68)
  const logicalW = 75;
  const logicalH = 50;
  const scale = Math.min(w / logicalW, h / logicalH);
  ctx.save();
  ctx.translate((w - logicalW * scale) / 2, (h - logicalH * scale) / 2);
  ctx.scale(scale, scale);
  const mockPlayer: PlayerState = {
    x: 6,
    y: -8,
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
    activeTrick: TrickType.NONE,
    trickProgress: 0,
    trickPhase: "extend",
    trickCompletions: 0,
    rampBoost: null,
    rampSurfaceAngle: 0,
    targetFlipCount: 0,
    targetTrickCount: 0,
  };
  drawPlayer(ctx, mockPlayer, skin);
  ctx.restore();
}
