import type { GhostSnapshot } from "./types";

/** ~650ms of history at 15 Hz — enough to bracket the render time despite jitter. */
const MAX_SNAPSHOTS = 10;

/**
 * Interpolation buffer for a single remote player.
 * Keeps a short history of snapshots and renders ~100ms behind real time,
 * lerping between the two snapshots that bracket that moment for smoothness.
 */
export class InterpolationBuffer {
  private snapshots: GhostSnapshot[] = [];

  /**
   * Estimated (our clock − sender's clock) in ms. Every page has its own
   * performance.now() origin, so sender timestamps are meaningless locally
   * until shifted. The smallest observed (arrival − send) gap is the best
   * estimate: it's the true clock difference plus the fastest network trip.
   */
  private clockOffset = Infinity;

  /** How far behind real-time we render (ms). */
  private readonly renderOffset: number;

  constructor(renderOffsetMs = 100) {
    this.renderOffset = renderOffsetMs;
  }

  /**
   * Push a new snapshot. Discards out-of-order packets.
   * @param snapshot - Snapshot as sent, with the sender's timestamp.
   * @param arrivalMs - Local performance.now() when it arrived.
   */
  push(snapshot: GhostSnapshot, arrivalMs: number): void {
    const last = this.snapshots[this.snapshots.length - 1];
    if (last && snapshot.t <= last.t) return; // out-of-order
    this.clockOffset = Math.min(this.clockOffset, arrivalMs - snapshot.t);
    this.snapshots.push(snapshot);
    if (this.snapshots.length > MAX_SNAPSHOTS) this.snapshots.shift();
  }

  /**
   * Time since the newest snapshot was (approximately) sent, on our clock.
   * Normally < ~70ms at 15 Hz; grows once the sender stops (crash, hidden tab, stall).
   */
  msSinceLatest(nowMs: number): number {
    const latest = this.snapshots[this.snapshots.length - 1];
    return latest ? nowMs - (latest.t + this.clockOffset) : Infinity;
  }

  /**
   * Get the interpolated snapshot at the current time.
   * Returns null if we don't have any data yet.
   */
  get(nowMs: number): GhostSnapshot | null {
    const count = this.snapshots.length;
    if (count === 0) return null;

    // Render target expressed on the sender's clock
    const target = nowMs - this.clockOffset - this.renderOffset;

    const oldest = this.snapshots[0];
    const latest = this.snapshots[count - 1];
    if (target <= oldest.t) return oldest;
    if (target >= latest.t) return latest; // starved — hold the last known pose

    for (let i = count - 1; i > 0; i--) {
      const a = this.snapshots[i - 1];
      if (a.t <= target) {
        const b = this.snapshots[i];
        return lerpSnapshot(a, b, (target - a.t) / (b.t - a.t));
      }
    }
    return latest;
  }
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpSnapshot(a: GhostSnapshot, b: GhostSnapshot, t: number): GhostSnapshot {
  return {
    t: lerpNum(a.t, b.t, t),
    h: lerpNum(a.h, b.h, t),
    og: t < 0.5 ? a.og : b.og,
    wr: lerpNum(a.wr, b.wr, t),
    bt: lerpNum(a.bt, b.bt, t),
    rl: lerpNum(a.rl, b.rl, t),
    rc: lerpNum(a.rc, b.rc, t),
    lt: lerpNum(a.lt, b.lt, t),
    // Flip angle resets to 0 on landing; lerping across the reset would spin the ghost backwards
    ba: b.ba < a.ba ? b.ba : lerpNum(a.ba, b.ba, t),
    fd: t < 0.5 ? a.fd : b.fd,
    at: t < 0.5 ? a.at : b.at,
    tp: lerpNum(a.tp, b.tp, t),
    s: Math.round(lerpNum(a.s, b.s, t)),
  };
}
