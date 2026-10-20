"use client";

/**
 * Route-level error boundary. If any part of the game UI throws while
 * rendering, players get a friendly retry screen instead of Next.js's blank
 * "Application error" page.
 */
import { useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { GlassButton } from "@/components/ui/GlassButton";
import { font, text } from "@/components/ui/tokens";

/** Suburban sky, so the panel reads the same as in-game when the canvas is gone. */
const SKY_GRADIENT = "linear-gradient(#b8c6d4, #d4dce4)";

/** Props Next.js passes to an App Router error boundary. */
interface GameErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Fallback screen for unexpected render errors.
 * Next.js requires error boundaries to be default exports.
 *
 * @param props.error - The error that was thrown; logged for debugging.
 * @param props.reset - Re-renders the route segment to try again.
 */
export default function GameError({ error, reset }: GameErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        textAlign: "center",
        background: SKY_GRADIENT,
        fontFamily: font.ui,
      }}
    >
      <GlassPanel>
        <ScreenTitle>Oops, Edy Fell Off!</ScreenTitle>
        <p style={text.body}>Something went wrong. Tap below to get back on the bike.</p>
        <GlassButton variant="primary" onClick={reset}>
          Try again
        </GlassButton>
      </GlassPanel>
    </div>
  );
}
