import { GameState, AmbulancePhase, AmbulanceState, ObstacleInstance, ObstacleType, TrickType, SkinDefinition } from "./types";
import {
  GROUND_RATIO,
  INITIAL_SPEED,
  SPEED_INCREASE,
  SPEED_INTERVAL,
  SCORE_PER_PX,
  MAX_SPEED_MULTIPLIER,
  FLIP_TOLERANCE,
  SKETCHY_TOLERANCE,
  AMBULANCE_CHANCE,
  CRASH_SKIP_AFTER_S,
  BIG_TRICK_POINTS,
  COMBO_MIN_LINKS_FOR_SUMMARY,
  COMBO_FLASH_MULTIPLIER,
  COMBO_CONFETTI_MULTIPLIER,
  COMBO_CONFETTI_COUNT,
  GRIND_MIN_MS,
  GRIND_BASE,
  GRIND_PER_SEC,
} from "./constants";
import type { ComboEndReason, GameEvent } from "./events";
import { createChain, addLink, tickChain, endChain } from "./ComboChain";
import {
  FloatingText,
  createTrickFloatingText,
  createComboSummaryText,
  updateFloatingTexts,
  processTrickLanding,
  TrickContext
} from "./TrickSystem";
import { createPlayer, updatePlayer, jumpPlayer, startBackflip, startFrontflip, startSuperman, startNoHander } from "./Player";
import { createBackgroundLayers, updateLayers, getTotalLayerWidth } from "./Background";
import {
  drawBackground, drawPlayer, drawObstacle, drawFloatingText,
  createParticles, updateParticles, drawParticles, drawAmbulance, drawReviveFlash,
  createConfettiBurst, updateConfetti, drawConfetti,
  createComboFx, triggerComboFx, clearComboFx, updateComboFx,
  drawComboMeter, drawComboFlash, resolveDisplayFont,
  getRearWheelContact, emitSparks, updateSparks, drawSparks,
} from "./rendering";
import type { Particle, ConfettiPiece, Spark } from "./rendering";
import type { ParticleOverlayConfig } from "./environments/types";
import { spawnObstacle, createObstacle, nextSpawnGap, getGrindLabel } from "./Obstacle";
import { checkCollision, checkRideableCollision } from "./Collision";
import { processRampInteractions, processRidingState } from "./RampPhysics";
import { SoundManager } from "./SoundManager";
import { EnvironmentManager } from "./environments";
import { getSkinById } from "./skins";
import { voiceCueFor } from "./voiceLines";
import { createAmbulanceState, updateAmbulanceLogic, AmbulanceAction } from "./CrashSequence";
import {
  beginCrash, createCrashPopText, createCrashState, crashPopFor, drawCrash, pickVariant, stepCrash, tickCrashAnim,
} from "./crashes";
import type { CrashCause } from "./crashes";
import type { MultiplayerAdapter } from "./multiplayer/MultiplayerAdapter";
import type { GhostSnapshot } from "./multiplayer/protocol";
import { drawGhostPlayer } from "./multiplayer/GhostPlayerRenderer";

/** Milliseconds per 60fps frame; converts the capped `dt` into game time for the chain timers. */
const FRAME_MS = 1000 / 60;

/** An in-progress grind: the obstacle being ridden and how long (game time) it has been ridden. */
interface GrindState {
  obstacle: ObstacleInstance;
  ms: number;
}

/**
 * Why the engine is paused. The loop runs only while no reason is held, so the
 * visibility hook can't un-pause a game the player paused on purpose.
 */
export type PauseReason = "user" | "hidden" | "orientation";

export type EngineCallbacks = {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
  onStateChange: (state: GameState) => void;
  onSpeedUpdate?: (speed: number) => void;
  /** Legacy trick callback, kept alongside `onGameEvent` for the HUD's trick popup. */
  onTrickLanded?: (trickName: string, points: number, sketchy?: boolean, multiplier?: number) => void;
  /** Receives every game event (run start, tricks, crashes, ...) for React-side reactions. */
  onGameEvent?: (event: GameEvent) => void;
  /**
   * Fires whenever the set of pause reasons changes, so React can show or hide
   * the pause menu. `paused` is true while any reason is held.
   */
  onPauseChange?: (paused: boolean, reasons: readonly PauseReason[]) => void;
};

/** Optional Engine dependencies, used by multiplayer to make runs reproducible across clients. */
export interface EngineOptions {
  /**
   * Drives obstacle spawning only (type + gap), so every client seeded with the same
   * value gets the same course. Never use it for anything whose number of draws depends
   * on viewport size or frame timing (backgrounds, particles) — that would desync clients.
   */
  rng?: { random(): number };
  multiplayer?: MultiplayerAdapter;
}

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState = GameState.IDLE;
  private envManager = new EnvironmentManager();
  private player = createPlayer(0, 0);
  private layers = createBackgroundLayers(0, 0, this.envManager.getCurrentEnvironment());
  private obstacles: ObstacleInstance[] = [];
  private speed: number = INITIAL_SPEED;
  private score: number = 0;
  private distance: number = 0;
  private elapsedMs: number = 0;
  private lastTime: number = 0;
  private speedTimer: number = 0;
  private distanceSinceLastObstacle: number = 0;
  private nextObstacleGap: number = 0;
  private rafId: number = 0;
  private pauseReasons = new Set<PauseReason>();
  private floatingTexts: FloatingText[] = [];
  /** Trick chain across landings; ticked from update() so it freezes while paused. */
  private chain = createChain();
  private comboFx = createComboFx();
  private confetti: ConfettiPiece[] = [];
  /** Canvas font stack for the combo meter, resolved on first use (needs the mounted DOM). */
  private displayFont: string | null = null;
  /**
   * The ride in progress along a rideable obstacle, if any. Lives here rather than on
   * PlayerState so multiplayer ghost snapshots stay unchanged.
   */
  private grind: GrindState | null = null;
  private sparks: Spark[] = [];
  private canvasW: number = 0;
  private canvasH: number = 0;
  private groundY: number = 0;
  private callbacks: EngineCallbacks;
  private sound = new SoundManager();
  private ambulance: AmbulanceState | null = null;
  private hasBeenResurrected = false;
  private iddqdActive = false;
  private skin: SkinDefinition = getSkinById("default");
  private debugSequence: ObstacleType[] | null = null;
  private debugIndex: number = 0;
  private debugGap: number = 500;
  private crashState = createCrashState();
  /**
   * Decided when the crash starts (not when it ends) so the player can skip a crash
   * animation that no ambulance follows; an ambulance, once rolled, always plays.
   */
  private ambulancePending = false;
  private particles: Particle[] = [];
  private particleConfig: ParticleOverlayConfig | null = null;
  private rng: { random(): number } = { random: Math.random };
  private multiplayer: MultiplayerAdapter | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks, options?: EngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.callbacks = callbacks;
    if (options?.rng) this.rng = options.rng;
    if (options?.multiplayer) this.multiplayer = options.multiplayer;
    this.loop = this.loop.bind(this);
    this.resize(window.innerWidth, window.innerHeight);
    this.rafId = requestAnimationFrame(this.loop);
  }

  resize(w: number, h: number): void {
    this.canvasW = w;
    this.canvasH = h;
    this.groundY = Math.floor(h * GROUND_RATIO);
    this.canvas.width = w;
    this.canvas.height = h;
    this.layers = createBackgroundLayers(w, this.groundY, this.envManager.getCurrentEnvironment());
    if (this.state !== GameState.RUNNING && this.state !== GameState.AMBULANCE) {
      this.player = createPlayer(this.groundY, w);
    } else {
      this.player.y = Math.min(this.player.y, this.groundY - this.player.height);
    }
    // The loop is stopped while paused; setting the canvas size cleared it, so redraw the frozen frame.
    if (this.isPaused()) this.render();
  }

  start(): void {
    if (this.state !== GameState.IDLE) return;
    this.state = GameState.RUNNING;
    this.nextObstacleGap = nextSpawnGap(this.speed, this.elapsedMs, this.rng.random.bind(this.rng));
    this.sound.startMusic();
    // First user gesture: the one place the voice clips may be fetched and decoded
    this.sound.voice.preload();
    this.callbacks.onStateChange(this.state);
    this.emit({ type: "runStart" });
  }

  restart(): void {
    // Drop only the player's pause: a phone still held in portrait (or a hidden tab) keeps the game frozen.
    const wasPaused = this.isPaused();
    const hadUserPause = this.pauseReasons.delete("user");
    this.sound.stopSiren();
    this.cancelGrind();
    this.sound.reset();
    this.ambulance = null;
    this.ambulancePending = false;
    this.hasBeenResurrected = false;
    this.iddqdActive = false;
    this.state = GameState.IDLE;
    this.speed = INITIAL_SPEED;
    this.score = 0;
    this.distance = 0;
    this.elapsedMs = 0;
    this.speedTimer = 0;
    this.lastTime = 0;
    this.distanceSinceLastObstacle = 0;
    this.nextObstacleGap = 0;
    this.debugIndex = 0;
    this.obstacles = [];
    this.floatingTexts = [];
    this.chain = createChain();
    clearComboFx(this.comboFx);
    this.confetti = [];
    this.envManager.reset();
    this.particles = [];
    this.particleConfig = null;
    this.player = createPlayer(this.groundY, this.canvasW);
    this.layers = createBackgroundLayers(this.canvasW, this.groundY, this.envManager.getCurrentEnvironment());
    this.callbacks.onScoreUpdate(0);
    this.callbacks.onStateChange(this.state);
    if (wasPaused && !this.isPaused()) {
      // The loop was stopped by the pause; bring it back for the fresh run.
      this.lastTime = 0;
      this.rafId = requestAnimationFrame(this.loop);
    }
    if (hadUserPause) this.notifyPauseChange();
  }

  jump(): void {
    if (this.state === GameState.IDLE) {
      this.start();
      return;
    }
    if (this.state === GameState.RUNNING) {
      const prevCount = this.player.jumpCount;
      jumpPlayer(this.player);
      if (this.player.jumpCount > prevCount) {
        this.sound.playJump(prevCount === 1);
      }
      // Jumping off the top ends the grind right away rather than on the next frame
      if (this.grind && !this.player.ridingObstacle) this.endGrind();
    } else if (this.state === GameState.CRASHING) {
      this.skipCrash();
    }
  }

  backflip(): void {
    if (this.state !== GameState.RUNNING) return;
    startBackflip(this.player);
  }

  frontflip(): void {
    if (this.state !== GameState.RUNNING) return;
    startFrontflip(this.player);
  }

  superman(): void {
    if (this.state !== GameState.RUNNING) return;
    startSuperman(this.player);
  }

  noHander(): void {
    if (this.state !== GameState.RUNNING) return;
    startNoHander(this.player);
  }

  private loop(timestamp: number): void {
    if (this.lastTime === 0) this.lastTime = timestamp;
    const rawDt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    // Normalize to 60fps units — dt=1 at 60fps, capped to avoid spiral on tab switch
    const dt = Math.min(rawDt / (1000 / 60), 3);

    if (this.state === GameState.RUNNING) {
      this.update(dt, rawDt);
    } else if (this.state === GameState.CRASHING) {
      this.updateCrash(dt, rawDt);
    } else if (this.state === GameState.AMBULANCE) {
      this.updateAmbulance(dt, rawDt);
    }

    // Continue driving out ambulance after game resumes
    if (this.state === GameState.RUNNING && this.ambulance) {
      this.updateAmbulance(dt, rawDt);
    }

    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  }

  private update(dt: number, rawDt: number): void {
    // Multiplayer: the server counted us out (e.g. tab hidden too long) — crash out now
    if (this.multiplayer?.isLocalEliminated()) {
      this.startCrash({ kind: "eliminated" });
      return;
    }

    // Environment progression
    const envResult = this.envManager.update(dt, this.elapsedMs);
    if (envResult.biomeStarted) this.emit({ type: "biomeChanged", biome: envResult.biomeStarted });
    if (envResult.musicCrossfade) {
      this.sound.crossfadeTo(envResult.musicCrossfade.track, envResult.musicCrossfade.durationMs);
    }
    if (envResult.appendBackground) {
      // Append new biome buildings to the end of the existing layer so they scroll in naturally
      const toEnv = envResult.appendBackground.toEnv;
      const buildingLayer = this.layers[1];
      const totalWidth = getTotalLayerWidth(buildingLayer, this.canvasW);
      const gap = 300;
      const newElements = toEnv.background.generateElements(this.canvasW, this.groundY, toEnv.palette);
      for (const el of newElements) {
        el.x += totalWidth + gap;
      }
      buildingLayer.elements.push(...newElements);
    }
    if (envResult.regenerateBackground) {
      this.layers = createBackgroundLayers(this.canvasW, this.groundY, envResult.regenerateBackground);
      // Initialize particles if the new biome has a particle overlay
      const overlay = envResult.regenerateBackground.particleOverlay;
      if (overlay) {
        this.particleConfig = overlay;
        this.particles = createParticles(this.canvasW, this.canvasH, overlay);
      } else {
        this.particleConfig = null;
        this.particles = [];
      }
    }

    // Speed progression
    this.speedTimer += rawDt;
    this.elapsedMs += rawDt;
    if (this.speedTimer >= SPEED_INTERVAL) {
      this.speedTimer -= SPEED_INTERVAL;
      this.speed *= 1 + SPEED_INCREASE;
      const maxSpeed = INITIAL_SPEED * MAX_SPEED_MULTIPLIER;
      if (this.speed > maxSpeed) this.speed = maxSpeed;
      this.callbacks.onSpeedUpdate?.(this.speed);
    }

    // Score from distance
    this.distance += this.speed * dt;
    const newScore = Math.floor(this.distance / SCORE_PER_PX);
    if (newScore !== this.score) {
      this.score = newScore;
      this.callbacks.onScoreUpdate(this.score);
    }

    // Update player and background
    const wasAirborne = !this.player.isOnGround;
    const wasBackflipping = this.player.isBackflipping;
    const prevBackflipAngle = this.player.backflipAngle;
    const prevFlipDirection = this.player.flipDirection;
    updatePlayer(this.player, dt, this.groundY, this.speed);
    updateLayers(this.layers, this.speed, dt);
    if (this.particleConfig && this.particles.length > 0) {
      updateParticles(this.particles, this.particleConfig, dt, this.canvasW, this.canvasH);
    }

    const FULL_FLIP = Math.PI * 2;
    // Where a botched landing plants the rider: the road, or the top of the obstacle landed on
    let landingSurfaceY = this.groundY;
    const trickCtx: TrickContext = {
      player: this.player,
      onCrash: (underRotated) => this.startCrash({ kind: "badLanding", underRotated, surfaceY: landingSurfaceY }),
      onAwardBonus: (label, bonus, sketchy) => this.awardTrickBonus(label, bonus, sketchy)
    };

    // Trick landing checks — unified to support combos (pose + flip simultaneously)
    if (wasAirborne && this.player.isOnGround) {
      const hadFlip = wasBackflipping;
      const hadPose = this.player.activeTrick !== TrickType.NONE;
      landingSurfaceY = Math.min(this.groundY, this.player.y + this.player.height);
      if (processTrickLanding(trickCtx, hadFlip, hadPose, prevBackflipAngle, prevFlipDirection, FULL_FLIP, FLIP_TOLERANCE, SKETCHY_TOLERANCE)) return;
    }

    // Trick chain: the window only drains on the ground (not in the air, not riding an obstacle)
    const dtMs = dt * FRAME_MS;
    updateComboFx(this.comboFx, dtMs);
    updateConfetti(this.confetti, dt);
    if (tickChain(this.chain, dtMs, this.player.isOnGround && !this.player.ridingObstacle)) {
      this.finishChain("expired");
    }

    // Update floating texts (float up + fade out)
    this.floatingTexts = updateFloatingTexts(this.floatingTexts, dt);

    // Move obstacles and cull off-screen ones
    for (const obs of this.obstacles) {
      obs.x -= this.speed * dt;
    }
    this.obstacles = this.obstacles.filter((obs) => obs.x + obs.width > 0);

    // Obstacle spawning
    this.distanceSinceLastObstacle += this.speed * dt;
    const gap = this.debugSequence ? this.debugGap : this.nextObstacleGap;
    if (this.distanceSinceLastObstacle >= gap) {
      if (this.debugSequence) {
        const type = this.debugSequence[this.debugIndex % this.debugSequence.length];
        this.obstacles.push(createObstacle(type, this.canvasW, this.groundY));
        this.debugIndex++;
      } else {
        this.obstacles.push(
          spawnObstacle(this.canvasW, this.groundY, this.envManager.getBiomeElapsedMs(this.elapsedMs), this.envManager.getCurrentEnvironment(), this.rng.random.bind(this.rng))
        );
      }
      this.distanceSinceLastObstacle = 0;
      if (!this.debugSequence) {
        this.nextObstacleGap = nextSpawnGap(this.speed, this.elapsedMs, this.rng.random.bind(this.rng));
      }
    }

    // Ramp interaction (before collision checks)
    processRampInteractions(this.player, this.obstacles, this.groundY);
    processRidingState(this.player);
    this.updateGrind(dtMs, dt);

    // Collision detection
    for (const obs of this.obstacles) {
      if (this.player.ridingObstacle === obs) continue;
      if (obs.ramp) continue; // ramps never crash

      if (obs.rideable) {
        const result = checkRideableCollision(this.player, obs);
        if (result === "crash") {
          this.startCrash({ kind: "obstacle", obstacle: obs });
          return;
        }
        if (result === "land_on_top") {
          // Check trick landing on rideable (combo-aware)
          const landFlip = this.player.isBackflipping;
          const landPose = this.player.activeTrick !== TrickType.NONE;
          landingSurfaceY = obs.y;
          if (processTrickLanding(trickCtx, landFlip, landPose, this.player.backflipAngle, this.player.flipDirection, FULL_FLIP, FLIP_TOLERANCE, SKETCHY_TOLERANCE)) return;
          this.player.ridingObstacle = obs;
          this.player.y = obs.y - this.player.height;
          this.player.velocityY = 0;
          this.player.isOnGround = false;
          this.player.jumpCount = 0;
          this.beginGrind(obs);
        }
      } else {
        if (checkCollision(this.player, obs)) {
          this.startCrash({ kind: "obstacle", obstacle: obs });
          return;
        }
      }
    }

    // Multiplayer: send local state snapshot
    if (this.multiplayer) {
      this.multiplayer.sendLocalState(this.buildSnapshot());
    }
  }

  /**
   * Begins a crash. What was hit picks the animation; the ambulance is decided here too
   * so the player may skip the animation when none is coming.
   * @param cause - What the rider crashed into (an obstacle, a botched landing, an elimination).
   */
  private startCrash(cause: CrashCause): void {
    // Crashes are local only (multiplayer ghosts just fade), so Math.random is safe here
    const variant = pickVariant(cause, Math.random);
    this.emit({ type: "crash", variant });
    // A crash ends the chain without paying a cash-in; a revive starts a fresh one
    this.finishChain("crash");
    this.cancelGrind();
    clearComboFx(this.comboFx);
    this.confetti = [];
    this.state = GameState.CRASHING;
    this.sound.stopMusic();
    this.sound.playCrash(variant);
    beginCrash(this.crashState, variant, { player: this.player, speed: this.speed, groundY: this.groundY, cause });
    this.ambulancePending =
      !this.multiplayer && !this.hasBeenResurrected && (this.iddqdActive || Math.random() < AMBULANCE_CHANCE);
    this.floatingTexts.push(
      createCrashPopText(crashPopFor(variant), { x: this.player.x + this.player.width / 2 + 18, y: this.player.y - 36 }, this.canvasW),
    );
    this.callbacks.onStateChange(this.state);
  }

  /**
   * Cuts a crash animation short and goes on to game over. Only allowed once the crash has
   * played for a moment, and never when an ambulance is coming: that always plays out.
   */
  private skipCrash(): void {
    if (this.state !== GameState.CRASHING || this.isPaused() || this.ambulancePending) return;
    if (this.crashState.elapsed < CRASH_SKIP_AFTER_S) return;
    // The boings and rustles are timed to the animation being skipped
    this.sound.stopCrashSounds();
    this.gameOver();
  }

  private gameOver(): void {
    // In multiplayer: no ambulance — go straight to game over and notify server
    if (this.multiplayer) {
      this.multiplayer.sendCrashed(this.score);
      this.finalGameOver();
      return;
    }
    if (this.ambulancePending) {
      this.ambulancePending = false;
      this.hasBeenResurrected = true;
      this.iddqdActive = false;
      this.startAmbulanceSequence();
    } else {
      this.finalGameOver();
    }
  }

  private finalGameOver(): void {
    this.state = GameState.GAME_OVER;
    this.callbacks.onStateChange(this.state);
    this.callbacks.onGameOver(this.score);
  }

  private startAmbulanceSequence(): void {
    this.state = GameState.AMBULANCE;
    this.ambulance = createAmbulanceState(this.player.x, this.player.width, this.canvasW, this.groundY);
    this.crashState.elapsed = this.crashState.duration - 0.31; // Keep ragdoll visible (alpha ~1)
    this.sound.playSiren();
    this.callbacks.onStateChange(this.state);
  }

  private updateAmbulance(dt: number, rawDt: number): void {
    if (!this.ambulance) return;

    this.floatingTexts = updateFloatingTexts(this.floatingTexts, dt);

    // The crashed rider keeps wiggling while the ambulance drives up
    if (this.ambulance.phase === AmbulancePhase.DRIVING_IN || this.ambulance.phase === AmbulancePhase.STOPPED) {
      tickCrashAnim(this.crashState, rawDt);
    }

    const action = updateAmbulanceLogic(this.ambulance, dt, rawDt, this.canvasW);

    if (action === AmbulanceAction.STOP_SIREN) {
      this.sound.stopSiren();
    } else if (action === AmbulanceAction.REVIVE) {
      this.revivePlayer();
      this.sound.playRevive();
    } else if (action === AmbulanceAction.RESUME_GAME) {
      this.state = GameState.RUNNING;
      this.sound.startMusic();
      this.callbacks.onStateChange(this.state);
    } else if (action === AmbulanceAction.REMOVE) {
      this.ambulance = null;
    }
  }

  private revivePlayer(): void {
    // Clear obstacles near the player
    const clearZone = this.player.x + this.player.width + 200;
    this.obstacles = this.obstacles.filter((obs) => obs.x > clearZone);

    // Reset player state to ground
    this.player.y = this.groundY - this.player.height;
    this.player.velocityY = 0;
    this.player.isOnGround = true;
    this.player.jumpCount = 0;
    this.player.bikeTilt = 0;
    this.player.riderLean = 0;
    this.player.riderCrouch = 0;
    this.player.legTuck = 0;
    this.player.ridingObstacle = null;
    this.player.backflipAngle = 0;
    this.player.isBackflipping = false;

    // Mercy slowdown
    this.speed *= 0.85;
    this.callbacks.onSpeedUpdate?.(this.speed);

    // Big gap after revive
    this.distanceSinceLastObstacle = 0;
    this.nextObstacleGap = 500;

    this.emit({ type: "revive" });
    this.floatingTexts.push({
      text: "REVIVED!",
      x: this.player.x + this.player.width / 2,
      y: this.player.y - 20,
      opacity: 1,
      velocityY: -1.2,
      color: "#00ff88",
    });
  }

  private updateCrash(dt: number, rawDt: number): void {
    // The pop word ("SPLAT!") has to keep floating and fading while the crash plays
    this.floatingTexts = updateFloatingTexts(this.floatingTexts, dt);
    if (stepCrash(this.crashState, dt, rawDt, this.groundY)) {
      this.gameOver();
    }
  }

  /**
   * Pays a trick link through the chain.
   * @returns Points actually paid (after the chain multiplier).
   */
  private awardTrickBonus(label: string, bonus: number, sketchy?: boolean): number {
    const isSketchy = sketchy ?? false;
    const prevMultiplier = this.chain.multiplier;
    const { multiplier, paid } = addLink(this.chain, bonus);
    this.score += paid;
    this.distance = this.score * SCORE_PER_PX;
    this.callbacks.onScoreUpdate(this.score);
    this.sound.playComboStep(this.chain.links);
    this.floatingTexts.push(createTrickFloatingText(label, paid, this.player.x, this.player.y, this.player.width, isSketchy, multiplier));
    this.emit({ type: "trickLanded", label, points: paid, sketchy: isSketchy, big: bonus >= BIG_TRICK_POINTS, multiplier });
    this.emit({ type: "comboChanged", links: this.chain.links, multiplier });

    // A sketchy landing still counts as a link, but it breaks the chain
    if (isSketchy) {
      this.finishChain("sketchy");
      return paid;
    }
    // Feedback only when the multiplier actually climbs into a tier
    const climbed = multiplier > prevMultiplier;
    triggerComboFx(this.comboFx, climbed && multiplier >= COMBO_FLASH_MULTIPLIER);
    if (climbed && multiplier >= COMBO_CONFETTI_MULTIPLIER) {
      this.confetti.push(...createConfettiBurst(this.canvasW / 2, 70, COMBO_CONFETTI_COUNT));
    }
    return paid;
  }

  /** Starts timing a ride along `obstacle` and its scrape sound; replaces (and pays out) any earlier one. */
  private beginGrind(obstacle: ObstacleInstance): void {
    if (this.grind) this.endGrind();
    this.grind = { obstacle, ms: 0 };
    this.sound.startGrind();
  }

  /**
   * Per-frame grind bookkeeping, run right after the riding state is resolved: pays out
   * a ride that just ended (rolled off the end), otherwise adds the frame to the ride,
   * throws sparks from the rear wheel and keeps existing sparks flying.
   */
  private updateGrind(dtMs: number, dt: number): void {
    if (this.grind) {
      if (this.player.ridingObstacle !== this.grind.obstacle) {
        this.endGrind();
      } else {
        this.grind.ms += dtMs;
        const contact = getRearWheelContact(this.player, this.skin);
        emitSparks(this.sparks, contact.x, contact.y);
      }
    }
    updateSparks(this.sparks, dt);
  }

  /**
   * Finishes the current ride (rolled off or jumped off): stops the scrape and, for a
   * ride of at least GRIND_MIN_MS, awards a combo link named after the obstacle. Crashes
   * and revives never come through here, so they pay nothing (see cancelGrind).
   */
  private endGrind(): void {
    const grind = this.grind;
    if (!grind) return;
    this.grind = null;
    this.sound.stopGrind();
    if (grind.ms < GRIND_MIN_MS) return;
    const base = Math.round(GRIND_BASE + (GRIND_PER_SEC * grind.ms) / 1000);
    const points = this.awardTrickBonus(getGrindLabel(grind.obstacle.type), base);
    this.emit({ type: "grindEnded", obstacle: grind.obstacle.type, points });
  }

  /** Drops the current ride without paying (crash, restart): no award, no sound, no sparks. */
  private cancelGrind(): void {
    this.grind = null;
    this.sparks = [];
    this.sound.stopGrind();
  }

  /**
   * Ends the trick chain. A chain of 2+ links is announced with an event; unless it
   * ended in a crash it also pays out a "cash-in" sound and summary text (the points
   * were already paid link by link).
   */
  private finishChain(reason: ComboEndReason): void {
    const summary = endChain(this.chain);
    if (!summary || summary.links < COMBO_MIN_LINKS_FOR_SUMMARY) return;
    this.emit({ type: "comboEnded", links: summary.links, multiplier: summary.multiplier, total: summary.total, reason });
    if (reason === "crash") return;
    this.sound.playComboCashIn(summary.multiplier);
    this.floatingTexts.push(createComboSummaryText(summary, this.player.x, this.player.y, this.player.width, this.canvasW));
  }

  /**
   * Single exit for game events. Internal reactions are routed here first, then
   * React is told through `callbacks.onGameEvent`. Keeps feature code ignorant of
   * who listens.
   */
  private emit(event: GameEvent): void {
    const cue = voiceCueFor(event);
    if (cue) this.sound.voice.say(cue.event, { variant: cue.variant });
    if (event.type === "trickLanded") {
      this.callbacks.onTrickLanded?.(event.label, event.points, event.sketchy, event.multiplier);
    }
    this.callbacks.onGameEvent?.(event);
  }

  private render(): void {
    const { ctx, canvasW, canvasH, groundY } = this;
    const palette = this.envManager.getCurrentPalette();
    const drawers = this.envManager.getBackgroundDrawers();
    ctx.clearRect(0, 0, canvasW, canvasH);

    const crashing = this.state === GameState.CRASHING;
    if (crashing) {
      ctx.save();
      ctx.translate(this.crashState.shakeOffsetX, this.crashState.shakeOffsetY);
    }

    drawBackground(ctx, this.layers, canvasW, canvasH, groundY, palette, drawers);
    if (this.particleConfig && this.particles.length > 0) {
      drawParticles(ctx, this.particles, this.particleConfig);
    }
    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs, palette);
    }

    // Draw ghost players (multiplayer)
    if (this.multiplayer) {
      const ghosts = this.multiplayer.getGhostPlayers();
      for (const ghost of ghosts) {
        drawGhostPlayer(ctx, ghost, this.groundY, this.canvasW);
      }
    }

    const ambulancePreRevive = this.state === GameState.AMBULANCE
      && this.ambulance
      && (this.ambulance.phase === AmbulancePhase.DRIVING_IN || this.ambulance.phase === AmbulancePhase.STOPPED);

    if (crashing || ambulancePreRevive || this.state === GameState.GAME_OVER) {
      drawCrash(ctx, this.crashState, { skin: this.skin, palette, groundY });
    } else {
      drawPlayer(ctx, this.player, this.skin);
      drawSparks(ctx, this.sparks);
    }

    if (this.ambulance) {
      drawAmbulance(ctx, this.ambulance);
      if (this.ambulance.reviveFlashOpacity > 0) {
        drawReviveFlash(ctx, this.ambulance.reviveFlashOpacity, canvasW, canvasH);
      }
    }

    for (const ft of this.floatingTexts) {
      if (ft.pop) this.displayFont ??= resolveDisplayFont(this.canvas);
      drawFloatingText(ctx, ft.text, ft.x, ft.y, ft.opacity, ft.color, ft.size, {
        rotation: ft.rotation,
        outline: ft.outline,
        pop: ft.pop,
        fontFamily: ft.pop ? this.displayFont ?? undefined : undefined,
      });
    }

    if (crashing) {
      ctx.restore();
    }

    // Combo overlay in screen space, never shaken
    drawConfetti(ctx, this.confetti);
    if (this.state === GameState.RUNNING && this.chain.links > 0) {
      this.displayFont ??= resolveDisplayFont(this.canvas);
      drawComboMeter(ctx, this.chain, this.comboFx, canvasW, canvasH, this.displayFont, performance.now());
    }
    drawComboFlash(ctx, this.comboFx, canvasW, canvasH);
  }

  private buildSnapshot(): GhostSnapshot {
    const p = this.player;
    return {
      t: performance.now(),
      h: this.groundY - p.y,
      og: p.isOnGround,
      wr: p.wheelRotation,
      bt: p.bikeTilt,
      rl: p.riderLean,
      rc: p.riderCrouch,
      lt: p.legTuck,
      ba: p.backflipAngle,
      fd: p.flipDirection,
      at: p.activeTrick,
      tp: p.trickProgress,
      s: this.score,
    };
  }


  getState(): GameState {
    return this.state;
  }
  /**
   * Edy's voice line for a moment only React can detect (the engine knows neither the saved
   * best score nor the unlock thresholds). Plays through the same rules as engine events, except
   * that it waits for a line still playing (usually the crash line at game over) instead of being dropped.
   * @param moment - "newBest" at game over with a personal best, "skinUnlocked" when a bike unlocks mid-run.
   */
  announce(moment: "newBest" | "skinUnlocked"): void {
    this.sound.voice.say(moment, { wait: true });
  }

  /** Plays the in-run "bike unlocked" chime (respects the SFX mute). */
  playUnlockChime(): void {
    this.sound.playUnlock();
  }
  activateIddqd(): void {
    this.iddqdActive = true;
    // Typed mid-crash: the ambulance is already decided, so the cheat has to flip it
    if (this.state === GameState.CRASHING && !this.multiplayer && !this.hasBeenResurrected) {
      this.ambulancePending = true;
    }
    this.floatingTexts.push({
      text: "GOD MODE",
      x: this.canvasW / 2,
      y: this.canvasH * 0.35,
      opacity: 1,
      velocityY: -0.8,
      color: "#ff4444",
    });
  }

  /**
   * Adds a pause reason; the first one stops the loop and the sound.
   * A "user" pause is only allowed mid-run (RUNNING/AMBULANCE), never on the
   * idle, crash or game-over screens.
   */
  pause(reason: PauseReason): void {
    if (reason === "user" && this.state !== GameState.RUNNING && this.state !== GameState.AMBULANCE) return;
    if (this.pauseReasons.has(reason)) return;
    const wasPaused = this.isPaused();
    this.pauseReasons.add(reason);
    if (!wasPaused) {
      cancelAnimationFrame(this.rafId);
      this.sound.voice.stop();
      if (this.state === GameState.RUNNING) {
        this.sound.pauseMusic();
        this.sound.stopGrind();
      } else if (this.state === GameState.CRASHING) {
        this.sound.stopCrashSounds();
      } else if (this.state === GameState.AMBULANCE) {
        this.sound.stopSiren();
      }
    }
    this.notifyPauseChange();
  }

  /** Removes a pause reason; the loop and sound restart once no reason is left. */
  resume(reason: PauseReason): void {
    if (!this.pauseReasons.delete(reason)) return;
    if (!this.isPaused()) {
      this.lastTime = 0; // reset so dt doesn't spike after a long pause
      this.rafId = requestAnimationFrame(this.loop);
      if (this.state === GameState.RUNNING) {
        this.sound.resumeMusic();
        if (this.grind) this.sound.startGrind();
      } else if (this.state === GameState.AMBULANCE && this.ambulance?.phase === AmbulancePhase.DRIVING_IN) {
        this.sound.playSiren();
      }
    }
    this.notifyPauseChange();
  }

  /** True while any pause reason is held. */
  isPaused(): boolean {
    return this.pauseReasons.size > 0;
  }

  /** True if this specific reason is currently held. */
  isPausedBy(reason: PauseReason): boolean {
    return this.pauseReasons.has(reason);
  }

  private notifyPauseChange(): void {
    this.callbacks.onPauseChange?.(this.isPaused(), [...this.pauseReasons]);
  }

  setMusicMuted(muted: boolean): void {
    this.sound.setMusicMuted(muted);
  }

  setSfxMuted(muted: boolean): void {
    this.sound.setSfxMuted(muted);
    // Muting stops the scrape inside the sound manager; bring it back if unmuted mid-grind
    if (!muted && this.grind && this.state === GameState.RUNNING && !this.isPaused()) this.sound.startGrind();
  }

  setSkin(skin: SkinDefinition): void {
    this.skin = skin;
  }

  setDebugObstacles(sequence: ObstacleType[] | null, gap?: number): void {
    this.debugSequence = sequence;
    this.debugIndex = 0;
    if (gap !== undefined) this.debugGap = gap;
  }

  forceNextBiome(): void {
    const result = this.envManager.forceNextBiome();
    if (result.biomeStarted) this.emit({ type: "biomeChanged", biome: result.biomeStarted });
    if (result.musicCrossfade) {
      this.sound.crossfadeTo(result.musicCrossfade.track, result.musicCrossfade.durationMs);
    }
    // Immediately regenerate background with the target environment
    const env = this.envManager.getCurrentEnvironment();
    this.layers = createBackgroundLayers(this.canvasW, this.groundY, env);
    const overlay = env.particleOverlay;
    if (overlay) {
      this.particleConfig = overlay;
      this.particles = createParticles(this.canvasW, this.canvasH, overlay);
    } else {
      this.particleConfig = null;
      this.particles = [];
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.sound.destroy();
  }
}
