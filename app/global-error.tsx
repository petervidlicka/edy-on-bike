"use client";

/**
 * Last-resort error boundary for errors in the root layout itself, which app/error.tsx
 * can't catch. It replaces the whole document, so it renders its own <html> and <body>
 * and can't rely on the layout's fonts (the UI kit's font stacks fall back to system fonts).
 */
import { useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ScreenTitle } from "@/components/ui/ScreenTitle";
import { GlassButton } from "@/components/ui/GlassButton";
import { font, text } from "@/components/ui/tokens";

/** Suburban sky, matching app/error.tsx. */
const SKY_GRADIENT = "linear-gradient(#b8c6d4, #d4dce4)";

/** Props Next.js passes to the global error boundary. */
interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Fallback document for errors thrown while rendering the root layout.
 * Next.js requires it to be a default export.
 *
 * @param props.error - The error that was thrown; logged for debugging.
 * @param props.reset - Re-renders the app to try again.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
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
      </body>
    </html>
  );
}
