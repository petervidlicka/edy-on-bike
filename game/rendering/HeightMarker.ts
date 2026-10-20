/**
 * Off-screen height marker: when a launch goes higher than even the zoomed-out camera
 * can show, a small pill pinned to the top edge tracks the rider and shows their height,
 * so the player never loses them.
 */
import { roundedPath } from "./vehicle";

/** The bike is ~64px long, roughly 1.8m — close enough for a fun height readout. */
const PX_PER_METER = 35;

let markerFont: string | null = null;

/** Canvas fonts can't read CSS variables, so resolve the page's (hashed) Nunito family once. */
function getMarkerFont(): string {
  if (!markerFont) {
    const family = getComputedStyle(document.body).fontFamily || "Arial, sans-serif";
    markerFont = `bold 12px ${family}`;
  }
  return markerFont;
}

/**
 * Draws the marker in screen space (call with an identity transform).
 * @param centerX - Rider's centre on screen.
 * @param heightPx - Rider's wheels above the road, in world px.
 */
export function drawHeightMarker(ctx: CanvasRenderingContext2D, centerX: number, heightPx: number, canvasW: number): void {
  const label = `${Math.max(1, Math.round(heightPx / PX_PER_METER))} m`;
  ctx.save();
  ctx.font = getMarkerFont();
  const textW = ctx.measureText(label).width;
  const w = textW + 30;
  const h = 22;
  const x = Math.min(canvasW - w - 6, Math.max(6, centerX - w / 2));
  const y = 12;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.strokeStyle = "rgba(39,67,94,0.35)";
  ctx.lineWidth = 1;
  const pill = roundedPath([{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }], h / 2);
  ctx.fill(pill);
  ctx.stroke(pill);

  // Arrow tip pointing up at the rider, clamped inside the pill's span
  const tipX = Math.min(x + w - h / 2, Math.max(x + h / 2, centerX));
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.moveTo(tipX - 5, y + 0.5);
  ctx.lineTo(tipX, y - 6);
  ctx.lineTo(tipX + 5, y + 0.5);
  ctx.closePath();
  ctx.fill();

  // Up chevron + height
  ctx.fillStyle = "#27435E";
  ctx.beginPath();
  ctx.moveTo(x + 10, y + h / 2 + 3);
  ctx.lineTo(x + 14, y + h / 2 - 3);
  ctx.lineTo(x + 18, y + h / 2 + 3);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + 22, y + h / 2 + 0.5);
  ctx.restore();
}
