/**
 * The single-player in-run overlay: live score chip and trick popup (top right), audio
 * and pause controls (top left), jump button (bottom left) and trick D-pad (bottom right).
 */
import { memo } from "react";
import type { EngineStats } from "@/hooks/engineStats";
import type { TrickFeedbackData } from "@/hooks/useGameEngine";
import { useGamepadConnected } from "@/hooks/useGamepad";
import { isGhostClick, markTouchHandled } from "@/lib/dom";
import { AudioControls } from "./AudioControls";
import { LiveHudChip } from "./LiveHudChip";
import { TrickDpad } from "./TrickDpad";
import { TrickFeedbackPopup, trickFeedbackColor } from "./TrickFeedbackPopup";
import { GlassButton } from "./ui/GlassButton";
import { PauseIcon } from "./ui/icons";
import { color, font, glassSurfaceSmall, safeInset } from "./ui/tokens";

interface HUDProps {
  /** Live score and speed; only the score chip subscribes to them. */
  stats: EngineStats;
  trickFeedback: TrickFeedbackData | null;
  musicMuted: boolean;
  sfxMuted: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  /** Vibration setting; the toggle only shows on devices that can vibrate. */
  vibrationOn: boolean;
  onToggleVibration: () => void;
  /** Pauses the run; shows a pause button next to the audio toggles. */
  onPause?: () => void;
  onJump: () => void;
  onBackflip: () => void;
  onFrontflip: () => void;
  onSuperman: () => void;
  onNoHander: () => void;
}

/**
 * Jump button, bottom left. Reacts on touchstart (no tap delay) and on mouse click, ignoring the
 * click a browser synthesises after a handled touch. Hidden while a gamepad's A button does the job.
 */
const JumpButton = memo(function JumpButton({ onJump }: { onJump: () => void }) {
  const hasGamepad = useGamepadConnected();
  if (hasGamepad) return null;
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); markTouchHandled(); onJump(); }}
      onClick={() => { if (isGhostClick()) return; onJump(); }}
      title="Jump (tap or space)"
      aria-label="Jump"
      style={{
        ...glassSurfaceSmall,
        position: "fixed",
        bottom: safeInset.bottom,
        left: safeInset.left,
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        color: color.ink,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
        padding: 0,
        fontFamily: font.ui,
      }}
    >
      <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 15 12 9 18 15" />
      </svg>
      <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1, pointerEvents: "none" }}>JUMP</span>
    </button>
  );
});

/**
 * Memoised, and every handler prop should be stable (created once from the engine ref),
 * so a score tick re-renders the chip alone and a landed trick only the top-right column.
 * @param props - The engine stats store, trick feedback, the audio settings and the input handlers.
 * @example
 * <HUD stats={stats} trickFeedback={trickFeedback} onJump={handleJump} ... />
 */
export const HUD = memo(function HUD({
  stats,
  trickFeedback,
  musicMuted,
  sfxMuted,
  onToggleMusic,
  onToggleSfx,
  vibrationOn,
  onToggleVibration,
  onPause,
  onJump,
  onBackflip,
  onFrontflip,
  onSuperman,
  onNoHander,
}: HUDProps) {
  return (
    <>
      {/* Score + speed — top right */}
      <div
        style={{
          position: "fixed",
          top: safeInset.top,
          right: safeInset.right,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.5rem",
          pointerEvents: "none",
        }}
      >
        <LiveHudChip stats={stats} accent={trickFeedback ? trickFeedbackColor(trickFeedback) : undefined} />
        <TrickFeedbackPopup trickFeedback={trickFeedback} />
      </div>

      <AudioControls
        musicMuted={musicMuted}
        sfxMuted={sfxMuted}
        onToggleMusic={onToggleMusic}
        onToggleSfx={onToggleSfx}
        vibrationOn={vibrationOn}
        onToggleVibration={onToggleVibration}
      >
        {onPause && (
          <GlassButton variant="icon" onClick={onPause} title="Pause (Esc or P)" aria-label="Pause">
            <PauseIcon />
          </GlassButton>
        )}
      </AudioControls>

      <JumpButton onJump={onJump} />

      <TrickDpad
        onBackflip={onBackflip}
        onFrontflip={onFrontflip}
        onSuperman={onSuperman}
        onNoHander={onNoHander}
      />
    </>
  );
});
