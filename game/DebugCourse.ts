/**
 * A fixed obstacle course for testing (`?obstacles=`): spawns the given types in order at a
 * fixed gap in place of the random course. It draws nothing from the shared run RNG, so it
 * can never desync a multiplayer course; a run on a debug course is not ranked.
 */
import type { ObstacleInstance, ObstacleType } from "./types";
import { createObstacle, spawnGapPadding } from "./Obstacle";

/** Default distance (px) between debug spawns when none is given. */
const DEFAULT_GAP_PX = 500;

/**
 * @example
 * course.set([ObstacleType.RAMP, ObstacleType.CAR], 400);
 * if (course.active && distance >= course.spawnGap) obstacles.push(course.spawn(right, groundY, playerX));
 */
export class DebugCourse {
  private sequence: ObstacleType[] = [];
  private index = 0;
  private gap = DEFAULT_GAP_PX;
  /** Padding the last spawned mover needs before the next spawn (see spawnGapPadding). */
  private nextPadding = 0;

  /** True while a sequence is set; the Engine then spawns from here instead of the random course. */
  get active(): boolean {
    return this.sequence.length > 0;
  }

  /** Distance (px) to cover before the next spawn: the fixed gap plus the last mover's padding. */
  get spawnGap(): number {
    return this.gap + this.nextPadding;
  }

  /**
   * Replaces the course and starts it over.
   * @param sequence - Types to cycle through, or null to go back to the random course.
   * @param gap - Fixed distance between spawns; the previous value is kept when omitted.
   */
  set(sequence: ObstacleType[] | null, gap?: number): void {
    this.sequence = sequence ?? [];
    this.reset();
    if (gap !== undefined) this.gap = gap;
  }

  /** A new run starts the sequence over. */
  reset(): void {
    this.index = 0;
    this.nextPadding = 0;
  }

  /**
   * Spawns the next type in the sequence (cycling). Only valid while `active`.
   * @param x - Where it appears (the right edge of the widest view).
   */
  spawn(x: number, groundY: number, playerX: number): ObstacleInstance {
    const type = this.sequence[this.index % this.sequence.length];
    const spawned = createObstacle(type, x, groundY, playerX);
    this.nextPadding = spawnGapPadding(spawned);
    this.index++;
    return spawned;
  }
}
