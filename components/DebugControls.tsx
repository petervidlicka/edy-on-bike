/**
 * Development-only buttons in the top-right corner of the single-player screen:
 * toggle the ?obstacles=debug course and skip to the next biome. Never rendered in
 * production builds.
 */
import type { CSSProperties } from "react";

interface DebugControlsProps {
  debugObstacles: boolean;
  onToggleDebugObstacles: () => void;
  onNextBiome: () => void;
}

/** Deliberately not on the UI kit: these are tooling, and should look like it. */
const debugButtonStyle: CSSProperties = {
  position: "fixed",
  top: 8,
  padding: "4px 10px",
  fontSize: "0.7rem",
  fontFamily: "monospace",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  opacity: 0.85,
  zIndex: 9999,
};

/**
 * @param props - Debug-course flag with its toggle, and the biome skip action.
 * @example
 * {process.env.NODE_ENV !== "production" && <DebugControls debugObstacles={on} onToggleDebugObstacles={toggle} onNextBiome={next} />}
 */
export function DebugControls({ debugObstacles, onToggleDebugObstacles, onNextBiome }: DebugControlsProps) {
  return (
    <>
      <button
        onClick={onToggleDebugObstacles}
        style={{ ...debugButtonStyle, right: 8, background: debugObstacles ? "#d44" : "#555" }}
      >
        Debug: {debugObstacles ? "ON" : "OFF"}
      </button>
      <button onClick={onNextBiome} style={{ ...debugButtonStyle, right: 110, background: "#c87020" }}>
        Next Biome
      </button>
    </>
  );
}
