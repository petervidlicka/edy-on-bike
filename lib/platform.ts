/**
 * One place that answers "what kind of device is this?" for the React layer: native
 * app or browser, touch or mouse, portrait phone, installed PWA, fullscreen. The
 * orientation overlay, the engine's orientation pause and the haptics toggle all read
 * the same answers, so they can't drift apart. Every check is false during server
 * rendering, so call these from effects or event handlers, never during render.
 */
import { Capacitor } from "@capacitor/core";

declare global {
  interface Document {
    /** Safari's prefixed fullscreen element (older iPadOS / macOS Safari). */
    webkitFullscreenElement?: Element | null;
  }
  interface Navigator {
    /** iOS Safari only: true when the page was launched from the Home Screen. */
    standalone?: boolean;
  }
  interface Element {
    /** Safari's prefixed fullscreen request; returns nothing, so listen for `webkitfullscreenchange`. */
    webkitRequestFullscreen?: () => void;
  }
}

const hasWindow = (): boolean => typeof window !== "undefined";

/** Whether the game runs inside the Capacitor iOS/Android shell. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Whether the primary pointer is a finger (the `(pointer: coarse)` media query). */
export function prefersCoarsePointer(): boolean {
  return hasWindow() && window.matchMedia("(pointer: coarse)").matches;
}

/** A phone or tablet: the native app, or a browser driven by touch. */
export function isTouchDevice(): boolean {
  return isNative() || prefersCoarsePointer();
}

/** Whether the viewport is taller than wide right now. */
export function isPortrait(): boolean {
  return hasWindow() && window.matchMedia("(orientation: portrait)").matches;
}

/**
 * A touch device held upright: when to show the "rotate your device" overlay and
 * pause the engine. Desktops in a tall window are left alone.
 */
export function isPortraitPhone(): boolean {
  return isPortrait() && isTouchDevice();
}

/**
 * True when the game already fills the screen without browser UI: the native app, an
 * installed PWA, or an iOS Home Screen launch. No fullscreen hint is needed then.
 */
export function isStandalone(): boolean {
  if (isNative()) return true;
  if (!hasWindow()) return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  return navigator.standalone === true;
}

/** iPhone, iPad (including iPadOS reporting itself as a Mac) or iPod. */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** The element in fullscreen, through the standard or Safari's prefixed API; null when not fullscreen. */
export function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

/**
 * Runs `listener` whenever the device turns. Covers both the media query (fires on every
 * viewport change) and the older `orientationchange` event (some Android browsers only fire that).
 * @returns Unsubscribe function.
 * @example
 * useEffect(() => subscribeOrientation(checkPause), [checkPause]);
 */
export function subscribeOrientation(listener: () => void): () => void {
  if (!hasWindow()) return () => {};
  const mq = window.matchMedia("(orientation: portrait)");
  mq.addEventListener("change", listener);
  window.addEventListener("orientationchange", listener);
  return () => {
    mq.removeEventListener("change", listener);
    window.removeEventListener("orientationchange", listener);
  };
}
