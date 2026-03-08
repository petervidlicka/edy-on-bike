import type { TerrainConfig } from "./environments/types";

interface TerrainSegment {
  startX: number;
  length: number;
  type: "flat" | "hills";
  /** Baked amplitude for this segment (from config at generation time). */
  amplitude: number;
  /** Baked wavelength for this segment (from config at generation time). */
  wavelength: number;
}

function smoothStep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Terrain {
  private config: TerrainConfig;
  private segments: TerrainSegment[] = [];
  private hillsActive = false;
  private hillsStartX = Infinity;

  constructor(config: TerrainConfig) {
    this.config = config;
    // Start with one massive flat segment
    this.segments = [{
      startX: 0,
      length: 200_000,
      type: "flat",
      amplitude: 0,
      wavelength: config.hillWavelength,
    }];
  }

  /** Update terrain config (e.g. on biome change). New segments use the new config. */
  setConfig(config: TerrainConfig): void {
    this.config = config;
  }

  /** Activate hills starting from a world X position (called when delay elapses). */
  activateHills(currentWorldX: number): void {
    if (this.hillsActive) return;
    this.hillsActive = true;
    // First hill segment starts 300px ahead of current position
    this.hillsStartX = currentWorldX + 300;

    // Replace the initial flat segment with a properly-sized one
    this.segments = [{
      startX: 0,
      length: this.hillsStartX,
      type: "flat",
      amplitude: 0,
      wavelength: this.config.hillWavelength,
    }];
    // Generate segments ahead
    this.generateSegments(this.hillsStartX + 5000);
  }

  /**
   * Returns Y offset from base groundY at a given world X position.
   * Negative = higher ground (hill peak). Positive = lower ground (valley).
   */
  getGroundYOffset(worldX: number): number {
    if (!this.hillsActive || this.config.hillAmplitude === 0) return 0;

    this.generateSegments(worldX + 3000);

    const seg = this.getSegmentAt(worldX);
    if (!seg || seg.type === "flat") {
      // Check if we're in a transition zone at the boundary of a hills segment
      return this.getTransitionBleed(worldX);
    }

    const envelope = this.computeEnvelope(worldX, seg);
    if (envelope === 0) return 0;

    const raw = this.rawHillHeight(worldX, seg.amplitude, seg.wavelength);
    return -raw * envelope;
  }

  /** Returns terrain slope angle in radians at worldX. */
  getSlopeAngle(worldX: number): number {
    const dx = 2;
    const y1 = this.getGroundYOffset(worldX - dx);
    const y2 = this.getGroundYOffset(worldX + dx);
    return Math.atan2(y2 - y1, dx * 2);
  }

  /**
   * Check if a world X range is entirely in a flat zone (excluding transition edges).
   * Used to determine if long/wide obstacles can be placed here.
   */
  isFlatZone(worldX: number, width: number): boolean {
    if (!this.hillsActive || this.config.hillAmplitude === 0) return true;

    this.generateSegments(worldX + width + 2000);

    const transition = this.config.transitionLength;
    // Check if the entire range falls within a flat segment's safe interior
    for (const seg of this.segments) {
      if (seg.type !== "flat") continue;
      const safeStart = seg.startX + transition;
      const safeEnd = seg.startX + seg.length - transition;
      if (worldX >= safeStart && worldX + width <= safeEnd) {
        return true;
      }
    }
    return false;
  }

  /** Reset terrain (e.g. on game restart). */
  reset(config: TerrainConfig): void {
    this.config = config;
    this.hillsActive = false;
    this.hillsStartX = Infinity;
    this.segments = [{
      startX: 0,
      length: 200_000,
      type: "flat",
      amplitude: 0,
      wavelength: config.hillWavelength,
    }];
  }

  /** Remove segments that are far behind the camera to save memory. */
  cullOldSegments(currentWorldX: number): void {
    const cullBefore = currentWorldX - 1000;
    while (this.segments.length > 1 && this.segments[0].startX + this.segments[0].length < cullBefore) {
      this.segments.shift();
    }
  }

  // ── Internal ──

  private rawHillHeight(worldX: number, amplitude: number, wavelength: number): number {
    const freq = Math.PI * 2 / wavelength;
    return amplitude * (
      0.6 * Math.sin(worldX * freq) +
      0.4 * Math.sin(worldX * freq * 1.7 + 2.1)
    );
  }

  private computeEnvelope(worldX: number, seg: TerrainSegment): number {
    const transition = this.config.transitionLength;
    const distFromStart = worldX - seg.startX;
    const distFromEnd = (seg.startX + seg.length) - worldX;

    let blend = 1;
    if (distFromStart < transition) {
      blend = Math.min(blend, smoothStep(distFromStart / transition));
    }
    if (distFromEnd < transition) {
      blend = Math.min(blend, smoothStep(distFromEnd / transition));
    }
    return blend;
  }

  /**
   * When we're in a flat segment near a hills segment boundary,
   * compute any bleed from the adjacent hills segment's transition zone.
   */
  private getTransitionBleed(worldX: number): number {
    const transition = this.config.transitionLength;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (seg.type !== "hills") continue;

      // Check if worldX is just before this hills segment starts
      const distBefore = seg.startX - worldX;
      if (distBefore > 0 && distBefore < transition) {
        const blend = smoothStep(1 - distBefore / transition);
        const raw = this.rawHillHeight(worldX, seg.amplitude, seg.wavelength);
        return -raw * blend;
      }

      // Check if worldX is just after this hills segment ends
      const segEnd = seg.startX + seg.length;
      const distAfter = worldX - segEnd;
      if (distAfter > 0 && distAfter < transition) {
        const blend = smoothStep(1 - distAfter / transition);
        const raw = this.rawHillHeight(worldX, seg.amplitude, seg.wavelength);
        return -raw * blend;
      }
    }

    return 0;
  }

  private getSegmentAt(worldX: number): TerrainSegment | null {
    // Search backwards since we're usually near the end
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      if (worldX >= seg.startX && worldX < seg.startX + seg.length) {
        return seg;
      }
    }
    return null;
  }

  private generateSegments(upTo: number): void {
    if (!this.hillsActive) return;

    while (true) {
      const lastSeg = this.segments[this.segments.length - 1];
      const lastEnd = lastSeg.startX + lastSeg.length;
      if (lastEnd >= upTo) break;

      const nextType = lastSeg.type === "flat" ? "hills" : "flat";
      const config = this.config;
      let length: number;

      if (nextType === "hills") {
        length = config.hillSegmentMin +
          Math.random() * (config.hillSegmentMax - config.hillSegmentMin);
      } else {
        length = config.flatSegmentMin +
          Math.random() * (config.flatSegmentMax - config.flatSegmentMin);
      }

      this.segments.push({
        startX: lastEnd,
        length,
        type: nextType,
        amplitude: nextType === "hills" ? config.hillAmplitude : 0,
        wavelength: config.hillWavelength,
      });
    }
  }
}
