/**
 * The scrolling scenery behind a run: parallax layers (clouds, buildings, road) and the
 * weather overlay, plus the hand-off between biomes. On a biome change the next biome's
 * buildings queue up just past the right edge and scroll in behind the current ones;
 * clouds and weather cross-fade. Nothing is rebuilt mid-run, so nothing on screen jumps.
 */
import type { BackgroundLayer, BackgroundElement } from "./types";
import type { BackgroundDrawFn, EnvironmentDefinition, EnvironmentPalette, ParticleOverlayConfig, SkylinePass } from "./environments/types";
import { createBackgroundLayers, createCloudLayer, getTotalLayerWidth, updateLayers } from "./Background";
import { createParticles, updateParticles, drawBackground, drawParticles } from "./rendering";
import type { Particle } from "./rendering";
import type { ViewBounds } from "./Camera";

/** Space between the last outgoing building and the first incoming one. */
const BIOME_GAP_PX = 300;

/** A biome's weather (snow, sand, rain) and its particles. */
interface Weather {
  config: ParticleOverlayConfig;
  particles: Particle[];
}

/**
 * Owns the background layers and weather for one Engine.
 * @example
 * const scenery = new BiomeScenery(env, canvasW, canvasH, groundY);
 * scenery.beginBiomeChange(fromEnv, toEnv, widestView); // transition starts
 * scenery.update(speed, dt, widestView.left);           // every running frame
 * scenery.endBiomeChange();                             // transition done
 */
export class BiomeScenery {
  /** [clouds, buildings, road] — see createBackgroundLayers. */
  private layers: BackgroundLayer[];
  /** The previous biome's clouds while they fade out. */
  private outgoingClouds: BackgroundLayer | null = null;
  private weather: Weather | null = null;
  /** The previous biome's weather while it fades out. */
  private outgoingWeather: Weather | null = null;
  /**
   * Building-layer x where the incoming biome starts while the outgoing biome's buildings are
   * still on screen; those are dropped (and the layer rebased) once this scrolls off the left.
   */
  private incomingBuildingsX: number | null = null;
  /** Drawers for the buildings on screen: both biomes' while outgoing ones remain. */
  private drawers: Record<string, BackgroundDrawFn>;
  /** The incoming biome's drawers alone, which take over once the outgoing buildings are gone. */
  private incomingDrawers: Record<string, BackgroundDrawFn>;
  private canvasW: number;
  private canvasH: number;
  private groundY: number;

  constructor(env: EnvironmentDefinition, canvasW: number, canvasH: number, groundY: number) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.groundY = groundY;
    this.layers = createBackgroundLayers(canvasW, groundY, env);
    this.drawers = env.backgroundDrawers;
    this.incomingDrawers = env.backgroundDrawers;
    this.weather = createWeather(env, canvasW, canvasH);
  }

  /**
   * Rebuilds everything for `env` at a new size or for a fresh run. Any biome change in
   * progress is dropped, so pass the biome being transitioned to.
   */
  reset(env: EnvironmentDefinition, canvasW: number, canvasH: number, groundY: number): void {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.groundY = groundY;
    this.layers = createBackgroundLayers(canvasW, groundY, env);
    this.outgoingClouds = null;
    this.outgoingWeather = null;
    this.incomingBuildingsX = null;
    this.drawers = env.backgroundDrawers;
    this.incomingDrawers = env.backgroundDrawers;
    this.weather = createWeather(env, canvasW, canvasH);
  }

  /**
   * A transition into `toEnv` started: queue its buildings just past the widest view so they
   * scroll in behind the current ones, and start cross-fading clouds and weather.
   * @returns How far (px of building-layer scroll) until the incoming buildings fill the view.
   */
  beginBiomeChange(fromEnv: EnvironmentDefinition, toEnv: EnvironmentDefinition, widestView: ViewBounds): number {
    // A previous hand-off still under way (very fast forced changes): finish it now
    if (this.incomingBuildingsX !== null) this.dropOutgoingBuildings();

    const buildings = this.layers[1];
    const width = getTotalLayerWidth(buildings, this.canvasW);
    // Unwrap the layer: keep the outgoing buildings at the positions they're drawn at now
    // (wrapped copies included), so the incoming ones can follow without the row jumping.
    const norm = ((buildings.offset % width) + width) % width;
    const kept: BackgroundElement[] = [];
    let keptRight = widestView.right;
    for (const el of buildings.elements) {
      for (const shift of [-width, 0, width]) {
        const screenX = el.x + shift - norm;
        if (screenX + el.width < widestView.left || screenX > widestView.right) continue;
        kept.push({ ...el, x: el.x + shift });
        keptRight = Math.max(keptRight, screenX + el.width);
      }
    }
    kept.sort((a, b) => a.x - b.x);

    const startX = norm + keptRight + BIOME_GAP_PX;
    const incoming = toEnv.background.generateElements(this.canvasW, this.groundY, toEnv.palette);
    for (const el of incoming) el.x += startX;
    buildings.elements = [...kept, ...incoming];
    buildings.offset = norm;
    buildings.speedRatio = toEnv.background.buildingSpeedRatio;
    this.incomingBuildingsX = startX;
    this.drawers = { ...fromEnv.backgroundDrawers, ...toEnv.backgroundDrawers };
    this.incomingDrawers = toEnv.backgroundDrawers;

    // Same offset as the outgoing clouds, so skylines (which scroll with them) don't jump
    this.outgoingClouds = this.layers[0];
    this.layers[0] = createCloudLayer(this.canvasW, this.groundY, toEnv, this.outgoingClouds.offset);
    this.outgoingWeather = this.weather;
    this.weather = createWeather(toEnv, this.canvasW, this.canvasH);
    return startX - norm - widestView.left;
  }

  /** The transition finished: the outgoing clouds and weather have faded out. */
  endBiomeChange(): void {
    this.outgoingClouds = null;
    this.outgoingWeather = null;
  }

  /**
   * Scrolls the layers and weather by one frame and drops the outgoing biome's
   * buildings once they've all left the screen.
   * @param viewLeft - Left edge of the widest (most zoomed-out) view.
   */
  update(speed: number, dt: number, viewLeft: number): void {
    updateLayers(this.layers, speed, dt);
    if (this.outgoingClouds) updateLayers([this.outgoingClouds], speed, dt);
    for (const weather of [this.weather, this.outgoingWeather]) {
      if (weather) updateParticles(weather.particles, weather.config, dt, this.canvasW, this.canvasH);
    }
    const buildings = this.layers[1];
    if (this.incomingBuildingsX !== null && this.incomingBuildingsX - buildings.offset <= viewLeft) {
      this.dropOutgoingBuildings();
    }
  }

  /**
   * Draws sky, scenery and road (in world space, under the camera).
   * @param fade - Eased biome-change progress 0–1, or null outside a change.
   * @param nowMs - Scene clock (engine time that stops while paused) for animated scenery.
   */
  drawWorld(
    ctx: CanvasRenderingContext2D,
    view: ViewBounds,
    palette: EnvironmentPalette,
    skylines: readonly SkylinePass[],
    roadOverlays: readonly SkylinePass[],
    fade: number | null,
    nowMs: number,
  ): void {
    const outgoingClouds = this.outgoingClouds && fade !== null ? { layer: this.outgoingClouds, alpha: 1 - fade } : null;
    drawBackground(ctx, {
      layers: this.layers,
      canvasW: this.canvasW,
      view,
      groundY: this.groundY,
      palette,
      drawers: this.drawers,
      skylines,
      roadOverlays,
      cloudAlpha: fade ?? 1,
      outgoingClouds,
      nowMs,
    });
  }

  /**
   * Draws the weather overlay (in screen space).
   * @param fade - Eased biome-change progress 0–1, or null outside a change.
   */
  drawWeather(ctx: CanvasRenderingContext2D, fade: number | null): void {
    if (this.outgoingWeather && fade !== null) {
      drawParticles(ctx, this.outgoingWeather.particles, this.outgoingWeather.config, 1 - fade);
    }
    if (this.weather) drawParticles(ctx, this.weather.particles, this.weather.config, fade ?? 1);
  }

  /** Removes the outgoing biome's buildings and rebases the layer so the incoming ones start at 0. */
  private dropOutgoingBuildings(): void {
    const startX = this.incomingBuildingsX;
    if (startX === null) return;
    const buildings = this.layers[1];
    buildings.elements = buildings.elements.filter((el) => el.x >= startX);
    for (const el of buildings.elements) el.x -= startX;
    // Same screen positions: drawn at el.x - offset, both shifted by startX
    buildings.offset -= startX;
    this.incomingBuildingsX = null;
    this.drawers = this.incomingDrawers;
  }
}

/** Fresh weather for a biome, or null if it has none. */
function createWeather(env: EnvironmentDefinition, canvasW: number, canvasH: number): Weather | null {
  const config = env.particleOverlay;
  return config ? { config, particles: createParticles(canvasW, canvasH, config) } : null;
}
