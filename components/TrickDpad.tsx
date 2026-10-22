/**
 * Touch D-pad for tricks, bottom right, shared by the single-player and race HUDs.
 * Laid out like the arrow keys and a gamepad's pad (↑ front, ↓ back, ← superman, → no-hander)
 * so the on-screen, keyboard and controller mappings match.
 */
import { memo, type CSSProperties } from "react";
import { useGamepadConnected } from "@/hooks/useGamepad";
import { isGhostClick, markTouchHandled } from "@/lib/dom";
import { color, font, radius, safeInset } from "./ui/tokens";

/** Which arm of the D-pad a trick sits on; rounds only that arm's outer end so the four join into one plus. */
type DpadArm = "up" | "down" | "left" | "right";

const ARM_RADIUS: Record<DpadArm, string> = {
  up: `${radius.md} ${radius.md} 0 0`,
  down: `0 0 ${radius.md} ${radius.md}`,
  left: `${radius.md} 0 0 ${radius.md}`,
  right: `0 ${radius.md} ${radius.md} 0`,
};

/** Fill shared by the arms and the hub, so the pad reads as one piece. */
const DPAD_FILL = "rgba(255,255,255,0.8)";

/** One arm of the touch D-pad: big enough to hit mid-jump, labelled so the move is clear without knowing the arrow keys. */
const trickBtnStyle: CSSProperties = {
  width: "58px",
  height: "58px",
  background: DPAD_FILL,
  border: "none",
  color: color.ink,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  padding: 0,
  fontFamily: font.ui,
};

/** Path data for each trick's icon: a flip arrow per direction, a full stretch, arms up. */
const TRICK_ICONS = {
  frontflip: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
  backflip: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
  superman: "M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4",
  noHander: "M6 4l6 8 6-8M12 12v8",
} as const;

interface TrickButtonProps {
  arm: DpadArm;
  label: string;
  title: string;
  icon: string;
  onPress: () => void;
}

/**
 * Fires on touchstart (no 300 ms delay mid-jump) and on a mouse click, with the same
 * ghost-click guard as the jump button so a touch doesn't trigger the trick twice.
 */
function TrickButton({ arm, label, title, icon, onPress }: TrickButtonProps) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); markTouchHandled(); onPress(); }}
      onClick={() => { if (isGhostClick()) return; onPress(); }}
      title={title}
      aria-label={title}
      style={{ ...trickBtnStyle, borderRadius: ARM_RADIUS[arm] }}
    >
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      <span style={{ fontSize: "11px", fontWeight: 800, lineHeight: 1, pointerEvents: "none" }}>{label}</span>
    </button>
  );
}

interface TrickDpadProps {
  onBackflip: () => void;
  onFrontflip: () => void;
  onSuperman: () => void;
  onNoHander: () => void;
}

/**
 * Hidden while a gamepad is connected, since the controller's own D-pad does the job.
 * Memoised: pass stable handlers and it never re-renders during a run.
 * @param props - One handler per trick.
 * @example
 * <TrickDpad onBackflip={backflip} onFrontflip={frontflip} onSuperman={superman} onNoHander={noHander} />
 */
export const TrickDpad = memo(function TrickDpad({ onBackflip, onFrontflip, onSuperman, onNoHander }: TrickDpadProps) {
  const hasGamepad = useGamepadConnected();
  if (hasGamepad) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: safeInset.bottom,
        right: safeInset.right,
        display: "grid",
        gridTemplateColumns: "58px 58px 58px",
        gridTemplateRows: "58px 58px 58px",
        // One shadow around the whole plus instead of one per arm
        filter: "drop-shadow(0 4px 12px rgba(15,23,42,0.18))",
      }}
    >
      <div />
      <TrickButton arm="up" label="Front" title="Frontflip (↑)" icon={TRICK_ICONS.frontflip} onPress={onFrontflip} />
      <div />
      <TrickButton arm="left" label="Superman" title="Superman (←)" icon={TRICK_ICONS.superman} onPress={onSuperman} />
      <div aria-hidden="true" style={{ background: DPAD_FILL, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(30,41,59,0.1)" }} />
      </div>
      <TrickButton arm="right" label="No hands" title="No hander (→)" icon={TRICK_ICONS.noHander} onPress={onNoHander} />
      <div />
      <TrickButton arm="down" label="Back" title="Backflip (↓)" icon={TRICK_ICONS.backflip} onPress={onBackflip} />
      <div />
    </div>
  );
});
