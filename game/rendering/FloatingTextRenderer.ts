// --- Floating bonus text ---

export function drawFloatingText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, opacity);
  ctx.font = "bold 21px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 3;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = "#1a7a2e";
  ctx.fillText(text, x, y);
  ctx.restore();
}
