import type { GhostSnapshot } from "./types";
import { TrickType } from "../types";

/**
 * Interpolation buffer for a single remote player.
 * Holds the two most recent snapshots and lerps between them
 * with a render offset (~100ms behind real-time) for smoothness.
 */
export class InterpolationBuffer {
  private prev: GhostSnapshot | null = null;
  private next: GhostSnapshot | null = null;

  /** How far behind real-time we render (ms). */
  private readonly renderOffset: number;

  constructor(renderOffsetMs = 100) {
    this.renderOffset = renderOffsetMs;
  }

  /** Push a new snapshot. Discards out-of-order packets. */
  push(snapshot: GhostSnapshot): void {
    if (this.next && snapshot.t <= this.next.t) return; // out-of-order
    this.prev = this.next;
    this.next = snapshot;
  }

  /**
   * Get the interpolated snapshot at the current time.
   * Returns null if we don't have enough data yet.
   */
  get(nowMs: number): GhostSnapshot | null {
    if (!this.next) return null;
    if (!this.prev) return this.next;

    const renderTime = nowMs - this.renderOffset;
    const duration = this.next.t - this.prev.t;
    if (duration <= 0) return this.next;

    const t = Math.max(0, Math.min(1, (renderTime - this.prev.t) / duration));
    return lerpSnapshot(this.prev, this.next, t);
  }

  /** True if we've received at least one snapshot. */
  hasData(): boolean {
    return this.next !== null;
  }

  /** Get the latest raw snapshot (no interpolation). */
  latest(): GhostSnapshot | null {
    return this.next;
  }
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpSnapshot(a: GhostSnapshot, b: GhostSnapshot, t: number): GhostSnapshot {
  return {
    t: lerpNum(a.t, b.t, t),
    y: lerpNum(a.y, b.y, t),
    og: t < 0.5 ? a.og : b.og,
    wr: lerpNum(a.wr, b.wr, t),
    bt: lerpNum(a.bt, b.bt, t),
    rl: lerpNum(a.rl, b.rl, t),
    rc: lerpNum(a.rc, b.rc, t),
    lt: lerpNum(a.lt, b.lt, t),
    ba: lerpNum(a.ba, b.ba, t),
    fd: t < 0.5 ? a.fd : b.fd,
    at: t < 0.5 ? a.at : b.at,
    tp: lerpNum(a.tp, b.tp, t),
    s: Math.round(lerpNum(a.s, b.s, t)),
    a: b.a, // alive state uses latest
  };
}
