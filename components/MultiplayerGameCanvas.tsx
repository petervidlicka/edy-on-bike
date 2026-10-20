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
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { AudioControls, TrickFeedbackPopup, TrickDpad } from "./HUD";
import { GlassButton } from "./ui/GlassButton";
import { GlassPanel } from "./ui/GlassPanel";
import { HudChip } from "./ui/HudChip";
import { ScreenTitle } from "./ui/ScreenTitle";
import { badge, color, font, formatScore, glassSurfaceSmall, radius, text } from "./ui/tokens";
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
export function MultiplayerGameCanvas({
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
  const { onGameEvent, vibrationOn, toggleVibration } = useHapticFeedback();
  const { engineRef, score, speed, trickFeedback, musicMuted, sfxMuted, toggleMusic, toggleSfx } =
    useGameEngine(canvasRef, {
      // Engine already calls adapter.sendCrashed() in its gameOver() method
      onGameOver: () => setCrashed(true),
      onGameEvent,
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
        vibrationOn={vibrationOn}
        onToggleVibration={toggleVibration}
      >
        <GlassButton variant="icon" onClick={onLeave} title="Leave race" aria-label="Leave race">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </GlassButton>
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
          <GlassPanel style={{ pointerEvents: "auto", fontFamily: font.ui }}>
            <ScreenTitle>You Crashed</ScreenTitle>
            <span style={text.numberXl}>{formatScore(score)}</span>
            <p style={{ ...text.body, fontSize: "0.875rem" }}>Waiting for the others to finish…</p>
            <GlassButton variant="quiet" onClick={onLeave}>
              Leave race
            </GlassButton>
          </GlassPanel>
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
              top: "1rem",
              right: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.5rem",
              zIndex: 50,
              pointerEvents: "none",
            }}
          >
            <HudChip score={score} multiplier={multiplier} />
            <TrickFeedbackPopup trickFeedback={trickFeedback} />
            <ol
              aria-label="Standings"
              style={{
                ...glassSurfaceSmall,
                margin: 0,
                padding: "6px",
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                width: "200px",
                borderRadius: radius.md,
                fontFamily: font.ui,
              }}
            >
              {playerStandings.map((p, i) => {
                const mine = p.id === localPlayerId;
                return (
                  <li
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "4px 10px",
                      borderRadius: radius.sm,
                      color: mine ? color.white : p.alive ? color.ink : color.muted,
                      background: mine ? color.navy : "rgba(255,255,255,0.6)",
                    }}
                  >
                    <span style={{ width: 14, fontFamily: font.mono, fontSize: "0.75rem", fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: "0.8rem", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    {!p.alive && (
                      <span style={{ ...badge, padding: "1px 6px", fontSize: "0.65rem", color: mine ? color.white : color.muted, background: mine ? "rgba(255,255,255,0.2)" : "rgba(30,41,59,0.08)" }}>
                        OUT
                      </span>
                    )}
                    <span style={{ fontFamily: font.mono, fontSize: "0.8rem", fontWeight: 700 }}>{formatScore(p.score)}</span>
                  </li>
                );
              })}
            </ol>
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
