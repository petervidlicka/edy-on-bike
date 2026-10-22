/**
 * Tree hang, for the three tree obstacles: the rider is flung up into the crown,
 * snagged by the back of the shirt, and dangles there swinging like a pendulum with
 * limp arms and legs while a few leaves drift down. The bike bounces off the trunk
 * and falls to the road below. A few clumps of foliage are painted over the rider's
 * back so they look caught in the branches rather than stuck on in front.
 */
import { INITIAL_SPEED, PLAYER_WIDTH, PLAYER_HEIGHT } from "../constants";
import { ObstacleType } from "../types";
import { OBSTACLE_SPECS } from "../Obstacle";
import { drawRiderFigure, UPRIGHT_SHOULDER } from "../rendering/CrashRenderer";
import type { Offset } from "../rendering/CrashRenderer";
import type { EnvironmentPalette } from "../environments/types";
import { figurePoint, HEAD_OFFSET, launchBike, lerp, stepBike } from "./physics";
import type { CrashVariant, TreeHangData } from "./types";

const T_FLY = 0.32;
const DURATION = 2.1;
const STARS_FROM = 0.75;
const BIKE_REST = 20;

/** Swing of the dangling rider: first peak in radians, decay per second, angular speed. */
const SWING_AMPLITUDE = 0.5;
const SWING_DECAY = 1.5;
const SWING_SPEED = 6;

/** Hip of an upright rider on the bike, relative to the player box. */
const HIP_FROM_PLAYER: Offset = [27, 24];
/** Where the branch catches the shirt: between the shoulder blades, relative to the hip. */
const HOOK_OFFSET: Offset = [1, -12];

/** Hook depth (fraction of the tree's height, from the top) for a type whose spec has none. */
const DEFAULT_HOOK_DEPTH = 0.3;

/** Falling leaves: sideways offset from the hook, delay before they let go, sway phase, size. */
const LEAVES = [
  { dx: -10, delay: 0.0, phase: 0.0, size: 2.8 },
  { dx: 7, delay: 0.05, phase: 1.3, size: 2.4 },
  { dx: -4, delay: 0.12, phase: 2.6, size: 3.0 },
  { dx: 12, delay: 0.2, phase: 0.7, size: 2.5 },
  { dx: -13, delay: 0.3, phase: 3.9, size: 2.6 },
  { dx: 3, delay: 0.42, phase: 5.1, size: 2.9 },
  { dx: 9, delay: 0.6, phase: 2.0, size: 2.4 },
  { dx: -7, delay: 0.8, phase: 4.4, size: 2.7 },
] as const;
const LEAF_FALL_SPEED = 55;

/** Foliage painted over the rider's back: offsets from the hook and ellipse radii. Small, so the face stays clear. */
const FOLIAGE = [
  { dx: -6, dy: 0, rx: 5, ry: 3.4 },
  { dx: -1, dy: 7, rx: 4.5, ry: 3 },
  { dx: 5, dy: 3, rx: 3.6, ry: 2.6 },
] as const;

function foliageColors(palette: EnvironmentPalette, type: ObstacleType): { base: string; light: string; edge: string } {
  const c = palette.obstacle;
  return type === ObstacleType.GIANT_TREE
    ? { base: c.giantTreeCanopy, light: c.giantTreeCanopyHighlight, edge: c.giantTreeOutline }
    : { base: c.tree, light: c.treeHighlight, edge: c.treeTrunkShadow };
}

/** Swing angle of the hanging rider `s` seconds after the snag. */
function swingAngle(s: number): number {
  return SWING_AMPLITUDE * Math.exp(-SWING_DECAY * s) * Math.sin(SWING_SPEED * s);
}

/** Hip position and rotation of the rider at `t` seconds. */
function riderAt(data: TreeHangData, t: number): { x: number; y: number; angle: number } {
  // Upright and hanging straight, the hip sits below the hook by the hook's own offset
  const restX = data.hookX - HOOK_OFFSET[0];
  const restY = data.hookY - HOOK_OFFSET[1];

  if (t < T_FLY) {
    // Thrown up and forward in a somersault that ends upright right at the branch
    const u = t / T_FLY;
    const spin = 1 - (1 - u) * (1 - u);
    return {
      x: lerp(data.startX, restX, u),
      y: lerp(data.startY, restY, u) - 20 * 4 * u * (1 - u),
      angle: Math.PI * 2 * spin,
    };
  }

  const s = t - T_FLY;
  const angle = swingAngle(s);
  // The shirt stretches a little when it catches, then springs back
  const jolt = 5 * Math.exp(-9 * s) * Math.abs(Math.sin(20 * s));
  const hook = figurePoint(0, 0, angle, HOOK_OFFSET);
  return { x: data.hookX - hook.x, y: data.hookY - hook.y + jolt, angle };
}

export const treeHangCrash: CrashVariant<TreeHangData> = {
  id: "treeHang",
  duration: DURATION,
  starsFrom: STARS_FROM,
  pop: { text: "BONK!", fill: "#7be05a", outline: "#133a0c" },

  init(cs, { player: p, speed, cause }) {
    const speedFactor = speed / INITIAL_SPEED;
    // Only ever picked for an obstacle cause; the guard keeps the types honest
    const tree = cause.kind === "obstacle" ? cause.obstacle : null;
    const treeBox = tree
      ? { type: tree.type, x: tree.x, y: tree.y, width: tree.width, height: tree.height }
      : { type: ObstacleType.SMALL_TREE, x: p.x + 50, y: p.y, width: 22, height: 48 };
    const data: TreeHangData = {
      kind: "treeHang",
      startX: p.x + HIP_FROM_PLAYER[0],
      startY: p.y + HIP_FROM_PLAYER[1],
      hookX: treeBox.x + treeBox.width / 2,
      hookY: treeBox.y + treeBox.height * (OBSTACLE_SPECS[treeBox.type].hookDepth ?? DEFAULT_HOOK_DEPTH),
      tree: treeBox,
    };
    cs.riderX = data.startX;
    cs.riderY = data.startY;
    cs.riderAngle = 0;
    cs.riderVX = cs.riderVY = cs.riderAngularVel = 0;
    cs.riderBounceCount = 0;
    // The bike bounces back off the trunk and drops to the road
    launchBike(
      cs,
      { x: p.x + PLAYER_WIDTH / 2, y: p.y + PLAYER_HEIGHT / 2 },
      p.wheelRotation,
      { vx: -(1 + speedFactor * 0.6), vy: -3, spin: 0.12 },
    );
    return data;
  },

  update(cs, data, { dt, groundY }) {
    stepBike(cs, dt, groundY, BIKE_REST);
    const r = riderAt(data, cs.anim);
    cs.riderX = r.x;
    cs.riderY = r.y;
    cs.riderAngle = r.angle;
  },

  drawRider(ctx, cs, data, { skin, palette, groundY }) {
    const t = cs.anim;
    const s = t - T_FLY;
    const hanging = s >= 0;
    const settle = hanging ? Math.exp(-SWING_DECAY * s) : 1;

    ctx.save();
    ctx.translate(cs.riderX, cs.riderY);
    ctx.rotate(cs.riderAngle);

    // Limbs lag behind the body: they swing against it, plus a lazy wobble that dies away
    const body = hanging ? swingAngle(s) : 0;
    const wobble = hanging ? 0.25 * settle * Math.sin(SWING_SPEED * 1.7 * s) : 0;
    const legRel = hanging ? -0.7 * body + wobble : 0.5;
    const armRel = hanging ? -0.5 * body + 0.4 * settle * Math.sin(SWING_SPEED * 2.2 * s) : -0.4;
    const [shoulderX, shoulderY] = UPRIGHT_SHOULDER;
    const reach = 12;
    drawRiderFigure(ctx, skin, {
      footL: [Math.sin(-0.12 + legRel) * 12.5, Math.cos(-0.12 + legRel) * 12.5],
      footR: [Math.sin(0.22 + legRel * 1.1) * 11, Math.cos(0.22 + legRel * 1.1) * 11],
      shoulder: UPRIGHT_SHOULDER,
      handL: [shoulderX + Math.sin(-0.55 + armRel) * reach, shoulderY + Math.cos(-0.55 + armRel) * reach],
      handR: [shoulderX + Math.sin(0.55 + armRel) * reach, shoulderY + Math.cos(0.55 + armRel) * reach],
      dazed: hanging,
    });
    ctx.restore();

    if (!hanging) return;

    // Foliage in front of the rider's back, so the branch seems to hold them
    const colors = foliageColors(palette, data.tree.type);
    const rustle = Math.sin(s * 14) * 1.2 * settle;
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = colors.edge;
    FOLIAGE.forEach((f, i) => {
      ctx.fillStyle = i % 2 === 0 ? colors.base : colors.light;
      ctx.beginPath();
      ctx.ellipse(data.hookX + f.dx + (i % 2 === 0 ? rustle : -rustle), data.hookY + f.dy, f.rx, f.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Leaves shaken loose, drifting down to the road
    for (let i = 0; i < LEAVES.length; i++) {
      const leaf = LEAVES[i];
      const tau = s - leaf.delay;
      if (tau <= 0) continue;
      const y = Math.min(groundY - 2, data.hookY - 4 + LEAF_FALL_SPEED * tau);
      const landed = y >= groundY - 2;
      const x = data.hookX + leaf.dx + (landed ? 0 : Math.sin(tau * 4 + leaf.phase) * 7);
      ctx.fillStyle = i % 2 === 0 ? colors.base : colors.light;
      ctx.beginPath();
      ctx.ellipse(x, y, leaf.size, leaf.size * 0.5, landed ? 0.1 * i : Math.sin(tau * 3 + leaf.phase), 0, Math.PI * 2);
      ctx.fill();
    }
  },

  headAnchor(cs) {
    return figurePoint(cs.riderX, cs.riderY, cs.riderAngle, HEAD_OFFSET);
  },
};
