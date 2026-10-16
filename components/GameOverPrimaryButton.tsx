/**
 * The big call-to-action on the game-over screen. It fades in while the input
 * lockout runs, so it's visibly not ready instead of silently ignoring presses.
 */
import type { ReactNode } from "react";
import { glassBtn } from "./sharedStyles";

interface GameOverPrimaryButtonProps {
  children: ReactNode;
  onClick: () => void;
  /** Lockout or an in-flight save: shown dimmed and not clickable. */
  disabled: boolean;
}

/**
 * @param props - Label, click handler and disabled state.
 * @example
 * <GameOverPrimaryButton onClick={onRestart} disabled={locked}>▶ Play again</GameOverPrimaryButton>
 */
export function GameOverPrimaryButton({ children, onClick, disabled }: GameOverPrimaryButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      style={{
        ...glassBtn,
        fontSize: "1.2rem",
        padding: "0.75rem 2.4rem",
        marginTop: "0.5rem",
        background: "rgba(106,138,154,0.55)",
        color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "opacity 0.5s ease",
      }}
    >
      {children}
    </button>
  );
}
