/**
 * The scene clock: scenery time in milliseconds, owned by the engine and advanced only
 * while the game loop runs. Lanterns, flags, trains, steam and blinking lamps animate
 * off it rather than performance.now(), so they freeze on the paused frame along with
 * everything else instead of running on wall-clock time.
 *
 * The draw entry points (drawBackground, drawObstacle) set it for the renderers they
 * call: the biome drawer signatures (BackgroundDrawFn, SkylineDrawFn) are fixed in
 * environments/types.ts, so the clock can't travel as a parameter past them.
 */
let sceneMs = 0;

/** Sets the clock the scenery renderers read for this draw. */
export function setSceneTimeMs(ms: number): void {
  sceneMs = ms;
}

/** Scenery time in ms, as set by the current draw entry point. */
export function sceneTimeMs(): number {
  return sceneMs;
}
