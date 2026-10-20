"use client";

/**
 * Horizontal bike picker (start screen and multiplayer lobby). Locked bikes show the best
 * score that unlocks them; only unlocked ones can be selected.
 */
import { useCallback } from "react";
import { SkinId, SkinDefinition } from "@/game/types";
import { SKINS, isSkinUnlocked } from "@/game/skins";
import { SkinPreview, SKIN_PREVIEW_H, SKIN_PREVIEW_W } from "./SkinPreview";
import { color, font, radius } from "./ui/tokens";

interface SkinPickerProps {
  selectedSkinId: SkinId;
  bestScore: number;
  cheatUnlocked: boolean;
  onSelectSkin: (id: SkinId) => void;
}

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
  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (isUnlocked) onSelect();
    },
    [isUnlocked, onSelect]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchEnd={handleClick}
      aria-pressed={isSelected}
      aria-disabled={!isUnlocked}
      title={isUnlocked ? skin.name : `${skin.name}: reach a best of ${skin.unlockScore} to unlock`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.25rem",
        flexShrink: 0,
        width: "104px",
        padding: "0.4rem 0.5rem",
        borderRadius: radius.md,
        border: isSelected ? `2px solid ${color.navy}` : "1px solid rgba(30,41,59,0.12)",
        background: isSelected
          ? "rgba(255,255,255,0.92)"
          : isUnlocked
            ? "rgba(255,255,255,0.6)"
            : "rgba(255,255,255,0.35)",
        boxShadow: isSelected ? "0 4px 14px rgba(39,67,94,0.25)" : "none",
        cursor: isUnlocked ? "pointer" : "default",
        fontFamily: font.ui,
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
        pointerEvents: "auto",
      }}
    >
      <SkinPreview
        skin={skin}
        style={{
          // Shrinks on short landscape phones so the whole start screen fits without scrolling
          height: `clamp(44px, 11vh, ${SKIN_PREVIEW_H}px)`,
          aspectRatio: `${SKIN_PREVIEW_W} / ${SKIN_PREVIEW_H}`,
          // Dim only the art, so the name and unlock score keep full contrast
          opacity: isUnlocked ? 1 : 0.35,
          filter: isUnlocked ? "none" : "grayscale(1)",
        }}
      />
      <span
        style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          color: color.ink,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {skin.name}
      </span>
      {!isUnlocked && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: color.muted,
          }}
        >
          <LockIcon />
          Best <span style={{ fontFamily: font.mono }}>{skin.unlockScore}</span>
        </span>
      )}
    </button>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
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
        padding: "0.25rem",
        maxWidth: "min(calc(100vw - 72px), 672px)",
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
