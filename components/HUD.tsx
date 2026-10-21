import { INITIAL_SPEED } from "@/game/constants";
import { formatMultiplier } from "@/game/ComboChain";
import type { TrickFeedbackData } from "@/hooks/useGameEngine";
import { useCanVibrate } from "@/hooks/useHapticFeedback";
import { useGamepadConnected } from "@/hooks/useGamepad";
import { GlassButton } from "./ui/GlassButton";
import { HudChip } from "./ui/HudChip";
import { color, font, glassSurfaceSmall, radius } from "./ui/tokens";

/** Guards against browsers firing both onTouchStart and onClick. */
let lastTouchTime = 0;

/**
 * Corner offsets that clear the notch and rounded corners: the app draws edge to edge
 * (viewportFit "cover", status bar over the web view), so landscape iPhones need the insets.
 */
const SAFE = {
  top: "calc(1rem + env(safe-area-inset-top, 0px))",
  right: "calc(1.5rem + env(safe-area-inset-right, 0px))",
  bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
  left: "calc(1.5rem + env(safe-area-inset-left, 0px))",
} as const;

const TRICK_COLOR_CLEAN = color.success;
const TRICK_COLOR_SKETCHY = color.caution;

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
      width="20"
      height="20"
      aria-hidden="true"
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
      width="20"
      height="20"
      aria-hidden="true"
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
      width="20"
      height="20"
      aria-hidden="true"
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

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
const trickBtnStyle: React.CSSProperties = {
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

function TrickButton({ arm, label, title, icon, onPress }: { arm: DpadArm; label: string; title: string; icon: string; onPress: () => void }) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
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
        top: SAFE.top,
        left: SAFE.left,
        display: "flex",
        gap: "0.5rem",
      }}
    >
      <GlassButton
        variant="icon"
        onClick={onToggleMusic}
        title={musicMuted ? "Music on" : "Music off"}
        aria-label={musicMuted ? "Music on" : "Music off"}
      >
        <MusicIcon muted={musicMuted} />
      </GlassButton>
      <GlassButton
        variant="icon"
        onClick={onToggleSfx}
        title={sfxMuted ? "Sound on" : "Sound off"}
        aria-label={sfxMuted ? "Sound on" : "Sound off"}
      >
        <SpeakerIcon muted={sfxMuted} />
      </GlassButton>
      {canVibrate && (
        <GlassButton
          variant="icon"
          onClick={onToggleVibration}
          title={vibrationOn ? "Vibration off" : "Vibration on"}
          aria-label={vibrationOn ? "Vibration off" : "Vibration on"}
        >
          <VibrationIcon off={!vibrationOn} />
        </GlassButton>
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
        fontFamily: font.mono,
        fontSize: "0.8rem",
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: radius.sm,
        background: "rgba(255,255,255,0.85)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
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

  // A D-pad, laid out like the arrow keys and a gamepad's pad (↑ front, ↓ back, ← superman, → no-hander)
  return (
    <div
      style={{
        position: "fixed",
        bottom: SAFE.bottom,
        right: SAFE.right,
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
}

export function HUD({
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
          top: SAFE.top,
          right: SAFE.right,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.5rem",
          pointerEvents: "none",
        }}
      >
        <HudChip
          score={score}
          multiplier={multiplier}
          accent={trickFeedback ? (trickFeedback.sketchy ? TRICK_COLOR_SKETCHY : TRICK_COLOR_CLEAN) : undefined}
        />
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

      {/* Jump button — bottom left; a connected gamepad's A button replaces it */}
      {!hasGamepad && <button
        onTouchStart={(e) => { e.preventDefault(); lastTouchTime = Date.now(); onJump(); }}
        onClick={() => { if (Date.now() - lastTouchTime < 500) return; onJump(); }}
        title="Jump (tap or space)"
        aria-label="Jump"
        style={{
          ...glassSurfaceSmall,
          position: "fixed",
          bottom: SAFE.bottom,
          left: SAFE.left,
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
