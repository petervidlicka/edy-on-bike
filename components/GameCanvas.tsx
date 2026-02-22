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
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [trickFeedback, setTrickFeedback] = useState<{ name: string; points: number } | null>(null);
  const trickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      onTrickLanded: (trickName, points) => {
        if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
        setTrickFeedback({ name: trickName, points });
        trickTimeoutRef.current = setTimeout(() => setTrickFeedback(null), 2000);
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
      if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
    };
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      // Don't intercept space when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.getState();
      if (state === GameState.IDLE || state === GameState.RUNNING) {
        engine.jump();
      }
      // GAME_OVER is fully handled by GameOverScreen's own keydown listener
    }
    if (e.code === "ArrowDown") {
      e.preventDefault();
      engineRef.current?.backflip();
    }
    if (e.code === "ArrowUp") {
      e.preventDefault();
      engineRef.current?.frontflip();
    }
    if (e.code === "ArrowLeft") {
      e.preventDefault();
      engineRef.current?.superman();
    }
    if (e.code === "ArrowRight") {
      e.preventDefault();
      engineRef.current?.noHander();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleTouch = useCallback((e: TouchEvent) => {
    // Don't intercept taps on interactive overlays (name input, submit button)
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "BUTTON") return;
    e.preventDefault();
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    if (state === GameState.IDLE || state === GameState.RUNNING) {
      engine.jump();
    }
    // GAME_OVER touch is handled by the "Play Again" button in GameOverScreen
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("touchstart", handleTouch, { passive: false });
    return () => canvas.removeEventListener("touchstart", handleTouch);
  }, [handleTouch]);

  useEffect(() => {
    engineRef.current?.setMusicMuted(musicMuted);
  }, [musicMuted]);

  useEffect(() => {
    engineRef.current?.setSfxMuted(sfxMuted);
  }, [sfxMuted]);

  // Pause when tab is hidden or device is in portrait (mobile) — resumes on the inverse.
  // A single checkPause fn handles both triggers so they don't conflict.
  const checkPause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const isHidden = document.hidden;
    const isPortraitMobile =
      window.matchMedia("(orientation: portrait)").matches &&
      window.matchMedia("(pointer: coarse)").matches;
    if (isHidden || isPortraitMobile) {
      engine.pause();
    } else {
      engine.resume();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", checkPause);
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", checkPause);
    window.addEventListener("orientationchange", checkPause);
    return () => {
      document.removeEventListener("visibilitychange", checkPause);
      mq.removeEventListener("change", checkPause);
      window.removeEventListener("orientationchange", checkPause);
    };
  }, [checkPause]);

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
          touchAction: "none", // prevent pull-to-refresh / swipe-back on mobile
        }}
      />

      {gameState === GameState.IDLE && <StartScreen />}

      {gameState === GameState.RUNNING && (
        <HUD
          score={score}
          speed={speed}
          trickFeedback={trickFeedback}
          musicMuted={musicMuted}
          sfxMuted={sfxMuted}
          onToggleMusic={() => setMusicMuted((m) => !m)}
          onToggleSfx={() => setSfxMuted((m) => !m)}
          onBackflip={() => engineRef.current?.backflip()}
          onFrontflip={() => engineRef.current?.frontflip()}
          onSuperman={() => engineRef.current?.superman()}
          onNoHander={() => engineRef.current?.noHander()}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen score={score} bestScore={bestScore} onRestart={handleRestart} />
      )}
    </>
  );
}
