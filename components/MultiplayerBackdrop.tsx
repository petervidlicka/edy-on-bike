"use client";

/**
 * Game scene behind the multiplayer lobby and results screens. Without it those
 * screens sit on the app's dark body background, where their dark text (styled
 * for the sky, like the single-player start screen) is unreadable.
 */
import { useEffect, useRef } from "react";
import { Engine } from "@/game/Engine";
import { getSkinById } from "@/game/skins";
import type { SkinId } from "@/game/types";

interface MultiplayerBackdropProps {
  /** Rider shown on the road — the player's current pick. */
  skinId: SkinId;
}

/**
 * An idle Engine: it draws sky, buildings, road and rider like the single-player
 * start screen, but never starts (no input handlers, no audio until start()).
 */
export default function MultiplayerBackdrop({ skinId }: MultiplayerBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, {
      onScoreUpdate: () => {},
      onGameOver: () => {},
      onStateChange: () => {},
    });
    engineRef.current = engine;

    const handleResize = () => engine.resize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => {
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setSkin(getSkinById(skinId));
  }, [skinId]);

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
