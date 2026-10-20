/**
 * Idle-state overlay: title, bike picker, unlock progress and the way into a run
 * (Start button, Space, gamepad A or a tap on the scene) or into multiplayer.
 */
import Link from "next/link";
import { SkinId } from "@/game/types";
import SkinPicker from "./SkinPicker";
import { UnlockProgress } from "./UnlockProgress";
import { isMultiplayerEnabled } from "@/lib/multiplayerConfig";
import { useGamepadConnected } from "@/hooks/useGamepad";
import { GlassPanel } from "./ui/GlassPanel";
import { ScreenTitle } from "./ui/ScreenTitle";
import { GlassButton, glassButtonStyle } from "./ui/GlassButton";
import { color, font, formatScore, text } from "./ui/tokens";

interface StartScreenProps {
  bestScore: number;
  cheatUnlocked: boolean;
  selectedSkinId: SkinId;
  onSelectSkin: (id: SkinId) => void;
  /** Starts the run (same as Space or a tap on the scene). */
  onStart: () => void;
}

/** Small key-cap shown inside the Start button; hidden on touch screens via `.kbd-hint`. */
const kbdStyle = {
  padding: "2px 8px",
  borderRadius: "6px",
  background: "rgba(255,255,255,0.18)",
  fontFamily: font.mono,
  fontSize: "0.7rem",
  letterSpacing: 0,
  textTransform: "none",
} as const;

/**
 * @param props - Saved best and unlock state, selected bike, and the select / start actions.
 * @example
 * <StartScreen bestScore={620} cheatUnlocked={false} selectedSkinId="default" onSelectSkin={pick} onStart={start} />
 */
export default function StartScreen({
  bestScore,
  cheatUnlocked,
  selectedSkinId,
  onSelectSkin,
  onStart,
}: StartScreenProps) {
  const hasGamepad = useGamepadConnected();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Taps outside the controls fall through to the canvas, which starts the run
        pointerEvents: "none",
        fontFamily: font.ui,
      }}
    >
      {/* The panel takes pointer input so it can scroll on short screens; a tap on its
          background still starts the run, as a tap on the scene does */}
      <GlassPanel
        style={{ pointerEvents: "auto" }}
        onClick={(e) => {
          // Buttons and links act on their own; the skin picker stops its clicks itself
          if ((e.target as Element).closest("button, a")) return;
          onStart();
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <ScreenTitle as="h1">Edy on Bike</ScreenTitle>
          <p style={text.body}>Jump and double-jump to avoid obstacles</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
            <span style={text.label}>Choose your rider</span>
            {bestScore > 0 && (
              <span style={text.label}>
                Best <span style={{ fontFamily: font.mono, color: color.ink }}>{formatScore(bestScore)}</span>
              </span>
            )}
          </div>
          <SkinPicker
            selectedSkinId={selectedSkinId}
            bestScore={bestScore}
            cheatUnlocked={cheatUnlocked}
            onSelectSkin={onSelectSkin}
          />
        </div>

        <UnlockProgress bestScore={bestScore} cheatUnlocked={cheatUnlocked} />

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <GlassButton variant="primary" onClick={onStart}>
            START RIDE
            <span className="kbd-hint" style={kbdStyle}>{hasGamepad ? "Ⓐ" : "Space"}</span>
          </GlassButton>
          {isMultiplayerEnabled && (
            <Link href="/multiplayer" style={glassButtonStyle("secondary")}>
              MULTIPLAYER
            </Link>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
