/**
 * Big-air camera: zooms the scene out while the rider climbs above the top of the
 * screen (container and curved-ramp launches go ~2× higher than the sky we show),
 * then eases back in on the way down. Purely a render transform — physics, speed and
 * the shared multiplayer course never see it — anchored on the road at the rider's
 * home x so the ground line and the rider's horizontal position stay put.
 */
import { PLAYER_X_RATIO } from "./constants";

/** Furthest zoom-out; beyond this the scene gets too small, and the height marker takes over. */
export const MIN_CAMERA_ZOOM = 0.6;
/** Keep the rider's top edge this far below the top of the screen (fraction of groundY). */
const TOP_MARGIN_RATIO = 0.18;
/** Zoom out quickly so a fast launch doesn't clip; drift back in gently. */
const ZOOM_OUT_TAU_MS = 90;
const ZOOM_IN_TAU_MS = 450;

/** The world-space rectangle visible on screen at a given zoom. */
export interface ViewBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Zoom pivot x: the rider's home position, so zooming never slides them sideways. */
export function cameraPivotX(canvasW: number): number {
  return canvasW * PLAYER_X_RATIO;
}

/**
 * @returns The world rectangle on screen at `zoom`. Pass MIN_CAMERA_ZOOM for the widest
 * view the camera can ever show — where obstacles must spawn and be culled so they
 * never pop in or out on screen.
 */
export function getViewBounds(zoom: number, canvasW: number, canvasH: number, groundY: number): ViewBounds {
  const px = cameraPivotX(canvasW);
  return {
    left: px - px / zoom,
    right: px + (canvasW - px) / zoom,
    top: groundY - groundY / zoom,
    bottom: groundY + (canvasH - groundY) / zoom,
  };
}

/**
 * Smoothed zoom for one engine.
 * @example
 * camera.update(rawDt, player.y, groundY);
 * ctx.save(); camera.apply(ctx, canvasW, groundY); drawWorld(); ctx.restore();
 */
export class Camera {
  zoom = 1;

  /**
   * @param rawDt - Real milliseconds since the last frame.
   * @param focusTopY - World y of the rider's top edge, or null to ease back to 1×.
   * @param groundY - World y of the road surface.
   */
  update(rawDt: number, focusTopY: number | null, groundY: number): void {
    let target = 1;
    if (focusTopY !== null) {
      const rise = groundY - focusTopY;
      const allowed = groundY * (1 - TOP_MARGIN_RATIO);
      if (rise > allowed) target = Math.max(MIN_CAMERA_ZOOM, allowed / rise);
    }
    const tau = target < this.zoom ? ZOOM_OUT_TAU_MS : ZOOM_IN_TAU_MS;
    this.zoom += (target - this.zoom) * (1 - Math.exp(-rawDt / tau));
    if (Math.abs(target - this.zoom) < 0.001) this.zoom = target;
  }

  /** Multiplies the zoom onto ctx's current transform (call inside save/restore). */
  apply(ctx: CanvasRenderingContext2D, canvasW: number, groundY: number): void {
    if (this.zoom === 1) return;
    const px = cameraPivotX(canvasW);
    ctx.translate(px, groundY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-px, -groundY);
  }

  /** @returns Where a world point lands on screen at the current zoom. */
  toScreen(x: number, y: number, canvasW: number, groundY: number): { x: number; y: number } {
    const px = cameraPivotX(canvasW);
    return { x: px + (x - px) * this.zoom, y: groundY + (y - groundY) * this.zoom };
  }

  reset(): void {
    this.zoom = 1;
  }
}
