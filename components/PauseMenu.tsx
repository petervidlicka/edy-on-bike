"use client";

/**
 * Pause overlay for single-player runs: Resume / Restart / Home plus audio
 * toggles. Resuming goes through a short 3-2-1 countdown so a kid isn't thrown
 * back mid-air with no warning.
 */
import { useCallback, useEffect, useState } from "react";
import type { Engine } from "@/game/Engine";
import { useGamepadPress } from "@/hooks/useGamepad";
import { useCanVibrate } from "@/hooks/useHapticFeedback";
import { GlassPanel } from "./ui/GlassPanel";
import { ScreenTitle } from "./ui/ScreenTitle";
import { GlassButton } from "./ui/GlassButton";
import { font } from "./ui/tokens";

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
 * a "user" pause; it owns the keys that act on a paused game (Space or gamepad A
 * resumes without also jumping, Esc/P or gamepad Menu resume or cancel the countdown).
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

  // Leaving the tab mid-countdown backs out to the menu; otherwise the timer would finish in
  // the background and the player would come back straight into the run.
  const counting = countdown !== null;
  useEffect(() => {
    if (!counting) return;
    const onVisibility = () => {
      if (document.hidden) setCountdown(null);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [counting]);

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

  // Same split as the keys: A resumes, Menu toggles. Claimed so the engine doesn't also jump or re-pause.
  useGamepadPress(
    (e) => {
      if (e.detail.button === "A") {
        e.stopImmediatePropagation();
        startResume();
      } else if (e.detail.button === "Start") {
        e.stopImmediatePropagation();
        setCountdown((c) => (c === null ? COUNTDOWN_START : null));
      }
    },
    { capture: true },
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(30,41,59,0.28)",
        fontFamily: font.ui,
      }}
    >
      {countdown !== null ? (
        <span
          key={countdown}
          style={{
            color: "#fff",
            fontFamily: font.display,
            fontSize: "6rem",
            fontWeight: 600,
            textShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
        >
          {countdown}
        </span>
      ) : (
        <GlassPanel style={{ minWidth: "min(300px, 90vw)" }}>
          <ScreenTitle>Paused</ScreenTitle>
          <GlassButton variant="primary" onClick={startResume} style={{ width: "100%" }}>
            Resume
          </GlassButton>
          <GlassButton variant="secondary" onClick={handleRestart} style={{ width: "100%" }}>
            Restart
          </GlassButton>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            <GlassButton variant="quiet" onClick={onToggleMusic} aria-pressed={!musicMuted}>
              Music: {musicMuted ? "Off" : "On"}
            </GlassButton>
            <GlassButton variant="quiet" onClick={onToggleSfx} aria-pressed={!sfxMuted}>
              Sound: {sfxMuted ? "Off" : "On"}
            </GlassButton>
            {canVibrate && (
              <GlassButton variant="quiet" onClick={onToggleVibration} aria-pressed={vibrationOn}>
                Vibration: {vibrationOn ? "On" : "Off"}
              </GlassButton>
            )}
          </div>
          <GlassButton variant="quiet" onClick={handleHome}>
            Home / change bike
          </GlassButton>
        </GlassPanel>
      )}
    </div>
  );
}
