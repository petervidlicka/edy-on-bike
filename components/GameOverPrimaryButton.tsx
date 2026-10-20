/**
 * The big call-to-action on the game-over screen. It fades in while the input
 * lockout runs, so it's visibly not ready instead of silently ignoring presses.
 */
import type { ReactNode } from "react";
import { GlassButton } from "./ui/GlassButton";

interface GameOverPrimaryButtonProps {
  children: ReactNode;
  onClick: () => void;
  /** Lockout or an in-flight save: shown dimmed and not clickable. */
  disabled: boolean;
}

/**
 * @param props - Label, click handler and disabled state; clicks never bubble to the "tap anywhere to replay" overlay.
 * @example
 * <GameOverPrimaryButton onClick={onRestart} disabled={locked}>Play again</GameOverPrimaryButton>
 */
export function GameOverPrimaryButton({ children, onClick, disabled }: GameOverPrimaryButtonProps) {
  return (
    <GlassButton
      variant="primary"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      style={{ transition: "opacity 0.5s ease" }}
    >
      {children}
    </GlassButton>
  );
}
