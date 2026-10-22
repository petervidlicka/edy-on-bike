/**
 * The original crash: the rider is thrown forward and tumbles, the bike slides, and
 * both bounce twice before lying still. Also the fallback every other variant gives
 * way to now and then, so crashes stay surprising.
 */
import { CRASH_DURATION, INITIAL_SPEED } from "../constants";
import { drawRiderFigure, UPRIGHT_SHOULDER } from "../rendering/CrashRenderer";
import { CLASSIC_BIKE_REST, riderHead, stepBike, stepBody } from "./physics";
import type { ClassicCrashData, CrashVariant } from "./types";

/** The settled rider's hip rests this far above the ground. */
const RIDER_REST = 15;
/** Share of horizontal speed the rider keeps on each bounce. */
const RIDER_LANDING_FRICTION = 0.7;

export const classicCrash: CrashVariant<ClassicCrashData> = {
  id: "classic",
  duration: CRASH_DURATION,
  starsFrom: 0.55,
  pop: { text: "OOF!", fill: "#ffd23f", outline: "#7a2e00" },

  init(cs, { player: p, speed }) {
    const speedFactor = speed / INITIAL_SPEED;

    // Rider: ejected forward and upward
    cs.riderX = p.x + 10;
    cs.riderY = p.y - 5;
    cs.riderVX = speed * 0.6 + 1.5;
    cs.riderVY = -6 - speedFactor * 2;
    cs.riderAngle = 0;
    cs.riderAngularVel = 0.15 + speedFactor * 0.08;
    cs.riderBounceCount = 0;

    // Carry upward momentum if player was still rising
    if (p.velocityY < 0) {
      cs.riderVY += p.velocityY * 0.5;
    }

    // Bike: slides forward, slight upward kick
    cs.bikeX = p.x;
    cs.bikeY = p.y + p.height * 0.3;
    cs.bikeVX = speed * 0.3;
    cs.bikeVY = -2;
    cs.bikeAngle = 0;
    cs.bikeAngularVel = -0.08;
    cs.bikeBounceCount = 0;
    cs.bikeWheelRotation = p.wheelRotation;
    return { kind: "classic" };
  },

  update(cs, _data, { dt, groundY }) {
    stepBody(cs, "rider", dt, groundY, RIDER_REST, RIDER_LANDING_FRICTION);
    stepBike(cs, dt, groundY, CLASSIC_BIKE_REST);
  },

  drawRider(ctx, cs, _data, { skin }) {
    ctx.save();
    ctx.translate(cs.riderX, cs.riderY);
    ctx.rotate(cs.riderAngle);

    // Limb spread: compact -> ragdoll over first 0.3s
    const spread = Math.min(cs.elapsed / 0.3, 1);
    const [shoulderX, shoulderY] = UPRIGHT_SHOULDER;
    drawRiderFigure(ctx, skin, {
      footL: [-6 * spread, 12],
      footR: [8 * spread, 10],
      shoulder: UPRIGHT_SHOULDER,
      handL: [shoulderX - 10 * spread, shoulderY + 3],
      handR: [shoulderX + 8 * spread, shoulderY - 5 * spread],
    });
    ctx.restore();
  },

  headAnchor: riderHead,
};
