"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { GameState, ObstacleType } from "@/game/types";
import { getSkinById } from "@/game/skins";
import { loadSkinState } from "@/game/storage";
import StartScreen from "./StartScreen";
import HUD from "./HUD";
import GameOverScreen from "./GameOverScreen";
import { PauseMenu } from "./PauseMenu";
import { UnlockToast } from "./UnlockToast";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { haptic } from "@/lib/haptics";
import { useUnlockToast } from "@/hooks/useUnlockToast";

import { useCheatCode } from "@/hooks/useCheatCode";
import { useDebugObstaclesFlag } from "@/hooks/useDebugObstaclesFlag";
import { usePauseOnHidden } from "@/hooks/usePauseOnHidden";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useEngineInput } from "@/hooks/useEngineInput";
import { useSavedSkinState, recordBestScore, unlockAllSkins } from "@/hooks/useSavedSkinState";

/**
 * ?obstacles=debug course: ramps and rideables for grinds, then one of each crash-variant
 * trigger (trees, a hatchback, a van, a low sports car). Jump a trick and land it badly for the faceplant.
 */
const DEBUG_OBSTACLE_SEQUENCE = [
  ObstacleType.STRAIGHT_RAMP, ObstacleType.CURVED_RAMP,
  ObstacleType.SHIPPING_CONTAINER, ObstacleType.CONTAINER_WITH_RAMP, ObstacleType.BUS_STOP,
  ObstacleType.SMALL_TREE, ObstacleType.TALL_TREE, ObstacleType.GIANT_TREE,
  ObstacleType.CAR, ObstacleType.DELIVERY_VAN, ObstacleType.PORSCHE_911,
];

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  // True while the player (or a hidden tab promoted to one) holds a "user" pause
  const [userPaused, setUserPaused] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);
  // ?obstacles=debug flag — off during prerender/hydration, then read from the URL
  const [debugObstacles, toggleDebugObstacles] = useDebugObstaclesFlag();

  // Saved skin state — defaults during prerender/hydration, then the stored value
  const [skinState, chooseSkin] = useSavedSkinState();
  const { bestScore, cheatUnlocked, selectedSkinId } = skinState;

  const { onGameEvent, vibrationOn, toggleVibration } = useHapticFeedback();

  const { engineRef, score, speed, trickFeedback, musicMuted, sfxMuted, toggleMusic, toggleSfx } =
    useGameEngine(canvasRef, {
      onGameOver: (finalScore) => {
        setGameState(GameState.GAME_OVER);
        // Remember the best from before this run so the unlock bar can animate from it
        const savedBest = loadSkinState().bestScore;
        setPreviousBest(savedBest);
        // Same rule as the game-over header's "New personal best!" line
        if (finalScore > 0 && finalScore >= savedBest) haptic("success");
        recordBestScore(finalScore);
      },
      onStateChange: setGameState,
      onGameEvent,
      onPauseChange: (_paused, reasons) => setUserPaused(reasons.includes("user")),
    });

  const unlockToast = useUnlockToast(engineRef, gameState, score, bestScore, cheatUnlocked);

  // Sync skin to engine on mount, after hydration swaps in the saved skin, and on selection
  useEffect(() => {
    engineRef.current?.setSkin(getSkinById(selectedSkinId));
  }, [engineRef, selectedSkinId]);

  // Sync debug obstacle sequence to engine the same way (URL flag is read after hydration)
  useEffect(() => {
    engineRef.current?.setDebugObstacles(debugObstacles ? DEBUG_OBSTACLE_SEQUENCE : null, 700);
  }, [engineRef, debugObstacles]);

  // Straight into the next run (same as the pause menu's Restart); Home keeps the start screen reachable
  const handleRestart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.restart();
    engine.start();
  }, [engineRef]);

  const handleHome = useCallback(() => {
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
          vibrationOn={vibrationOn}
          onToggleVibration={toggleVibration}
          onPause={() => engineRef.current?.pause("user")}
          onJump={() => engineRef.current?.jump()}
          onBackflip={() => engineRef.current?.backflip()}
          onFrontflip={() => engineRef.current?.frontflip()}
          onSuperman={() => engineRef.current?.superman()}
          onNoHander={() => engineRef.current?.noHander()}
        />
      )}

      <UnlockToast message={unlockToast} />

      {userPaused && (
        <PauseMenu
          engineRef={engineRef}
          musicMuted={musicMuted}
          sfxMuted={sfxMuted}
          onToggleMusic={toggleMusic}
          onToggleSfx={toggleSfx}
          vibrationOn={vibrationOn}
          onToggleVibration={toggleVibration}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen
          score={score}
          bestScore={bestScore}
          skinName={getSkinById(selectedSkinId).name}
          previousBest={previousBest}
          cheatUnlocked={cheatUnlocked}
          onRestart={handleRestart}
          onHome={handleHome}
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
