/**
 * Small DOM helpers shared by the React layer: which keys belong to a text field rather
 * than the game, and telling a real click from the one a browser synthesises after a touch.
 */

/**
 * Whether a key press is text entry (the name field, a select, anything contentEditable)
 * rather than input to the game, so Space can't make the rider jump while typing and
 * a name like "Idkfan" can't trigger a cheat code.
 * @example
 * if (isTyping(e.target)) return;
 */
export function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
  );
}

/**
 * Whether the event target is a button, which handles Space/Enter (and taps) natively;
 * game-wide key handlers leave those presses alone so overlay buttons stay reachable.
 */
export function isButton(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.tagName === "BUTTON";
}

/** When the last touch handler fired; a click within GHOST_CLICK_MS of it is the browser's echo. */
let lastTouchTime = 0;

/** Browsers fire the compatibility click up to ~300 ms after touchend; 500 ms leaves a margin. */
const GHOST_CLICK_MS = 500;

/**
 * Records that a touch handler already acted on the press, so the click the browser
 * fires for the same touch can be ignored with {@link isGhostClick}.
 * @example
 * <button onTouchStart={(e) => { e.preventDefault(); markTouchHandled(); jump(); }} onClick={() => { if (isGhostClick()) return; jump(); }} />
 */
export function markTouchHandled(): void {
  lastTouchTime = Date.now();
}

/**
 * Whether a click is the browser's follow-up to a touch that {@link markTouchHandled} already
 * handled, rather than a real mouse click. Lets a control react to touch immediately (no 300 ms
 * delay) while still working with a mouse.
 */
export function isGhostClick(): boolean {
  return Date.now() - lastTouchTime < GHOST_CLICK_MS;
}
