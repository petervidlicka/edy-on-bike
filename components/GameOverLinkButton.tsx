/**
 * Quiet text button for secondary game-over actions (See leaderboard, Home, Skip…).
 */
import type { ReactNode } from "react";
import { GlassButton } from "./ui/GlassButton";

interface GameOverLinkButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * @param props - Label and click handler; clicks never bubble to the "tap anywhere to replay" overlay.
 * @example
 * <GameOverLinkButton onClick={showBoard}>See leaderboard</GameOverLinkButton>
 */
export function GameOverLinkButton({ children, onClick, disabled = false }: GameOverLinkButtonProps) {
  return (
    <GlassButton
      variant="quiet"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
    >
      {children}
    </GlassButton>
  );
}
