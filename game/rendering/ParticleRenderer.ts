import type { ParticleOverlayConfig } from "../environments/types";

export interface Particle {
  x: number;
  y: number;
  size: number;
}

export function createParticles(
  canvasW: number,
  canvasH: number,
  config: ParticleOverlayConfig
): Particle[] {
  const area = (canvasW * canvasH) / 10_000; // per 100×100px
  const count = Math.floor(area * config.density);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvasW,
      y: Math.random() * canvasH,
      size: config.size.min + Math.random() * (config.size.max - config.size.min),
    });
  }
  return particles;
}

export function updateParticles(
  particles: Particle[],
  config: ParticleOverlayConfig,
  dt: number,
  canvasW: number,
  canvasH: number
): void {
  for (const p of particles) {
    p.x += config.speed.x * dt;
    p.y += config.speed.y * dt;
    // Wrap around screen edges
    if (p.x > canvasW) p.x -= canvasW;
    if (p.x < 0) p.x += canvasW;
    if (p.y > canvasH) p.y -= canvasH;
    if (p.y < 0) p.y += canvasH;
  }
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  config: ParticleOverlayConfig
): void {
  ctx.fillStyle = config.color;
  ctx.globalAlpha = config.opacity;
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
