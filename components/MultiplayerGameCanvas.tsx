"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Engine } from "@/game/Engine";
import { GameState, SkinId } from "@/game/types";
import { INITIAL_SPEED } from "@/game/constants";
import { getSkinById } from "@/game/skins";
import { MultiplayerAdapter } from "@/game/multiplayer/MultiplayerAdapter";
import { SeededRNG } from "@/game/multiplayer/SeededRNG";
import { PlayerInfo } from "@/game/multiplayer/types";
import { AudioControls, TrickFeedbackPopup, TrickDpad } from "./HUD";
import type { TrickFeedbackData } from "./HUD";
import { usePauseOnHidden } from "@/hooks/usePauseOnHidden";

interface MultiplayerGameCanvasProps {
  roomCode: string;
  seed: number;
  players: PlayerInfo[];
  localPlayerId: string;
  adapter: MultiplayerAdapter;
  onRaceFinished: () => void;
}

export default function MultiplayerGameCanvas({
  roomCode,
  seed,
  players,
  localPlayerId,
  adapter,
  onRaceFinished,
}: MultiplayerGameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [trickFeedback, setTrickFeedback] = useState<TrickFeedbackData | null>(null);
  const trickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [countdown, setCountdown] = useState<3 | 2 | 1 | "GO" | null>(3);
  const [playerStandings, setPlayerStandings] = useState<PlayerInfo[]>(players);

  // Keep standings in sync with players prop
  useEffect(() => {
    setPlayerStandings([...players].sort((a, b) => b.score - a.score));
  }, [players]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;

    const timer = setTimeout(() => {
      if (countdown === 3) setCountdown(2);
      else if (countdown === 2) setCountdown(1);
      else if (countdown === 1) setCountdown("GO");
      else if (countdown === "GO") {
        setCountdown(null);
        // Start the engine after GO disappears
        engineRef.current?.start();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const localPlayer = players.find((p) => p.id === localPlayerId);
    const skinId = (localPlayer?.skinId ?? "default") as SkinId;

    const engine = new Engine(canvas, {
      onScoreUpdate: setScore,
      onSpeedUpdate: setSpeed,
      onGameOver: (finalScore) => {
        setScore(finalScore);
        // Engine already calls adapter.sendCrashed() in its gameOver() method
      },
      onStateChange: (state) => {
        if (state === GameState.RUNNING) {
          setSpeed(INITIAL_SPEED);
        }
      },
      onTrickLanded: (trickName, points, sketchy) => {
        if (trickTimeoutRef.current) clearTimeout(trickTimeoutRef.current);
        setTrickFeedback({ name: trickName, points, sketchy });
        trickTimeoutRef.current = setTimeout(() => setTrickFeedback(null), 2000);
      },
    }, { rng: new SeededRNG(seed), multiplayer: adapter });

    engine.setSkin(getSkinById(skinId));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.getState();
      if (state === GameState.RUNNING) {
        engine.jump();
      }
    }
    if (
      e.code === "ArrowDown" ||
      e.code === "ArrowUp" ||
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight"
    ) {
      e.preventDefault();
      if (e.repeat) return;
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

  // Touch input
  const handleTouch = useCallback((e: TouchEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "BUTTON") return;
    e.preventDefault();
    const engine = engineRef.current;
    if (!engine) return;
    const state = engine.getState();
    if (state === GameState.RUNNING) {
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

  usePauseOnHidden(engineRef);

  const multiplier = (speed / INITIAL_SPEED).toFixed(1);

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

      {/* Countdown overlay */}
      {countdown !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: "5rem",
              fontFamily: "var(--font-fredoka), sans-serif",
              fontWeight: 700,
              color: "#fff",
              textShadow:
                "0 4px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {countdown === "GO" ? "GO!" : countdown}
          </span>
        </div>
      )}

      {/* Multiplayer HUD — player standings + speed + audio + tricks */}
      {countdown === null && (
        <>
          <div
            style={{
              position: "fixed",
              top: "0.75rem",
              right: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              zIndex: 50,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderRadius: "12px",
              padding: "0.5rem 0.75rem",
              minWidth: "140px",
            }}
          >
            {playerStandings.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-nunito), Arial, sans-serif",
                  fontWeight: p.id === localPlayerId ? 700 : 600,
                  color: p.id === localPlayerId ? "#fbbf24" : "#e2e8f0",
                  textDecoration: !p.alive ? "line-through" : "none",
                  opacity: !p.alive ? 0.6 : 1,
                }}
              >
                <span>{p.name}</span>
                <span>{p.score}</span>
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.15)",
                paddingTop: "0.25rem",
                marginTop: "0.1rem",
                fontSize: "0.72rem",
                fontFamily: "var(--font-space-mono), monospace",
                color: "#94a3b8",
                textAlign: "right",
              }}
            >
              &times;{multiplier}
            </div>
            <TrickFeedbackPopup trickFeedback={trickFeedback} />
          </div>

          <AudioControls
            musicMuted={musicMuted}
            sfxMuted={sfxMuted}
            onToggleMusic={() => setMusicMuted((m) => !m)}
            onToggleSfx={() => setSfxMuted((m) => !m)}
          />

          <TrickDpad
            onBackflip={() => engineRef.current?.backflip()}
            onFrontflip={() => engineRef.current?.frontflip()}
            onSuperman={() => engineRef.current?.superman()}
            onNoHander={() => engineRef.current?.noHander()}
          />
        </>
      )}
    </>
  );
}
