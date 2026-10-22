/**
 * Car bonk, for every car-like obstacle: the rider is tossed onto the roof, bounces
 * off it like a trampoline (one big spinning boing, a smaller one, a tiny one) and
 * ends up sprawled on their back with arms and legs in the air. The bike bounces off
 * the rear bumper and falls to the road.
 */
import { INITIAL_SPEED } from "../constants";
import { drawRiderFigure, UPRIGHT_SHOULDER } from "../rendering/CrashRenderer";
import type { Offset } from "../rendering/CrashRenderer";
import { clamp01, HIP_FROM_PLAYER, launchBikeFromRider, lerp, placeRider, riderHead } from "./physics";
import type { CarBonkData, CrashVariant, RiderPlacement } from "./types";

// Which obstacles play this variant is the `crashFamily: "car"` entry in OBSTACLE_SPECS.

const DURATION = 2.3;
const STARS_FROM = 1.55;

/** Seconds of the toss onto the roof, then each boing: height above the roof, flight time. */
const T_TOSS = 0.42;
const BOINGS = [
  { height: 78, time: 0.62 },
  { height: 30, time: 0.38 },
  { height: 9, time: 0.2 },
] as const;
/** Anim time of each landing on the roof: the toss, then every boing. */
const LANDING_TIMES = BOINGS.reduce<number[]>((times, b) => [...times, times[times.length - 1] + b.time], [T_TOSS]);
/** When the last boing lands; the limbs ease into the spread-eagle pose from here. */
const T_SETTLED = LANDING_TIMES[LANDING_TIMES.length - 1];
const LIE_DOWN_S = 0.35;
/** Hip height above the roof when lying on the back. */
const LYING_HEIGHT = 5;
/** Rotation of a rider lying on their back, head towards the rear of the car. */
const LYING_ANGLE = Math.PI * 1.5;
/** How far along the roof the rider lands, as a fraction of the car's width. */
const ROOF_CENTRE = 0.42;
/** Where each landing is on the roof, relative to the centre: toss, boing 1, 2 and 3. */
const LAND_DX = [-4, 0, 5, 8] as const;

/** Arms and legs flung wide while tumbling, and the sprawl once lying on the roof. */
const FLAIL = {
  footL: [-6.5, 11] as Offset,
  footR: [9, 9] as Offset,
  handL: [-10, 3] as Offset,
  handR: [8, -5] as Offset,
};
const SPRAWL = {
  footL: [10, 8] as Offset,
  footR: [-1, 12.5] as Offset,
  handL: [11, -3] as Offset,
  handR: [6, -10] as Offset,
};

function mix(a: Offset, b: Offset, t: number): Offset {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

/** Hip position and rotation of the rider at `t` seconds. */
function riderAt(data: CarBonkData, t: number): RiderPlacement {
  const landY = data.roofY - LYING_HEIGHT;
  const landX = (i: number) => data.roofX + LAND_DX[i];

  if (t < T_TOSS) {
    // Thrown up and over the rear of the car, landing on its roof
    const u = t / T_TOSS;
    return {
      x: lerp(data.startX, landX(0), u),
      y: lerp(data.startY, landY, u) - 34 * 4 * u * (1 - u),
      angle: LYING_ANGLE * u,
    };
  }

  let start = T_TOSS;
  for (let i = 0; i < BOINGS.length; i++) {
    const { height, time } = BOINGS[i];
    if (t < start + time) {
      const u = (t - start) / time;
      // The big boing spins a full turn; the small ones just wobble in the air
      const spin = i === 0 ? Math.PI * 2 * u : 0.35 * Math.sin(Math.PI * u * 2);
      return {
        x: lerp(landX(i), landX(i + 1), u),
        y: landY - height * 4 * u * (1 - u),
        angle: LYING_ANGLE + spin,
      };
    }
    start += time;
  }
  return { x: landX(BOINGS.length), y: landY, angle: LYING_ANGLE };
}

export const carBonkCrash: CrashVariant<CarBonkData> = {
  id: "carBonk",
  duration: DURATION,
  starsFrom: STARS_FROM,
  pop: { text: "BOING!", fill: "#5ad1ff", outline: "#0a2f55" },

  init(cs, { player: p, speed, cause }) {
    const speedFactor = speed / INITIAL_SPEED;
    // Only ever picked for an obstacle cause; fall back to a guess ahead of the rider otherwise
    const car = cause.kind === "obstacle" ? cause.obstacle : null;
    const data: CarBonkData = {
      kind: "carBonk",
      startX: p.x + HIP_FROM_PLAYER[0],
      startY: p.y + HIP_FROM_PLAYER[1],
      roofX: car ? car.x + car.width * ROOF_CENTRE : p.x + 80,
      roofY: car ? car.y : p.y + p.height * 0.6,
    };
    placeRider(cs, data.startX, data.startY);
    // The bike bounces back off the rear bumper and drops to the road
    launchBikeFromRider(cs, p, { vx: -(1.2 + speedFactor * 0.6), vy: -3.5, spin: 0.1 });
    return data;
  },

  riderAt,

  drawRider(ctx, cs, data, { skin }) {
    const t = cs.anim;

    // Short impact lines where the rider hits the roof
    LANDING_TIMES.forEach((at, i) => {
      const since = t - at;
      if (since < 0 || since > 0.16) return;
      const k = since / 0.16;
      const x = data.roofX + LAND_DX[i];
      ctx.save();
      ctx.globalAlpha *= 1 - k;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (const a of [-1.15, -0.55, 0.05, 0.65, 1.25]) {
        const ang = a - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(ang) * (8 + k * 6), data.roofY + Math.sin(ang) * (8 + k * 6));
        ctx.lineTo(x + Math.cos(ang) * (14 + k * 10), data.roofY + Math.sin(ang) * (14 + k * 10));
        ctx.stroke();
      }
      ctx.restore();
    });

    ctx.save();
    ctx.translate(cs.riderX, cs.riderY);
    ctx.rotate(cs.riderAngle);
    // Flailing in the air, easing into the sprawl once the last boing has landed
    const lie = clamp01((t - T_SETTLED) / LIE_DOWN_S);
    const flop = Math.sin(t * 16) * 1.2 * (1 - lie * 0.6) * (t > T_TOSS ? 1 : 0.4);
    const flail = (o: Offset, sign: number): Offset => [o[0] + sign * flop, o[1] - sign * flop * 0.6];
    const [shoulderX, shoulderY] = UPRIGHT_SHOULDER;
    const hand = (o: Offset): Offset => [shoulderX + o[0], shoulderY + o[1]];
    drawRiderFigure(ctx, skin, {
      footL: flail(mix(FLAIL.footL, SPRAWL.footL, lie), 1),
      footR: flail(mix(FLAIL.footR, SPRAWL.footR, lie), -1),
      shoulder: UPRIGHT_SHOULDER,
      handL: flail(hand(mix(FLAIL.handL, SPRAWL.handL, lie)), -1),
      handR: flail(hand(mix(FLAIL.handR, SPRAWL.handR, lie)), 1),
      dazed: t >= T_TOSS,
    });
    ctx.restore();
  },

  headAnchor: riderHead,
};
