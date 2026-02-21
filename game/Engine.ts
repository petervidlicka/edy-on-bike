import { GameState, ObstacleInstance, TrickType } from "./types";
import {
  GROUND_RATIO,
  INITIAL_SPEED,
  SPEED_INCREASE,
  SPEED_INTERVAL,
  SCORE_PER_PX,
  BACKFLIP_BONUS,
  SUPERMAN_BONUS,
  NO_HANDER_BONUS,
  TRICK_COMPLETION_THRESHOLD,
  DOUBLE_CHAIN_BONUS,
  TRIPLE_CHAIN_BONUS,
  JUMP_FORCE,
  RAMP_HEIGHT_MULTIPLIER,
} from "./constants";
import { createPlayer, updatePlayer, jumpPlayer, startBackflip, startFrontflip, startSuperman, startNoHander } from "./Player";
import { createBackgroundLayers, updateLayers } from "./Background";
import { drawBackground, drawPlayer, drawObstacle, drawFloatingText } from "./Renderer";
import { spawnObstacle, nextSpawnGap } from "./Obstacle";
import { checkCollision, checkRideableCollision, checkRampCollision } from "./Collision";
import { SoundManager } from "./SoundManager";

function computeTrickScore(baseName: string, basePoints: number, count: number): { label: string; totalBonus: number } {
  if (count === 1) return { label: baseName, totalBonus: basePoints };
  if (count === 2) return { label: `Double ${baseName}`, totalBonus: 2 * basePoints + DOUBLE_CHAIN_BONUS };
  const prefix = count === 3 ? "Triple" : `${count}x`;
  return { label: `${prefix} ${baseName}`, totalBonus: count * basePoints + TRIPLE_CHAIN_BONUS };
}

interface FloatingText {
  text: string;
  x: number;
  y: number;
  opacity: number;
  velocityY: number;
}

export type EngineCallbacks = {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
  onStateChange: (state: GameState) => void;
  onSpeedUpdate?: (speed: number) => void;
};

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState = GameState.IDLE;
  private player = createPlayer(0, 0);
  private layers = createBackgroundLayers(0, 0);
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
    this.layers = createBackgroundLayers(w, this.groundY);
    if (this.state !== GameState.RUNNING) {
      this.player = createPlayer(this.groundY, w);
    } else {
      this.player.y = Math.min(this.player.y, this.groundY - this.player.height);
    }
  }

  start(): void {
    if (this.state !== GameState.IDLE) return;
    this.state = GameState.RUNNING;
    this.nextObstacleGap = nextSpawnGap(this.speed);
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
    this.obstacles = [];
    this.floatingTexts = [];
    this.player = createPlayer(this.groundY, this.canvasW);
    this.layers = createBackgroundLayers(this.canvasW, this.groundY);
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
    // Speed progression
    this.speedTimer += rawDt;
    this.elapsedMs += rawDt;
    if (this.speedTimer >= SPEED_INTERVAL) {
      this.speedTimer -= SPEED_INTERVAL;
      this.speed *= 1 + SPEED_INCREASE;
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

    // Flip landing check — player just touched the ground
    if (wasAirborne && this.player.isOnGround && wasBackflipping) {
      if (this.handleFlipLanding(prevBackflipAngle, prevFlipDirection, FULL_FLIP, FLIP_TOLERANCE)) return;
    }

    // Pose trick landing check (superman, no hander)
    if (wasAirborne && this.player.isOnGround && this.player.activeTrick !== TrickType.NONE) {
      if (this.handlePoseTrickLanding()) return;
    }

    // Update floating texts (float up + fade out)
    for (const ft of this.floatingTexts) {
      ft.y += ft.velocityY * dt;
      ft.opacity -= 0.01333 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.opacity > 0);

    // Move obstacles and cull off-screen ones
    for (const obs of this.obstacles) {
      obs.x -= this.speed * dt;
    }
    this.obstacles = this.obstacles.filter((obs) => obs.x + obs.width > 0);

    // Obstacle spawning
    this.distanceSinceLastObstacle += this.speed * dt;
    if (this.distanceSinceLastObstacle >= this.nextObstacleGap) {
      this.obstacles.push(
        spawnObstacle(this.canvasW, this.groundY, this.elapsedMs)
      );
      this.distanceSinceLastObstacle = 0;
      this.nextObstacleGap = nextSpawnGap(this.speed);
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
          this.player.isOnGround = false;
          this.player.jumpCount = 1; // can still double-jump
          if (this.player.rampBoost === "curved") {
            this.player.velocityY = JUMP_FORCE * RAMP_HEIGHT_MULTIPLIER;
          } else {
            this.player.velocityY = JUMP_FORCE;
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
        this.player.ridingObstacle = null;
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
          // Check flip landing on rideable
          if (this.player.isBackflipping) {
            if (this.handleFlipLanding(this.player.backflipAngle, this.player.flipDirection, FULL_FLIP, FLIP_TOLERANCE)) return;
          }
          // Check pose trick landing on rideable
          if (this.player.activeTrick !== TrickType.NONE) {
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
    const completedFlips = Math.floor(angle / fullFlip);
    const remainder = angle - completedFlips * fullFlip;
    const totalFlips = completedFlips + (remainder >= fullFlip - tolerance ? 1 : 0);

    if (totalFlips >= 1) {
      const baseName = direction >= 0 ? "Backflip" : "Frontflip";
      const { label, totalBonus } = computeTrickScore(baseName, BACKFLIP_BONUS, totalFlips);
      this.awardTrickBonus(label, totalBonus);
      this.player.backflipAngle = 0;
      this.player.isBackflipping = false;
      return false;
    }
    // Too incomplete — crash
    this.gameOver();
    return true;
  }

  /** Handle pose trick landing. Returns true if game over (crash). */
  private handlePoseTrickLanding(): boolean {
    const completions = this.player.trickCompletions;
    const progress = this.player.trickProgress;
    const safeProgress = 1 - TRICK_COMPLETION_THRESHOLD; // 0.1

    const safeToLand = completions >= 1 && progress <= safeProgress;

    if (safeToLand) {
      const isSuperman = this.player.activeTrick === TrickType.SUPERMAN;
      const baseName = isSuperman ? "Superman" : "No Hander";
      const basePoints = isSuperman ? SUPERMAN_BONUS : NO_HANDER_BONUS;
      const { label, totalBonus } = computeTrickScore(baseName, basePoints, completions);
      this.awardTrickBonus(label, totalBonus);
    } else if (completions === 0) {
      // Trick started but never completed — crash
      this.player.activeTrick = TrickType.NONE;
      this.player.trickProgress = 0;
      this.player.trickCompletions = 0;
      this.gameOver();
      return true;
    }

    this.player.activeTrick = TrickType.NONE;
    this.player.trickProgress = 0;
    this.player.trickCompletions = 0;
    return false;
  }

  private awardTrickBonus(label: string, bonus: number): void {
    this.score += bonus;
    this.distance = this.score * SCORE_PER_PX;
    this.callbacks.onScoreUpdate(this.score);
    this.sound.playBackflipSuccess();
    this.floatingTexts.push({
      text: `${label}! +${bonus}`,
      x: this.player.x + this.player.width / 2,
      y: this.player.y - 10,
      opacity: 1,
      velocityY: -1.5,
    });
  }

  private render(): void {
    const { ctx, canvasW, canvasH, groundY } = this;
    ctx.clearRect(0, 0, canvasW, canvasH);
    drawBackground(ctx, this.layers, canvasW, canvasH, groundY);
    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs);
    }
    drawPlayer(ctx, this.player);
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

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.sound.destroy();
  }
}
