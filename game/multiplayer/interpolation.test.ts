import { describe, expect, it } from "vitest";
import { InterpolationBuffer } from "./interpolation";
import type { GhostSnapshot } from "./protocol";
import { TrickType } from "../types";

function snap(t: number, overrides: Partial<GhostSnapshot> = {}): GhostSnapshot {
  return { t, h: 0, og: true, wr: 0, bt: 0, rl: 0, rc: 0, lt: 0, ba: 0, fd: 1, at: TrickType.NONE, tp: 0, s: 0, ...overrides };
}

/** Sender clock runs 5000ms behind ours; packets take 50ms. */
const OFFSET = 5000;
const TRIP = 50;

/** Buffer rendering 100ms behind, fed snapshots sent at `times` on the sender's clock. */
function filled(times: number[], make: (t: number) => GhostSnapshot = (t) => snap(t, { h: t })): InterpolationBuffer {
  const buf = new InterpolationBuffer(100);
  for (const t of times) buf.push(make(t), t + OFFSET + TRIP);
  return buf;
}

describe("InterpolationBuffer", () => {
  it("has nothing to show before the first snapshot", () => {
    const buf = new InterpolationBuffer();
    expect(buf.get(0)).toBeNull();
    expect(buf.msSinceLatest(0)).toBe(Infinity);
  });

  it("lerps between the two snapshots bracketing the render time, on the sender's clock", () => {
    const buf = filled([0, 100, 200]);
    // Local 5000+50+100+150: render target = 150 on the sender's clock → between t=100 and t=200
    const got = buf.get(OFFSET + TRIP + 100 + 150);
    expect(got?.h).toBeCloseTo(150);
    expect(got?.t).toBeCloseTo(150);
  });

  it("holds the oldest pose before the history and the latest when starved", () => {
    const buf = filled([0, 100]);
    expect(buf.get(0)?.h).toBe(0);
    expect(buf.get(OFFSET + 10_000)?.h).toBe(100);
  });

  it("drops out-of-order snapshots", () => {
    const buf = filled([0, 100]);
    buf.push(snap(50, { h: 999 }), OFFSET + TRIP + 150);
    expect(buf.get(OFFSET + TRIP + 10_000)?.h).toBe(100);
  });

  it("measures staleness from the newest snapshot's send time", () => {
    const buf = filled([0, 100]);
    expect(buf.msSinceLatest(OFFSET + TRIP + 100 + 70)).toBeCloseTo(70);
  });

  it("snaps discrete fields at the midpoint and never lerps a flip across its landing reset", () => {
    const buf = filled([0, 100], (t) => snap(t, { ba: t === 0 ? 300 : 0, og: t === 100, at: t === 0 ? TrickType.SUPERMAN : TrickType.NONE }));
    const early = buf.get(OFFSET + TRIP + 100 + 20); // target 20 → 20% of the way
    expect(early?.ba).toBe(0); // landed: angle reset wins over lerping backwards
    expect(early?.og).toBe(false);
    expect(early?.at).toBe("SUPERMAN");
    const late = buf.get(OFFSET + TRIP + 100 + 80); // target 80
    expect(late?.og).toBe(true);
    expect(late?.at).toBe("NONE");
  });

  it("lerps x only when both snapshots carry it", () => {
    const withX = filled([0, 100], (t) => snap(t, { x: t / 100 }));
    expect(withX.get(OFFSET + TRIP + 100 + 50)?.x).toBeCloseTo(0.5);
    const mixed = filled([0, 100], (t) => (t === 0 ? snap(t) : snap(t, { x: 0.3 })));
    expect(mixed.get(OFFSET + TRIP + 100 + 50)?.x).toBe(0.3);
  });

  it("keeps only the most recent history", () => {
    const buf = filled(Array.from({ length: 30 }, (_, i) => i * 100));
    expect(buf.get(0)?.h).toBe(2000); // the oldest kept is 10 snapshots back
  });
});
