/**
 * Haptic feedback for game moments. Native builds use the Capacitor Haptics plugin
 * (Taptic Engine / Android vibrator); the web falls back to `navigator.vibrate`,
 * which only Android browsers implement. Everything here is fire-and-forget so the
 * game loop never waits on, or breaks because of, a vibration.
 */
import { isNative, prefersCoarsePointer } from "./platform";

/** The moments the game can buzz for. */
export type HapticKind = "tap" | "land" | "bigLand" | "comboUp" | "crash" | "success";

type ImpactStyle = "Light" | "Medium" | "Heavy";
type NotificationType = "Success" | "Error";

/** Native feedback per kind: an impact weight or a notification pattern. */
const NATIVE: Record<HapticKind, { impact: ImpactStyle } | { notification: NotificationType }> = {
  tap: { impact: "Light" },
  land: { impact: "Medium" },
  bigLand: { impact: "Heavy" },
  comboUp: { impact: "Light" },
  crash: { notification: "Error" },
  success: { notification: "Success" },
};

/** Web vibration patterns in milliseconds (coarse: browsers only offer on/off timing). */
const WEB_PATTERN: Record<HapticKind, number | number[]> = {
  tap: 10,
  land: 20,
  bigLand: 40,
  comboUp: 10,
  crash: [60, 40, 80],
  success: [30, 50, 30],
};

let enabled = true;
let warned = false;

/** Logs the first plugin failure only; haptics are optional, so later ones stay quiet. */
function warnOnce(error: unknown): void {
  if (warned) return;
  warned = true;
  console.warn("Haptics unavailable:", error);
}

/**
 * Whether this device can produce haptics at all: a native app, or a browser with
 * the Vibration API (not iOS Safari). Use it to hide the vibration toggle where it
 * would do nothing. Always false during server rendering.
 * @returns True when `haptic()` can have an effect.
 */
export function canVibrate(): boolean {
  if (typeof window === "undefined") return false;
  // Desktop Chrome exposes navigator.vibrate too, but has nothing to vibrate; require a touch device
  return isNative() || (typeof navigator.vibrate === "function" && prefersCoarsePointer());
}

/**
 * Master switch mirroring the player's vibration setting; while off, `haptic()` is a no-op.
 * @param on - Whether haptics should fire.
 */
export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

async function playNative(kind: HapticKind): Promise<void> {
  // Imported lazily so the plugin stays out of the web bundle's critical path
  const { Haptics, ImpactStyle, NotificationType: Notification } = await import("@capacitor/haptics");
  const effect = NATIVE[kind];
  if ("impact" in effect) {
    await Haptics.impact({ style: ImpactStyle[effect.impact] });
  } else {
    await Haptics.notification({ type: Notification[effect.notification] });
  }
}

/**
 * Triggers a haptic. Fire-and-forget: never throws and never blocks the caller.
 * @param kind - Which game moment to buzz for.
 * @example
 * haptic("bigLand");
 */
export function haptic(kind: HapticKind): void {
  if (!enabled || typeof window === "undefined") return;
  try {
    if (isNative()) {
      playNative(kind).catch(warnOnce);
    } else if (typeof navigator.vibrate === "function" && navigator.userActivation?.hasBeenActive !== false) {
      // Chrome refuses (and logs an error) until the page has had a real tap
      navigator.vibrate(WEB_PATTERN[kind]);
    }
  } catch (error) {
    warnOnce(error);
  }
}
