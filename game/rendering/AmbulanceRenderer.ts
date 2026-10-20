import { AmbulanceState } from "../types";
import { drawVehicle, roundedPath, type VehicleColors, type VehicleShape } from "./vehicle";

/** The ambulance looks the same in every biome, so it carries its own glass, tyre and lamp colours. */
const AMBULANCE_COLORS: VehicleColors = {
  carWindow: "#8abcd4",
  carWheel: "#2e2e2c",
  carTaillight: "#c44040",
  carHeadlight: "#e8d06a",
};

/** High-roof van silhouette; the cab and bonnet sit in the right-hand 30%. */
const AMBULANCE_SHAPE: VehicleShape = {
  outline: [[0.005, 0.86], [0.0, 0.14], [0.02, 0.09], [0.69, 0.09], [0.72, 0.17], [0.8, 0.18], [0.9, 0.46], [0.985, 0.54], [1.0, 0.68], [0.995, 0.86]],
  windows: [[0.725, 0.45], [0.725, 0.22], [0.79, 0.22], [0.865, 0.45]],
  pillars: [],
  wheels: [0.16, 0.81],
  wheelR: 8.5,
  claddingFrom: 0.8,
  tailLight: [0.0, 0.62, 0.02, 0.12],
  headLight: [0.955, 0.56, 0.04, 0.07],
};

/**
 * European-style ambulance on a high-roof Mercedes Sprinter–type van: white body,
 * green/yellow Battenburg chequer band, blue Star of Life and blue roof beacons
 * that alternate while the siren runs.
 */
export function drawAmbulance(ctx: CanvasRenderingContext2D, amb: AmbulanceState) {
  // Authored facing right, but it arrives from the right and leaves to the left, so
  // mirror it to keep the cab pointing the way it drives.
  ctx.save();
  ctx.translate(2 * amb.x + amb.width, 0);
  ctx.scale(-1, 1);
  drawAmbulanceArt(ctx, amb);
  ctx.restore();
}

function drawAmbulanceArt(ctx: CanvasRenderingContext2D, amb: AmbulanceState) {
  const { x, y, width: w, height: h } = amb;

  drawVehicle(ctx, x, y, w, h, AMBULANCE_COLORS, AMBULANCE_SHAPE, {
    body: "#f6f5f1",
    bodyDark: "#c9c6bd",
    cladding: "#8d8f92",
  });

  ctx.save();

  // Battenburg chequer band, clipped to the body.
  ctx.clip(roundedPath(AMBULANCE_SHAPE.outline.map(([fx, fy]) => ({ x: x + w * fx, y: y + h * fy })), 3));
  const bandTop = y + h * 0.5;
  const cell = h * 0.075;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; x + i * cell * 1.6 < x + w * 0.9; i++) {
      ctx.fillStyle = (i + row) % 2 === 0 ? "#f2cf1d" : "#1f8a4c";
      ctx.fillRect(x + i * cell * 1.6, bandTop + row * cell, cell * 1.6, cell);
    }
  }
  // Rear door seam and sliding-door seam.
  ctx.strokeStyle = "#c9c6bd";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.14);
  ctx.lineTo(x + w * 0.5, y + h * 0.8);
  ctx.stroke();
  ctx.restore();

  // Rear box window.
  ctx.fillStyle = "#8ab4cc";
  ctx.fillRect(x + w * 0.53, y + h * 0.2, w * 0.12, h * 0.18);

  // Star of Life on the box side.
  const scx = x + w * 0.27;
  const scy = y + h * 0.3;
  const arm = h * 0.11;
  ctx.fillStyle = "#1f5fb0";
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(scx, scy);
    ctx.rotate((i * Math.PI) / 3);
    ctx.fillRect(-arm * 0.32, -arm, arm * 0.64, arm * 2);
    ctx.restore();
  }
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(scx, scy - arm * 0.75);
  ctx.lineTo(scx, scy + arm * 0.75);
  ctx.stroke();

  // Blue beacons: front light bar over the cab and a rear corner lamp, alternating.
  const phase = Math.floor(amb.sirenFlash / 150) % 2 === 0;
  const beacon = (bx: number, bw: number, on: boolean) => {
    ctx.fillStyle = on ? "#3d7bff" : "#1d3f8f";
    ctx.fillRect(bx, y + h * 0.03, bw, h * 0.065);
    if (on) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#5c90ff";
      ctx.beginPath();
      ctx.ellipse(bx + bw / 2, y + h * 0.06, bw * 0.9, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };
  beacon(x + w * 0.6, w * 0.045, phase);
  beacon(x + w * 0.65, w * 0.045, !phase);
  beacon(x + w * 0.015, w * 0.035, !phase);
}

export function drawReviveFlash(ctx: CanvasRenderingContext2D, opacity: number, w: number, h: number) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
