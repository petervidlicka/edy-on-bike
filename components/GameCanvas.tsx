"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Engine } from "@/game/Engine";
import { GameState } from "@/game/types";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, {
      onScoreUpdate: setScore,
      onGameOver: (finalScore) => {
        setScore(finalScore);
        setGameState(GameState.GAME_OVER);
      },
      onStateChange: setGameState,
    });
    engineRef.current = engine;

    const handleResize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.getState();
      if (state === GameState.IDLE || state === GameState.RUNNING) {
        engine.jump();
      } else if (state === GameState.GAME_OVER) {
        engine.restart();
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", display: "block" }}
      />

      {/* IDLE overlay */}
      {gameState === GameState.IDLE && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <h1 style={{ color: "#d4dce4", fontSize: "2.5rem", fontWeight: "bold", margin: 0 }}>
            Edy on Bike
          </h1>
          <p style={{ color: "#a0aab4", marginTop: "1rem", fontSize: "1rem" }}>
            Press <strong>SPACE</strong> to start
          </p>
        </div>
      )}

      {/* Score HUD */}
      {gameState === GameState.RUNNING && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1.5rem",
            color: "#d4dce4",
            fontFamily: "monospace",
            fontSize: "1.25rem",
            fontWeight: "bold",
            pointerEvents: "none",
          }}
        >
          {String(score).padStart(5, "0")}
        </div>
      )}

      {/* GAME OVER overlay — placeholder, will be replaced in Phase 4 */}
      {gameState === GameState.GAME_OVER && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <h2 style={{ color: "#d4dce4", fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
            GAME OVER
          </h2>
          <p style={{ color: "#a0aab4", marginTop: "0.5rem" }}>Score: {score}</p>
          <p style={{ color: "#a0aab4", marginTop: "0.5rem" }}>
            Press <strong>SPACE</strong> to play again
          </p>
        </div>
      )}
    </>
  );
}
