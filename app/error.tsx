"use client";

/**
 * Route-level error boundary. If any part of the game UI throws while
 * rendering, players get a friendly retry screen instead of Next.js's blank
 * "Application error" page.
 */
import { useEffect } from "react";
import { glassBtn } from "@/components/sharedStyles";

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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "1rem",
        textAlign: "center",
        background: "#18181b",
        color: "#f4f4f5",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "2rem",
          fontFamily: "var(--font-fredoka), sans-serif",
          fontWeight: 600,
          letterSpacing: "0.06em",
        }}
      >
        Oops, Edy fell off!
      </h2>
      <p style={{ margin: 0, fontSize: "0.95rem", color: "#d4d4d8" }}>
        Something went wrong. Tap below to get back on the bike.
      </p>
      <button type="button" onClick={reset} style={{ ...glassBtn, color: "#f4f4f5" }}>
        Try again
      </button>
    </div>
  );
}
