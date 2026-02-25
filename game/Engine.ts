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
  CRASH_DURATION,
  CRASH_GRAVITY,
  CRASH_BOUNCE_DAMPING,
  CRASH_SHAKE_INITIAL,
  AMBULANCE_CHANCE,
  AMBULANCE_WIDTH,
  AMBULANCE_HEIGHT,
  AMBULANCE_DRIVE_SPEED,
  AMBULANCE_DRIVE_OUT_SPEED,
  AMBULANCE_STOP_MS,
  AMBULANCE_REVIVE_MS,
} from "./constants";
import {
  FloatingText,
  evaluateFlipLanding,
  evaluatePoseTrickLanding,
  evaluateComboLanding,
  resetFlipState,
  resetPoseState,
  resetAllTrickState,
  createTrickFloatingText,
  updateFloatingTexts,
} from "./TrickSystem";
import { createPlayer, updatePlayer, jumpPlayer, startBackflip, startFrontflip, startSuperman, startNoHander } from "./Player";
import { createBackgroundLayers, updateLayers } from "./Background";
import { drawBackground, drawPlayer, drawObstacle, drawFloatingText, drawCrashBike, drawCrashRider, createParticles, updateParticles, drawParticles, drawAmbulance, drawReviveFlash } from "./rendering";
import type { Particle } from "./rendering";
import type { ParticleOverlayConfig } from "./environments/types";
import { spawnObstacle, createObstacle, nextSpawnGap } from "./Obstacle";
import { checkCollision, checkRideableCollision } from "./Collision";
import { processRampInteractions, processRidingState } from "./RampPhysics";
import { SoundManager } from "./SoundManager";
import { EnvironmentManager } from "./environments";
import { getSkinById } from "./skins";

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

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.callbacks = callbacks;
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
    this.sound.stopMusic();
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

    // Trick landing checks — unified to support combos (pose + flip simultaneously)
    if (wasAirborne && this.player.isOnGround) {
      const hadFlip = wasBackflipping;
      const hadPose = this.player.activeTrick !== TrickType.NONE;
      if (hadFlip && hadPose) {
        if (this.handleComboLanding(prevBackflipAngle, prevFlipDirection, FULL_FLIP, FLIP_TOLERANCE, SKETCHY_TOLERANCE)) return;
      } else if (hadFlip) {
        if (this.handleFlipLanding(prevBackflipAngle, prevFlipDirection, FULL_FLIP, FLIP_TOLERANCE, SKETCHY_TOLERANCE)) return;
      } else if (hadPose) {
        if (this.handlePoseTrickLanding()) return;
      }
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
          spawnObstacle(this.canvasW, this.groundY, this.envManager.getBiomeElapsedMs(this.elapsedMs), this.envManager.getCurrentEnvironment())
        );
      }
      this.distanceSinceLastObstacle = 0;
      if (!this.debugSequence) {
        this.nextObstacleGap = nextSpawnGap(this.speed, this.elapsedMs);
      }
    }

    // Ramp interaction (before collision checks)
    processRampInteractions(this.player, this.obstacles, this.groundY);
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
          if (landFlip && landPose) {
            if (this.handleComboLanding(this.player.backflipAngle, this.player.flipDirection, FULL_FLIP, FLIP_TOLERANCE, SKETCHY_TOLERANCE)) return;
          } else if (landFlip) {
            if (this.handleFlipLanding(this.player.backflipAngle, this.player.flipDirection, FULL_FLIP, FLIP_TOLERANCE, SKETCHY_TOLERANCE)) return;
          } else if (landPose) {
            if (this.handlePoseTrickLanding()) return;
          }
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
    this.initCrashState();
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

    this.ambulance = {
      x: this.canvasW + 140,
      y: this.groundY - AMBULANCE_HEIGHT,
      width: AMBULANCE_WIDTH,
      height: AMBULANCE_HEIGHT,
      phase: AmbulancePhase.DRIVING_IN,
      phaseTimer: 0,
      targetX: this.player.x + this.player.width + 10,
      sirenFlash: 0,
      reviveFlashOpacity: 0,
    };

    this.crashState.elapsed = this.crashState.duration - 0.31; // Keep ragdoll visible (alpha ~1)

    this.sound.playSiren();
    this.callbacks.onStateChange(this.state);
  }

  private updateAmbulance(dt: number, rawDt: number): void {
    const amb = this.ambulance;
    if (!amb) return;

    amb.phaseTimer += rawDt;
    amb.sirenFlash += rawDt;

    // Update floating texts
    this.floatingTexts = updateFloatingTexts(this.floatingTexts, dt);

    switch (amb.phase) {
      case AmbulancePhase.DRIVING_IN:
        amb.x -= AMBULANCE_DRIVE_SPEED * dt;
        if (amb.x <= amb.targetX) {
          amb.x = amb.targetX;
          amb.phase = AmbulancePhase.STOPPED;
          amb.phaseTimer = 0;
          this.sound.stopSiren();
        }
        break;

      case AmbulancePhase.STOPPED:
        if (amb.phaseTimer >= AMBULANCE_STOP_MS) {
          amb.phase = AmbulancePhase.REVIVING;
          amb.phaseTimer = 0;
          amb.reviveFlashOpacity = 1;
          this.revivePlayer();
          this.sound.playRevive();
        }
        break;

      case AmbulancePhase.REVIVING:
        amb.reviveFlashOpacity = Math.max(0, 1 - amb.phaseTimer / AMBULANCE_REVIVE_MS);
        if (amb.phaseTimer >= AMBULANCE_REVIVE_MS) {
          amb.phase = AmbulancePhase.DRIVING_OUT;
          amb.phaseTimer = 0;
          this.state = GameState.RUNNING;
          this.sound.startMusic();
          this.callbacks.onStateChange(this.state);
        }
        break;

      case AmbulancePhase.DRIVING_OUT:
        amb.x += AMBULANCE_DRIVE_OUT_SPEED * dt;
        if (amb.x > this.canvasW + 20) {
          this.ambulance = null;
        }
        break;
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

    this.floatingTexts.push({
      text: "REVIVED!",
      x: this.player.x + this.player.width / 2,
      y: this.player.y - 20,
      opacity: 1,
      velocityY: -1.2,
      color: "#00ff88",
    });
  }

  private initCrashState(): void {
    const cs = this.crashState;
    const p = this.player;
    const speedFactor = this.speed / INITIAL_SPEED;

    cs.elapsed = 0;
    cs.duration = CRASH_DURATION;
    cs.shakeIntensity = CRASH_SHAKE_INITIAL;
    cs.shakeOffsetX = 0;
    cs.shakeOffsetY = 0;

    // Rider: ejected forward and upward
    cs.riderX = p.x + 10;
    cs.riderY = p.y - 5;
    cs.riderVX = this.speed * 0.6 + 1.5;
    cs.riderVY = -6 - speedFactor * 2;
    cs.riderAngle = 0;
    cs.riderAngularVel = 0.15 + speedFactor * 0.08;
    cs.riderBounceCount = 0;

    // Carry upward momentum if player was still rising
    if (p.velocityY < 0) {
      cs.riderVY += p.velocityY * 0.5;
    }

    // Bike: slides forward, slight upward kick
    cs.bikeX = p.x;
    cs.bikeY = p.y + p.height * 0.3;
    cs.bikeVX = this.speed * 0.3;
    cs.bikeVY = -2;
    cs.bikeAngle = 0;
    cs.bikeAngularVel = -0.08;
    cs.bikeBounceCount = 0;
    cs.bikeWheelRotation = p.wheelRotation;
  }

  private updateCrash(dt: number, rawDt: number): void {
    const cs = this.crashState;
    cs.elapsed += rawDt / 1000;

    if (cs.elapsed >= cs.duration) {
      this.gameOver();
      return;
    }

    const groundY = this.groundY;
    const friction = 0.95;
    const angularDamping = 0.7;

    // Screen shake — exponential decay
    cs.shakeIntensity *= 1 - 0.06 * dt;
    if (cs.shakeIntensity < 0.3) cs.shakeIntensity = 0;
    cs.shakeOffsetX = (Math.random() - 0.5) * 2 * cs.shakeIntensity;
    cs.shakeOffsetY = (Math.random() - 0.5) * 2 * cs.shakeIntensity;

    // Rider physics
    const riderGroundY = groundY - 15;
    const riderSettled = cs.riderBounceCount >= 2;
    if (!riderSettled) cs.riderVY += CRASH_GRAVITY * dt;
    cs.riderX += cs.riderVX * dt;
    if (!riderSettled) cs.riderY += cs.riderVY * dt;
    cs.riderAngle += cs.riderAngularVel * dt;
    cs.riderVX *= Math.pow(friction, dt);

    if (cs.riderY >= riderGroundY && cs.riderVY > 0 && !riderSettled) {
      cs.riderY = riderGroundY;
      cs.riderBounceCount++;
      if (cs.riderBounceCount >= 2) {
        cs.riderVY = 0;
        cs.riderAngularVel = 0;
      } else {
        cs.riderVY = -cs.riderVY * CRASH_BOUNCE_DAMPING;
        cs.riderAngularVel *= angularDamping;
      }
      cs.riderVX *= 0.7;
    }

    // Bike physics
    const bikeGroundY = groundY - 12;
    const bikeSettled = cs.bikeBounceCount >= 2;
    if (!bikeSettled) cs.bikeVY += CRASH_GRAVITY * dt;
    cs.bikeX += cs.bikeVX * dt;
    if (!bikeSettled) cs.bikeY += cs.bikeVY * dt;
    cs.bikeAngle += cs.bikeAngularVel * dt;
    cs.bikeVX *= Math.pow(friction, dt);

    if (cs.bikeY >= bikeGroundY && cs.bikeVY > 0 && !bikeSettled) {
      cs.bikeY = bikeGroundY;
      cs.bikeBounceCount++;
      if (cs.bikeBounceCount >= 2) {
        cs.bikeVY = 0;
        cs.bikeAngularVel = 0;
      } else {
        cs.bikeVY = -cs.bikeVY * CRASH_BOUNCE_DAMPING;
        cs.bikeAngularVel *= angularDamping;
      }
      cs.bikeVX *= 0.6;
    }

    // Decelerating wheel spin
    cs.bikeWheelRotation += cs.bikeVX * dt * 0.08;
  }

  /** Handle flip landing. Returns true if game over (crash). */
  private handleFlipLanding(angle: number, direction: number, fullFlip: number, tolerance: number, sketchyTolerance: number): boolean {
    const result = evaluateFlipLanding(angle, direction, fullFlip, tolerance, sketchyTolerance);
    resetFlipState(this.player);
    if (result.crashed) { this.startCrash(); return true; }
    this.awardTrickBonus(result.label!, result.bonus!, result.sketchy);
    return false;
  }

  /** Handle pose trick landing. Returns true if game over (crash). */
  private handlePoseTrickLanding(): boolean {
    const result = evaluatePoseTrickLanding(this.player);
    resetPoseState(this.player);
    if (result.crashed) { this.startCrash(); return true; }
    this.awardTrickBonus(result.label!, result.bonus!, result.sketchy);
    return false;
  }

  /** Handle combo landing (pose trick + flip simultaneously). Returns true if crash. */
  private handleComboLanding(angle: number, direction: number, fullFlip: number, tolerance: number, sketchyTolerance: number): boolean {
    const result = evaluateComboLanding(this.player, angle, direction, fullFlip, tolerance, sketchyTolerance);
    resetAllTrickState(this.player);
    if (result.crashed) { this.startCrash(); return true; }
    this.awardTrickBonus(result.label!, result.bonus!, result.sketchy);
    return false;
  }

  private awardTrickBonus(label: string, bonus: number, sketchy?: boolean): void {
    this.score += bonus;
    this.distance = this.score * SCORE_PER_PX;
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

    drawBackground(ctx, this.layers, canvasW, canvasH, groundY, palette, drawers);
    if (this.particleConfig && this.particles.length > 0) {
      drawParticles(ctx, this.particles, this.particleConfig);
    }
    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs, palette);
    }

    const ambulancePreRevive = this.state === GameState.AMBULANCE
      && this.ambulance
      && (this.ambulance.phase === AmbulancePhase.DRIVING_IN || this.ambulance.phase === AmbulancePhase.STOPPED);

    if (crashing || ambulancePreRevive) {
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
