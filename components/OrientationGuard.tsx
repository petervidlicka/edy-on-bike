"use client";

/**
 * Keeps phones in landscape: a "rotate your device" overlay in portrait, and in a mobile
 * browser a one-time "tap for fullscreen" hint (or "Add to Home Screen" where fullscreen
 * isn't available). The native apps are locked to landscape and already fullscreen.
 */
import { useRef } from "react";
import { useFullscreenPrompt } from "@/hooks/useFullscreenPrompt";
import { useIsPortraitPhone } from "@/hooks/useIsPortraitPhone";
import { FullscreenHint } from "./FullscreenHint";
import { RotateOverlay } from "./RotateOverlay";

/**
 * Wraps a game screen with the orientation overlay and fullscreen hint. The wrapper div is
 * what goes fullscreen, so the overlays inside it stay visible in fullscreen too.
 * @example
 * <OrientationGuard><GameCanvas /></OrientationGuard>
 */
export function OrientationGuard({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prompt = useFullscreenPrompt(containerRef);
  const showOverlay = useIsPortraitPhone();

  return (
    <div ref={containerRef}>
      {children}
      <FullscreenHint prompt={prompt} />
      {showOverlay && <RotateOverlay />}
    </div>
  );
}
