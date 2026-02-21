"use client";

import { useRef, useEffect, useCallback } from "react";
import { SkinId, SkinDefinition } from "@/game/types";
import { SKINS, isSkinUnlocked } from "@/game/skins";
import { drawSkinPreview } from "@/game/Renderer";

interface SkinPickerProps {
  selectedSkinId: SkinId;
  bestScore: number;
  cheatUnlocked: boolean;
  onSelectSkin: (id: SkinId) => void;
}

const PREVIEW_W = 60;
const PREVIEW_H = 66;

function SkinCard({
  skin,
  isSelected,
  isUnlocked,
  onSelect,
}: {
  skin: SkinDefinition;
  isSelected: boolean;
  isUnlocked: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawSkinPreview(ctx, skin, PREVIEW_W, PREVIEW_H);
  }, [skin]);

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (isUnlocked) onSelect();
    },
    [isUnlocked, onSelect]
  );

  return (
    <div
      onClick={handleClick}
      onTouchEnd={handleClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.5rem",
        borderRadius: "8px",
        border: isSelected
          ? "2px solid #1e293b"
          : "2px solid rgba(30,41,59,0.2)",
        background: isSelected
          ? "rgba(30,41,59,0.1)"
          : "rgba(255,255,255,0.5)",
        opacity: isUnlocked ? 1 : 0.45,
        cursor: isUnlocked ? "pointer" : "default",
        minWidth: "80px",
        transition: "border-color 0.15s, background 0.15s",
        pointerEvents: "auto",
      }}
    >
      <canvas
        ref={canvasRef}
        width={PREVIEW_W}
        height={PREVIEW_H}
        style={{
          width: PREVIEW_W,
          height: PREVIEW_H,
          imageRendering: "pixelated",
        }}
      />
      <span
        style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "#1e293b",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {skin.name}
      </span>
      {!isUnlocked && (
        <span
          style={{
            fontSize: "0.55rem",
            fontWeight: 600,
            color: "#64748b",
          }}
        >
          Score {skin.unlockScore}
        </span>
      )}
    </div>
  );
}

export default function SkinPicker({
  selectedSkinId,
  bestScore,
  cheatUnlocked,
  onSelectSkin,
}: SkinPickerProps) {
  const handleContainerEvent = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
    },
    []
  );

  return (
    <div
      onClick={handleContainerEvent}
      onTouchStart={handleContainerEvent}
      onTouchEnd={handleContainerEvent}
      style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        padding: "0.5rem 0.25rem",
        maxWidth: "min(90vw, 560px)",
        pointerEvents: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {SKINS.map((skin) => (
        <SkinCard
          key={skin.id}
          skin={skin}
          isSelected={skin.id === selectedSkinId}
          isUnlocked={isSkinUnlocked(skin, bestScore, cheatUnlocked)}
          onSelect={() => onSelectSkin(skin.id)}
        />
      ))}
    </div>
  );
}
