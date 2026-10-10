"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Engine } from "@/game/Engine";
import { GameState, ObstacleType } from "@/game/types";
import { INITIAL_SPEED } from "@/game/constants";
import { getSkinById, SKINS } from "@/game/skins";
import { loadSkinState } from "@/game/storage";
import StartScreen from "./StartScreen";
import HUD from "./HUD";
import GameOverScreen from "./GameOverScreen";

import { useCheatCode } from "@/hooks/useCheatCode";
import { useDebugObstaclesFlag } from "@/hooks/useDebugObstaclesFlag";
import { usePauseOnHidden } from "@/hooks/usePauseOnHidden";
import { useSavedSkinState, recordBestScore, unlockAllSkins } from "@/hooks/useSavedSkinState";

const DEBUG_OBSTACLE_SEQUENCE = [
  ObstacleType.STRAIGHT_RAMP, ObstacleType.STRAIGHT_RAMP,
  ObstacleType.CURVED_RAMP, ObstacleType.CURVED_RAMP,
  ObstacleType.SHIPPING_CONTAINER, ObstacleType.SHIPPING_CONTAINER,
  ObstacleType.CONTAINER_WITH_RAMP, ObstacleType.CONTAINER_WITH_RAMP,
  ObstacleType.BUS_STOP, ObstacleType.BUS_STOP,
];

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [trickFeedback, setTrickFeedback] = useState<{ name: string; points: number; sketchy?: boolean } | null>(null);
  const trickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newlyUnlockedSkins, setNewlyUnlockedSkins] = useState<string[]>([]);
  // ?obstacles=debug flag — off during prerender/hydration, then read from the URL
  const [debugObstacles, toggleDebugObstacles] = useDebugObstaclesFlag();

  // Saved skin state — defaults during prerender/hydration, then the stored value
  const [skinState, chooseSkin] = useSavedSkinState();
  const { bestScore, cheatUnlocked, selectedSkinId } = skinState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, {
      onScoreUpdate: setScore,
      onSpeedUpdate: setSpeed,
      onGameOver: (finalScore) => {
        setScore(finalScore);
        setGameState(GameState.GAME_OVER);
        // Determine newly unlocked skins before updating best score
        const previousBest = loadSkinState().bestScore;
        const unlocked = SKINS.filter(
          s => finalScore >= s.unlockScore && previousBest < s.unlockScore && s.unlockScore > 0
        );
        setNewlyUnlockedSkins(unlocked.map(s => s.name));
        recordBestScore(finalScore);
      },
      onStateChange: (state) => {
        setGameState(state);
        if (state === GameState.RUNNING) {
          setSpeed(INITIAL_SPEED);
        }
      },
      onTrickLanded: (trickName, points, sketchy) => {
        if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
        setTrickFeedback({ name: trickName, points, sketchy });
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

  // Sync skin to engine on mount, after hydration swaps in the saved skin, and on selection
  useEffect(() => {
    engineRef.current?.setSkin(getSkinById(selectedSkinId));
  }, [selectedSkinId]);

  // Sync debug obstacle sequence to engine the same way (URL flag is read after hydration)
  useEffect(() => {
    engineRef.current?.setDebugObstacles(debugObstacles ? DEBUG_OBSTACLE_SEQUENCE : null, 700);
  }, [debugObstacles]);

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

  // IDKFA cheat code — unlock all skins
  useCheatCode("IDKFA", unlockAllSkins);

  // IDDQD cheat code — guaranteed ambulance resurrection
  const handleIddqd = useCallback(() => {
    engineRef.current?.activateIddqd();
  }, []);
  useCheatCode("IDDQD", handleIddqd);

  // Pause when tab is hidden or device is in portrait (mobile)
  usePauseOnHidden(engineRef);

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
          onSelectSkin={chooseSkin}
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
          onJump={() => engineRef.current?.jump()}
          onBackflip={() => engineRef.current?.backflip()}
          onFrontflip={() => engineRef.current?.frontflip()}
          onSuperman={() => engineRef.current?.superman()}
          onNoHander={() => engineRef.current?.noHander()}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen
          score={score}
          bestScore={bestScore}
          skinName={getSkinById(selectedSkinId).name}
          newlyUnlockedSkins={newlyUnlockedSkins}
          onRestart={handleRestart}
        />
      )}

      {process.env.NODE_ENV !== "production" && (
        <>
          <button
            onClick={toggleDebugObstacles}
            style={{
              position: "fixed",
              top: 8,
              right: 8,
              padding: "4px 10px",
              fontSize: "0.7rem",
              fontFamily: "monospace",
              background: debugObstacles ? "#d44" : "#555",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              opacity: 0.85,
              zIndex: 9999,
            }}
          >
            Debug: {debugObstacles ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => engineRef.current?.forceNextBiome()}
            style={{
              position: "fixed",
              top: 8,
              right: 110,
              padding: "4px 10px",
              fontSize: "0.7rem",
              fontFamily: "monospace",
              background: "#c87020",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              opacity: 0.85,
              zIndex: 9999,
            }}
          >
            Next Biome
          </button>
        </>
      )}
    </>
  );
}
