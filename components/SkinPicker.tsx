"use client";

import { useRef, useEffect, useCallback } from "react";
import { SkinId, SkinDefinition } from "@/game/types";
import { SKINS, isSkinUnlocked } from "@/game/skins";
import { drawSkinPreview } from "@/game/rendering";

interface SkinPickerProps {
  selectedSkinId: SkinId;
  bestScore: number;
  cheatUnlocked: boolean;
  onSelectSkin: (id: SkinId) => void;
}

const PREVIEW_W = 72;
const PREVIEW_H = 79;

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
        gap: "0.3rem",
        padding: "0.6rem",
        borderRadius: "14px",
        border: isSelected
          ? "2px solid rgba(255,255,255,0.9)"
          : "1.5px solid rgba(255,255,255,0.55)",
        background: isSelected
          ? "rgba(255,255,255,0.35)"
          : "rgba(255,255,255,0.22)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        boxShadow: isSelected
          ? "0 2px 20px rgba(0,0,0,0.15), inset 0 1.5px 0 rgba(255,255,255,0.8)"
          : "0 2px 16px rgba(0,0,0,0.1), inset 0 1.5px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04)",
        opacity: isUnlocked ? 1 : 0.45,
        cursor: isUnlocked ? "pointer" : "default",
        minWidth: "96px",
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
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
          fontSize: "0.78rem",
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
            fontSize: "0.66rem",
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
        gap: "0.6rem",
        overflowX: "auto",
        padding: "0.6rem 0.3rem",
        maxWidth: "min(90vw, 672px)",
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
