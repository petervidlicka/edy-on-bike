"use client";

/**
 * Game scene behind the multiplayer lobby and results screens. Without it those
 * screens sit on the app's dark body background, where their dark text (styled
 * for the sky, like the single-player start screen) is unreadable.
 */
import { useEffect, useRef } from "react";
import { getSkinById } from "@/game/skins";
import type { SkinId } from "@/game/types";
import { useGameEngine } from "@/hooks/useGameEngine";

interface MultiplayerBackdropProps {
  /** Rider shown on the road — the player's current pick. */
  skinId: SkinId;
}

/**
 * An idle Engine: it draws sky, buildings, road and rider like the single-player
 * start screen, but never starts (no input handlers, no audio until start()).
 */
export function MultiplayerBackdrop({ skinId }: MultiplayerBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engineRef } = useGameEngine(canvasRef);

  useEffect(() => {
    engineRef.current?.setSkin(getSkinById(skinId));
  }, [engineRef, skinId]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "block",
      }}
    />
  );
}
