import { GameState, AmbulancePhase, AmbulanceState, CrashState, ObstacleInstance, ObstacleType, TrickType, SkinDefinition } from "./types";
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
  CRASH_DURATION,
  BUILDING_LAYER_INDEX,
  BIOME_APPEND_GAP,
} from "./constants";
import {
  FloatingText,
  createTrickFloatingText,
  updateFloatingTexts,
  processTrickLanding,
  TrickContext
} from "./TrickSystem";
import { createPlayer, updatePlayer, jumpPlayer, startBackflip, startFrontflip, startSuperman, startNoHander } from "./Player";
import { createBackgroundLayers, updateLayers, getTotalLayerWidth } from "./Background";
import { drawBackground, drawPlayer, drawObstacle, drawFloatingText, drawCrashBike, drawCrashRider, createParticles, updateParticles, drawParticles, drawAmbulance, drawReviveFlash } from "./rendering";
import type { Particle } from "./rendering";
import type { ParticleOverlayConfig } from "./environments/types";
import { spawnObstacle, createObstacle, nextSpawnGap, selectObstacleType, needsFlatGround, selectHillSafeObstacleType } from "./Obstacle";
import { Terrain } from "./Terrain";
import { HILL_OBSTACLE_GAP_MULTIPLIER } from "./constants";
import { checkCollision, checkRideableCollision } from "./Collision";
import { processRampInteractions, processRidingState } from "./RampPhysics";
import { SoundManager } from "./SoundManager";
import { EnvironmentManager } from "./environments";
import { getSkinById } from "./skins";
import { initCrashPhysics, updateCrashPhysics, createAmbulanceState, updateAmbulanceLogic, AmbulanceAction } from "./CrashSequence";

export type EngineCallbacks = {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
  onStateChange: (state: GameState) => void;
  onSpeedUpdate?: (speed: number) => void;
  onTrickLanded?: (trickName: string, points: number, sketchy?: boolean) => void;
};

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
  private isPaused = false;
  private floatingTexts: FloatingText[] = [];
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
  private crashState: CrashState = {
    elapsed: 0, duration: CRASH_DURATION,
    shakeIntensity: 0, shakeOffsetX: 0, shakeOffsetY: 0,
    riderX: 0, riderY: 0, riderVX: 0, riderVY: 0,
    riderAngle: 0, riderAngularVel: 0, riderBounceCount: 0,
    bikeX: 0, bikeY: 0, bikeVX: 0, bikeVY: 0,
    bikeAngle: 0, bikeAngularVel: 0, bikeBounceCount: 0,
    bikeWheelRotation: 0,
  };
  private particles: Particle[] = [];
  private particleConfig: ParticleOverlayConfig | null = null;
  private terrain: Terrain;
  private hillsActivated = false;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.callbacks = callbacks;
    this.terrain = new Terrain(this.envManager.getCurrentEnvironment().terrain);
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
  }

  start(): void {
    if (this.state !== GameState.IDLE) return;
    this.state = GameState.RUNNING;
    this.nextObstacleGap = nextSpawnGap(this.speed, this.elapsedMs);
    this.sound.startMusic();
    this.callbacks.onStateChange(this.state);
  }

  restart(): void {
    this.sound.stopSiren();
    this.sound.reset(this.envManager.getCurrentEnvironment().musicTrack);
    this.ambulance = null;
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
    this.envManager.reset();
    this.terrain.reset(this.envManager.getCurrentEnvironment().terrain);
    this.hillsActivated = false;
    this.particles = [];
    this.particleConfig = null;
    this.player = createPlayer(this.groundY, this.canvasW);
    this.layers = createBackgroundLayers(this.canvasW, this.groundY, this.envManager.getCurrentEnvironment());
    this.callbacks.onScoreUpdate(0);
    this.callbacks.onStateChange(this.state);
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
    // Environment progression
    const envResult = this.envManager.update(dt, this.elapsedMs);
    if (envResult.musicCrossfade) {
      this.sound.crossfadeTo(envResult.musicCrossfade.track, envResult.musicCrossfade.durationMs);
    }
    if (envResult.appendBackground) {
      // Append new biome buildings to the end of the existing layer so they scroll in naturally
      const toEnv = envResult.appendBackground.toEnv;
      const buildingLayer = this.layers[BUILDING_LAYER_INDEX];
      const totalWidth = getTotalLayerWidth(buildingLayer, this.canvasW);
      const gap = BIOME_APPEND_GAP;
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
      // Update terrain config for the new biome
      this.terrain.setConfig(envResult.regenerateBackground.terrain);
    }

    // Activate hills after the configured delay
    const currentEnv = this.envManager.getCurrentEnvironment();
    if (!this.hillsActivated && this.elapsedMs >= currentEnv.terrain.hillStartDelayMs) {
      this.hillsActivated = true;
      // Pass right screen edge so hills start off-screen
      this.terrain.activateHills(this.distance + this.canvasW);
    }

    // Pre-generate terrain segments once per frame (covers player + obstacle spawn zone)
    this.terrain.ensureSegments(this.distance + this.canvasW + 3000);

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

    // Compute terrain-adjusted ground Y for the player's position
    const playerWorldX = this.player.x + this.distance;
    const playerTerrainOffset = this.terrain.getGroundYOffset(playerWorldX);
    const effectiveGroundY = this.groundY + playerTerrainOffset;

    // Update player and background
    const wasAirborne = !this.player.isOnGround;
    const wasBackflipping = this.player.isBackflipping;
    const prevBackflipAngle = this.player.backflipAngle;
    const prevFlipDirection = this.player.flipDirection;
    updatePlayer(this.player, dt, effectiveGroundY, this.speed);

    // Match bike tilt to terrain slope when on ground
    if (this.player.isOnGround && !this.player.ridingObstacle) {
      this.player.rampSurfaceAngle = this.terrain.getSlopeAngle(playerWorldX);
    }

    updateLayers(this.layers, this.speed, dt);
    if (this.particleConfig && this.particles.length > 0) {
      updateParticles(this.particles, this.particleConfig, dt, this.canvasW, this.canvasH);
    }

    const FULL_FLIP = Math.PI * 2;
    const trickCtx: TrickContext = {
      player: this.player,
      onCrash: () => this.startCrash(),
      onAwardBonus: (label, bonus, sketchy) => this.awardTrickBonus(label, bonus, sketchy)
    };

    // Trick landing checks — unified to support combos (pose + flip simultaneously)
    if (wasAirborne && this.player.isOnGround) {
      const hadFlip = wasBackflipping;
      const hadPose = this.player.activeTrick !== TrickType.NONE;
      if (processTrickLanding(trickCtx, hadFlip, hadPose, prevBackflipAngle, prevFlipDirection, FULL_FLIP, FLIP_TOLERANCE, SKETCHY_TOLERANCE)) return;
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
      const obstacleWorldX = this.distance + this.canvasW + 60;
      const obstacleTerrainOffset = this.terrain.getGroundYOffset(obstacleWorldX);
      const isFlat = this.terrain.isFlatZone(obstacleWorldX, 200);

      if (this.debugSequence) {
        const type = this.debugSequence[this.debugIndex % this.debugSequence.length];
        this.obstacles.push(createObstacle(type, this.canvasW, this.groundY, obstacleTerrainOffset));
        this.debugIndex++;
      } else {
        const biomeMs = this.envManager.getBiomeElapsedMs(this.elapsedMs);
        const env = this.envManager.getCurrentEnvironment();
        let type = selectObstacleType(env, biomeMs);

        // If the selected obstacle needs flat ground but terrain isn't flat, re-roll
        if (!isFlat && needsFlatGround(type)) {
          type = selectHillSafeObstacleType(env, biomeMs);
        }

        this.obstacles.push(createObstacle(type, this.canvasW, this.groundY, obstacleTerrainOffset));
      }
      this.distanceSinceLastObstacle = 0;
      if (!this.debugSequence) {
        let nextGap = nextSpawnGap(this.speed, this.elapsedMs);
        // Obstacles are less frequent on hilly terrain
        if (!isFlat) {
          nextGap *= HILL_OBSTACLE_GAP_MULTIPLIER;
        }
        this.nextObstacleGap = nextGap;
      }
    }

    // Periodically cull old terrain segments
    this.terrain.cullOldSegments(this.distance);

    // Ramp interaction (before collision checks)
    processRampInteractions(this.player, this.obstacles, effectiveGroundY);
    processRidingState(this.player);

    // Collision detection
    for (const obs of this.obstacles) {
      if (this.player.ridingObstacle === obs) continue;
      if (obs.ramp) continue; // ramps never crash

      if (obs.rideable) {
        const result = checkRideableCollision(this.player, obs);
        if (result === "crash") {
          this.startCrash();
          return;
        }
        if (result === "land_on_top") {
          // Check trick landing on rideable (combo-aware)
          const landFlip = this.player.isBackflipping;
          const landPose = this.player.activeTrick !== TrickType.NONE;
          if (processTrickLanding(trickCtx, landFlip, landPose, this.player.backflipAngle, this.player.flipDirection, FULL_FLIP, FLIP_TOLERANCE, SKETCHY_TOLERANCE)) return;
          this.player.ridingObstacle = obs;
          this.player.y = obs.y - this.player.height;
          this.player.velocityY = 0;
          this.player.isOnGround = false;
          this.player.jumpCount = 0;
        }
      } else {
        if (checkCollision(this.player, obs)) {
          this.startCrash();
          return;
        }
      }
    }
  }

  private startCrash(): void {
    this.state = GameState.CRASHING;
    this.sound.stopMusic();
    this.sound.playCrash();
    initCrashPhysics(this.crashState, this.player, this.speed);
    this.callbacks.onStateChange(this.state);
  }

  private gameOver(): void {
    if (!this.hasBeenResurrected && (this.iddqdActive || Math.random() < AMBULANCE_CHANCE)) {
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
    const ambWorldX = this.player.x + this.distance;
    const ambTerrainOffset = this.terrain.getGroundYOffset(ambWorldX);
    this.ambulance = createAmbulanceState(this.player.x, this.player.width, this.canvasW, this.groundY + ambTerrainOffset);
    this.crashState.elapsed = this.crashState.duration - 0.31; // Keep ragdoll visible (alpha ~1)
    this.sound.playSiren();
    this.callbacks.onStateChange(this.state);
  }

  private updateAmbulance(dt: number, rawDt: number): void {
    if (!this.ambulance) return;

    this.floatingTexts = updateFloatingTexts(this.floatingTexts, dt);

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

    // Reset player state to ground (terrain-adjusted)
    const reviveWorldX = this.player.x + this.distance;
    const reviveTerrainOffset = this.terrain.getGroundYOffset(reviveWorldX);
    this.player.y = this.groundY + reviveTerrainOffset - this.player.height;
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
    // Use terrain-adjusted groundY for crash bounce surface
    const crashWorldX = this.crashState.riderX + this.distance;
    const crashTerrainOffset = this.terrain.getGroundYOffset(crashWorldX);
    if (updateCrashPhysics(this.crashState, dt, rawDt, this.groundY + crashTerrainOffset)) {
      this.gameOver();
    }
  }

  private awardTrickBonus(label: string, bonus: number, sketchy?: boolean): void {
    this.score += bonus;
    // Don't sync distance from score — that would jump worldX and shift terrain
    this.callbacks.onScoreUpdate(this.score);
    this.sound.playBackflipSuccess();
    this.floatingTexts.push(createTrickFloatingText(label, bonus, this.player.x, this.player.y, this.player.width, sketchy ?? false));
    this.callbacks.onTrickLanded?.(label, bonus, sketchy);
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

    const terrainFn = (screenX: number) => this.terrain.getGroundYOffset(screenX + this.distance);
    drawBackground(ctx, this.layers, canvasW, canvasH, groundY, palette, drawers, terrainFn);
    if (this.particleConfig && this.particles.length > 0) {
      drawParticles(ctx, this.particles, this.particleConfig);
    }
    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs, palette);
    }

    const ambulancePreRevive = this.state === GameState.AMBULANCE
      && this.ambulance
      && (this.ambulance.phase === AmbulancePhase.DRIVING_IN || this.ambulance.phase === AmbulancePhase.STOPPED);

    if (crashing || ambulancePreRevive || this.state === GameState.GAME_OVER) {
      drawCrashBike(ctx, this.crashState, this.skin);
      drawCrashRider(ctx, this.crashState, this.skin);
    } else {
      drawPlayer(ctx, this.player, this.skin);
    }

    if (this.ambulance) {
      drawAmbulance(ctx, this.ambulance);
      if (this.ambulance.reviveFlashOpacity > 0) {
        drawReviveFlash(ctx, this.ambulance.reviveFlashOpacity, canvasW, canvasH);
      }
    }

    for (const ft of this.floatingTexts) {
      drawFloatingText(ctx, ft.text, ft.x, ft.y, ft.opacity, ft.color);
    }

    if (crashing) {
      ctx.restore();
    }
  }

  getScore(): number {
    return this.score;
  }
  getSpeed(): number {
    return this.speed;
  }
  getState(): GameState {
    return this.state;
  }
  activateIddqd(): void {
    this.iddqdActive = true;
    this.floatingTexts.push({
      text: "GOD MODE",
      x: this.canvasW / 2,
      y: this.canvasH * 0.35,
      opacity: 1,
      velocityY: -0.8,
      color: "#ff4444",
    });
  }

  pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    cancelAnimationFrame(this.rafId);
    if (this.state === GameState.RUNNING) {
      this.sound.pauseMusic();
    } else if (this.state === GameState.AMBULANCE) {
      this.sound.stopSiren();
    }
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = 0; // reset so dt doesn't spike after a long pause
    this.rafId = requestAnimationFrame(this.loop);
    if (this.state === GameState.RUNNING) {
      this.sound.resumeMusic();
    } else if (this.state === GameState.AMBULANCE && this.ambulance?.phase === AmbulancePhase.DRIVING_IN) {
      this.sound.playSiren();
    }
  }

  setMusicMuted(muted: boolean): void {
    this.sound.setMusicMuted(muted);
  }

  setSfxMuted(muted: boolean): void {
    this.sound.setSfxMuted(muted);
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
    if (result.musicCrossfade) {
      this.sound.crossfadeTo(result.musicCrossfade.track, result.musicCrossfade.durationMs);
    }
    // Immediately regenerate background with the target environment
    const env = this.envManager.getCurrentEnvironment();
    this.layers = createBackgroundLayers(this.canvasW, this.groundY, env);
    this.terrain.setConfig(env.terrain);
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
