import { INITIAL_SPEED } from "@/game/constants";
import { formatMultiplier } from "@/game/ComboChain";
import type { TrickFeedbackData } from "@/hooks/useGameEngine";
import { useCanVibrate } from "@/hooks/useHapticFeedback";
import { useGamepadConnected } from "@/hooks/useGamepad";

/** Guards against browsers firing both onTouchStart and onClick. */
let lastTouchTime = 0;

const TRICK_COLOR_CLEAN = "#1a7a2e";
const TRICK_COLOR_SKETCHY = "#d97706";

interface HUDProps {
  score: number;
  speed: number;
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

function MusicIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Musical note */}
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      {muted && (
        <>
          <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {muted ? (
        <>
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  );
}

function VibrationIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="4" width="8" height="16" rx="1.5" />
      <path d="M4 8v8M20 8v8" />
      {off && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.5" />}
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

/** Shared glass style for small HUD buttons, so screens composing HUD pieces match. */
export const btnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.22)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  border: "1.5px solid rgba(255,255,255,0.55)",
  borderRadius: "14px",
  color: "#1e293b",
  cursor: "pointer",
  padding: "0.45rem 0.65rem",
  lineHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow:
    "0 2px 16px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
};

const dpadBtnStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.35)",
  border: "2px solid rgba(30,41,59,0.3)",
  color: "#1e293b",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

function ArrowSVG({ points }: { points: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points} />
    </svg>
  );
}

/**
 * Music/SFX/vibration toggles, top left (vibration only where the device can vibrate). Extracted so the multiplayer race screen can reuse
 * them and append its own buttons (e.g. LEAVE) via children.
 */
export function AudioControls({
  musicMuted,
  sfxMuted,
  onToggleMusic,
  onToggleSfx,
  vibrationOn,
  onToggleVibration,
  children,
}: {
  musicMuted: boolean;
  sfxMuted: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  vibrationOn: boolean;
  onToggleVibration: () => void;
  /** Extra buttons appended to the same top-left row (e.g. multiplayer's Leave). */
  children?: React.ReactNode;
}) {
  const canVibrate = useCanVibrate();
  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        left: "1.5rem",
        display: "flex",
        gap: "0.4rem",
      }}
    >
      <button
        onClick={onToggleMusic}
        title={musicMuted ? "Music on" : "Music off"}
        style={btnStyle}
      >
        <MusicIcon muted={musicMuted} />
      </button>
      <button
        onClick={onToggleSfx}
        title={sfxMuted ? "Sound on" : "Sound off"}
        style={btnStyle}
      >
        <SpeakerIcon muted={sfxMuted} />
      </button>
      {canVibrate && (
        <button
          onClick={onToggleVibration}
          title={vibrationOn ? "Vibration off" : "Vibration on"}
          style={btnStyle}
        >
          <VibrationIcon off={!vibrationOn} />
        </button>
      )}
      {children}
    </div>
  );
}

/** "Backflip +75 (×1.5)"-style feedback; renders nothing when there's no recent trick. */
export function TrickFeedbackPopup({
  trickFeedback,
}: {
  trickFeedback: TrickFeedbackData | null;
}) {
  if (!trickFeedback) return null;
  return (
    <span
      style={{
        color: trickFeedback.sketchy ? TRICK_COLOR_SKETCHY : TRICK_COLOR_CLEAN,
        fontFamily: "var(--font-space-mono), monospace",
        fontSize: "0.7rem",
        fontWeight: "bold",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {trickFeedback.name} +{trickFeedback.points}
      {trickFeedback.multiplier > 1 && ` (\u00d7${formatMultiplier(trickFeedback.multiplier)})`}
    </span>
  );
}

/**
 * Touch D-pad for tricks (bottom right), shared by single-player and multiplayer.
 * Hidden while a gamepad is connected, since the controller's own D-pad does the job.
 */
export function TrickDpad({
  onBackflip,
  onFrontflip,
  onSuperman,
  onNoHander,
}: {
  onBackflip: () => void;
  onFrontflip: () => void;
  onSuperman: () => void;
  onNoHander: () => void;
}) {
  const hasGamepad = useGamepadConnected();
  if (hasGamepad) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        display: "grid",
        gridTemplateColumns: "48px 48px 48px",
        gridTemplateRows: "48px 48px 48px",
        gap: "4px",
      }}
    >
      {/* Row 1: _, Up (Frontflip), _ */}
      <div />
      <button
        onTouchStart={(e) => { e.preventDefault(); onFrontflip(); }}
        title="Frontflip (↑)"
        style={dpadBtnStyle}
      >
        <ArrowSVG points="6 15 12 9 18 15" />
      </button>
      <div />

      {/* Row 2: Left (Superman), Tricks label, Right (No Hander) */}
      <button
        onTouchStart={(e) => { e.preventDefault(); onSuperman(); }}
        title="Superman (←)"
        style={dpadBtnStyle}
      >
        <ArrowSVG points="15 6 9 12 15 18" />
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontFamily: "var(--font-space-mono), monospace", color: "rgba(30,41,59,0.65)", textAlign: "center", lineHeight: 1.1, pointerEvents: "none" }}>
        Tricks
      </div>
      <button
        onTouchStart={(e) => { e.preventDefault(); onNoHander(); }}
        title="No Hander (→)"
        style={dpadBtnStyle}
      >
        <ArrowSVG points="9 6 15 12 9 18" />
      </button>

      {/* Row 3: _, Down (Backflip), _ */}
      <div />
      <button
        onTouchStart={(e) => { e.preventDefault(); onBackflip(); }}
        title="Backflip (↓)"
        style={dpadBtnStyle}
      >
        <ArrowSVG points="6 9 12 15 18 9" />
      </button>
      <div />
    </div>
  );
}

export default function HUD({
  score,
  speed,
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
  const multiplier = (speed / INITIAL_SPEED).toFixed(1);
  const hasGamepad = useGamepadConnected();

  return (
    <>
      {/* Score + speed — top right */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.2rem",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            color: trickFeedback
              ? trickFeedback.sketchy ? TRICK_COLOR_SKETCHY : TRICK_COLOR_CLEAN
              : "#1e293b",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: "1.25rem",
            fontWeight: "bold",
            transition: "color 0.3s ease",
          }}
        >
          {String(score).padStart(5, "0")}
        </span>
        <span
          style={{
            color: "#475569",
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: "0.75rem",
          }}
        >
          &times;{multiplier}
        </span>
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
          <button onClick={onPause} title="Pause (Esc or P)" style={btnStyle}>
            <PauseIcon />
          </button>
        )}
      </AudioControls>

      {/* Jump button — bottom left; a connected gamepad's A button replaces it */}
      {!hasGamepad && <button
        onTouchStart={(e) => { e.preventDefault(); lastTouchTime = Date.now(); onJump(); }}
        onClick={() => { if (Date.now() - lastTouchTime < 500) return; onJump(); }}
        title="Jump (tap or space)"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "1.5rem",
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.35)",
          border: "2px solid rgba(30,41,59,0.3)",
          color: "#1e293b",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          padding: 0,
        }}
      >
        <ArrowSVG points="6 15 12 9 18 15" />
        <span style={{ fontSize: "9px", fontFamily: "var(--font-space-mono), monospace", lineHeight: 1, pointerEvents: "none" }}>JUMP</span>
      </button>}

      <TrickDpad
        onBackflip={onBackflip}
        onFrontflip={onFrontflip}
        onSuperman={onSuperman}
        onNoHander={onNoHander}
      />
    </>
  );
}
