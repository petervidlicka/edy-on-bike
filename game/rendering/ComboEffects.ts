/**
 * Short-lived visual state for the combo meter: the "pop" when a link lands and the
 * white screen flash at high multipliers. Advanced from the Engine's update() so it
 * freezes with the game when paused; ComboRenderer only reads it.
 */
import { COMBO_FLASH_ALPHA, COMBO_FLASH_MS, COMBO_PULSE_MS } from "../constants";

/** Remaining time of each effect, in ms. */
export interface ComboFx {
  pulseMs: number;
  flashMs: number;
}

/** @returns Effects state with nothing playing. */
export function createComboFx(): ComboFx {
  return { pulseMs: 0, flashMs: 0 };
}

/** Starts the meter pop; also the white flash when `flash` is set. */
export function triggerComboFx(fx: ComboFx, flash: boolean): void {
  fx.pulseMs = COMBO_PULSE_MS;
  if (flash) fx.flashMs = COMBO_FLASH_MS;
}

/** Stops every effect (new run, crash). */
export function clearComboFx(fx: ComboFx): void {
  fx.pulseMs = 0;
  fx.flashMs = 0;
}

/**
 * Advances the effects.
 * @param dtMs - Elapsed game time.
 */
export function updateComboFx(fx: ComboFx, dtMs: number): void {
  fx.pulseMs = Math.max(0, fx.pulseMs - dtMs);
  fx.flashMs = Math.max(0, fx.flashMs - dtMs);
}

/** Meter scale: pops to COMBO_PULSE_SCALE and eases back to 1. */
export function pulseScale(fx: ComboFx, peakScale: number): number {
  const t = fx.pulseMs / COMBO_PULSE_MS; // 1 right after a link, 0 settled
  return 1 + (peakScale - 1) * t * t;
}

/** Current opacity of the white flash (0 when idle). */
export function flashAlpha(fx: ComboFx): number {
  return COMBO_FLASH_ALPHA * (fx.flashMs / COMBO_FLASH_MS);
}
