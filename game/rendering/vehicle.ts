/**
 * Shared side-view vehicle renderer. Every road vehicle in the game (cars, SUVs,
 * vans, the ambulance) is drawn with the same recipe so they read as one family:
 * a rounded silhouette, a window band split by pillars, dark wheel arches and
 * lower cladding, light-rimmed tyres and a soft contact shadow.
 */
import type { EnvironmentPalette } from "../environments/types";

/** The few palette colours a vehicle needs (glass, tyres, lamps). */
export type VehicleColors = Pick<EnvironmentPalette["obstacle"], "carWindow" | "carWheel" | "carTaillight" | "carHeadlight">;

/** A point as [x, y] fractions of the vehicle's box, so shapes scale with OBSTACLE_SPECS. */
export type Pt = [number, number];

/** A light box as [x, y, w, h] fractions of the vehicle's box. */
export type LightBox = [number, number, number, number];

/**
 * Colour-independent side-view geometry of one vehicle model. Every coordinate is a
 * fraction of w/h, so a shape is declared once at module level and reused every frame.
 */
export interface VehicleShape {
  /** Silhouette points, clockwise from the rear bottom. */
  outline: Pt[];
  /** Side-window polygon. */
  windows: Pt[];
  /** x fractions where a body-coloured pillar splits the window band. */
  pillars: number[];
  /** x fractions of the wheel centres. */
  wheels: number[];
  /** Tyre radius in px (wheels stay round whatever the box aspect). */
  wheelR: number;
  /** y fraction where the darker lower cladding starts. */
  claddingFrom: number;
  /** Angular, flat-topped wheel arches (e.g. Lamborghini) instead of round ones. */
  angularArches?: boolean;
  /** Rear light box; omit when the vehicle draws its own lamps. */
  tailLight?: LightBox;
  /** Headlight box; omit when the vehicle draws its own lamps. */
  headLight?: LightBox;
}

/** Multi-spoke alloy wheel styling, e.g. black 5-spoke with yellow calipers. */
export interface VehicleRim {
  color: string;
  spokes: number;
  caliper?: string;
  thin?: boolean;
}

/**
 * Per-draw colours for a vehicle. Kept separate from VehicleShape because body colours
 * come from the biome palette while the geometry is fixed.
 */
export interface VehiclePaint {
  body: string;
  bodyDark: string;
  /** Lower cladding colour; defaults to bodyDark. */
  cladding?: string;
  /** Second body colour for a two-tone lower band: [colour, from y fraction, to y fraction]. */
  lowerTone?: [string, number, number];
  /** Sporty multi-spoke alloy instead of the plain light rim. */
  rim?: VehicleRim;
  /** Glass colour override; defaults to colors.carWindow. */
  window?: string;
}

/**
 * Builds a closed polygon path with every corner rounded to radius r. Returned as a
 * Path2D so callers can fill, clip and stroke the same outline without re-tracing it.
 */
export function roundedPath(pts: Array<{ x: number; y: number }>, r: number): Path2D {
  const path = new Path2D();
  const n = pts.length;
  const last = pts[n - 1];
  path.moveTo((last.x + pts[0].x) / 2, (last.y + pts[0].y) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % n];
    path.arcTo(p.x, p.y, next.x, next.y, r);
  }
  path.closePath();
  return path;
}

/**
 * A vehicle model's outline paths at one box size, in local space (box at the origin).
 * Box sizes are fixed per obstacle type, so these are built once and translated into place.
 */
export interface VehiclePaths {
  /** Rounded silhouette. */
  body: Path2D;
  /** Rounded side-window polygon. */
  glass: Path2D;
  tail: Path2D | null;
  head: Path2D | null;
  /** Left and top of the window band, where the reflection and pillars start. */
  glassLeft: number;
  glassTop: number;
  /** y of the beltline (the lowest window edge). */
  beltY: number;
}

/** Paths per shape, then per `w|h`. Shapes are module-level constants, so a WeakMap keys them directly. */
const pathCache = new WeakMap<VehicleShape, Map<string, VehiclePaths>>();

/** A rounded box path from a light box's fractions. */
function lightPath(w: number, h: number, [fx, fy, fw, fh]: LightBox): Path2D {
  return roundedPath([
    { x: w * fx, y: h * fy },
    { x: w * (fx + fw), y: h * fy },
    { x: w * (fx + fw), y: h * (fy + fh) },
    { x: w * fx, y: h * (fy + fh) },
  ], 1);
}

/**
 * Returns `shape`'s paths for a `w`×`h` box, building them on first use. Lets callers
 * (the ambulance's chequer band) clip to the same silhouette drawVehicle fills.
 * @example
 * ctx.translate(x, y); ctx.clip(vehiclePaths(SHAPE, w, h).body);
 */
export function vehiclePaths(shape: VehicleShape, w: number, h: number): VehiclePaths {
  let bySize = pathCache.get(shape);
  if (!bySize) {
    bySize = new Map();
    pathCache.set(shape, bySize);
  }
  const key = `${w}|${h}`;
  let paths = bySize.get(key);
  if (paths) return paths;

  const at = ([fx, fy]: Pt) => ({ x: w * fx, y: h * fy });
  const win = shape.windows.map(at);
  let glassLeft = Infinity;
  let glassTop = Infinity;
  for (const p of win) {
    glassLeft = Math.min(glassLeft, p.x);
    glassTop = Math.min(glassTop, p.y);
  }
  let beltFy = 0;
  for (const [, fy] of shape.windows) beltFy = Math.max(beltFy, fy);
  paths = {
    body: roundedPath(shape.outline.map(at), 3),
    glass: roundedPath(win, 1.5),
    tail: shape.tailLight ? lightPath(w, h, shape.tailLight) : null,
    head: shape.headLight ? lightPath(w, h, shape.headLight) : null,
    glassLeft,
    glassTop,
    beltY: h * beltFy,
  };
  bySize.set(key, paths);
  return paths;
}

/**
 * Draws a vehicle facing right inside the box (x, y, w, h); the tyres touch y + h.
 * Shared by every road vehicle so they read as one family. Drawn in the box's local
 * space so the outline paths come from the per-size cache rather than being retraced.
 *
 * @param colors Biome glass, tyre and lamp colours.
 * @param shape Module-level geometry for the model.
 * @param paint Body colours for this draw.
 */
export function drawVehicle(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  colors: VehicleColors, shape: VehicleShape, paint: VehiclePaint,
) {
  const paths = vehiclePaths(shape, w, h);
  const wheelY = h - shape.wheelR;

  ctx.save();
  ctx.translate(x, y);

  // Soft contact shadow so the vehicle sits on the road.
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 0.5, w * 0.48, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body.
  const body = paths.body;
  ctx.fillStyle = paint.body;
  ctx.fill(body);

  // Lower cladding and wheel arches, clipped to the body.
  ctx.save();
  ctx.clip(body);
  if (paint.lowerTone) {
    const [tone, from, to] = paint.lowerTone;
    ctx.fillStyle = tone;
    ctx.fillRect(0, h * from, w, h * (to - from));
  }
  ctx.fillStyle = paint.cladding ?? paint.bodyDark;
  ctx.fillRect(0, h * shape.claddingFrom, w, h);
  ctx.fillStyle = "#1f1f1e";
  for (const fx of shape.wheels) {
    const wx = w * fx;
    const ar = shape.wheelR + 1.6;
    ctx.beginPath();
    if (shape.angularArches) {
      ctx.moveTo(wx - ar - 0.6, h);
      ctx.lineTo(wx - ar, wheelY - ar * 0.35);
      ctx.lineTo(wx - ar * 0.45, wheelY - ar);
      ctx.lineTo(wx + ar * 0.45, wheelY - ar);
      ctx.lineTo(wx + ar, wheelY - ar * 0.35);
      ctx.lineTo(wx + ar + 0.6, h);
    } else {
      ctx.arc(wx, wheelY, ar, Math.PI, 0);
      ctx.lineTo(wx + ar, h);
      ctx.lineTo(wx - ar, h);
    }
    ctx.fill();
  }
  // Beltline highlight just under the windows.
  const beltY = paths.beltY;
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(0, beltY + 1.5, w, 1.2);
  ctx.restore();

  // Windows with pillars and a soft reflection.
  const glass = paths.glass;
  ctx.fillStyle = paint.window ?? colors.carWindow;
  ctx.fill(glass);
  ctx.save();
  ctx.clip(glass);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  const wx0 = paths.glassLeft;
  const wy0 = paths.glassTop;
  ctx.beginPath();
  ctx.moveTo(wx0 + 4, wy0);
  ctx.lineTo(wx0 + 9, wy0);
  ctx.lineTo(wx0 + 3, beltY);
  ctx.lineTo(wx0 - 2, beltY);
  ctx.fill();
  ctx.fillStyle = paint.body;
  for (const fx of shape.pillars) ctx.fillRect(w * fx - 1.2, wy0 - 1, 2.4, h);
  ctx.restore();

  // Body outline.
  ctx.strokeStyle = paint.bodyDark;
  ctx.lineWidth = 0.9;
  ctx.stroke(body);

  // Lights.
  if (paths.tail) {
    ctx.fillStyle = colors.carTaillight;
    ctx.fill(paths.tail);
  }
  if (paths.head) {
    ctx.fillStyle = colors.carHeadlight;
    ctx.fill(paths.head);
  }

  // Wheels: tyre, light rim, dark hub.
  for (const fx of shape.wheels) {
    const wx = w * fx;
    ctx.fillStyle = colors.carWheel;
    ctx.beginPath();
    ctx.arc(wx, wheelY, shape.wheelR, 0, Math.PI * 2);
    ctx.fill();
    if (paint.rim) {
      drawAlloy(ctx, wx, wheelY, shape.wheelR * 0.72, paint.rim);
    } else {
      ctx.fillStyle = "#c9ccce";
      ctx.beginPath();
      ctx.arc(wx, wheelY, shape.wheelR * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6f7275";
      ctx.beginPath();
      ctx.arc(wx, wheelY, shape.wheelR * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Multi-spoke alloy: dark barrel, optional brake caliper, tapered spokes, lip and centre cap. */
function drawAlloy(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rim: VehicleRim) {
  // Barrel / brake disc seen through the spokes.
  ctx.fillStyle = "#0e0e0f";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a4c50";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  if (rim.caliper) {
    ctx.fillStyle = rim.caliper;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.66, -2.6, -1.5);
    ctx.arc(cx, cy, r * 0.4, -1.5, -2.6, true);
    ctx.closePath();
    ctx.fill();
  }
  // Tapered spokes: wide at the lip, narrow at the hub.
  ctx.fillStyle = rim.color;
  for (let i = 0; i < rim.spokes; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / rim.spokes;
    const outer = rim.thin ? 0.09 : 0.2;
    const inner = rim.thin ? 0.13 : 0.28;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - inner) * r * 0.3, cy + Math.sin(a - inner) * r * 0.3);
    ctx.lineTo(cx + Math.cos(a - outer) * r * 0.97, cy + Math.sin(a - outer) * r * 0.97);
    ctx.lineTo(cx + Math.cos(a + outer) * r * 0.97, cy + Math.sin(a + outer) * r * 0.97);
    ctx.lineTo(cx + Math.cos(a + inner) * r * 0.3, cy + Math.sin(a + inner) * r * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  // Rim lip with a soft highlight, then the centre cap.
  ctx.strokeStyle = rim.color;
  ctx.lineWidth = r * 0.14;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.93, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.93, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();
  ctx.fillStyle = rim.color;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
}
