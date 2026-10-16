import { PlayerState, TrickType, SkinDefinition, HelmetStyle, BikeStyle } from "../types";

// --- Player (BMX bike + stick-figure rider with helmet) ---
// The bike rotates around the bottom bracket during a bunnyhop (bikeTilt).
// The rider moves independently: leans back → stands up → tucks legs.

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// --- Helmet styles (skin-specific headwear) ---

export function drawHelmet(
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

export interface BikeGeom {
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

export function getBikeGeometry(bikeStyle: BikeStyle, x: number, y: number): BikeGeom {
  switch (bikeStyle) {
    case "racing":
      // Road bike: long, low race geometry — stretched wheelbase, lower saddle and bars
      return {
        wheelR: 12, rearWheelX: x + 11, frontWheelX: x + 52, wheelY: y + 46,
        pivotX: x + 28, pivotY: y + 43,
        seatX: x + 23, seatY: y + 33,
        bbX: x + 28, bbY: y + 44,
        headX: x + 45, headY: y + 28,
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

export function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rotation: number,
  color: string,
  glow: boolean,
  spokeCount: number = 12,
  spokeWidth: number = 0.5,
  spokeColor?: string,
  knobby: boolean = false,
  tyreWidth: number = 2.3
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
  ctx.save();
  ctx.lineCap = "round";
  // Tyre
  ctx.strokeStyle = color;
  ctx.lineWidth = tyreWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Knobby tyre treads (MTB)
  if (knobby) {
    ctx.lineWidth = 1;
    const knobCount = 24;
    for (let i = 0; i < knobCount; i++) {
      const angle = rotation + (i * Math.PI * 2) / knobCount;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.lineTo(cx + Math.cos(angle) * (r + tyreWidth * 0.5 + 0.5), cy + Math.sin(angle) * (r + tyreWidth * 0.5 + 0.5));
      ctx.stroke();
    }
  }
  // Rim: a light metal ring just inside the tyre
  const rimR = r - tyreWidth / 2 - 0.5;
  ctx.strokeStyle = glow ? color : "#b9bec3";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(cx, cy, rimR, 0, Math.PI * 2);
  ctx.stroke();
  // Spokes: many thin wires, or a few bold mag-wheel arms when spokeWidth is large
  ctx.strokeStyle = spokeColor ?? "rgba(150,155,160,0.85)";
  ctx.lineWidth = spokeWidth;
  for (let i = 0; i < spokeCount; i++) {
    const angle = rotation + (i * Math.PI * 2) / spokeCount;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 1.6, cy + Math.sin(angle) * 1.6);
    ctx.lineTo(cx + Math.cos(angle) * rimR, cy + Math.sin(angle) * rimR);
    ctx.stroke();
  }
  // Hub
  ctx.fillStyle = "#9a9fa5";
  ctx.beginPath();
  ctx.arc(cx, cy, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Fox Factory–style orange for suspension fork lowers. */
const MTB_FORK_ORANGE = "#f47b20";

export function drawBikeFrame(
  ctx: CanvasRenderingContext2D,
  skin: SkinDefinition,
  g: BikeGeom,
) {
  const c = skin.colors;
  const { seatX, seatY, bbX, bbY, headX, headY, rearWheelX, frontWheelX, wheelY } = g;
  const tube = skin.bikeStyle === "fatTire" || skin.bikeStyle === "mtb" ? 2.2 : skin.bikeStyle === "racing" ? 1.6 : 1.9;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Chain and rear cog, behind the frame
  ctx.strokeStyle = "rgba(45,45,45,0.85)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(bbX, bbY - 3.6);
  ctx.lineTo(rearWheelX, wheelY - 2);
  ctx.moveTo(bbX, bbY + 3.6);
  ctx.lineTo(rearWheelX, wheelY + 2);
  ctx.stroke();
  ctx.fillStyle = "#5a5e63";
  ctx.beginPath();
  ctx.arc(rearWheelX, wheelY, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Rear triangle: slimmer chain stays + seat stays
  ctx.strokeStyle = c.frame;
  ctx.lineWidth = tube * 0.7;
  ctx.beginPath();
  ctx.moveTo(bbX, bbY); ctx.lineTo(rearWheelX, wheelY);
  ctx.moveTo(seatX, seatY + 1); ctx.lineTo(rearWheelX, wheelY);
  ctx.stroke();

  // Main triangle: top tube + down tube + seat tube
  ctx.lineWidth = tube;
  ctx.beginPath();
  ctx.moveTo(seatX, seatY); ctx.lineTo(headX, headY + 2);
  ctx.moveTo(headX, headY + 5); ctx.lineTo(bbX, bbY);
  ctx.moveTo(seatX, seatY); ctx.lineTo(bbX, bbY);
  ctx.stroke();
  // Head tube
  ctx.lineWidth = tube + 0.9;
  ctx.beginPath();
  ctx.moveTo(headX - 0.4, headY); ctx.lineTo(headX + 0.6, headY + 5.5);
  ctx.stroke();
  // Tube highlight for a rounded, painted look
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(seatX + 1, seatY - 0.6); ctx.lineTo(headX - 1, headY + 1.4);
  ctx.moveTo(headX - 0.6, headY + 5); ctx.lineTo(bbX + 1, bbY - 1);
  ctx.stroke();

  // Fork — varies by bike style
  if (skin.bikeStyle === "mtb") {
    // Suspension fork on one straight axis from head tube to hub: silver stanchions
    // sliding into Fox-style orange lowers, with a crown at the top.
    const topX = headX + 0.6;
    const topY = headY + 5;
    const along = (t: number) => ({ x: topX + (frontWheelX - topX) * t, y: topY + (wheelY - topY) * t });
    const split = along(0.42);
    ctx.strokeStyle = "#c3c8cd";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(topX, topY); ctx.lineTo(split.x, split.y);
    ctx.stroke();
    ctx.strokeStyle = MTB_FORK_ORANGE;
    ctx.lineWidth = 2.7;
    ctx.beginPath();
    ctx.moveTo(split.x, split.y); ctx.lineTo(frontWheelX, wheelY);
    ctx.stroke();
    ctx.strokeStyle = "#2b2b2b";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(topX - 1.4, topY); ctx.lineTo(topX + 1.6, topY);
    ctx.stroke();
  } else {
    // Rigid fork with a gentle forward rake to the dropout
    ctx.strokeStyle = c.frame;
    ctx.lineWidth = tube * 0.85;
    ctx.beginPath();
    ctx.moveTo(headX + 0.6, headY + 5);
    ctx.quadraticCurveTo(headX + (frontWheelX - headX) * 0.55, headY + (wheelY - headY) * 0.75, frontWheelX, wheelY);
    ctx.stroke();
  }

  // Chainring: hollow ring with a spider
  ctx.strokeStyle = "#4a4d52";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(bbX, bbY, 3.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#8d9297";
  ctx.beginPath();
  ctx.arc(bbX, bbY, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Silver seat post + shaped saddle (narrow nose forward)
  ctx.strokeStyle = "#a4a9ae";
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(seatX, seatY); ctx.lineTo(seatX - 0.8, seatY - 3.2); ctx.stroke();
  ctx.fillStyle = c.wheel;
  ctx.beginPath();
  ctx.moveTo(seatX - 6, seatY - 5.2);
  ctx.quadraticCurveTo(seatX - 2, seatY - 6.2, seatX + 4.5, seatY - 4.4);
  ctx.lineTo(seatX + 4.2, seatY - 3.4);
  ctx.quadraticCurveTo(seatX - 1, seatY - 3.6, seatX - 5.6, seatY - 3);
  ctx.closePath();
  ctx.fill();

  // Crank arms + pedals
  const pedalLX = bbX - 7;
  const pedalRX = bbX + 7;
  const pedalY = bbY;
  ctx.strokeStyle = "#3d4045";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pedalLX, pedalY); ctx.lineTo(pedalRX, pedalY);
  ctx.stroke();
  ctx.fillStyle = "#2c2e31";
  ctx.fillRect(pedalLX - 2.4, pedalY - 0.9, 4.8, 1.8);
  ctx.fillRect(pedalRX - 2.4, pedalY - 0.9, 4.8, 1.8);

  ctx.restore();
}

export function drawHandlebars(
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
    ctx.lineWidth = 1.6;
    // Stem
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(stemTopX, stemTopY);
    ctx.stroke();
    // Drops: curved bar that goes forward then down (lowered)
    ctx.lineWidth = 1.5;
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
    // Wide flat bar with rubber grips
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(stemTopX - 6, stemTopY);
    ctx.lineTo(stemTopX + 4, stemTopY);
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(stemTopX - 6, stemTopY);
    ctx.lineTo(stemTopX - 3.5, stemTopY);
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
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(stemTopX - 3, stemTopY);
  ctx.lineTo(stemTopX + 2, stemTopY);
  ctx.stroke();
  // Rubber grip
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(stemTopX - 3.2, stemTopY);
  ctx.lineTo(stemTopX - 1, stemTopY);
  ctx.stroke();
  return { gripX: stemTopX - 2, gripY: stemTopY };
}

export function getWheelParams(skin: SkinDefinition): {
  spokeCount: number; spokeWidth: number; spokeColor?: string; knobby: boolean; tyreWidth: number;
} {
  let spokeCount = 12, spokeWidth = 0.5, spokeColor: string | undefined, knobby = false, tyreWidth = 2.3;
  switch (skin.bikeStyle) {
    case "racing":  spokeCount = 16; spokeWidth = 0.4; tyreWidth = 1.7; break;
    case "mtb":     knobby = true; tyreWidth = 2.8; break;
    case "cruiser": spokeCount = 3; spokeWidth = 3; spokeColor = skin.colors.frame; tyreWidth = 2.6; break;
    case "fixie":   spokeCount = 4; spokeWidth = 1.6; spokeColor = skin.colors.frame; tyreWidth = 1.9; break;
    case "fatTire": spokeCount = 10; spokeColor = "#8f9499"; tyreWidth = 4.2; break;
  }
  return { spokeCount, spokeWidth, spokeColor, knobby, tyreWidth };
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
  const { spokeCount, spokeWidth, spokeColor, knobby, tyreWidth } = getWheelParams(skin);
  drawWheel(ctx, g.rearWheelX, g.wheelY, g.wheelR, wheelRotation, c.wheel, glowWheels, spokeCount, spokeWidth, spokeColor, knobby, tyreWidth);
  drawWheel(ctx, g.frontWheelX, g.wheelY, g.wheelR, wheelRotation, c.wheel, glowWheels, spokeCount, spokeWidth, spokeColor, knobby, tyreWidth);

  // ── Frame ──
  drawBikeFrame(ctx, skin, g);

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
