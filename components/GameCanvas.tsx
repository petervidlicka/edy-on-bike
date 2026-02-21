"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Engine } from "@/game/Engine";
import { GameState } from "@/game/types";
import { INITIAL_SPEED } from "@/game/constants";
import StartScreen from "./StartScreen";
import HUD from "./HUD";
import GameOverScreen from "./GameOverScreen";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [bestScore, setBestScore] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, {
      onScoreUpdate: setScore,
      onSpeedUpdate: setSpeed,
      onGameOver: (finalScore) => {
        setScore(finalScore);
        setGameState(GameState.GAME_OVER);
        setBestScore((prev) => Math.max(prev, finalScore));
      },
      onStateChange: (state) => {
        setGameState(state);
        if (state === GameState.RUNNING) {
          setSpeed(INITIAL_SPEED);
        }
      },
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
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "block",
        }}
      />

      {gameState === GameState.IDLE && <StartScreen />}

      {gameState === GameState.RUNNING && (
        <HUD
          score={score}
          speed={speed}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen score={score} bestScore={bestScore} />
      )}
    </>
  );
}
