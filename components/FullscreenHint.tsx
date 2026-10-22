/**
 * Bottom-centre hint from `useFullscreenPrompt`: "Tap for fullscreen", or how to add the
 * game to the Home Screen when fullscreen isn't available.
 */
import type { CSSProperties, MouseEvent } from "react";
import type { FullscreenPrompt } from "@/hooks/useFullscreenPrompt";
import { isIOS } from "@/lib/platform";
import { color, font } from "./ui/tokens";

/** Both variants sit in the same spot and slide in the same way. */
const hintBase: CSSProperties = {
  position: "fixed",
  bottom: "1.5rem",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 9998,
  fontFamily: font.ui,
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  animation: "fadeInUp 0.3s ease-out",
  cursor: "pointer",
};

/** The iOS share icon (box with an arrow out of the top), inline with the text. */
function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline", verticalAlign: "middle", margin: "0 0.15em" }}
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

/**
 * Renders nothing while the prompt is hidden.
 * @param props - The prompt state and actions from `useFullscreenPrompt`.
 * @example
 * <FullscreenHint prompt={useFullscreenPrompt(containerRef)} />
 */
export function FullscreenHint({ prompt }: { prompt: FullscreenPrompt }) {
  if (prompt.mode === "fullscreen") {
    const onClick = (e: MouseEvent) => {
      // The tap must not also reach the game (it would jump)
      e.stopPropagation();
      e.preventDefault();
      prompt.requestFullscreen();
    };
    return (
      <button
        onClick={onClick}
        style={{
          ...hintBase,
          background: "rgba(196,120,90,0.9)",
          color: color.white,
          border: "none",
          borderRadius: "2rem",
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          fontWeight: 700,
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          letterSpacing: "0.02em",
        }}
      >
        Tap for fullscreen
      </button>
    );
  }

  if (prompt.mode === "install") {
    return (
      <div
        onClick={prompt.dismiss}
        style={{
          ...hintBase,
          background: "rgba(30,41,59,0.95)",
          color: "#b8c6d4",
          border: "1px solid rgba(196,120,90,0.4)",
          borderRadius: "1rem",
          padding: "0.75rem 1.5rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.5,
          boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
          maxWidth: "90vw",
        }}
      >
        {isIOS() ? (
          <>
            Tap <ShareIcon /> then <strong>&quot;Add to Home Screen&quot;</strong> for fullscreen
          </>
        ) : (
          <>
            Open browser menu → <strong>Add to Home Screen</strong> for fullscreen
          </>
        )}
      </div>
    );
  }

  return null;
}
