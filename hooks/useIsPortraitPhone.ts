/**
 * React view of `isPortraitPhone()` from lib/platform, for the rotate overlay.
 */
import { useSyncExternalStore } from "react";
import { isPortraitPhone, subscribeOrientation } from "@/lib/platform";

const serverSnapshot = () => false;

/**
 * Whether a touch device is currently held in portrait. False on the server and during
 * hydration, so the prerendered page never flashes the overlay on desktop.
 * @example
 * const showRotateOverlay = useIsPortraitPhone();
 */
export function useIsPortraitPhone(): boolean {
  return useSyncExternalStore(subscribeOrientation, isPortraitPhone, serverSnapshot);
}
