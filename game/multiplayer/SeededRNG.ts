/**
 * Mulberry32 — a fast, seedable 32-bit PRNG.
 * Produces deterministic sequences so all multiplayer clients
 * see identical obstacle spawns from the same seed.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a pseudo-random float in [0, 1). */
  random(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Reset with a new seed. */
  reseed(seed: number): void {
    this.state = seed | 0;
  }
}
