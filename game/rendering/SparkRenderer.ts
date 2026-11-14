/**
 * Grind sparks: a small pool of short-lived streaks thrown off the rear wheel while the
 * rider scrapes along an obstacle. Separate from the biome particle overlay (a looping,
 * config-driven ambience) and from confetti (screen-space celebration): sparks live in
 * world space, so they are drawn inside the crash-shake transform. Uses Math.random on
 * purpose: it is cosmetic and must never touch the seeded multiplayer RNG.
 */
import type { PlayerState, SkinDefinition } from "../types";
import { GRIND_SPARKS_MAX, GRIND_SPARKS_MIN, GRIND_SPARK_MAX } from "../constants";
import { getBikeGeometry } from "./PlayerRenderer";

/** One spark streak. */
export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Remaining life, 1 -> 0; also drives the fade and the orange-to-yellow shift. */
  life: number;
  /** Life lost per dt unit, so sparks die at different times. */
  decay: number;
}

/** Pixels per dt unit squared pulling sparks down. */
const SPARK_GRAVITY = 0.16;
/** How long (in px of velocity) the streak trails behind a spark. */
const STREAK_LENGTH = 2.2;

/**
 * Finds where the rear tyre touches the surface, following the bike's tilt, so sparks
 * start at the contact point whatever the skin's bike geometry.
 * @param player - The rider; its position and bikeTilt are read.
 * @param skin - Supplies the bike style (wheel size and wheelbase differ).
 * @returns The contact point in canvas coordinates.
 */
export function getRearWheelContact(player: PlayerState, skin: SkinDefinition): { x: number; y: number } {
  const g = getBikeGeometry(skin.bikeStyle, player.x, player.y);
  // The renderer rotates the bike around its pivot by -bikeTilt; do the same to the tyre's lowest point
  const angle = -player.bikeTilt;
  const dx = g.rearWheelX - g.pivotX;
  const dy = g.wheelY + g.wheelR - g.pivotY;
  return {
    x: g.pivotX + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: g.pivotY + dx * Math.sin(angle) + dy * Math.cos(angle),
  };
}

/**
 * Throws a few sparks back and up from a point; does nothing once the pool is full.
 * @param sparks - The running list (mutated).
 * @param x - Contact point.
 * @param y - Contact point.
 */
export function emitSparks(sparks: Spark[], x: number, y: number): void {
  const count = GRIND_SPARKS_MIN + Math.floor(Math.random() * (GRIND_SPARKS_MAX - GRIND_SPARKS_MIN + 1));
  for (let i = 0; i < count && sparks.length < GRIND_SPARK_MAX; i++) {
    sparks.push({
      x: x + (Math.random() - 0.5) * 4,
      y,
      vx: -(2 + Math.random() * 4),
      vy: -(1.5 + Math.random() * 3),
      life: 0.6 + Math.random() * 0.4,
      decay: 1 / (16 + Math.random() * 14),
    });
  }
}

/**
 * Advances every spark and removes the ones that burned out (in place).
 * @param sparks - The running list.
 * @param dt - Frame time in 60fps units.
 */
export function updateSparks(sparks: Spark[], dt: number): void {
  let write = 0;
  for (const s of sparks) {
    s.vy += SPARK_GRAVITY * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= s.decay * dt;
    if (s.life > 0) sparks[write++] = s;
  }
  sparks.length = write;
}

/** Draws each spark as a short streak along its velocity, fading from yellow to orange as it dies. */
export function drawSparks(ctx: CanvasRenderingContext2D, sparks: readonly Spark[]): void {
  if (sparks.length === 0) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 2;
  for (const s of sparks) {
    ctx.globalAlpha = Math.min(1, s.life * 1.5);
    // Hue 28 (orange) when nearly dead, 52 (yellow) when fresh
    ctx.strokeStyle = `hsl(${28 + 24 * s.life}, 100%, ${55 + 15 * s.life}%)`;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * STREAK_LENGTH, s.y - s.vy * STREAK_LENGTH);
    ctx.stroke();
  }
  ctx.restore();
}
