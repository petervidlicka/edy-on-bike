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

/**
 * Draws a weather overlay in screen space.
 * @param alpha - Extra fade (0–1) on top of the config's opacity, for biome changes.
 */
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  config: ParticleOverlayConfig,
  alpha = 1
): void {
  if (alpha <= 0) return;
  ctx.globalAlpha = config.opacity * alpha;
  if (config.type === "rain") {
    // Streaks along the fall direction, longer for the bigger (nearer) drops
    const len = Math.hypot(config.speed.x, config.speed.y) || 1;
    const ux = config.speed.x / len;
    const uy = config.speed.y / len;
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const p of particles) {
      const streak = p.size * 4;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - ux * streak, p.y - uy * streak);
    }
    ctx.stroke();
  } else {
    // One path for every flake: a fill per particle costs hundreds of draw calls a frame
    ctx.fillStyle = config.color;
    ctx.beginPath();
    for (const p of particles) {
      ctx.moveTo(p.x + p.size, p.y);
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
