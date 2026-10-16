/**
 * Cartoon garnish every crash variant shares: stars circling the rider's head once
 * they have settled, and the comic pop word ("SPLAT!") at the moment of impact.
 * Purely cosmetic, so `Math.random` is fine here.
 */
import type { FloatingText } from "../TrickSystem";
import type { CrashPopText, Point } from "./types";

const STAR_COUNT = 3;
/** Radians per second the stars orbit at. */
const STAR_SPIN = 6;
const ORBIT_RX = 16;
const ORBIT_RY = 5;
/** How far above the head's centre the orbit sits (clears the helmet). */
const ORBIT_LIFT = 17;
const STAR_FILL = "#ffd23f";
const STAR_STROKE = "#c98a00";
/** Seconds the stars take to fade in. */
const STAR_FADE_IN_S = 0.15;

/** Pop word size and how long it lasts, tuned so it reads on a phone without hiding the crash. */
const POP_SIZE = 40;
const POP_RISE = -0.35;
/** Highest the pop word may sit, so it stays clear of the score and the buttons at the top. */
const POP_MIN_Y = 70;

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rotation: number): void {
  const inner = radius * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : inner;
    const a = rotation + (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * Draws stars orbiting above a head. Stars on the far side of the orbit are drawn a
 * little smaller so the ring reads as three-dimensional.
 * @param ctx - Canvas context (the caller owns the fade).
 * @param head - World position of the head's centre.
 * @param time - Seconds since the stars started; drives the spin and the fade-in.
 */
export function drawCrashStars(ctx: CanvasRenderingContext2D, head: Point, time: number): void {
  if (time <= 0) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, time / STAR_FADE_IN_S);
  ctx.fillStyle = STAR_FILL;
  ctx.strokeStyle = STAR_STROKE;
  ctx.lineWidth = 0.9;
  ctx.lineJoin = "round";
  for (let i = 0; i < STAR_COUNT; i++) {
    const a = time * STAR_SPIN + (i * Math.PI * 2) / STAR_COUNT;
    const depth = Math.sin(a); // -1 far side, 1 near side
    const x = head.x + Math.cos(a) * ORBIT_RX;
    const y = head.y - ORBIT_LIFT + depth * ORBIT_RY;
    drawStar(ctx, x, y, 3.6 + depth * 0.7, time * 3 + i);
  }
  ctx.restore();
}

/**
 * Builds the comic word that pops up at the impact: big, tilted, outlined, rising slowly.
 * It rides the normal floating-text pipeline (so it fades with it) with `pop` styling.
 * @param pop - Word and colours of the variant that crashed.
 * @param at - Where the crash happened, in canvas pixels.
 * @param canvasW - Canvas width, to keep the word on screen.
 */
export function createCrashPopText(pop: CrashPopText, at: Point, canvasW: number): FloatingText {
  const margin = pop.text.length * POP_SIZE * 0.35 + 8;
  return {
    text: pop.text,
    x: Math.min(Math.max(at.x, margin), canvasW - margin),
    y: Math.max(at.y, POP_MIN_Y),
    opacity: 1,
    velocityY: POP_RISE,
    color: pop.fill,
    size: POP_SIZE,
    rotation: (Math.random() < 0.5 ? -1 : 1) * (0.1 + Math.random() * 0.08),
    outline: pop.outline,
    pop: true,
  };
}
