import { GameState, ObstacleInstance, ObstacleType, TrickType, SkinDefinition } from "./types";
import {
  GROUND_RATIO,
  INITIAL_SPEED,
  SPEED_INCREASE,
  SPEED_INTERVAL,
  SCORE_PER_PX,
  JUMP_FORCE,
  RAMP_HEIGHT_MULTIPLIER,
  MAX_SPEED_MULTIPLIER,
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
import { drawBackground, drawPlayer, drawObstacle, drawFloatingText } from "./rendering";
import { spawnObstacle, createObstacle, nextSpawnGap } from "./Obstacle";
import { checkCollision, checkRideableCollision, checkRampCollision } from "./Collision";
import { SoundManager } from "./SoundManager";
import { EnvironmentManager } from "./environments";
import { getSkinById } from "./skins";

export type EngineCallbacks = {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
  onStateChange: (state: GameState) => void;
  onSpeedUpdate?: (speed: number) => void;
  onTrickLanded?: (trickName: string, points: number) => void;
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
  private skin: SkinDefinition = getSkinById("default");
  private debugSequence: ObstacleType[] | null = null;
  private debugIndex: number = 0;
  private debugGap: number = 500;

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
    if (this.state !== GameState.RUNNING) {
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
    this.sound.stopMusic();
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
    }

    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  }

  private update(dt: number, rawDt: number): void {
    // Environment progression
    const envResult = this.envManager.update(dt, this.score);
    if (envResult.musicCrossfade) {
      this.sound.crossfadeTo(envResult.musicCrossfade.track, envResult.musicCrossfade.durationMs);
    }
    if (envResult.regenerateBackground) {
      this.layers = createBackgroundLayers(this.canvasW, this.groundY, envResult.regenerateBackground);
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

    // Flip landing tolerance: allow landing with up to 30° remaining
    const FLIP_TOLERANCE = Math.PI / 6; // 30 degrees
    const FULL_FLIP = Math.PI * 2;

    // Trick landing checks — unified to support combos (pose + flip simultaneously)
    if (wasAirborne && this.player.isOnGround) {
      const hadFlip = wasBackflipping;
      const hadPose = this.player.activeTrick !== TrickType.NONE;
      if (hadFlip && hadPose) {
        if (this.handleComboLanding(prevBackflipAngle, prevFlipDirection, FULL_FLIP, FLIP_TOLERANCE)) return;
      } else if (hadFlip) {
        if (this.handleFlipLanding(prevBackflipAngle, prevFlipDirection, FULL_FLIP, FLIP_TOLERANCE)) return;
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
          spawnObstacle(this.canvasW, this.groundY, this.elapsedMs, this.envManager.getCurrentEnvironment())
        );
      }
      this.distanceSinceLastObstacle = 0;
      if (!this.debugSequence) {
        this.nextObstacleGap = nextSpawnGap(this.speed, this.elapsedMs);
      }
    }

    // Ramp interaction (before collision checks)
    let onAnyRamp = false;
    for (const obs of this.obstacles) {
      if (!obs.ramp) continue;
      if (!this.player.isOnGround && !this.player.ridingObstacle) continue;
      const rampResult = checkRampCollision(this.player, obs);
      if (rampResult.onRamp) {
        onAnyRamp = true;
        this.player.y = rampResult.surfaceY - this.player.height;
        this.player.rampSurfaceAngle = rampResult.surfaceAngle;
        this.player.rampBoost = rampResult.rampType;
      }
    }
    if (!onAnyRamp) {
      // Check if player just left a ramp (was elevated, now past the ramp end)
      if (this.player.rampBoost && this.player.isOnGround) {
        const groundPos = this.groundY - this.player.height;
        if (this.player.y < groundPos - 2) {
          // Auto-launch: player is above ground after riding off ramp
          // Gentle boost for passive roll-off; active jump gives full boost
          this.player.isOnGround = false;
          this.player.jumpCount = 1; // can still double-jump
          if (this.player.rampBoost === "curved") {
            this.player.velocityY = JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER * 0.2;
          } else {
            this.player.velocityY = JUMP_FORCE * 0.2;
          }
        }
      }
      // Smooth angle decay
      this.player.rampSurfaceAngle *= 0.85;
      if (Math.abs(this.player.rampSurfaceAngle) < 0.01) {
        this.player.rampSurfaceAngle = 0;
      }
    }

    // Riding state: check if obstacle scrolled past player
    if (this.player.ridingObstacle) {
      const obs = this.player.ridingObstacle;
      if (obs.x + obs.width < this.player.x + 8) {
        // Apply gentle boost for passive roll-off from container ramp
        if (this.player.rampBoost) {
          this.player.jumpCount = 1;
          if (this.player.rampBoost === "curved") {
            this.player.velocityY = JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER * 0.2;
          } else {
            this.player.velocityY = JUMP_FORCE * 0.2;
          }
        }
        this.player.ridingObstacle = null;
      } else if (obs.type === ObstacleType.CONTAINER_WITH_RAMP) {
        // Container with ramp: last 75px has a curved ramp on top
        const rampW = 75;
        const rampH = 36;
        const rampX = obs.x + obs.width - rampW;
        const playerCenterX = this.player.x + this.player.width / 2;
        if (playerCenterX >= rampX) {
          // Player is on the ramp section
          const t = (playerCenterX - rampX) / rampW;
          const curvedT = t * t;
          const surfaceY = obs.y - curvedT * rampH;
          this.player.y = surfaceY - this.player.height;
          this.player.rampBoost = "curved";
          this.player.rampSurfaceAngle = Math.atan2((-2 * t * rampH) / rampW, 1);
          onAnyRamp = true;
        } else {
          this.player.y = obs.y - this.player.height;
        }
      } else {
        this.player.y = obs.y - this.player.height;
      }
    }

    // Collision detection
    for (const obs of this.obstacles) {
      if (this.player.ridingObstacle === obs) continue;
      if (obs.ramp) continue; // ramps never crash

      if (obs.rideable) {
        const result = checkRideableCollision(this.player, obs);
        if (result === "crash") {
          this.gameOver();
          return;
        }
        if (result === "land_on_top") {
          // Check trick landing on rideable (combo-aware)
          const landFlip = this.player.isBackflipping;
          const landPose = this.player.activeTrick !== TrickType.NONE;
          if (landFlip && landPose) {
            if (this.handleComboLanding(this.player.backflipAngle, this.player.flipDirection, FULL_FLIP, FLIP_TOLERANCE)) return;
          } else if (landFlip) {
            if (this.handleFlipLanding(this.player.backflipAngle, this.player.flipDirection, FULL_FLIP, FLIP_TOLERANCE)) return;
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
          this.gameOver();
          return;
        }
      }
    }
  }

  private gameOver(): void {
    this.state = GameState.GAME_OVER;
    this.sound.stopMusic();
    this.sound.playCrash();
    this.callbacks.onStateChange(this.state);
    this.callbacks.onGameOver(this.score);
  }

  /** Handle flip landing. Returns true if game over (crash). */
  private handleFlipLanding(angle: number, direction: number, fullFlip: number, tolerance: number): boolean {
    const result = evaluateFlipLanding(angle, direction, fullFlip, tolerance);
    resetFlipState(this.player);
    if (result.crashed) { this.gameOver(); return true; }
    this.awardTrickBonus(result.label!, result.bonus!);
    return false;
  }

  /** Handle pose trick landing. Returns true if game over (crash). */
  private handlePoseTrickLanding(): boolean {
    const result = evaluatePoseTrickLanding(this.player);
    resetPoseState(this.player);
    if (result.crashed) { this.gameOver(); return true; }
    this.awardTrickBonus(result.label!, result.bonus!);
    return false;
  }

  /** Handle combo landing (pose trick + flip simultaneously). Returns true if crash. */
  private handleComboLanding(angle: number, direction: number, fullFlip: number, tolerance: number): boolean {
    const result = evaluateComboLanding(this.player, angle, direction, fullFlip, tolerance);
    resetAllTrickState(this.player);
    if (result.crashed) { this.gameOver(); return true; }
    this.awardTrickBonus(result.label!, result.bonus!);
    return false;
  }

  private awardTrickBonus(label: string, bonus: number): void {
    this.score += bonus;
    this.distance = this.score * SCORE_PER_PX;
    this.callbacks.onScoreUpdate(this.score);
    this.sound.playBackflipSuccess();
    this.floatingTexts.push(createTrickFloatingText(label, bonus, this.player.x, this.player.y, this.player.width));
    this.callbacks.onTrickLanded?.(label, bonus);
  }

  private render(): void {
    const { ctx, canvasW, canvasH, groundY } = this;
    const palette = this.envManager.getCurrentPalette();
    const drawers = this.envManager.getBackgroundDrawers();
    ctx.clearRect(0, 0, canvasW, canvasH);
    drawBackground(ctx, this.layers, canvasW, canvasH, groundY, palette, drawers);
    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs, palette);
    }
    drawPlayer(ctx, this.player, this.skin);
    for (const ft of this.floatingTexts) {
      drawFloatingText(ctx, ft.text, ft.x, ft.y, ft.opacity);
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
  pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    cancelAnimationFrame(this.rafId);
    if (this.state === GameState.RUNNING) {
      this.sound.pauseMusic();
    }
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = 0; // reset so dt doesn't spike after a long pause
    this.rafId = requestAnimationFrame(this.loop);
    if (this.state === GameState.RUNNING) {
      this.sound.resumeMusic();
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

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.sound.destroy();
  }
}
