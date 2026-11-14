import { BackgroundLayer } from "../../types";
import type { EnvironmentPalette, BackgroundDrawFn, SkylinePass } from "../../environments/types";
import { getTotalLayerWidth } from "../../Background";
import type { ViewBounds } from "../../Camera";
import { decodePedestrianVariant, SKIN_TONES, HAIR_COLORS } from "../../environments/pedestrians";
import { cachedGradient, fillTransformed } from "../drawHelpers";
import { setSceneTimeMs } from "../sceneClock";

/** x fractions of a walking figure's two shoes. */
const SHOE_X = [-0.26, 0.22];

// --- Sky ---

function drawSky(ctx: CanvasRenderingContext2D, view: ViewBounds, groundY: number, palette: EnvironmentPalette) {
  // One unit gradient per colour pair (the pair steps through a biome blend), stretched to the ground
  const gradient = cachedGradient(ctx, `sky|${palette.sky}|${palette.skyBottom}`, () => {
    const unit = ctx.createLinearGradient(0, 0, 0, 1);
    unit.addColorStop(0, palette.sky);
    unit.addColorStop(1, palette.skyBottom);
    return unit;
  });
  // Gradient stays pinned to the unzoomed sky; above it (zoomed out) the top colour just continues
  ctx.beginPath();
  ctx.rect(view.left, view.top, view.right - view.left, groundY - view.top);
  fillTransformed(ctx, gradient, 0, 0, 1, groundY);
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

// --- Ground ---

function drawGround(ctx: CanvasRenderingContext2D, view: ViewBounds, groundY: number, offset: number, palette: EnvironmentPalette) {
  const w = view.right - view.left;

  // Grass verge — sits above the road, grounds the buildings
  ctx.fillStyle = palette.ground;
  ctx.fillRect(view.left, groundY - 22, w, 22);

  // Ground fill — stretches to the bottom of the view
  ctx.fillRect(view.left, groundY, w, view.bottom - groundY);

  // Road surface
  ctx.fillStyle = palette.road;
  ctx.fillRect(view.left, groundY, w, 20);

  // Dashed road markings. Dashes are measured from the path start, so shift the
  // offset by it to keep them fixed to the road while the view widens.
  ctx.strokeStyle = palette.roadLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 15]);
  ctx.lineDashOffset = offset + view.left;
  ctx.beginPath();
  ctx.moveTo(view.left, groundY + 10);
  ctx.lineTo(view.right, groundY + 10);
  ctx.stroke();
  ctx.setLineDash([]);
}

// --- Background layers ---

/** A cloud layer leaving with the previous biome, drawn at `alpha` while it fades out. */
export interface FadingCloudLayer {
  layer: BackgroundLayer;
  alpha: number;
}

/** Shared empty pass list, so a scene without skylines allocates nothing per frame. */
const NO_PASSES: readonly SkylinePass[] = [];

/** A wrapping layer is checked at its natural position and one layer-width either side. */
const WRAP_SIGNS = [0, 1, -1];

/** Everything drawBackground needs for one frame of scenery. */
export interface BackgroundScene {
  /** [clouds, buildings, road] — see createBackgroundLayers. */
  layers: BackgroundLayer[];
  canvasW: number;
  /** The world rectangle on screen; wider than the canvas while the big-air camera is zoomed out. */
  view: ViewBounds;
  groundY: number;
  palette: EnvironmentPalette;
  /** Building-layer element type → renderer. */
  drawers: Record<string, BackgroundDrawFn>;
  /** Far scenery bands behind the clouds, each with its fade. */
  skylines?: readonly SkylinePass[];
  /** Passes over the road (wet-road reflections), each with its fade. */
  roadOverlays?: readonly SkylinePass[];
  /** Opacity of the current cloud layer (below 1 while it fades in on a biome change). */
  cloudAlpha?: number;
  /** The previous biome's clouds while they fade out. */
  outgoingClouds?: FadingCloudLayer | null;
  /** Scene clock (engine time that stops while paused) for animated scenery. */
  nowMs?: number;
}

/**
 * Draws sky, parallax layers and road covering `scene.view`.
 * @example
 * drawBackground(ctx, { layers, canvasW, view, groundY, palette, drawers, nowMs });
 */
export function drawBackground(ctx: CanvasRenderingContext2D, scene: BackgroundScene) {
  const { layers, canvasW, view, groundY, palette, drawers } = scene;
  const skylines = scene.skylines ?? NO_PASSES;
  const roadOverlays = scene.roadOverlays ?? NO_PASSES;
  const cloudAlpha = scene.cloudAlpha ?? 1;
  const outgoingClouds = scene.outgoingClouds ?? null;
  setSceneTimeMs(scene.nowMs ?? 0);
  drawSky(ctx, view, groundY, palette);

  // Far scenery (mountain ranges) sits behind the clouds and scrolls with them
  for (const pass of skylines) {
    if (pass.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = pass.alpha;
    pass.draw(ctx, view, groundY, layers[0].offset, palette);
    ctx.restore();
  }

  // Layer 0: clouds (plus the previous biome's, fading out). Coloured from the palette,
  // so they follow its colour blend across a biome change.
  if (outgoingClouds) drawCloudLayer(ctx, outgoingClouds.layer, canvasW, view, palette.cloud, outgoingClouds.alpha);
  drawCloudLayer(ctx, layers[0], canvasW, view, palette.cloud, cloudAlpha);

  // Layer 1: buildings & nature — dispatched via drawers map
  const buildingLayer = layers[1];
  const buildingWidth = getTotalLayerWidth(buildingLayer, canvasW);
  const buildingNorm = buildingLayer.offset % buildingWidth;
  // Each element is checked at its natural scroll position and both wrapped copies
  for (const el of buildingLayer.elements) {
    for (const sign of WRAP_SIGNS) {
      const drawX = el.x - buildingNorm + sign * buildingWidth;
      if (drawX + el.width < view.left || drawX > view.right) continue;
      const drawFn = drawers[el.type];
      if (drawFn) {
        // BackgroundDrawFn's last two parameters are overloaded by element type: `roofColor`
        // is a pedestrian's trouser colour or a chalet's timber, and `variant` is a drawing
        // variant for houses but a seed for Tokyo buildings (see environments/types.ts).
        drawFn(ctx, drawX, el.y, el.width, el.height, el.color, palette, el.roofColor, el.variant);
      }
    }
  }

  // Layer 2: ground + road
  drawGround(ctx, view, groundY, layers[2].offset, palette);

  // Road overlays (wet-road reflections) scroll with the road
  for (const pass of roadOverlays) {
    if (pass.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = pass.alpha;
    pass.draw(ctx, view, groundY, layers[2].offset, palette);
    ctx.restore();
  }
}

/** Draws one wrapping cloud layer at the given opacity. */
function drawCloudLayer(
  ctx: CanvasRenderingContext2D,
  layer: BackgroundLayer,
  canvasW: number,
  view: ViewBounds,
  color: string,
  alpha: number,
) {
  if (alpha <= 0) return;
  const width = getTotalLayerWidth(layer, canvasW);
  const norm = layer.offset % width;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const el of layer.elements) {
    for (const sign of WRAP_SIGNS) {
      const drawX = el.x - norm + sign * width;
      if (drawX + el.width < view.left || drawX > view.right) continue;
      drawCloud(ctx, drawX, el.y, el.width, el.height, color);
    }
  }
  ctx.restore();
}

// --- Pedestrians (shared across biomes) ---

/**
 * Side-view walking figure facing right, mid-stride. `color` is the top, `bottomColor`
 * the trousers or skirt; `variant` selects man / woman / child and the skin tone.
 */
export function drawWalkingPerson(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, _palette: EnvironmentPalette,
  bottomColor = "#3d405b", variant = 0
) {
  const { kind, skinIndex } = decodePedestrianVariant(variant);
  const skin = SKIN_TONES[skinIndex];
  const hair = HAIR_COLORS[skinIndex];
  const isWoman = kind === "woman";
  const isChild = kind === "child";

  const cx = x + w * 0.5;
  const headR = h * (isChild ? 0.11 : 0.08);
  const headY = y + headR + h * 0.01;
  const shoulderY = headY + headR + h * 0.04;
  const hipY = y + h * (isChild ? 0.56 : 0.53);
  const footY = y + h * 0.97;
  const torsoW = w * (isChild ? 0.42 : 0.4);
  const limb = Math.max(1.4, w * 0.15);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Back arm and back leg (slightly darker, behind the body).
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = skin;
  ctx.lineWidth = limb * 0.75;
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY + 1);
  ctx.lineTo(cx - w * 0.28, hipY - h * 0.02);
  ctx.stroke();
  ctx.strokeStyle = isWoman ? skin : bottomColor;
  ctx.lineWidth = isWoman ? limb * 0.7 : limb;
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx - w * 0.08, (hipY + footY) / 2 + 1);
  ctx.lineTo(cx - w * 0.26, footY - 1);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Front leg.
  ctx.strokeStyle = isWoman ? skin : bottomColor;
  ctx.lineWidth = isWoman ? limb * 0.7 : limb;
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + w * 0.16, (hipY + footY) / 2);
  ctx.lineTo(cx + w * 0.22, footY - 1);
  ctx.stroke();

  // Shoes.
  ctx.fillStyle = "#2a2a2a";
  for (const fx of SHOE_X) {
    ctx.beginPath();
    ctx.ellipse(cx + w * fx + 1, footY - 0.6, limb * 0.75, limb * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torso (top).
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - torsoW / 2, shoulderY + 1);
  ctx.quadraticCurveTo(cx, shoulderY - 1, cx + torsoW / 2, shoulderY + 1);
  ctx.lineTo(cx + torsoW * 0.45, hipY);
  ctx.lineTo(cx - torsoW * 0.45, hipY);
  ctx.closePath();
  ctx.fill();

  // Skirt for the woman.
  if (isWoman) {
    ctx.fillStyle = bottomColor;
    ctx.beginPath();
    ctx.moveTo(cx - torsoW * 0.45, hipY - 1);
    ctx.lineTo(cx + torsoW * 0.45, hipY - 1);
    ctx.lineTo(cx + w * 0.38, hipY + h * 0.2);
    ctx.lineTo(cx - w * 0.38, hipY + h * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  // Front arm: sleeve then forearm.
  ctx.strokeStyle = color;
  ctx.lineWidth = limb;
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY + 1);
  ctx.lineTo(cx + w * 0.12, shoulderY + h * 0.1);
  ctx.stroke();
  ctx.strokeStyle = skin;
  ctx.lineWidth = limb * 0.75;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.12, shoulderY + h * 0.1);
  ctx.lineTo(cx + w * 0.26, hipY - h * 0.03);
  ctx.stroke();

  // Head, hair.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx + w * 0.04, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(cx + w * 0.02, headY - headR * 0.15, headR * 1.02, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  if (isWoman) {
    // Longer hair falling behind to the shoulders.
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.9, headY - headR * 0.2);
    ctx.quadraticCurveTo(cx - headR * 1.4, headY + headR * 1.4, cx - headR * 0.2, shoulderY + h * 0.06);
    ctx.lineTo(cx + headR * 0.1, headY);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(cx - headR * 0.9, headY - headR * 0.3, headR * 0.6, headR * 0.9);
  }

  ctx.restore();
}
