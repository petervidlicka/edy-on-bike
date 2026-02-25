import { AmbulanceState } from "../types";

export function drawAmbulance(ctx: CanvasRenderingContext2D, amb: AmbulanceState) {
  const { x, y, width: w, height: h } = amb;

  ctx.save();

  // Shadow under ambulance
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h + 2, w * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main body — white van
  ctx.fillStyle = "#f0f0f0";
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 8);
  ctx.lineTo(x + w - 20, y + 8);
  ctx.quadraticCurveTo(x + w - 16, y + 8, x + w - 16, y + 12);
  ctx.lineTo(x + w - 16, y + h - 12);
  ctx.lineTo(x + 4, y + h - 12);
  ctx.quadraticCurveTo(x, y + h - 12, x, y + h - 16);
  ctx.lineTo(x, y + 12);
  ctx.quadraticCurveTo(x, y + 8, x + 4, y + 8);
  ctx.fill();

  // Cabin (front section) — slightly darker
  ctx.fillStyle = "#e4e4e4";
  ctx.fillRect(x + w - 35, y + 10, 19, h - 22);

  // Windshield
  ctx.fillStyle = "#8abcd4";
  ctx.beginPath();
  ctx.moveTo(x + w - 16, y + 12);
  ctx.lineTo(x + w - 8, y + 16);
  ctx.lineTo(x + w - 8, y + h - 22);
  ctx.lineTo(x + w - 16, y + h - 18);
  ctx.closePath();
  ctx.fill();
  // Windshield reflection
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(x + w - 15, y + 14, 4, 8);

  // Red stripe along the side
  ctx.fillStyle = "#c44040";
  ctx.fillRect(x + 6, y + h * 0.45, w - 42, 6);

  // Red cross
  const crossX = x + w * 0.3;
  const crossY = y + h * 0.28;
  ctx.fillStyle = "#c44040";
  ctx.fillRect(crossX - 6, crossY - 2, 12, 4);
  ctx.fillRect(crossX - 2, crossY - 6, 4, 12);

  // "AMBULANCE" text
  ctx.fillStyle = "#c44040";
  ctx.font = "bold 7px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AMBULANCE", x + w * 0.35, y + h * 0.65);

  // Roof light bar
  ctx.fillStyle = "#d0d0d0";
  ctx.fillRect(x + w * 0.3, y + 4, 30, 5);

  // Flashing sirens on roof — red/blue alternate
  const flash = amb.sirenFlash;
  const isRedPhase = Math.floor(flash / 150) % 2 === 0;
  // Left siren
  ctx.fillStyle = isRedPhase ? "#ff2020" : "#2040ff";
  ctx.beginPath();
  ctx.arc(x + w * 0.33, y + 6, 4, 0, Math.PI * 2);
  ctx.fill();
  // Right siren (opposite color)
  ctx.fillStyle = isRedPhase ? "#2040ff" : "#ff2020";
  ctx.beginPath();
  ctx.arc(x + w * 0.33 + 22, y + 6, 4, 0, Math.PI * 2);
  ctx.fill();
  // Siren glow
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = isRedPhase ? "#ff2020" : "#2040ff";
  ctx.beginPath();
  ctx.arc(x + w * 0.33, y + 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = isRedPhase ? "#2040ff" : "#ff2020";
  ctx.beginPath();
  ctx.arc(x + w * 0.33 + 22, y + 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wheels
  const wheelR = 7;
  const wheelY = y + h - 10;
  ctx.fillStyle = "#2e2e2e";
  ctx.beginPath();
  ctx.arc(x + 22, wheelY, wheelR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 28, wheelY, wheelR, 0, Math.PI * 2);
  ctx.fill();
  // Hubcaps
  ctx.fillStyle = "#8a8a8a";
  ctx.beginPath();
  ctx.arc(x + 22, wheelY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 28, wheelY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Headlights
  ctx.fillStyle = "#e8d06a";
  ctx.beginPath();
  ctx.arc(x + w - 8, y + h - 20, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Taillights
  ctx.fillStyle = "#c44040";
  ctx.beginPath();
  ctx.arc(x + 3, y + h - 20, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Front bumper
  ctx.fillStyle = "#8a8a8a";
  ctx.fillRect(x + w - 10, y + h - 14, 6, 3);
  // Rear bumper
  ctx.fillRect(x - 2, y + h - 14, 6, 3);

  // Body outline
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 8);
  ctx.lineTo(x + w - 20, y + 8);
  ctx.quadraticCurveTo(x + w - 16, y + 8, x + w - 16, y + 12);
  ctx.lineTo(x + w - 16, y + h - 12);
  ctx.lineTo(x + 4, y + h - 12);
  ctx.quadraticCurveTo(x, y + h - 12, x, y + h - 16);
  ctx.lineTo(x, y + 12);
  ctx.quadraticCurveTo(x, y + 8, x + 4, y + 8);
  ctx.stroke();

  ctx.restore();
}

export function drawReviveFlash(ctx: CanvasRenderingContext2D, opacity: number, w: number, h: number) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
