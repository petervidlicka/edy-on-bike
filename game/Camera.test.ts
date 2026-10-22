import { describe, expect, it } from "vitest";
import { Camera, cameraPivotX, getViewBounds, MIN_CAMERA_ZOOM } from "./Camera";

const W = 1000;
const H = 600;
const GROUND = 450;

describe("getViewBounds", () => {
  it("is the canvas at 1× and widens around the pivot when zoomed out", () => {
    expect(cameraPivotX(W)).toBe(200);
    expect(getViewBounds(1, W, H, GROUND)).toEqual({ left: 0, right: W, top: 0, bottom: H });
    expect(getViewBounds(0.5, W, H, GROUND)).toEqual({ left: -200, right: 1800, top: -450, bottom: 750 });
  });
});

describe("Camera", () => {
  it("stays at 1× while the rider is below the top margin", () => {
    const camera = new Camera();
    camera.update(1000, GROUND - 100, GROUND);
    expect(camera.zoom).toBe(1);
  });

  it("zooms out no further than MIN_CAMERA_ZOOM and eases back to 1× with nothing to follow", () => {
    const camera = new Camera();
    camera.update(100_000, -100_000, GROUND); // a huge step converges on the target
    expect(camera.zoom).toBe(MIN_CAMERA_ZOOM);
    camera.update(100_000, null, GROUND);
    expect(camera.zoom).toBe(1);
  });

  it("maps world points through the pivot and ground line", () => {
    const camera = new Camera();
    camera.zoom = 0.5;
    expect(camera.toScreen(200, GROUND, W, GROUND)).toEqual({ x: 200, y: GROUND });
    expect(camera.toScreen(1200, GROUND - 400, W, GROUND)).toEqual({ x: 700, y: GROUND - 200 });
    camera.reset();
    expect(camera.zoom).toBe(1);
  });
});
