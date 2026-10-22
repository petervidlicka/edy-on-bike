/**
 * Music / sound / vibration toggles pinned top left, shared by the single-player HUD
 * (which appends Pause) and the race screen (which appends Leave).
 */
import { memo, type ReactNode } from "react";
import { useCanVibrate } from "@/hooks/useHapticFeedback";
import { GlassButton } from "./ui/GlassButton";
import { MusicIcon, SpeakerIcon, VibrationIcon } from "./ui/icons";
import { safeInset } from "./ui/tokens";

interface AudioControlsProps {
  musicMuted: boolean;
  sfxMuted: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  /** Vibration setting; the toggle only shows on devices that can vibrate. */
  vibrationOn: boolean;
  onToggleVibration: () => void;
  /** Extra buttons appended to the same top-left row (e.g. Pause, multiplayer's Leave). */
  children?: ReactNode;
}

/**
 * Memoised: its props only change when a setting is toggled, so it must not re-render
 * with the rest of the HUD.
 * @param props - The three settings with their toggles, plus optional trailing buttons.
 * @example
 * <AudioControls musicMuted={m} sfxMuted={s} onToggleMusic={tm} onToggleSfx={ts} vibrationOn={v} onToggleVibration={tv}>
 *   <GlassButton variant="icon" onClick={onPause} aria-label="Pause"><PauseIcon /></GlassButton>
 * </AudioControls>
 */
export const AudioControls = memo(function AudioControls({
  musicMuted,
  sfxMuted,
  onToggleMusic,
  onToggleSfx,
  vibrationOn,
  onToggleVibration,
  children,
}: AudioControlsProps) {
  const canVibrate = useCanVibrate();
  return (
    <div
      style={{
        position: "fixed",
        top: safeInset.top,
        left: safeInset.left,
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
});
