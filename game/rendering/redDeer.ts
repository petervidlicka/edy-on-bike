/**
 * The Alpine red deer stag, shared by the Austria obstacle roster (a stag on the road)
 * and the Austria backdrop (stags grazing behind the village). Lives apart from both so
 * the background layer doesn't import the obstacle renderer.
 */
import type { EnvironmentPalette } from "../environments/types";
import { AUSTRIA_OBSTACLE_COLORS } from "../environments/obstacleColors";
import { boxMapper, fillPoly, contactShadow, strokeLine, type Pt } from "./drawHelpers";

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
  for (const fx of HOOF_X) ctx.fillRect(x + w * fx - 1.2, y + h * 0.975, 2.4, 1.6);

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

/** x fractions of the four hooves. */
const HOOF_X = [0.3, 0.36, 0.8, 0.86];
