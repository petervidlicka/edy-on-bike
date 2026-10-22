/**
 * Big centred "3 · 2 · 1 · GO!" number, shared by the pause menu's resume countdown and
 * the multiplayer race start so both count down in the same voice.
 */
import { color, font } from "./ui/tokens";

interface CountdownOverlayProps {
  /** The number (or word, e.g. "GO!") to show; a change remounts the label. */
  label: number | string;
  /** Stacking order; the default sits above every HUD element. */
  zIndex?: number;
}

/**
 * Never intercepts input: the countdown is purely visual, and the keys/buttons that
 * cancel it belong to the screen that owns the countdown state.
 * @example
 * {countdown !== null && <CountdownOverlay label={countdown} />}
 */
export function CountdownOverlay({ label, zIndex = 100 }: CountdownOverlayProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex,
        pointerEvents: "none",
      }}
    >
      <span
        key={label}
        style={{
          color: color.white,
          fontFamily: font.display,
          fontSize: "6rem",
          fontWeight: 600,
          textShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
