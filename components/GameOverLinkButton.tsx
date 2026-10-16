/**
 * Small text-style button for secondary game-over actions (See leaderboard, Home, Skip…).
 */
import type { ReactNode } from "react";

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
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      style={{
        background: "none",
        border: "none",
        padding: "0.2rem 0.4rem",
        fontSize: "0.8rem",
        fontWeight: 700,
        fontFamily: "var(--font-nunito), Arial, sans-serif",
        color: "#334155",
        textDecoration: "underline",
        letterSpacing: "0.03em",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: "auto",
      }}
    >
      {children}
    </button>
  );
}
