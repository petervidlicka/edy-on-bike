"use client";

/**
 * Race screen for multiplayer: runs a local Engine seeded like everyone else's,
 * renders remote players as ghosts, and shows live standings, the countdown and
 * a waiting state once the local rider has crashed.
 */
import { useRef, useEffect, useState } from "react";
import { INITIAL_SPEED } from "@/game/constants";
import { getSkinById } from "@/game/skins";
import { MultiplayerAdapter } from "@/game/multiplayer/MultiplayerAdapter";
import { SeededRNG } from "@/game/multiplayer/SeededRNG";
import { PlayerInfo } from "@/game/multiplayer/protocol";
import { AudioControls, TrickFeedbackPopup, TrickDpad, btnStyle } from "./HUD";
import { usePauseOnHidden } from "@/hooks/usePauseOnHidden";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useEngineInput } from "@/hooks/useEngineInput";

/** Scores stream in at ~15 Hz per player; a few standings refreshes per second is plenty. */
const STANDINGS_REFRESH_MS = 250;
/** How long "GO!" stays up after the race starts. */
const GO_DISPLAY_MS = 700;

interface MultiplayerGameCanvasProps {
  seed: number;
  /** Server sent race_start — the shared moment every client starts its engine. */
  raceStarted: boolean;
  players: PlayerInfo[];
  localPlayerId: string;
  adapter: MultiplayerAdapter;
  /** Exit the race at any time — the server counts the player as crashed. */
  onLeave: () => void;
}

/**
 * One race. Mounts at countdown_start and is replaced by the results screen
 * when the server reports race_finished.
 */
export default function MultiplayerGameCanvas({
  seed,
  raceStarted,
  players,
  localPlayerId,
  adapter,
  onLeave,
}: MultiplayerGameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Local rider is out but others may still be racing — show a waiting state with a way out. */
  const [crashed, setCrashed] = useState(false);
  const { engineRef, score, speed, trickFeedback, musicMuted, sfxMuted, toggleMusic, toggleSfx } =
    useGameEngine(canvasRef, {
      // Engine already calls adapter.sendCrashed() in its gameOver() method
      onGameOver: () => setCrashed(true),
      createEngineOptions: () => ({ rng: new SeededRNG(seed), multiplayer: adapter }),
      onEngineCreated: (engine) => {
        const localPlayer = players.find((p) => p.id === localPlayerId);
        engine.setSkin(getSkinById(localPlayer?.skinId ?? "default"));
      },
    });
  const [countdown, setCountdown] = useState<3 | 2 | 1>(3);
  const [goVisible, setGoVisible] = useState(true);
  /** 3-2-1 counts locally; "GO!" and the engine start wait for the server's race_start. */
  const overlay: 3 | 2 | 1 | "GO" | null = raceStarted ? (goVisible ? "GO" : null) : countdown;
  const [playerStandings, setPlayerStandings] = useState<PlayerInfo[]>(() => adapter.getPlayers());

  // The adapter holds live scores (local sends + remote snapshots); room-level `players`
  // only changes on join/leave/ready/crash, so it can't drive a live leaderboard.
  useEffect(() => {
    const refresh = () => setPlayerStandings(adapter.getPlayers().sort((a, b) => b.score - a.score));
    refresh();
    const timer = setInterval(refresh, STANDINGS_REFRESH_MS);
    return () => clearInterval(timer);
  }, [adapter]);

  // Count 3 → 2 → 1 and hold at 1 until the server says go
  useEffect(() => {
    if (raceStarted || countdown === 1) return;
    const timer = setTimeout(() => setCountdown(countdown === 3 ? 2 : 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, raceStarted]);

  // Start on the server's race_start rather than a local timer, so all clients begin together.
  // Declared after the engine effect so the engine exists if the race is already on at mount.
  useEffect(() => {
    if (!raceStarted) return;
    engineRef.current?.start();
    const timer = setTimeout(() => setGoVisible(false), GO_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [engineRef, raceStarted]);

  useEngineInput(engineRef, canvasRef, { allowIdleStart: false });

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

      <AudioControls
        musicMuted={musicMuted}
        sfxMuted={sfxMuted}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      >
        <button
          onClick={onLeave}
          title="Leave race"
          style={{
            ...btnStyle,
            lineHeight: 1,
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            fontFamily: "var(--font-nunito), Arial, sans-serif",
          }}
        >
          LEAVE
        </button>
      </AudioControls>

      {/* Waiting overlay — local rider crashed, race still running for others */}
      {crashed && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 90,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.6rem",
              padding: "1rem 1.5rem",
              borderRadius: "18px",
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "#fff",
              fontFamily: "var(--font-nunito), Arial, sans-serif",
              textAlign: "center",
              pointerEvents: "auto",
            }}
          >
            <span style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-fredoka), sans-serif" }}>
              You crashed! {score}
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.85 }}>
              Waiting for the others to finish…
            </span>
            <button
              onClick={onLeave}
              style={{
                ...btnStyle,
                lineHeight: 1,
                padding: "0.5rem 1.5rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                fontFamily: "var(--font-nunito), Arial, sans-serif",
              }}
            >
              LEAVE
            </button>
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      {overlay !== null && (
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
            {overlay === "GO" ? "GO!" : overlay}
          </span>
        </div>
      )}

      {/* Multiplayer HUD — player standings + speed + tricks */}
      {overlay === null && (
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
