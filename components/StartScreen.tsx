import { SkinId } from "@/game/types";
import SkinPicker from "./SkinPicker";

interface StartScreenProps {
  bestScore: number;
  cheatUnlocked: boolean;
  selectedSkinId: SkinId;
  onSelectSkin: (id: SkinId) => void;
}

export default function StartScreen({
  bestScore,
  cheatUnlocked,
  selectedSkinId,
  onSelectSkin,
}: StartScreenProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        gap: "0.75rem",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
      }}
    >
      <h1
        style={{
          color: "#1e293b",
          fontSize: "3rem",
          fontWeight: 800,
          margin: 0,
          letterSpacing: "0.04em",
          textShadow: "0 2px 6px rgba(255,255,255,0.4)",
        }}
      >
        Edy on Bike
      </h1>
      <p
        style={{
          color: "#334155",
          fontSize: "1rem",
          margin: 0,
          fontWeight: 600,
        }}
      >
        Jump and double-jump to avoid obstacles
      </p>
      <SkinPicker
        selectedSkinId={selectedSkinId}
        bestScore={bestScore}
        cheatUnlocked={cheatUnlocked}
        onSelectSkin={onSelectSkin}
      />
      <div
        style={{
          marginTop: "0.5rem",
          color: "#1e293b",
          fontSize: "1rem",
          fontWeight: 700,
          background: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          border: "1.5px solid rgba(255,255,255,0.55)",
          borderRadius: "18px",
          padding: "0.65rem 2.25rem",
          letterSpacing: "0.06em",
          textAlign: "center",
          boxShadow: "0 2px 20px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
        }}
      >
        PRESS SPACE TO START
        <span
          style={{
            display: "block",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#64748b",
            letterSpacing: "0.04em",
            marginTop: "0.2rem",
          }}
        >
          or tap on mobile
        </span>
      </div>
    </div>
  );
}
