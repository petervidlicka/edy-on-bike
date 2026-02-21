import { GameState, ObstacleInstance } from "./types";
import {
  GROUND_RATIO,
  INITIAL_SPEED,
  SPEED_INCREASE,
  SPEED_INTERVAL,
  SCORE_PER_PX,
} from "./constants";
import { createPlayer, updatePlayer, jumpPlayer } from "./Player";
import { createBackgroundLayers, updateLayers } from "./Background";
import { drawBackground, drawPlayer, drawObstacle } from "./Renderer";
import { spawnObstacle, nextSpawnGap } from "./Obstacle";
import { checkCollision } from "./Collision";
import { SoundManager } from "./SoundManager";

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
    updatePlayer(this.player, dt, this.groundY, this.speed);
    updateLayers(this.layers, this.speed, dt);

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

    // Collision detection
    for (const obs of this.obstacles) {
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

  private render(): void {
    const { ctx, canvasW, canvasH, groundY } = this;
    ctx.clearRect(0, 0, canvasW, canvasH);
    drawBackground(ctx, this.layers, canvasW, canvasH, groundY);
    for (const obs of this.obstacles) {
      drawObstacle(ctx, obs);
    }
    drawPlayer(ctx, this.player);
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
  setMuted(muted: boolean): void {
    this.sound.setMuted(muted);
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.sound.destroy();
  }
}
