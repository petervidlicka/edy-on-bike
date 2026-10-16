// --- Floating bonus text ---

/** Optional comic styling for a floating text (the "SPLAT!" pops of the crash variants). */
export interface FloatingTextStyle {
  /** Tilt in radians, clockwise. */
  rotation?: number;
  /** Outline colour; the default is a translucent black. */
  outline?: string;
  /** Pops in with a small overshoot, stays solid for most of its life, then fades. */
  pop?: boolean;
  /** Canvas font-family stack; plain sans-serif when omitted. */
  fontFamily?: string;
}

/** Opacity drop over which a popping text grows from small to full size (~0.12 s of life). */
const POP_IN_SPAN = 0.1;

/** Ease-out with an overshoot, 0 -> 1 -> slightly past 1 -> 1. */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function drawFloatingText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opacity: number,
  color: string = "#1a7a2e",
  fontSize: number = 21,
  style: FloatingTextStyle = {}
) {
  ctx.save();
  if (style.pop) {
    // Life runs 1 -> 0: grow in over the first stretch, hold solid, fade over the last half
    const grow = Math.min(1, Math.max(0, (1 - opacity) / POP_IN_SPAN));
    const scale = 0.3 + 0.7 * easeOutBack(grow);
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity * 2));
    ctx.translate(x, y);
    ctx.rotate(style.rotation ?? 0);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
  } else {
    ctx.globalAlpha = Math.max(0, opacity);
    if (style.rotation) {
      ctx.translate(x, y);
      ctx.rotate(style.rotation);
      ctx.translate(-x, -y);
    }
  }
  ctx.font = `bold ${fontSize}px ${style.fontFamily ?? "sans-serif"}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = style.outline ?? "rgba(0,0,0,0.6)";
  ctx.lineWidth = style.pop ? 5 : 3;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
