import { GameState, ObstacleInstance, SkinDefinition } from "./types";
import {
  GROUND_RATIO,
  INITIAL_SPEED,
  SPEED_INCREASE,
  SPEED_INTERVAL,
  SCORE_PER_PX,
  BACKFLIP_BONUS,
} from "./constants";
import { createPlayer, updatePlayer, jumpPlayer, startBackflip, startFrontflip } from "./Player";
import { createBackgroundLayers, updateLayers } from "./Background";
import { drawBackground, drawPlayer, drawObstacle, drawFloatingText } from "./Renderer";
import { getSkinById } from "./skins";
import { spawnObstacle, nextSpawnGap } from "./Obstacle";
import { checkCollision, checkRideableCollision } from "./Collision";
import { SoundManager } from "./SoundManager";

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
  private skin: SkinDefinition = getSkinById("default");

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
    // backflipAngle is now unbounded, so count full rotations + near-completion tolerance.
    if (wasAirborne && this.player.isOnGround && wasBackflipping) {
      const completedFlips = Math.floor(prevBackflipAngle / FULL_FLIP);
      const remainder = prevBackflipAngle - completedFlips * FULL_FLIP;
      const totalFlips = completedFlips + (remainder >= FULL_FLIP - FLIP_TOLERANCE ? 1 : 0);

      if (totalFlips >= 1) {
        const bonus = totalFlips * BACKFLIP_BONUS;
        this.score += bonus;
        this.distance = this.score * SCORE_PER_PX;
        this.callbacks.onScoreUpdate(this.score);
        this.sound.playBackflipSuccess();
        const label = prevFlipDirection >= 0 ? "Backflip" : "Frontflip";
        const flipLabel = totalFlips > 1 ? `${totalFlips}× ${label}` : label;
        this.floatingTexts.push({
          text: `${flipLabel}! +${bonus}`,
          x: this.player.x + this.player.width / 2,
          y: this.player.y - 10,
          opacity: 1,
          velocityY: -1.5,
        });
        this.player.backflipAngle = 0;
        this.player.isBackflipping = false;
      } else {
        // Too incomplete — crash
        this.state = GameState.GAME_OVER;
        this.sound.stopMusic();
        this.sound.playCrash();
        this.callbacks.onStateChange(this.state);
        this.callbacks.onGameOver(this.score);
        return;
      }
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

    // Riding state: check if obstacle scrolled past player
    if (this.player.ridingObstacle) {
      const obs = this.player.ridingObstacle;
      if (obs.x + obs.width < this.player.x + 8) {
        // Obstacle scrolled past — player falls off
        this.player.ridingObstacle = null;
      } else {
        // Keep player on top
        this.player.y = obs.y - this.player.height;
      }
    }

    // Collision detection
    for (const obs of this.obstacles) {
      // Skip the obstacle the player is currently riding
      if (this.player.ridingObstacle === obs) continue;

      if (obs.rideable) {
        const result = checkRideableCollision(this.player, obs);
        if (result === "crash") {
          this.state = GameState.GAME_OVER;
          this.sound.stopMusic();
          this.sound.playCrash();
          this.callbacks.onStateChange(this.state);
          this.callbacks.onGameOver(this.score);
          return;
        }
        if (result === "land_on_top") {
          if (this.player.isBackflipping) {
            const completedFlips = Math.floor(this.player.backflipAngle / FULL_FLIP);
            const remainder = this.player.backflipAngle - completedFlips * FULL_FLIP;
            const totalFlips = completedFlips + (remainder >= FULL_FLIP - FLIP_TOLERANCE ? 1 : 0);

            if (totalFlips >= 1) {
              const bonus = totalFlips * BACKFLIP_BONUS;
              this.score += bonus;
              this.distance = this.score * SCORE_PER_PX;
              this.callbacks.onScoreUpdate(this.score);
              this.sound.playBackflipSuccess();
              const label = this.player.flipDirection >= 0 ? "Backflip" : "Frontflip";
              const flipLabel = totalFlips > 1 ? `${totalFlips}× ${label}` : label;
              this.floatingTexts.push({
                text: `${flipLabel}! +${bonus}`,
                x: this.player.x + this.player.width / 2,
                y: this.player.y - 10,
                opacity: 1,
                velocityY: -1.5,
              });
              this.player.backflipAngle = 0;
              this.player.isBackflipping = false;
            } else {
              // Too incomplete → crash
              this.state = GameState.GAME_OVER;
              this.sound.stopMusic();
              this.sound.playCrash();
              this.callbacks.onStateChange(this.state);
              this.callbacks.onGameOver(this.score);
              return;
            }
          }
          this.player.ridingObstacle = obs;
          this.player.y = obs.y - this.player.height;
          this.player.velocityY = 0;
          this.player.isOnGround = false;
          this.player.jumpCount = 0;
        }
      } else {
        if (checkCollision(this.player, obs)) {
          this.state = GameState.GAME_OVER;
          this.sound.stopMusic();
          this.sound.playCrash();
          this.callbacks.onStateChange(this.state);
          this.callbacks.onGameOver(this.score);
          return;
        }
      }
    }
  }

  private render(): void {
    const { ctx, canvasW, canvasH, groundY } = this;
    ctx.clearRect(0, 0, canvasW, canvasH);
    drawBackground(ctx, this.layers, canvasW, canvasH, groundY);
    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs);
    }
    drawPlayer(ctx, this.player, this.skin);
    for (const ft of this.floatingTexts) {
      drawFloatingText(ctx, ft.text, ft.x, ft.y, ft.opacity);
    }
  }

  setSkin(skin: SkinDefinition): void {
    this.skin = skin;
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
      this.sound.stopMusic();
    }
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = 0; // reset so dt doesn't spike after a long pause
    this.rafId = requestAnimationFrame(this.loop);
    if (this.state === GameState.RUNNING) {
      this.sound.startMusic();
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
