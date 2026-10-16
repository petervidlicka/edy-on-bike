/**
 * A small one-shot confetti burst, separate from the biome particle overlay (which
 * is a looping, config-driven ambience). Pieces fly out, fall and fade, then drop
 * out of the list. Uses Math.random on purpose: it is cosmetic and must never touch
 * the seeded multiplayer RNG.
 */

/** One falling confetti piece. */
export interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  hue: number;
  /** Remaining life, 1 -> 0; also drives the fade. */
  life: number;
}

/** Pixels per dt unit squared pulling confetti down. */
const GRAVITY = 0.18;
/** Life lost per dt unit; ~1.4s at 60fps. */
const LIFE_DECAY = 1 / 85;

/**
 * Creates a fan of confetti bursting upward and outward from a point.
 * @param x - Burst origin.
 * @param y - Burst origin.
 * @param count - Number of pieces.
 * @returns The new pieces to add to the running list.
 */
export function createConfettiBurst(x: number, y: number, count: number): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    // Mostly downward-facing fan from the meter, with a wide spread
    const angle = Math.PI * (0.05 + 0.9 * Math.random());
    const speed = 3 + Math.random() * 5;
    pieces.push({
      x,
      y,
      vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
      vy: -Math.sin(angle) * speed * 0.6 - 1,
      size: 5 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.4,
      hue: Math.floor(Math.random() * 360),
      life: 0.6 + Math.random() * 0.4,
    });
  }
  return pieces;
}

/**
 * Advances every piece and removes the ones that faded out (in place).
 * @param pieces - The running list.
 * @param dt - Frame time in 60fps units.
 */
export function updateConfetti(pieces: ConfettiPiece[], dt: number): void {
  let write = 0;
  for (const p of pieces) {
    p.vy += GRAVITY * dt;
    p.vx *= 1 - 0.01 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.spin * dt;
    p.life -= LIFE_DECAY * dt;
    if (p.life > 0) pieces[write++] = p;
  }
  pieces.length = write;
}

/** Draws the pieces as small rotated rectangles that fade with their remaining life. */
export function drawConfetti(ctx: CanvasRenderingContext2D, pieces: readonly ConfettiPiece[]): void {
  ctx.save();
  for (const p of pieces) {
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.fillStyle = `hsl(${p.hue}, 90%, 60%)`;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.rotate(-p.rotation);
    ctx.translate(-p.x, -p.y);
  }
  ctx.restore();
}
