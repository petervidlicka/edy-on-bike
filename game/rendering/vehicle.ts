/**
 * Shared side-view vehicle renderer. Every road vehicle in the game (cars, SUVs,
 * vans, the ambulance) is drawn with the same recipe so they read as one family:
 * a rounded silhouette, a window band split by pillars, dark wheel arches and
 * lower cladding, light-rimmed tyres and a soft contact shadow.
 */
import type { EnvironmentPalette } from "../environments/types";

/** The few palette colours a vehicle needs (glass, tyres, lamps). */
export type VehicleColors = Pick<EnvironmentPalette["obstacle"], "carWindow" | "carWheel" | "carTaillight" | "carHeadlight">;

// Cars, SUVs, vans and the ambulance share one side-view recipe: a rounded body silhouette, a window
// band split by pillars, darker wheel arches and lower cladding, and tyres with light
// rims. Shapes are fractions of w/h so each vehicle scales with its OBSTACLE_SPECS size.

export type Pt = [number, number];

export interface VehicleStyle {
  body: string;
  bodyDark: string;
  /** Silhouette points as fractions of w/h, clockwise from the rear bottom. */
  outline: Pt[];
  /** Side-window polygon as fractions of w/h. */
  windows: Pt[];
  /** x fractions where a body-coloured pillar splits the window band. */
  pillars: number[];
  /** x fractions of the wheel centres. */
  wheels: number[];
  wheelR: number;
  /** y fraction where the darker lower cladding starts. */
  claddingFrom: number;
  /** Sporty multi-spoke alloy instead of the plain light rim, e.g. black 5-spoke. */
  rim?: { color: string; spokes: number; caliper?: string; thin?: boolean };
  /** Angular, flat-topped wheel arches (e.g. Lamborghini) instead of round ones. */
  angularArches?: boolean;
  /** Second body colour for a two-tone lower band: [colour, from y fraction, to y fraction]. */
  lowerTone?: [string, number, number];
  /** Lower cladding colour; defaults to bodyDark. */
  cladding?: string;
  /** Rear light and headlight boxes: [x, y, w, h] as fractions. */
  tailLight: [number, number, number, number];
  headLight: [number, number, number, number];
}

/** Traces a closed polygon with every corner rounded to radius r. */
export function roundedPath(ctx: CanvasRenderingContext2D, pts: Array<{ x: number; y: number }>, r: number) {
  const n = pts.length;
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(pts[n - 1], pts[0]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % n];
    ctx.arcTo(p.x, p.y, next.x, next.y, r);
  }
  ctx.closePath();
}

/** Draws a vehicle facing right inside the box (x, y, w, h); the tyres touch y + h. */
export function drawVehicle(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  colors: VehicleColors, style: VehicleStyle,
) {
  const c = colors;
  const at = ([fx, fy]: Pt) => ({ x: x + w * fx, y: y + h * fy });
  const wheelY = y + h - style.wheelR;

  ctx.save();

  // Soft contact shadow so the vehicle sits on the road.
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 0.5, w * 0.48, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body.
  const outline = style.outline.map(at);
  roundedPath(ctx, outline, 3);
  ctx.fillStyle = style.body;
  ctx.fill();

  // Lower cladding and wheel arches, clipped to the body.
  ctx.save();
  roundedPath(ctx, outline, 3);
  ctx.clip();
  if (style.lowerTone) {
    const [tone, from, to] = style.lowerTone;
    ctx.fillStyle = tone;
    ctx.fillRect(x, y + h * from, w, h * (to - from));
  }
  ctx.fillStyle = style.cladding ?? style.bodyDark;
  ctx.fillRect(x, y + h * style.claddingFrom, w, h);
  ctx.fillStyle = "#1f1f1e";
  for (const fx of style.wheels) {
    const wx = x + w * fx;
    const ar = style.wheelR + 1.6;
    ctx.beginPath();
    if (style.angularArches) {
      ctx.moveTo(wx - ar - 0.6, y + h);
      ctx.lineTo(wx - ar, wheelY - ar * 0.35);
      ctx.lineTo(wx - ar * 0.45, wheelY - ar);
      ctx.lineTo(wx + ar * 0.45, wheelY - ar);
      ctx.lineTo(wx + ar, wheelY - ar * 0.35);
      ctx.lineTo(wx + ar + 0.6, y + h);
    } else {
      ctx.arc(wx, wheelY, ar, Math.PI, 0);
      ctx.lineTo(wx + ar, y + h);
      ctx.lineTo(wx - ar, y + h);
    }
    ctx.fill();
  }
  // Beltline highlight just under the windows.
  const beltY = Math.max(...style.windows.map(([, fy]) => fy));
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(x, y + h * beltY + 1.5, w, 1.2);
  ctx.restore();

  // Windows with pillars and a soft reflection.
  const win = style.windows.map(at);
  roundedPath(ctx, win, 1.5);
  ctx.fillStyle = c.carWindow;
  ctx.fill();
  ctx.save();
  roundedPath(ctx, win, 1.5);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  const wy0 = Math.min(...win.map((p) => p.y));
  const wx0 = Math.min(...win.map((p) => p.x));
  ctx.beginPath();
  ctx.moveTo(wx0 + 4, wy0);
  ctx.lineTo(wx0 + 9, wy0);
  ctx.lineTo(wx0 + 3, y + h * beltY);
  ctx.lineTo(wx0 - 2, y + h * beltY);
  ctx.fill();
  ctx.fillStyle = style.body;
  for (const fx of style.pillars) ctx.fillRect(x + w * fx - 1.2, wy0 - 1, 2.4, h);
  ctx.restore();

  // Body outline.
  roundedPath(ctx, outline, 3);
  ctx.strokeStyle = style.bodyDark;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Lights.
  const light = ([fx, fy, fw, fh]: [number, number, number, number], color: string) => {
    ctx.fillStyle = color;
    roundedPath(ctx, [
      { x: x + w * fx, y: y + h * fy },
      { x: x + w * (fx + fw), y: y + h * fy },
      { x: x + w * (fx + fw), y: y + h * (fy + fh) },
      { x: x + w * fx, y: y + h * (fy + fh) },
    ], 1);
    ctx.fill();
  };
  light(style.tailLight, c.carTaillight);
  light(style.headLight, c.carHeadlight);

  // Wheels: tyre, light rim, dark hub.
  for (const fx of style.wheels) {
    const wx = x + w * fx;
    ctx.fillStyle = c.carWheel;
    ctx.beginPath();
    ctx.arc(wx, wheelY, style.wheelR, 0, Math.PI * 2);
    ctx.fill();
    if (style.rim) {
      drawAlloy(ctx, wx, wheelY, style.wheelR * 0.72, style.rim);
    } else {
      ctx.fillStyle = "#c9ccce";
      ctx.beginPath();
      ctx.arc(wx, wheelY, style.wheelR * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6f7275";
      ctx.beginPath();
      ctx.arc(wx, wheelY, style.wheelR * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Multi-spoke alloy: dark barrel, optional brake caliper, tapered spokes, lip and centre cap. */
function drawAlloy(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number,
  rim: { color: string; spokes: number; caliper?: string; thin?: boolean },
) {
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
