/**
 * Draws the combo meter on the canvas, top centre. The drain bar changes every frame,
 * so doing this in React would mean a state update 60 times a second.
 *
 * Layout notes: the HUD has audio/pause buttons top left and the score (or the
 * multiplayer standings) top right; the in-run unlock toast sits at 24% from the top
 * (components/UnlockToast.tsx), below the meter. The meter shrinks on small screens
 * so it stays clear of both corners.
 */
import { COMBO_MAX_MULTIPLIER, COMBO_PULSE_SCALE, COMBO_WINDOW_MS } from "../constants";
import { formatMultiplier } from "../ComboChain";
import type { ComboChain } from "../ComboChain";
import { flashAlpha, pulseScale } from "./ComboEffects";
import type { ComboFx } from "./ComboEffects";
import { traceRoundRect } from "./drawHelpers";

/** Reference layout in px at scale 1. */
const PILL_W = 116;
const PILL_H = 58;
const BAR_H = 7;
const TOP = 12;
const BAR_GAP = 6;
/** Below this fraction of the window left, the bar blinks as a "hurry" cue. */
const LOW_WINDOW = 0.3;

/** Fallback when the page font can't be resolved (e.g. before fonts load). */
const FALLBACK_FONT = "'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif";

/**
 * Looks up the page's Fredoka font stack (a CSS variable set by next/font) so the
 * canvas text matches the rest of the UI.
 * @param el - Any element under the body, e.g. the game canvas.
 * @returns A CSS font-family value, never empty.
 */
export function resolveDisplayFont(el: HTMLElement): string {
  const family = getComputedStyle(el).getPropertyValue("--font-fredoka").trim();
  return family ? `${family}, ${FALLBACK_FONT}` : FALLBACK_FONT;
}

/**
 * Meter colour by multiplier tier: white, green, orange, pink, then rainbow at the cap.
 * @param multiplier - Current chain multiplier.
 * @param nowMs - Clock for the rainbow cycle.
 */
export function comboTierColor(multiplier: number, nowMs: number): string {
  if (multiplier >= COMBO_MAX_MULTIPLIER) return `hsl(${(nowMs / 6) % 360}, 95%, 62%)`;
  if (multiplier >= 3) return "#f472b6";
  if (multiplier >= 2) return "#fb923c";
  if (multiplier >= 1.5) return "#4ade80";
  return "#ffffff";
}

/**
 * Draws the meter: a "COMBO x2.5" badge with a bar below that drains with the window.
 * Nothing is drawn while no chain is running.
 * @param ctx - Canvas context (screen space, unshaken).
 * @param chain - Live chain state.
 * @param fx - Pop animation state.
 * @param canvasW - Canvas width, used to centre and scale the meter.
 * @param canvasH - Canvas height, used to scale the meter on short screens.
 * @param fontFamily - From `resolveDisplayFont`.
 * @param nowMs - Clock for colour cycling and the low-window blink.
 */
export function drawComboMeter(
  ctx: CanvasRenderingContext2D,
  chain: ComboChain,
  fx: ComboFx,
  canvasW: number,
  canvasH: number,
  fontFamily: string,
  nowMs: number,
): void {
  if (chain.links === 0) return;

  const scale = Math.min(1, Math.max(0.7, Math.min(canvasW / 900, canvasH / 560)));
  const color = comboTierColor(chain.multiplier, nowMs);
  const cx = canvasW / 2;
  const pillTop = TOP * scale;
  const pillW = PILL_W * scale;
  const pillH = PILL_H * scale;
  const pop = pulseScale(fx, COMBO_PULSE_SCALE);

  ctx.save();
  // Pop around the badge centre so it grows in place
  ctx.translate(cx, pillTop + pillH / 2);
  ctx.scale(pop, pop);
  ctx.translate(-cx, -(pillTop + pillH / 2));

  traceRoundRect(ctx, cx - pillW / 2, pillTop, pillW, pillH, 16 * scale);
  ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
  ctx.fill();
  ctx.lineWidth = 2.5 * scale;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `600 ${11 * scale}px ${fontFamily}`;
  ctx.fillText("COMBO", cx, pillTop + 13 * scale);

  ctx.font = `700 ${34 * scale}px ${fontFamily}`;
  ctx.lineWidth = 4 * scale;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineJoin = "round";
  const label = `×${formatMultiplier(chain.multiplier)}`;
  ctx.strokeText(label, cx, pillTop + 38 * scale);
  ctx.fillStyle = color;
  ctx.fillText(label, cx, pillTop + 38 * scale);
  ctx.restore();

  // Drain bar (not popped, so it stays steady)
  const fraction = Math.max(0, Math.min(1, chain.windowMs / COMBO_WINDOW_MS));
  const barW = pillW * 0.9;
  const barH = BAR_H * scale;
  const barX = cx - barW / 2;
  const barY = pillTop + pillH + BAR_GAP * scale;
  traceRoundRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
  ctx.fill();
  if (fraction > 0) {
    const blinkOff = fraction < LOW_WINDOW && Math.floor(nowMs / 140) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = blinkOff ? 0.45 : 1;
    traceRoundRect(ctx, barX, barY, Math.max(barH, barW * fraction), barH, barH / 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Draws the light white flash that marks reaching a high multiplier.
 * @param ctx - Canvas context.
 * @param fx - Effects state; nothing is drawn when the flash is over.
 */
export function drawComboFlash(ctx: CanvasRenderingContext2D, fx: ComboFx, canvasW: number, canvasH: number): void {
  const alpha = flashAlpha(fx);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();
}
