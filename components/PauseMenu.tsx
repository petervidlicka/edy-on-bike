"use client";

/**
 * Pause overlay for single-player runs: Resume / Restart / Home plus audio
 * toggles. Resuming goes through a short 3-2-1 countdown so a kid isn't thrown
 * back mid-air with no warning.
 */
import { useCallback, useEffect, useState } from "react";
import type { Engine } from "@/game/Engine";
import { useCanVibrate } from "@/hooks/useHapticFeedback";
import { glassBtn } from "./sharedStyles";

/** Time each countdown number stays on screen (3 numbers = 1.5 s total). */
const COUNTDOWN_STEP_MS = 500;
const COUNTDOWN_START = 3;

interface PauseMenuProps {
  engineRef: React.RefObject<Engine | null>;
  musicMuted: boolean;
  sfxMuted: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  vibrationOn: boolean;
  onToggleVibration: () => void;
}

/**
 * Overlay shown while the player has paused. Mount it only while the engine holds
 * a "user" pause; it owns the keys that act on a paused game (Space resumes
 * without also jumping, Esc/P resume or cancel the countdown).
 * @param props - Engine ref plus audio state and toggles to mirror the HUD.
 * @example
 * {userPaused && <PauseMenu engineRef={engineRef} musicMuted={m} sfxMuted={s} onToggleMusic={tm} onToggleSfx={ts} vibrationOn={v} onToggleVibration={tv} />}
 */
export function PauseMenu({
  engineRef,
  musicMuted,
  sfxMuted,
  onToggleMusic,
  onToggleSfx,
  vibrationOn,
  onToggleVibration,
}: PauseMenuProps) {
  const canVibrate = useCanVibrate();
  const [countdown, setCountdown] = useState<number | null>(null);

  // Tick 3 → 2 → 1, then hand control back to the engine.
  useEffect(() => {
    if (countdown === null) return;
    const timer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        setCountdown(null);
        engineRef.current?.resume("user");
      }
    }, COUNTDOWN_STEP_MS);
    return () => clearTimeout(timer);
  }, [countdown, engineRef]);

  const startResume = useCallback(() => {
    setCountdown((c) => c ?? COUNTDOWN_START);
  }, []);

  const handleRestart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.restart(); // clears the pause and returns to IDLE
    engine.start();
  }, [engineRef]);

  const handleHome = useCallback(() => {
    engineRef.current?.restart();
  }, [engineRef]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        // Capture phase + stop: the same press must not also reach the jump handler.
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) startResume();
      } else if ((e.code === "Escape" || e.code === "KeyP") && !e.repeat) {
        e.preventDefault();
        // Esc/P toggles: during the countdown it backs out to the menu.
        setCountdown((c) => (c === null ? COUNTDOWN_START : null));
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [startResume]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.7rem",
        background: "rgba(30,41,59,0.28)",
        fontFamily: "var(--font-nunito), Arial, sans-serif",
      }}
    >
      {countdown !== null ? (
        <span
          key={countdown}
          style={{
            color: "#fff",
            fontFamily: "var(--font-fredoka), sans-serif",
            fontSize: "6rem",
            fontWeight: 600,
            textShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
        >
          {countdown}
        </span>
      ) : (
        <>
          <h2
            style={{
              color: "#fff",
              fontSize: "2.5rem",
              fontFamily: "var(--font-fredoka), sans-serif",
              fontWeight: 600,
              margin: "0 0 0.5rem",
              textShadow: "0 2px 12px rgba(0,0,0,0.35)",
            }}
          >
            Paused
          </h2>
          <button onClick={startResume} style={{ ...glassBtn, fontSize: "1.2rem", padding: "0.7rem 3rem" }}>
            Resume
          </button>
          <button onClick={handleRestart} style={glassBtn}>
            Restart
          </button>
          <button onClick={handleHome} style={glassBtn}>
            Home
          </button>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button onClick={onToggleMusic} style={{ ...glassBtn, padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
              Music: {musicMuted ? "Off" : "On"}
            </button>
            <button onClick={onToggleSfx} style={{ ...glassBtn, padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
              Sound: {sfxMuted ? "Off" : "On"}
            </button>
            {canVibrate && (
              <button onClick={onToggleVibration} style={{ ...glassBtn, padding: "0.4rem 1rem", fontSize: "0.8rem" }}>
                Vibration: {vibrationOn ? "On" : "Off"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
