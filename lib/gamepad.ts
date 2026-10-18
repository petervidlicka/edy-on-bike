/**
 * Gamepad support (Backbone, Xbox, PlayStation, MFi…) via the browser Gamepad API.
 *
 * The Gamepad API has no button events, only state to poll, so this module polls
 * once per animation frame while anyone is listening and turns fresh presses into
 * `edygamepadpress` DOM events. They're dispatched on `document` and bubble, so
 * listeners on `window` get the same capture-then-bubble order as `keydown`.
 * Overlays can then claim a press in the capture phase with
 * `stopImmediatePropagation()`, exactly as they already do for keys.
 */

/** Buttons by position in the W3C "standard" layout, which Backbone reports. */
export type GamepadButtonName =
  | "A"
  | "B"
  | "X"
  | "Y"
  | "LB"
  | "RB"
  | "LT"
  | "RT"
  | "Select"
  | "Start"
  | "Up"
  | "Down"
  | "Left"
  | "Right";

/** Name of the DOM event fired once per fresh button press. */
export const GAMEPAD_PRESS_EVENT = "edygamepadpress";

/** Payload of a gamepad press event. */
export interface GamepadPressDetail {
  button: GamepadButtonName;
}

/** Event fired on `document` (bubbling to `window`) when a gamepad button goes down. */
export type GamepadPressEvent = CustomEvent<GamepadPressDetail>;

declare global {
  interface WindowEventMap {
    [GAMEPAD_PRESS_EVENT]: GamepadPressEvent;
  }
}

/** Standard-layout button indices. The left stick also drives Up/Down/Left/Right. */
const STANDARD_BUTTONS: ReadonlyArray<readonly [number, GamepadButtonName]> = [
  [0, "A"],
  [1, "B"],
  [2, "X"],
  [3, "Y"],
  [4, "LB"],
  [5, "RB"],
  [6, "LT"],
  [7, "RT"],
  [8, "Select"],
  [9, "Start"],
  [12, "Up"],
  [13, "Down"],
  [14, "Left"],
  [15, "Right"],
];

const DIRECTIONS: readonly GamepadButtonName[] = ["Up", "Down", "Left", "Right"];

/** Stick deflection that counts as a direction press. */
const STICK_PRESS = 0.6;
/** Deflection the stick must fall back under before it counts as released (hysteresis, so it doesn't chatter). */
const STICK_RELEASE = 0.35;

/** Buttons held on each pad in the previous frame, keyed by `Gamepad.index`. */
const heldByPad = new Map<number, Set<GamepadButtonName>>();
let listenerCount = 0;
let frame: number | null = null;

/** True when this browser exposes the Gamepad API (secure contexts only). */
export function gamepadsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.getGamepads === "function";
}

/** Connected pads; some browsers fill the array with nulls for empty slots. */
function connectedPads(): Gamepad[] {
  if (!gamepadsSupported()) return [];
  return navigator.getGamepads().filter((pad): pad is Gamepad => pad !== null && pad.connected);
}

/** The single dominant left-stick direction, so a diagonal never fires two tricks at once. */
function stickDirection(pad: Gamepad, wasHeld: Set<GamepadButtonName>): GamepadButtonName | null {
  const x = pad.axes[0] ?? 0;
  const y = pad.axes[1] ?? 0;
  const magnitude = Math.max(Math.abs(x), Math.abs(y));
  const stickWasHeld = DIRECTIONS.some((d) => wasHeld.has(d));
  if (magnitude < (stickWasHeld ? STICK_RELEASE : STICK_PRESS)) return null;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? "Right" : "Left";
  return y > 0 ? "Down" : "Up";
}

function readHeld(pad: Gamepad, wasHeld: Set<GamepadButtonName>): Set<GamepadButtonName> {
  const held = new Set<GamepadButtonName>();
  for (const [index, name] of STANDARD_BUTTONS) {
    if (pad.buttons[index]?.pressed) held.add(name);
  }
  const stick = stickDirection(pad, wasHeld);
  if (stick) held.add(stick);
  return held;
}

function poll(): void {
  const seen = new Set<number>();
  for (const pad of connectedPads()) {
    seen.add(pad.index);
    const wasHeld = heldByPad.get(pad.index) ?? new Set<GamepadButtonName>();
    const held = readHeld(pad, wasHeld);
    heldByPad.set(pad.index, held);
    for (const button of held) {
      if (wasHeld.has(button)) continue;
      document.dispatchEvent(
        new CustomEvent<GamepadPressDetail>(GAMEPAD_PRESS_EVENT, { detail: { button }, bubbles: true }),
      );
    }
  }
  for (const index of heldByPad.keys()) {
    if (!seen.has(index)) heldByPad.delete(index);
  }
  frame = requestAnimationFrame(poll);
}

function retainPolling(): void {
  listenerCount++;
  if (frame !== null || !gamepadsSupported()) return;
  // Buttons already down when polling starts aren't fresh presses; they count once released and pressed again
  heldByPad.clear();
  for (const pad of connectedPads()) heldByPad.set(pad.index, readHeld(pad, new Set()));
  frame = requestAnimationFrame(poll);
}

function releasePolling(): void {
  listenerCount--;
  if (listenerCount > 0 || frame === null) return;
  cancelAnimationFrame(frame);
  frame = null;
}

/**
 * Listens for fresh gamepad presses, polling the pads only while at least one listener exists.
 * Use `capture: true` for overlays that must claim a press before the game sees it.
 * @param listener - Called once per press; holding a button doesn't repeat.
 * @param options - `capture` to run before non-capture listeners.
 * @returns A function that removes the listener.
 * @example
 * const stop = addGamepadPressListener((e) => { if (e.detail.button === "A") jump(); });
 */
export function addGamepadPressListener(
  listener: (e: GamepadPressEvent) => void,
  options: { capture?: boolean } = {},
): () => void {
  window.addEventListener(GAMEPAD_PRESS_EVENT, listener, options);
  retainPolling();
  return () => {
    window.removeEventListener(GAMEPAD_PRESS_EVENT, listener, options);
    releasePolling();
  };
}

/**
 * Whether any gamepad is connected right now. Browsers hide a pad until a button
 * is pressed on it, so a freshly paired controller only counts after its first press.
 */
export function anyGamepadConnected(): boolean {
  return connectedPads().length > 0;
}
