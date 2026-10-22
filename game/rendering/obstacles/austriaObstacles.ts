/**
 * Snowy Austria obstacle draw functions. Each draws into its spec box (x, y, w, h) from
 * OBSTACLE_SPECS, standing on the box's bottom edge. Colours come from the biome palette
 * with built-in fallbacks, so obstacles still draw mid-transition. Movers face the way
 * they travel: freeriders and boarders ride right (with Edy), racers and scooters come left.
 */
import type { EnvironmentPalette } from "../../environments/types";

import { boxMapper, fillPoly, fillRoundRect, contactShadow, strokeLine, drawSprite, drawCachedText, cachedGradient, fillTransformed, type Pt } from "../drawHelpers";
import { AUSTRIA_OBSTACLE_COLORS } from "../../environments/obstacleColors";

// --- Snowman ---

/** Three-ball snowman with a black hat, carrot nose, red scarf and twig arms. */
export function drawSnowman(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const snow = palette.obstacle.snow ?? AUSTRIA_OBSTACLE_COLORS.snow;
  const shade = palette.obstacle.snowShadow ?? AUSTRIA_OBSTACLE_COLORS.snowShadow;
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Twig arms behind the middle ball.
  strokeLine(ctx, [P(0.3, 0.48), P(-0.12, 0.34), P(-0.2, 0.3)], "#6a4a30", 1.4);
  strokeLine(ctx, [P(-0.06, 0.37), P(-0.1, 0.26)], "#6a4a30", 1);
  strokeLine(ctx, [P(0.7, 0.48), P(1.1, 0.38), P(1.2, 0.4)], "#6a4a30", 1.4);
  strokeLine(ctx, [P(1.04, 0.4), P(1.1, 0.3)], "#6a4a30", 1);

  // Balls, bottom up, each shaded on its lower-left: one unit-radius gradient per
  // colour pair, scaled onto each ball, rather than a radial gradient per ball per frame.
  const shading = cachedGradient(ctx, `snowball|${snow}|${shade}`, () => {
    const unit = ctx.createRadialGradient(0.35, -0.35, 0.2, 0, 0, 1);
    unit.addColorStop(0, snow);
    unit.addColorStop(1, shade);
    return unit;
  });
  const ball = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    fillTransformed(ctx, shading, cx, cy, r, r);
  };
  ball(x + w * 0.5, y + h * 0.78, w * 0.4);
  ball(x + w * 0.5, y + h * 0.47, w * 0.3);
  ball(x + w * 0.5, y + h * 0.24, w * 0.22);

  // Scarf: wrap plus a tail blowing left.
  ctx.fillStyle = "#c8102e";
  ctx.fillRect(x + w * 0.3, y + h * 0.33, w * 0.4, h * 0.05);
  fillPoly(ctx, [P(0.34, 0.36), P(0.24, 0.5), P(0.32, 0.52), P(0.42, 0.37)], "#c8102e");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + w * 0.26, y + h * 0.47, w * 0.08, h * 0.015);

  // Coal buttons and eyes.
  ctx.fillStyle = "#2a2a2e";
  for (const fy of [0.45, 0.53, 0.68]) {
    ctx.beginPath();
    ctx.arc(x + w * 0.52, y + h * fy, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const fx of [0.46, 0.6]) {
    ctx.beginPath();
    ctx.arc(x + w * fx, y + h * 0.21, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Carrot nose pointing right.
  fillPoly(ctx, [P(0.6, 0.24), P(0.86, 0.27), P(0.6, 0.28)], "#ee7a22");

  // Top hat with a red band.
  ctx.fillStyle = "#2a2a2e";
  ctx.fillRect(x + w * 0.27, y + h * 0.12, w * 0.46, h * 0.025);
  ctx.fillRect(x + w * 0.35, y - h * 0.02, w * 0.3, h * 0.145);
  ctx.fillStyle = "#c8102e";
  ctx.fillRect(x + w * 0.35, y + h * 0.09, w * 0.3, h * 0.025);

  ctx.restore();
}

// --- Frozen lake ---

/** The four tilted ice plates as box fractions: base-left, top-left, top-right, base-right. */
const ICE_PLATES: ReadonlyArray<ReadonlyArray<Pt>> = [
  [[0.14, 0.95], [0.2, 0.42], [0.32, 0.3], [0.36, 0.95]],
  [[0.3, 0.95], [0.38, 0.12], [0.5, 0.02], [0.54, 0.95]],
  [[0.48, 0.95], [0.6, 0.18], [0.7, 0.26], [0.68, 0.95]],
  [[0.64, 0.95], [0.74, 0.44], [0.86, 0.5], [0.84, 0.95]],
];

/** A frozen pond heaved into a low ridge of tilted ice plates, banked with snow at both ends. */
export function drawFrozenLake(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const snow = palette.obstacle.snow ?? AUSTRIA_OBSTACLE_COLORS.snow;
  const shade = palette.obstacle.snowShadow ?? AUSTRIA_OBSTACLE_COLORS.snowShadow;
  const ice = palette.obstacle.ice ?? AUSTRIA_OBSTACLE_COLORS.ice;
  const iceHi = palette.obstacle.iceHighlight ?? AUSTRIA_OBSTACLE_COLORS.iceHighlight;
  const P = boxMapper(x, y, w, h);

  ctx.save();

  // Pond surface: a flat sheet of ice along the road.
  ctx.fillStyle = ice;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.9, w * 0.5, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tilted ice plates forming the ridge, drawn in the box's local space so each
  // plate's top-left-to-base-right gradient can be built once per look and size.
  ctx.save();
  ctx.translate(x, y);
  const L = boxMapper(0, 0, w, h);
  for (let i = 0; i < ICE_PLATES.length; i++) {
    const f = ICE_PLATES[i];
    const p0 = L(f[0][0], f[0][1]);
    const p1 = L(f[1][0], f[1][1]);
    const p2 = L(f[2][0], f[2][1]);
    const p3 = L(f[3][0], f[3][1]);
    const g = cachedGradient(ctx, `ice|${i}|${iceHi}|${ice}|${w}|${h}`, () => {
      const plate = ctx.createLinearGradient(p1[0], p1[1], p3[0], p3[1]);
      plate.addColorStop(0, iceHi);
      plate.addColorStop(1, ice);
      return plate;
    });
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p3[0], p3[1]);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // Bright top edge and a crack across the plate.
    strokeLine(ctx, [p1, p2], "#ffffff", 1.2);
    strokeLine(ctx, [
      [p1[0] + 2, p1[1] + 4 + i],
      [(p1[0] + p3[0]) / 2, (p1[1] + p3[1]) / 2],
      [p3[0] - 2, p3[1] - 3],
    ], "rgba(70,130,170,0.45)", 0.7);
  }
  ctx.restore();

  // Snow banks at both ends and a dusting on the plate tops.
  const bank = (cx: number, rx: number, ry: number) => {
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.ellipse(cx, y + h, rx, ry, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.ellipse(cx - 1, y + h - 1, rx * 0.9, ry * 0.85, 0, Math.PI, 0);
    ctx.fill();
  };
  bank(x + w * 0.08, w * 0.1, h * 0.55);
  bank(x + w * 0.92, w * 0.1, h * 0.5);
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.ellipse(...P(0.44, 0.08), w * 0.05, h * 0.06, -0.3, 0, Math.PI * 2);
  ctx.ellipse(...P(0.65, 0.22), w * 0.04, h * 0.05, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- Red deer stag ---

/** Alpine red deer stag in profile facing left, with a full spread of antlers. */
export function drawRedDeer(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const body = palette.obstacle.redDeer ?? AUSTRIA_OBSTACLE_COLORS.redDeer;
  const dark = palette.obstacle.redDeerDark ?? AUSTRIA_OBSTACLE_COLORS.redDeerDark;
  const antler = palette.obstacle.antler ?? AUSTRIA_OBSTACLE_COLORS.antler;
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.55, y + h, w * 0.36);

  // Far legs.
  strokeLine(ctx, [P(0.36, 0.66), P(0.35, 0.83), P(0.36, 0.99)], dark, 2.2);
  strokeLine(ctx, [P(0.78, 0.64), P(0.84, 0.8), P(0.8, 0.99)], dark, 2.4);

  // Antlers: two beams sweeping up and back with tines.
  const beam = (base: Pt, tip: Pt, ctrl: Pt, tines: Array<[Pt, Pt]>, lw: number) => {
    ctx.strokeStyle = antler;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(...base);
    ctx.quadraticCurveTo(...ctrl, ...tip);
    for (const [a, b] of tines) {
      ctx.moveTo(...a);
      ctx.lineTo(...b);
    }
    ctx.stroke();
  };
  beam(P(0.24, 0.26), P(0.46, 0.0), P(0.3, 0.04), [
    [P(0.26, 0.18), P(0.14, 0.12)],
    [P(0.3, 0.09), P(0.24, -0.02)],
    [P(0.38, 0.03), P(0.36, -0.06)],
  ], 1.6);
  beam(P(0.2, 0.26), P(0.36, 0.02), P(0.18, 0.08), [
    [P(0.2, 0.17), P(0.08, 0.14)],
    [P(0.23, 0.08), P(0.16, 0.0)],
  ], 1.3);

  // Body, neck with mane, head.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(...P(0.3, 0.68));
  ctx.bezierCurveTo(...P(0.24, 0.58), ...P(0.26, 0.46), ...P(0.24, 0.38));
  ctx.lineTo(...P(0.18, 0.3));
  ctx.quadraticCurveTo(...P(0.1, 0.27), ...P(0.02, 0.35));
  ctx.quadraticCurveTo(...P(-0.01, 0.39), ...P(0.04, 0.41));
  ctx.lineTo(...P(0.14, 0.42));
  ctx.quadraticCurveTo(...P(0.2, 0.44), ...P(0.24, 0.5));
  ctx.lineTo(...P(0.3, 0.44));
  ctx.bezierCurveTo(...P(0.48, 0.4), ...P(0.74, 0.4), ...P(0.86, 0.45));
  ctx.bezierCurveTo(...P(0.95, 0.5), ...P(0.94, 0.64), ...P(0.84, 0.68));
  ctx.bezierCurveTo(...P(0.66, 0.72), ...P(0.44, 0.72), ...P(0.3, 0.68));
  ctx.closePath();
  ctx.fill();

  // Darker mane on the neck, pale rump patch.
  fillPoly(ctx, [P(0.24, 0.38), P(0.33, 0.43), P(0.32, 0.6), P(0.25, 0.56)], dark);
  ctx.fillStyle = "#e8d8bc";
  ctx.beginPath();
  ctx.ellipse(...P(0.9, 0.52), w * 0.04, h * 0.07, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Near legs over the body.
  strokeLine(ctx, [P(0.3, 0.66), P(0.29, 0.84), P(0.3, 0.99)], body, 2.6);
  strokeLine(ctx, [P(0.84, 0.62), P(0.89, 0.8), P(0.86, 0.99)], body, 2.8);
  ctx.fillStyle = "#2a2018";
  for (const fx of [0.3, 0.36, 0.8, 0.86]) ctx.fillRect(x + w * fx - 1.2, y + h * 0.975, 2.4, 1.6);

  // Ear, eye, nose.
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(...P(0.2, 0.27), w * 0.035, h * 0.03, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1e1610";
  ctx.beginPath();
  ctx.arc(...P(0.12, 0.33), 0.8, 0, Math.PI * 2);
  ctx.arc(...P(0.02, 0.38), 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- Stiegl beer crates ---

/** Crate colours and whether bottle necks show, read by drawCrateArt while its sprite is built. */
const crateSpec = { red: "", dark: "", withBottles: false };

/**
 * One red beer crate seen from the side: rim, hand hole and a white label band, with
 * brown bottle necks showing when it is the top of a stack. A crate wall draws sixteen
 * of these (with text) per frame, so each look is rasterised once (see drawCrateArt).
 */
function drawCrate(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, cw: number, ch: number,
  palette: EnvironmentPalette,
  withBottles: boolean
) {
  crateSpec.red = palette.obstacle.beerCrate ?? AUSTRIA_OBSTACLE_COLORS.beerCrate;
  crateSpec.dark = palette.obstacle.beerCrateDark ?? AUSTRIA_OBSTACLE_COLORS.beerCrateDark;
  crateSpec.withBottles = withBottles;
  // Necks poke up to 0.32 of the crate height above its box
  const pad = withBottles ? Math.ceil(ch * 0.32) + 1 : 0;
  drawSprite(ctx, `crate|${crateSpec.red}|${crateSpec.dark}|${withBottles ? 1 : 0}`, cx, cy, cw, ch, drawCrateArt, { pad });
}

/** The crate art in local space (crate box at the origin), from the current crateSpec. */
function drawCrateArt(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const { red, dark, withBottles } = crateSpec;
  const cx = 0;
  const cy = 0;

  if (withBottles) {
    const necks = Math.max(3, Math.round(cw / 6));
    for (let i = 0; i < necks; i++) {
      const nx = cx + cw * ((i + 0.5) / necks) - 1.2;
      ctx.fillStyle = "#5a3416";
      ctx.fillRect(nx, cy - ch * 0.28, 2.4, ch * 0.32);
      ctx.fillStyle = "#e0b040";
      ctx.fillRect(nx - 0.2, cy - ch * 0.32, 2.8, 1.4);
    }
  }

  ctx.fillStyle = red;
  ctx.fillRect(cx, cy, cw, ch);
  // Top and bottom rims, side ribs.
  ctx.fillStyle = dark;
  ctx.fillRect(cx, cy, cw, ch * 0.14);
  ctx.fillRect(cx, cy + ch * 0.88, cw, ch * 0.12);
  ctx.fillRect(cx, cy, cw * 0.06, ch);
  ctx.fillRect(cx + cw * 0.94, cy, cw * 0.06, ch);
  // Hand hole near the top.
  ctx.fillStyle = "#4a0612";
  ctx.beginPath();
  ctx.ellipse(cx + cw * 0.5, cy + ch * 0.28, cw * 0.14, ch * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // White label band with the brand name.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx + cw * 0.14, cy + ch * 0.46, cw * 0.72, ch * 0.3);
  ctx.fillStyle = red;
  ctx.font = `bold ${Math.max(4, Math.round(ch * 0.26))}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("STIEGL", cx + cw * 0.5, cy + ch * 0.62, cw * 0.66);
  // Light catch along the top rim.
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(cx + cw * 0.06, cy + ch * 0.14, cw * 0.88, 1);
}

/** A slightly wonky stack of three Stiegl crates. */
export function drawBeerCrates(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const ch = h / 3;
  const offsets = [0, 1.5, -1];
  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.6);
  for (let i = 0; i < 3; i++) {
    const cy = y + h - ch * (i + 1);
    drawCrate(ctx, x + offsets[i], cy, w, ch - 0.5, palette, i === 2);
  }
  ctx.restore();
}

/** A rideable wall of crates, four wide and four high, bottles along the top. */
export function drawBeerCrateWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const cols = 4;
  const rows = 4;
  const neckRoom = 3; // bottle necks poke up into this band so the top stays at y
  const cw = w / cols;
  const ch = (h - neckRoom) / rows;
  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.55);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cy = y + h - ch * (r + 1);
      drawCrate(ctx, x + c * cw + 0.5, cy, cw - 1, ch - 0.5, palette, r === rows - 1);
    }
  }
  ctx.restore();
}

// --- Pistenbully snow cat ---

/**
 * A Pistenbully grooming machine facing left: dozer blade at the front, red cab and
 * engine deck on wide tracks, tiller at the back. The roof rack runs the full length,
 * so the whole top is the rideable surface.
 */
export function drawSnowCat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const red = palette.obstacle.snowCat ?? AUSTRIA_OBSTACLE_COLORS.snowCat;
  const dark = palette.obstacle.snowCatDark ?? AUSTRIA_OBSTACLE_COLORS.snowCatDark;
  const track = palette.obstacle.snowCatTrack ?? AUSTRIA_OBSTACLE_COLORS.snowCatTrack;
  const snow = palette.obstacle.snow ?? AUSTRIA_OBSTACLE_COLORS.snow;
  const glass = "#2a3c4c";
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Tiller at the rear, leaving fresh corduroy.
  fillPoly(ctx, [P(0.9, 0.7), P(1.0, 0.76), P(1.0, 0.98), P(0.9, 0.98)], "#4a4e54");
  ctx.strokeStyle = "#8a9098";
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w * (0.915 + i * 0.022), y + h * 0.78);
    ctx.lineTo(x + w * (0.915 + i * 0.022), y + h * 0.96);
    ctx.stroke();
  }

  // Tracks with road wheels and tread teeth.
  const tx = x + w * 0.1;
  const tw = w * 0.8;
  const ty = y + h * 0.7;
  const th = h * 0.3;
  fillRoundRect(ctx, tx, ty, tw, th, th / 2, track);
  ctx.fillStyle = "#1a1c1e";
  for (let i = 0; i < 18; i++) {
    ctx.fillRect(tx + th * 0.4 + i * ((tw - th * 0.8) / 17) - 1, ty + th - 2, 2, 2);
  }
  ctx.fillStyle = "#6a7078";
  for (let i = 0; i < 6; i++) {
    const wx = tx + th * 0.5 + i * ((tw - th) / 5);
    ctx.beginPath();
    ctx.arc(wx, ty + th * 0.5, th * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#3a3e44";
  for (let i = 0; i < 6; i++) {
    const wx = tx + th * 0.5 + i * ((tw - th) / 5);
    ctx.beginPath();
    ctx.arc(wx, ty + th * 0.5, th * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chassis.
  ctx.fillStyle = red;
  ctx.fillRect(x + w * 0.07, y + h * 0.52, w * 0.87, h * 0.2);
  ctx.fillStyle = dark;
  ctx.fillRect(x + w * 0.07, y + h * 0.66, w * 0.87, h * 0.06);

  // Engine deck behind the cab.
  fillPoly(ctx, [P(0.58, 0.32), P(0.9, 0.36), P(0.94, 0.52), P(0.58, 0.52)], red);
  ctx.fillStyle = dark;
  for (let i = 0; i < 5; i++) ctx.fillRect(x + w * (0.66 + i * 0.045), y + h * 0.4, w * 0.02, h * 0.08);

  // Cab: big glazed box at the front.
  fillPoly(ctx, [P(0.12, 0.06), P(0.58, 0.06), P(0.6, 0.54), P(0.07, 0.54), P(0.08, 0.2)], red);
  // Windows: windscreen raked at the front, then two side panes.
  fillPoly(ctx, [P(0.13, 0.12), P(0.24, 0.12), P(0.24, 0.36), P(0.1, 0.36), P(0.11, 0.22)], glass);
  ctx.fillStyle = glass;
  ctx.fillRect(x + w * 0.27, y + h * 0.12, w * 0.14, h * 0.24);
  ctx.fillRect(x + w * 0.43, y + h * 0.12, w * 0.12, h * 0.24);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  fillPoly(ctx, [P(0.28, 0.12), P(0.33, 0.12), P(0.29, 0.36), P(0.27, 0.36)], "rgba(255,255,255,0.22)");
  fillPoly(ctx, [P(0.44, 0.12), P(0.48, 0.12), P(0.45, 0.36), P(0.43, 0.36)], "rgba(255,255,255,0.18)");
  // Door line and brand lettering.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + w * 0.27, y + h * 0.1, w * 0.15, h * 0.42);
  drawCachedText(ctx, {
    text: "PistenBully",
    font: `bold ${Math.max(5, Math.round(h * 0.09))}px Arial, sans-serif`,
    color: "#ffffff",
    align: "left",
    maxWidth: w * 0.46,
  }, x + w * 0.44, y + h * 0.6);

  // Roof rack the full length, on posts down to the cab and deck, with amber beacons.
  ctx.fillStyle = "#3a3e44";
  ctx.fillRect(x + w * 0.06, y, w * 0.92, h * 0.05);
  for (const fx of [0.14, 0.56, 0.76, 0.95]) {
    const postTop = y + h * 0.05;
    const postBottom = fx <= 0.56 ? y + h * 0.06 : y + h * (0.32 + (fx - 0.58) * 0.12);
    ctx.fillRect(x + w * fx - 1, postTop, 2, Math.max(1, postBottom - postTop));
  }
  ctx.fillStyle = "#f5a020";
  ctx.fillRect(x + w * 0.2, y + h * 0.05, w * 0.04, h * 0.03);
  ctx.fillRect(x + w * 0.48, y + h * 0.05, w * 0.04, h * 0.03);
  // Snow lying on the rack.
  ctx.fillStyle = snow;
  ctx.fillRect(x + w * 0.3, y - 1, w * 0.18, 1.5);

  // Front blade on push arms: a tall curved shield with an orange top edge, snow heaped in front.
  strokeLine(ctx, [P(0.12, 0.62), P(0.05, 0.66)], "#4a4e54", 2.6);
  strokeLine(ctx, [P(0.12, 0.8), P(0.05, 0.84)], "#4a4e54", 2.6);
  ctx.fillStyle = "#c8ccd2";
  ctx.beginPath();
  ctx.moveTo(...P(0.065, 0.4));
  ctx.lineTo(...P(0.075, 0.42));
  ctx.quadraticCurveTo(...P(0.045, 0.7), ...P(0.075, 0.98));
  ctx.lineTo(...P(-0.005, 0.98));
  ctx.quadraticCurveTo(...P(0.035, 0.7), ...P(0.0, 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x + w * 0.012, y + h * 0.5, w * 0.012, h * 0.4);
  ctx.fillStyle = "#f5a020";
  ctx.fillRect(x - w * 0.002, y + h * 0.4, w * 0.08, h * 0.04);
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.ellipse(x - 1, y + h, w * 0.04, h * 0.2, 0, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

// --- Snow kicker ---

/** Segments along the kicker's take-off curve. */
const KICKER_STEPS = 16;

/** Kicker bodies per size, in local space (take-off starts at the origin's base). */
const kickerBodies = new Map<string, Path2D>();

/**
 * The kicker silhouette for a box size: the curved take-off, then the knuckle rolling
 * down behind the lip. Sizes come from OBSTACLE_SPECS, so there are only a few.
 */
function kickerBody(w: number, h: number): Path2D {
  const key = `${w}|${h}`;
  let body = kickerBodies.get(key);
  if (body) return body;
  body = new Path2D();
  body.moveTo(-4, h);
  for (let i = 0; i <= KICKER_STEPS; i++) {
    const t = i / KICKER_STEPS;
    body.lineTo(t * w, h - t * t * h);
  }
  body.quadraticCurveTo(w + 6, -1, w + 14, h);
  body.closePath();
  kickerBodies.set(key, body);
  return body;
}

/**
 * A freestyle kicker shaped out of snow. The surface follows the curved ramp's profile
 * (height grows with t²) so it matches the physics; the knuckle drops away behind the lip.
 * Drawn in the box's local space so the body path and its gradient are built once per size.
 */
export function drawSnowKicker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const snow = palette.obstacle.snow ?? AUSTRIA_OBSTACLE_COLORS.snow;
  const shade = palette.obstacle.snowShadow ?? AUSTRIA_OBSTACLE_COLORS.snowShadow;
  const base = h;
  const steps = KICKER_STEPS;

  ctx.save();
  ctx.translate(x, y);

  const body = kickerBody(w, h);
  const g = cachedGradient(ctx, `kicker|${snow}|${shade}|${w}|${h}`, () => {
    const slope = ctx.createLinearGradient(0, 0, w, base);
    slope.addColorStop(0, snow);
    slope.addColorStop(1, shade);
    return slope;
  });
  ctx.fillStyle = g;
  ctx.fill(body);

  // Groomed lines across the take-off.
  ctx.save();
  ctx.clip(body);
  ctx.strokeStyle = "rgba(140,170,200,0.35)";
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const sx = t * w;
    ctx.beginPath();
    ctx.moveTo(sx, base - t * t * h);
    ctx.lineTo(sx + 6, base);
    ctx.stroke();
  }
  // Shadowed knuckle.
  ctx.fillStyle = "rgba(110,140,180,0.25)";
  ctx.fillRect(w, -2, 16, h + 2);
  ctx.restore();

  // Bright lip edge.
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = steps / 2; i <= steps; i++) {
    const t = i / steps;
    if (i === steps / 2) ctx.moveTo(t * w, base - t * t * h);
    else ctx.lineTo(t * w, base - t * t * h);
  }
  ctx.stroke();

  // Orange marker poles either side of the lip.
  strokeLine(ctx, [[w + 2, base - h - 2], [w + 2, base - h - 14]], "#f07a1a", 1.4);
  ctx.fillStyle = "#f07a1a";
  ctx.fillRect(w + 2, base - h - 14, 5, 3);

  ctx.restore();
}

// --- Freeride skier ---

/** Freerider cruising right: baggy jacket and pants, beanie, goggles, twin-tip skis. */
export function drawFreerideSkier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const jacket = "#e2a32e";
  const jacketDark = "#b07a1c";
  const pants = "#4e6a4a";
  const pantsDark = "#3a5038";
  const skin = "#e0b896";
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Twin-tip skis: both ends turned up.
  ctx.strokeStyle = "#2a8ac8";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(...P(0.0, 0.86));
  ctx.quadraticCurveTo(...P(0.06, 0.97), ...P(0.2, 0.97));
  ctx.lineTo(...P(0.8, 0.97));
  ctx.quadraticCurveTo(...P(0.94, 0.97), ...P(1.0, 0.86));
  ctx.stroke();

  // Pole behind, planted in the snow.
  strokeLine(ctx, [P(0.38, 0.5), P(0.08, 0.95)], "#3a3a3e", 1);

  // Back leg and baggy pants.
  fillPoly(ctx, [P(0.36, 0.52), P(0.56, 0.54), P(0.62, 0.72), P(0.5, 0.94), P(0.36, 0.94), P(0.42, 0.74)], pantsDark);
  fillPoly(ctx, [P(0.42, 0.5), P(0.64, 0.52), P(0.76, 0.7), P(0.66, 0.94), P(0.52, 0.94), P(0.58, 0.74), P(0.44, 0.66)], pants);
  ctx.fillStyle = "#2a2a2e";
  ctx.fillRect(x + w * 0.38, y + h * 0.9, w * 0.14, h * 0.06);
  ctx.fillRect(x + w * 0.54, y + h * 0.9, w * 0.14, h * 0.06);

  // Oversized jacket down to the thighs, hood bunched behind the neck.
  fillPoly(ctx, [P(0.34, 0.22), P(0.6, 0.2), P(0.7, 0.42), P(0.68, 0.6), P(0.34, 0.62), P(0.28, 0.42)], jacket);
  fillPoly(ctx, [P(0.3, 0.2), P(0.42, 0.18), P(0.4, 0.3), P(0.28, 0.3)], jacketDark);
  ctx.fillStyle = jacketDark;
  ctx.fillRect(x + w * 0.34, y + h * 0.55, w * 0.34, h * 0.03);

  // Front arm holding the pole forward.
  strokeLine(ctx, [P(0.56, 0.26), P(0.74, 0.4), P(0.84, 0.44)], jacket, 3.6);
  strokeLine(ctx, [P(0.86, 0.44), P(0.78, 0.95)], "#3a3a3e", 1);
  ctx.fillStyle = "#2a2a2e";
  ctx.beginPath();
  ctx.arc(...P(0.86, 0.44), 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Head: face, beanie with a pom, goggles.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(...P(0.52, 0.13), w * 0.11, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b3a6a";
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.11, w * 0.12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x + w * 0.38, y + h * 0.1, w * 0.24, h * 0.03);
  ctx.fillStyle = "#e8e8ee";
  ctx.beginPath();
  ctx.arc(x + w * 0.46, y + h * 0.01, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f08a2a";
  ctx.fillRect(x + w * 0.54, y + h * 0.125, w * 0.11, h * 0.05);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(x + w * 0.56, y + h * 0.13, w * 0.03, h * 0.015);

  ctx.restore();
}

// --- Race skier ---

/** Downhill racer in a red suit, tucked low and coming left fast, with a spray of snow behind. */
export function drawRaceSkier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, palette: EnvironmentPalette) {
  const suit = palette.obstacle.skiRacer ?? AUSTRIA_OBSTACLE_COLORS.skiRacer;
  const suitDark = palette.obstacle.skiRacerDark ?? AUSTRIA_OBSTACLE_COLORS.skiRacerDark;
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Snow spray kicked up behind the skis, and speed streaks.
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  for (const [fx, fy, r] of [[0.96, 0.86, 2.4], [1.04, 0.8, 1.8], [1.1, 0.74, 1.2], [1.0, 0.72, 1.4]] as const) {
    ctx.beginPath();
    ctx.arc(...P(fx, fy), r, 0, Math.PI * 2);
    ctx.fill();
  }
  strokeLine(ctx, [P(1.02, 0.4), P(1.22, 0.4)], "rgba(255,255,255,0.6)", 1);
  strokeLine(ctx, [P(1.0, 0.56), P(1.16, 0.56)], "rgba(255,255,255,0.5)", 1);

  // Long race skis, tip curled at the front (left).
  ctx.strokeStyle = "#1e1e24";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(...P(0.0, 0.84));
  ctx.quadraticCurveTo(...P(0.03, 0.97), ...P(0.14, 0.97));
  ctx.lineTo(...P(0.98, 0.97));
  ctx.stroke();

  // Poles tucked under the arms, pointing back.
  strokeLine(ctx, [P(0.16, 0.52), P(0.96, 0.32)], "#9aa0a8", 1);

  // Legs: shins forward to the knees, thighs back to the hips.
  strokeLine(ctx, [P(0.58, 0.92), P(0.38, 0.66), P(0.66, 0.5)], suitDark, 4);
  strokeLine(ctx, [P(0.62, 0.92), P(0.44, 0.68), P(0.72, 0.5)], suit, 4.4);
  ctx.fillStyle = "#1e1e24";
  ctx.fillRect(x + w * 0.54, y + h * 0.86, w * 0.14, h * 0.1);

  // Torso flat and forward, white stripe along the back.
  fillPoly(ctx, [P(0.74, 0.42), P(0.7, 0.58), P(0.3, 0.52), P(0.24, 0.38), P(0.4, 0.3)], suit);
  strokeLine(ctx, [P(0.7, 0.44), P(0.38, 0.33)], "#ffffff", 1.4);

  // Arms forward, hands together in front of the chin.
  strokeLine(ctx, [P(0.32, 0.38), P(0.2, 0.5), P(0.13, 0.5)], suitDark, 3);
  ctx.fillStyle = "#1e1e24";
  ctx.beginPath();
  ctx.arc(...P(0.13, 0.5), 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Race helmet in team red with a white stripe and a mirrored visor.
  ctx.fillStyle = suit;
  ctx.beginPath();
  ctx.ellipse(...P(0.19, 0.3), w * 0.1, h * 0.15, -0.2, 0, Math.PI * 2);
  ctx.fill();
  strokeLine(ctx, [P(0.12, 0.2), P(0.27, 0.24)], "#ffffff", 1.2);
  fillPoly(ctx, [P(0.085, 0.27), P(0.17, 0.26), P(0.17, 0.37), P(0.095, 0.38)], "#e8a020");
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(x + w * 0.11, y + h * 0.28, w * 0.03, h * 0.02);

  ctx.restore();
}

// --- Snowboarder ---

/** Snowboarder riding right, sideways stance, knees bent, arms out for balance. */
export function drawSnowboarder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const hoodie = "#7a4ab0";
  const hoodieDark = "#5a3488";
  const pants = "#2e3a4a";
  const skin = "#d8a882";
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Board with both ends upturned and a graphic stripe.
  ctx.fillStyle = "#16a8a0";
  ctx.beginPath();
  ctx.moveTo(...P(0.02, 0.88));
  ctx.quadraticCurveTo(...P(0.06, 0.99), ...P(0.18, 0.99));
  ctx.lineTo(...P(0.82, 0.99));
  ctx.quadraticCurveTo(...P(0.94, 0.99), ...P(0.98, 0.88));
  ctx.quadraticCurveTo(...P(0.92, 0.94), ...P(0.82, 0.94));
  ctx.lineTo(...P(0.18, 0.94));
  ctx.quadraticCurveTo(...P(0.08, 0.94), ...P(0.02, 0.88));
  ctx.fill();
  ctx.fillStyle = "#f2d040";
  ctx.fillRect(x + w * 0.42, y + h * 0.94, w * 0.16, h * 0.05);

  // Legs bent, feet on the bindings at either end.
  strokeLine(ctx, [P(0.42, 0.56), P(0.26, 0.72), P(0.28, 0.92)], pants, 4.6);
  strokeLine(ctx, [P(0.58, 0.56), P(0.72, 0.72), P(0.7, 0.92)], pants, 4.6);
  ctx.fillStyle = "#1e1e24";
  ctx.fillRect(x + w * 0.2, y + h * 0.88, w * 0.16, h * 0.06);
  ctx.fillRect(x + w * 0.62, y + h * 0.88, w * 0.16, h * 0.06);

  // Baggy hoodie, front pocket.
  fillPoly(ctx, [P(0.36, 0.22), P(0.64, 0.22), P(0.7, 0.58), P(0.3, 0.58)], hoodie);
  ctx.fillStyle = hoodieDark;
  ctx.fillRect(x + w * 0.4, y + h * 0.44, w * 0.2, h * 0.07);

  // Arms out for balance.
  strokeLine(ctx, [P(0.38, 0.26), P(0.18, 0.36), P(0.04, 0.32)], hoodie, 3.4);
  strokeLine(ctx, [P(0.62, 0.26), P(0.82, 0.3), P(0.96, 0.24)], hoodie, 3.4);
  ctx.fillStyle = "#1e1e24";
  ctx.beginPath();
  ctx.arc(...P(0.03, 0.32), 1.6, 0, Math.PI * 2);
  ctx.arc(...P(0.97, 0.24), 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Head turned right: face, beanie, goggles pushed onto the beanie.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(...P(0.52, 0.13), w * 0.11, h * 0.085, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e84a3a";
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.1, w * 0.12, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#1e1e24";
  ctx.fillRect(x + w * 0.38, y + h * 0.06, w * 0.24, h * 0.03);
  ctx.fillStyle = "#56d0f0";
  ctx.fillRect(x + w * 0.52, y + h * 0.055, w * 0.1, h * 0.04);
  ctx.fillStyle = "#2a2018";
  ctx.beginPath();
  ctx.arc(...P(0.58, 0.14), 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- Snow scooter ---

/** Snowmobile coming left: front ski, raked windscreen, rider in a full-face helmet, rear track. */
export function drawSnowScooter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const body = "#f0c020";
  const bodyDark = "#c09010";
  const black = "#1e2024";
  const P = boxMapper(x, y, w, h);

  ctx.save();
  contactShadow(ctx, x + w * 0.5, y + h, w * 0.5);

  // Snow plume thrown out behind the track.
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const [fx, fy, r] of [[1.0, 0.86, 3], [1.08, 0.78, 2.4], [1.14, 0.7, 1.6]] as const) {
    ctx.beginPath();
    ctx.arc(...P(fx, fy), r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rear track unit.
  fillRoundRect(ctx, x + w * 0.42, y + h * 0.76, w * 0.56, h * 0.22, h * 0.1, black);
  ctx.fillStyle = "#5a5e66";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x + w * (0.5 + i * 0.13), y + h * 0.87, h * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  // Front ski on its strut.
  strokeLine(ctx, [P(0.22, 0.7), P(0.18, 0.92)], black, 2);
  ctx.strokeStyle = black;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(...P(0.0, 0.86));
  ctx.quadraticCurveTo(...P(0.02, 0.97), ...P(0.1, 0.97));
  ctx.lineTo(...P(0.34, 0.97));
  ctx.stroke();

  // Hood and body: pointed nose at the front, running back under the seat.
  fillPoly(ctx, [P(0.02, 0.66), P(0.16, 0.5), P(0.4, 0.44), P(0.62, 0.56), P(0.98, 0.6), P(0.98, 0.78), P(0.12, 0.78)], body);
  fillPoly(ctx, [P(0.12, 0.72), P(0.98, 0.72), P(0.98, 0.78), P(0.12, 0.78)], bodyDark);
  strokeLine(ctx, [P(0.08, 0.64), P(0.38, 0.52)], black, 1.6);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(...P(0.08, 0.62), w * 0.025, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();

  // Windscreen.
  fillPoly(ctx, [P(0.3, 0.46), P(0.36, 0.24), P(0.42, 0.26), P(0.4, 0.46)], "rgba(150,200,230,0.7)");

  // Seat.
  fillRoundRect(ctx, x + w * 0.5, y + h * 0.5, w * 0.42, h * 0.1, h * 0.05, black);

  // Rider: dark suit, arm to the handlebar, full-face helmet.
  strokeLine(ctx, [P(0.62, 0.52), P(0.5, 0.66), P(0.36, 0.7)], "#2e3a5a", 4.6);
  fillPoly(ctx, [P(0.56, 0.18), P(0.72, 0.16), P(0.8, 0.54), P(0.58, 0.54)], "#2e3a5a");
  strokeLine(ctx, [P(0.6, 0.24), P(0.48, 0.36), P(0.4, 0.42)], "#2e3a5a", 3.4);
  strokeLine(ctx, [P(0.38, 0.42), P(0.44, 0.46)], black, 1.6);
  ctx.fillStyle = "#e84a3a";
  ctx.beginPath();
  ctx.arc(x + w * 0.62, y + h * 0.1, w * 0.085, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a2a3a";
  fillPoly(ctx, [P(0.54, 0.06), P(0.6, 0.06), P(0.6, 0.15), P(0.54, 0.14)], "#1a2a3a");

  ctx.restore();
}
