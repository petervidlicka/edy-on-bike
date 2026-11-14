/**
 * Engine lifecycle shared by every screen that draws the game: single-player,
 * the multiplayer race and the multiplayer backdrop. Owns the Engine instance and
 * the React state the HUDs read from it, so each screen only adds its own rules.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Engine } from "@/game/Engine";
import type { EngineOptions, PauseReason } from "@/game/Engine";
import type { GameEvent } from "@/game/events";
import { GameState } from "@/game/types";
import { INITIAL_SPEED } from "@/game/constants";
import { createEngineStats, type EngineStats } from "./engineStats";
import { useStoredFlag } from "./useStoredFlag";

/** A landed trick to flash in the HUD (single-player and multiplayer share the popup). */
export type TrickFeedbackData = { name: string; points: number; sketchy?: boolean; multiplier: number };

/** How long a landed trick stays on screen. */
const TRICK_FEEDBACK_MS = 2000;

/** Screen-specific hooks into the engine; all optional. */
export interface UseGameEngineOptions {
  /** Runs after the score has been set to the final value; gets the engine so the screen can trigger voice lines. */
  onGameOver?: (finalScore: number, engine: Engine) => void;
  /** Runs on every engine state change (speed is already reset when a run starts). */
  onStateChange?: (state: GameState) => void;
  /** Runs whenever the engine's set of pause reasons changes. */
  onPauseChange?: (paused: boolean, reasons: readonly PauseReason[]) => void;
  /** Runs for every game event (run start, tricks, crashes, ...); use for haptics, toasts, etc. */
  onGameEvent?: (event: GameEvent) => void;
  /** Builds the Engine's options, read once at mount (e.g. multiplayer's seeded RNG and adapter). */
  createEngineOptions?: () => EngineOptions;
  /** Runs once right after the Engine is constructed, before any frame is drawn. */
  onEngineCreated?: (engine: Engine) => void;
}

/** What a game screen needs to render its HUD and drive the engine. */
export interface GameEngineHandle {
  /** The live Engine; null before mount and after unmount. */
  engineRef: React.RefObject<Engine | null>;
  /**
   * Live score and speed. Not React state: read them with `useEngineScore` /
   * `useEngineSpeed` in the component that shows them, so a score tick re-renders
   * only that component.
   */
  stats: EngineStats;
  /** The last finished run's score (React state: set once, at game over). */
  finalScore: number;
  /** Last landed trick, cleared automatically after a short delay. */
  trickFeedback: TrickFeedbackData | null;
  musicMuted: boolean;
  sfxMuted: boolean;
  toggleMusic: () => void;
  toggleSfx: () => void;
}

/**
 * Creates an Engine on the canvas at mount and destroys it on unmount, keeping
 * trick feedback, the final score and the (persisted) mute state in React and the
 * per-tick score/speed in an external store. The Engine is created
 * exactly once; options are read at mount and callbacks always see the latest
 * options, so callers don't need to memoise them.
 * @param canvasRef - Canvas the Engine draws into.
 * @param options - Screen-specific callbacks and Engine options.
 * @returns The engine ref plus HUD state and mute toggles.
 * @example
 * const { engineRef, stats, finalScore } = useGameEngine(canvasRef, {
 *   onGameOver: () => setGameState(GameState.GAME_OVER),
 * });
 */
export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseGameEngineOptions = {},
): GameEngineHandle {
  const engineRef = useRef<Engine | null>(null);
  // One store per hook instance, so two mounted engines (backdrop + race) never share numbers
  const [stats] = useState(createEngineStats);
  const [finalScore, setFinalScore] = useState(0);
  // Persisted; the saved value arrives right after hydration and the effects below push it to the engine
  const [musicMuted, toggleMusic] = useStoredFlag("edy-music-muted", false);
  const [sfxMuted, toggleSfx] = useStoredFlag("edy-sfx-muted", false);
  const [trickFeedback, setTrickFeedback] = useState<TrickFeedbackData | null>(null);

  // Engine callbacks outlive the render that created them, so they read options from here.
  // Layout effect: refreshed before paint, so a frame can't run between commit and update with stale callbacks.
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let trickTimeout: ReturnType<typeof setTimeout> | null = null;
    const engine = new Engine(
      canvas,
      {
        onScoreUpdate: stats.setScore,
        onSpeedUpdate: stats.setSpeed,
        onGameOver: (score) => {
          stats.setScore(score);
          setFinalScore(score);
          optionsRef.current.onGameOver?.(score, engine);
        },
        onStateChange: (state) => {
          // A fresh run starts at the base speed; a revive (back to RUNNING) keeps its own,
          // which the engine has already reported through onSpeedUpdate
          if (state === GameState.IDLE) stats.setSpeed(INITIAL_SPEED);
          optionsRef.current.onStateChange?.(state);
        },
        onPauseChange: (paused, reasons) => optionsRef.current.onPauseChange?.(paused, reasons),
        onGameEvent: (event) => optionsRef.current.onGameEvent?.(event),
        onTrickLanded: (name, points, sketchy, multiplier = 1) => {
          if (trickTimeout) clearTimeout(trickTimeout);
          setTrickFeedback({ name, points, sketchy, multiplier });
          trickTimeout = setTimeout(() => setTrickFeedback(null), TRICK_FEEDBACK_MS);
        },
      },
      optionsRef.current.createEngineOptions?.(),
    );
    optionsRef.current.onEngineCreated?.(engine);
    engineRef.current = engine;

    const handleResize = () => engine.resize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", handleResize);

    return () => {
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener("resize", handleResize);
      if (trickTimeout) clearTimeout(trickTimeout);
    };
  }, [canvasRef, stats]);

  useEffect(() => {
    engineRef.current?.setMusicMuted(musicMuted);
  }, [musicMuted]);

  useEffect(() => {
    engineRef.current?.setSfxMuted(sfxMuted);
  }, [sfxMuted]);

  return { engineRef, stats, finalScore, trickFeedback, musicMuted, sfxMuted, toggleMusic, toggleSfx };
}
