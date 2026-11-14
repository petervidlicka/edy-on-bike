/**
 * Faceplant, for a bad trick landing: the rider dives off the bike, sticks head-first
 * in the road with the legs kicking in the air, then slowly tips over and lies flat.
 * The head is buried by clipping the figure at the road line and covering the hole
 * with a mound of dirt.
 */
import { INITIAL_SPEED } from "../constants";
import { drawRiderFigure, UPRIGHT_SHOULDER } from "../rendering/CrashRenderer";
import type { Offset } from "../rendering/CrashRenderer";
import {
  BIKE_REST, clamp01, figurePoint, HEAD_OFFSET, HIP_FROM_PLAYER, launchBikeFromRider, lerp, placeRider, riderHead, stepBike,
} from "./physics";
import type { CrashVariant, FaceplantCrashData, RiderPlacement } from "./types";

/** Seconds the dive lasts, how long the rider stays stuck, and how long the tip-over takes. */
const T_FLY = 0.28;
const T_STUCK = 0.7;
const T_TIP = 0.4;
const DURATION = 1.9;
const STARS_FROM = T_FLY + 0.15;
/** Height of the dive's arc above the straight line, in px. */
const ARC_HEIGHT = 14;
/** Head centre sits this far above the road when planted (smaller = deeper), and when lying. */
const PLANTED_DEPTH = 2;
const LYING_HEIGHT = 4;

/** Leg directions as angles from straight down the leg's own axis, and their lengths. */
const LEG_L = { angle: -0.4, length: 12.5 };
const LEG_R = { angle: 0.55, length: 11 };

function legEnd(leg: { angle: number; length: number }, wiggle: number): Offset {
  const a = leg.angle + wiggle;
  return [Math.sin(a) * leg.length, Math.cos(a) * leg.length];
}

/** Hip position and rotation of the rider at `t` seconds. */
function riderAt(data: FaceplantCrashData, t: number): RiderPlacement {
  // Upside down (angle PI) the hip sits 19px above the head and 3px in front of it
  const hipX = data.plantX + HEAD_OFFSET[0];
  const hipY = data.surfaceY - PLANTED_DEPTH + HEAD_OFFSET[1];

  if (t < T_FLY) {
    const u = t / T_FLY;
    return {
      x: lerp(data.startX, hipX, u),
      y: lerp(data.startY, hipY, u) - ARC_HEIGHT * 4 * u * (1 - u),
      angle: Math.PI * Math.pow(u, 1.4),
    };
  }

  const stuck = t - T_FLY;
  const tip = stuck - T_STUCK;
  if (tip <= 0) {
    // Wobbling in place like a dart
    return { x: hipX, y: hipY, angle: Math.PI + 0.07 * Math.sin(stuck * 18) * Math.exp(-stuck * 2) };
  }

  // Tipping about the head: the angle accelerates like a fall, then bounces a little and settles
  const u = clamp01(tip / T_TIP);
  const settle = Math.max(0, tip - T_TIP);
  const bounce = 0.18 * Math.exp(-6 * settle) * Math.abs(Math.sin(settle * 16));
  const angle = Math.PI + data.tipDir * ((Math.PI / 2) * u * u - bounce);
  const pivotY = data.surfaceY - lerp(PLANTED_DEPTH, LYING_HEIGHT, u);
  const head = figurePoint(0, 0, angle, HEAD_OFFSET);
  return { x: data.plantX - head.x, y: pivotY - head.y, angle };
}

export const faceplantCrash: CrashVariant<FaceplantCrashData> = {
  id: "faceplant",
  duration: DURATION,
  starsFrom: STARS_FROM,
  pop: { text: "SPLAT!", fill: "#ff5d8f", outline: "#5a0a2a" },

  init(cs, { player: p, speed, groundY, cause }) {
    const speedFactor = speed / INITIAL_SPEED;
    const data: FaceplantCrashData = {
      kind: "faceplant",
      startX: p.x + HIP_FROM_PLAYER[0],
      startY: p.y + HIP_FROM_PLAYER[1],
      plantX: p.x + HIP_FROM_PLAYER[0] + 52 + speedFactor * 8,
      surfaceY: cause.kind === "badLanding" ? cause.surfaceY : groundY,
      tipDir: cause.kind === "badLanding" && !cause.underRotated ? 1 : -1,
    };
    placeRider(cs, data.startX, data.startY);
    // The bike stays behind: it hops, drops and tips over where the rider left it
    launchBikeFromRider(cs, p, { vx: -0.8, vy: -3.5, spin: -0.1 });
    return data;
  },

  // The bike lands on the surface the rider planted in, which may be an obstacle's top
  update(cs, data, { dt }) {
    stepBike(cs, dt, data.surfaceY, BIKE_REST);
  },

  riderAt,

  drawRider(ctx, cs, data, { skin }) {
    const t = cs.anim;
    const stuck = t - T_FLY;

    // Dust kicked up by the impact, behind the rider
    if (stuck > 0 && stuck < 0.5) {
      const k = stuck / 0.5;
      ctx.save();
      for (const [dx, dy] of [[-1, -0.25], [1, -0.25], [-0.45, -0.9], [0.45, -0.9], [0, -1]]) {
        ctx.fillStyle = `rgba(196,168,128,${0.7 * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(data.plantX + dx * k * 34, data.surfaceY + dy * k * 26 - 3, 3 + k * 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.save();
    // Everything below the road line is "in the ground"
    ctx.beginPath();
    ctx.rect(data.plantX - 200, data.surfaceY - 500, 400, 503);
    ctx.clip();
    ctx.translate(cs.riderX, cs.riderY);
    ctx.rotate(cs.riderAngle);

    // Legs flail in the dive, kick while stuck, then stop once the rider has tipped over
    const flail = t < T_FLY ? 0.6 : Math.max(0, 1 - Math.max(0, stuck - T_STUCK) / T_TIP) * 0.45;
    const wiggle = Math.sin(t * 22);
    const [shoulderX, shoulderY] = UPRIGHT_SHOULDER;
    const flung = t < T_FLY ? 1 : 0;
    drawRiderFigure(ctx, skin, {
      footL: legEnd(LEG_L, flail * wiggle - flung * 0.5),
      footR: legEnd(LEG_R, -flail * wiggle + flung * 0.4),
      shoulder: UPRIGHT_SHOULDER,
      // Arms trail behind the head, then lie out to the sides
      handL: [shoulderX - 8 + Math.sin(t * 9) * 1.5, shoulderY - 7],
      handR: [shoulderX + 7 - Math.sin(t * 9) * 1.5, shoulderY - 8],
      dazed: t >= T_FLY,
    });
    ctx.restore();

    // Mound of dirt over the hole the head went into
    if (stuck > 0) {
      const lift = clamp01(1 - (stuck - T_STUCK) / T_TIP);
      ctx.fillStyle = "#8a6a46";
      ctx.beginPath();
      ctx.ellipse(data.plantX, data.surfaceY + 1, 10 + 3 * (1 - lift), 4.5 * (0.55 + 0.45 * lift), 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#6e5236";
      ctx.beginPath();
      ctx.ellipse(data.plantX + 3, data.surfaceY + 1, 5, 2.4, 0, Math.PI, 0);
      ctx.fill();
    }
  },

  headAnchor: riderHead,
};
