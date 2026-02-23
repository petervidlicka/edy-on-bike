"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Engine } from "@/game/Engine";
import { GameState, SkinId } from "@/game/types";
import { INITIAL_SPEED } from "@/game/constants";
import { getSkinById } from "@/game/skins";
import { loadSkinState, updateBestScore, selectSkin, activateCheat } from "@/game/storage";
import StartScreen from "./StartScreen";
import HUD from "./HUD";
import GameOverScreen from "./GameOverScreen";

function useCheatCode(code: string, onActivate: () => void) {
  const bufferRef = useRef("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      bufferRef.current += e.key.toUpperCase();
      if (bufferRef.current.length > code.length) {
        bufferRef.current = bufferRef.current.slice(-code.length);
      }
      if (bufferRef.current === code) {
        bufferRef.current = "";
        onActivate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [code, onActivate]);
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [trickFeedback, setTrickFeedback] = useState<{ name: string; points: number } | null>(null);
  const trickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skin state — lazy initializer reads from localStorage (SSR-safe)
  const [skinState, setSkinState] = useState(() => {
    if (typeof window === "undefined") {
      return { selectedSkinId: "default" as SkinId, bestScore: 0, cheatUnlocked: false };
    }
    return loadSkinState();
  });

  const bestScore = skinState.bestScore;
  const cheatUnlocked = skinState.cheatUnlocked;
  const selectedSkinId = skinState.selectedSkinId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, {
      onScoreUpdate: setScore,
      onSpeedUpdate: setSpeed,
      onGameOver: (finalScore) => {
        setScore(finalScore);
        setGameState(GameState.GAME_OVER);
        const updated = updateBestScore(finalScore);
        setSkinState(updated);
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

    // Apply initial skin
    engine.setSkin(getSkinById(skinState.selectedSkinId));

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync skin to engine when selection changes
  useEffect(() => {
    engineRef.current?.setSkin(getSkinById(selectedSkinId));
  }, [selectedSkinId]);

  const handleSelectSkin = useCallback((id: SkinId) => {
    const updated = selectSkin(id);
    setSkinState(updated);
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.getState();
      if (state === GameState.IDLE || state === GameState.RUNNING) {
        engine.jump();
      }
    }
    if (e.code === "ArrowDown" || e.code === "ArrowUp" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
      e.preventDefault();
      if (e.repeat) return; // prevent key-repeat from queueing extra tricks
      if (e.code === "ArrowDown") engineRef.current?.backflip();
      else if (e.code === "ArrowUp") engineRef.current?.frontflip();
      else if (e.code === "ArrowLeft") engineRef.current?.superman();
      else if (e.code === "ArrowRight") engineRef.current?.noHander();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleTouch = useCallback((e: TouchEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "BUTTON") return;
    e.preventDefault();
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    if (state === GameState.IDLE || state === GameState.RUNNING) {
      engine.jump();
    }
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

  // IDKFA cheat code
  const handleCheat = useCallback(() => {
    const updated = activateCheat();
    setSkinState(updated);
  }, []);
  useCheatCode("IDKFA", handleCheat);

  // Pause when tab is hidden or device is in portrait (mobile)
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
          touchAction: "none",
        }}
      />

      {gameState === GameState.IDLE && (
        <StartScreen
          bestScore={bestScore}
          cheatUnlocked={cheatUnlocked}
          selectedSkinId={selectedSkinId}
          onSelectSkin={handleSelectSkin}
        />
      )}

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
