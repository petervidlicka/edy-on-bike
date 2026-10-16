"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { GameState, ObstacleType } from "@/game/types";
import { getSkinById, SKINS } from "@/game/skins";
import { loadSkinState } from "@/game/storage";
import StartScreen from "./StartScreen";
import HUD from "./HUD";
import GameOverScreen from "./GameOverScreen";
import { PauseMenu } from "./PauseMenu";

import { useCheatCode } from "@/hooks/useCheatCode";
import { useDebugObstaclesFlag } from "@/hooks/useDebugObstaclesFlag";
import { usePauseOnHidden } from "@/hooks/usePauseOnHidden";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useEngineInput } from "@/hooks/useEngineInput";
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
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  // True while the player (or a hidden tab promoted to one) holds a "user" pause
  const [userPaused, setUserPaused] = useState(false);
  const [newlyUnlockedSkins, setNewlyUnlockedSkins] = useState<string[]>([]);
  // ?obstacles=debug flag — off during prerender/hydration, then read from the URL
  const [debugObstacles, toggleDebugObstacles] = useDebugObstaclesFlag();

  // Saved skin state — defaults during prerender/hydration, then the stored value
  const [skinState, chooseSkin] = useSavedSkinState();
  const { bestScore, cheatUnlocked, selectedSkinId } = skinState;

  const { engineRef, score, speed, trickFeedback, musicMuted, sfxMuted, toggleMusic, toggleSfx } =
    useGameEngine(canvasRef, {
      onGameOver: (finalScore) => {
        setGameState(GameState.GAME_OVER);
        // Determine newly unlocked skins before updating best score
        const previousBest = loadSkinState().bestScore;
        const unlocked = SKINS.filter(
          s => finalScore >= s.unlockScore && previousBest < s.unlockScore && s.unlockScore > 0
        );
        setNewlyUnlockedSkins(unlocked.map(s => s.name));
        recordBestScore(finalScore);
      },
      onStateChange: setGameState,
      onPauseChange: (_paused, reasons) => setUserPaused(reasons.includes("user")),
    });

  // Sync skin to engine on mount, after hydration swaps in the saved skin, and on selection
  useEffect(() => {
    engineRef.current?.setSkin(getSkinById(selectedSkinId));
  }, [engineRef, selectedSkinId]);

  // Sync debug obstacle sequence to engine the same way (URL flag is read after hydration)
  useEffect(() => {
    engineRef.current?.setDebugObstacles(debugObstacles ? DEBUG_OBSTACLE_SEQUENCE : null, 700);
  }, [engineRef, debugObstacles]);

  const handleRestart = useCallback(() => {
    engineRef.current?.restart();
  }, [engineRef]);

  useEngineInput(engineRef, canvasRef, { allowIdleStart: true, allowPause: true });

  // IDKFA cheat code — unlock all skins
  useCheatCode("IDKFA", unlockAllSkins);

  // IDDQD cheat code — guaranteed ambulance resurrection
  const handleIddqd = useCallback(() => {
    engineRef.current?.activateIddqd();
  }, [engineRef]);
  useCheatCode("IDDQD", handleIddqd);

  // Pause when tab is hidden or device is in portrait (mobile); a hidden tab leaves the pause menu up
  usePauseOnHidden(engineRef, { promoteToUserPause: true });

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
          onToggleMusic={toggleMusic}
          onToggleSfx={toggleSfx}
          onPause={() => engineRef.current?.pause("user")}
          onJump={() => engineRef.current?.jump()}
          onBackflip={() => engineRef.current?.backflip()}
          onFrontflip={() => engineRef.current?.frontflip()}
          onSuperman={() => engineRef.current?.superman()}
          onNoHander={() => engineRef.current?.noHander()}
        />
      )}

      {userPaused && (
        <PauseMenu
          engineRef={engineRef}
          musicMuted={musicMuted}
          sfxMuted={sfxMuted}
          onToggleMusic={toggleMusic}
          onToggleSfx={toggleSfx}
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
