/**
 * Engine lifecycle shared by every screen that draws the game: single-player,
 * the multiplayer race and the multiplayer backdrop. Owns the Engine instance and
 * the React state the HUDs read from it, so each screen only adds its own rules.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Engine } from "@/game/Engine";
import type { EngineOptions, PauseReason } from "@/game/Engine";
import { GameState } from "@/game/types";
import { INITIAL_SPEED } from "@/game/constants";

/** A landed trick to flash in the HUD (single-player and multiplayer share the popup). */
export type TrickFeedbackData = { name: string; points: number; sketchy?: boolean };

/** How long a landed trick stays on screen. */
const TRICK_FEEDBACK_MS = 2000;

/** Screen-specific hooks into the engine; all optional. */
export interface UseGameEngineOptions {
  /** Runs after the score has been set to the final value. */
  onGameOver?: (finalScore: number) => void;
  /** Runs on every engine state change (speed is already reset when a run starts). */
  onStateChange?: (state: GameState) => void;
  /** Runs whenever the engine's set of pause reasons changes. */
  onPauseChange?: (paused: boolean, reasons: readonly PauseReason[]) => void;
  /** Builds the Engine's options, read once at mount (e.g. multiplayer's seeded RNG and adapter). */
  createEngineOptions?: () => EngineOptions;
  /** Runs once right after the Engine is constructed, before any frame is drawn. */
  onEngineCreated?: (engine: Engine) => void;
}

/** What a game screen needs to render its HUD and drive the engine. */
export interface GameEngineHandle {
  /** The live Engine; null before mount and after unmount. */
  engineRef: React.RefObject<Engine | null>;
  score: number;
  speed: number;
  /** Last landed trick, cleared automatically after a short delay. */
  trickFeedback: TrickFeedbackData | null;
  musicMuted: boolean;
  sfxMuted: boolean;
  toggleMusic: () => void;
  toggleSfx: () => void;
}

/**
 * Creates an Engine on the canvas at mount and destroys it on unmount, keeping
 * score, speed, trick feedback and mute state in React. The Engine is created
 * exactly once; options are read at mount and callbacks always see the latest
 * options, so callers don't need to memoise them.
 * @param canvasRef - Canvas the Engine draws into.
 * @param options - Screen-specific callbacks and Engine options.
 * @returns The engine ref plus HUD state and mute toggles.
 * @example
 * const { engineRef, score, speed } = useGameEngine(canvasRef, {
 *   onGameOver: () => setGameState(GameState.GAME_OVER),
 * });
 */
export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseGameEngineOptions = {},
): GameEngineHandle {
  const engineRef = useRef<Engine | null>(null);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
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
        onScoreUpdate: setScore,
        onSpeedUpdate: setSpeed,
        onGameOver: (finalScore) => {
          setScore(finalScore);
          optionsRef.current.onGameOver?.(finalScore);
        },
        onStateChange: (state) => {
          if (state === GameState.RUNNING) setSpeed(INITIAL_SPEED);
          optionsRef.current.onStateChange?.(state);
        },
        onPauseChange: (paused, reasons) => optionsRef.current.onPauseChange?.(paused, reasons),
        onTrickLanded: (name, points, sketchy) => {
          if (trickTimeout) clearTimeout(trickTimeout);
          setTrickFeedback({ name, points, sketchy });
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
  }, [canvasRef]);

  useEffect(() => {
    engineRef.current?.setMusicMuted(musicMuted);
  }, [musicMuted]);

  useEffect(() => {
    engineRef.current?.setSfxMuted(sfxMuted);
  }, [sfxMuted]);

  const toggleMusic = useCallback(() => setMusicMuted((m) => !m), []);
  const toggleSfx = useCallback(() => setSfxMuted((m) => !m), []);

  return { engineRef, score, speed, trickFeedback, musicMuted, sfxMuted, toggleMusic, toggleSfx };
}
