/**
 * The ambulance that may come for a crashed rider (solo runs only). Whether one is coming
 * is rolled the moment the crash starts; once the crash animation ends it drives in, revives
 * the rider on the road, hands the run back and drives off behind them. This module owns
 * that sequence, the one-rescue-per-run rule and the IDDQD cheat. The Engine keeps the crash
 * animation and the run's state machine, and reaches the sequence through `AmbulanceHost`.
 */
import { GameState, AmbulancePhase } from "./types";
import type { AmbulanceState, ObstacleInstance, PlayerState } from "./types";
import { AMBULANCE_CHANCE } from "./constants";
import type { GameEvent } from "./events";
import { resetAllTrickState } from "./TrickSystem";
import type { FloatingText } from "./TrickSystem";
import type { SoundManager } from "./SoundManager";
import { createAmbulanceState, updateAmbulanceLogic, AmbulanceAction } from "./CrashSequence";

/** Obstacles closer than this (px past the rider's front) are removed on revive, so the rider has room to get going. */
const REVIVE_CLEAR_ZONE_PX = 200;
/** Mercy slowdown: the run speed is multiplied by this on revive. */
const REVIVE_SPEED_FACTOR = 0.85;
/**
 * Distance (px) before the first obstacle after a revive. Only for the regular course:
 * a debug course (`?obstacles=`) keeps its own fixed gap.
 */
const REVIVE_SPAWN_GAP_PX = 500;
/** The "REVIVED!" pop over the rider: colour, rise speed and how far above the rider it starts. */
const REVIVE_TEXT = "REVIVED!";
const REVIVE_TEXT_COLOR = "#00ff88";
const REVIVE_TEXT_RISE = -1.2;
const REVIVE_TEXT_OFFSET_Y = 20;

/**
 * What the sequence needs from the run around it. Getters where the Engine replaces the
 * value on restart/resize (player, size, speed); setters where the run must be told.
 */
export interface AmbulanceHost {
  /** True in a multiplayer run: no ambulance ever comes (ghosts just fade). */
  readonly multiplayer: boolean;
  readonly sound: SoundManager;
  player(): PlayerState;
  /** The live obstacle array; the revive compacts it in place. */
  obstacles(): ObstacleInstance[];
  canvasW(): number;
  groundY(): number;
  speed(): number;
  /** Applies the mercy slowdown; the Engine tells React about the new speed. */
  setSpeed(speed: number): void;
  /** Restarts the spawn clock with this gap so the revived rider gets a clear stretch. */
  setSpawnGap(gap: number): void;
  /** Switches the run state and tells React. */
  setState(state: GameState): void;
  emit(event: GameEvent): void;
  addFloatingText(text: FloatingText): void;
}

/**
 * Crash → ambulance → revive, for one run at a time.
 * @example
 * rescue.decideOnCrash();                 // when the crash starts
 * if (!rescue.begin()) finalGameOver();   // when the crash animation ends
 * rescue.update(dt, rawDt);               // every AMBULANCE frame
 * rescue.driveOut(dt, rawDt);             // every other frame while it is still on screen
 */
export class AmbulanceSequence {
  private ambulance: AmbulanceState | null = null;
  /**
   * Decided when the crash starts (not when it ends) so the player can skip a crash
   * animation that no ambulance follows; an ambulance, once rolled, always plays.
   */
  private willCome = false;
  /** One rescue per run. */
  private used = false;
  /** IDDQD: guarantees the next ambulance; cleared once it has been spent. */
  private cheat = false;

  constructor(private readonly host: AmbulanceHost) {}

  /** The ambulance on screen (driving in, stopped, reviving or driving out), if any. */
  get current(): AmbulanceState | null {
    return this.ambulance;
  }

  /** True while an ambulance has been rolled for the crash in progress. */
  get pending(): boolean {
    return this.willCome;
  }

  /** True while the IDDQD cheat is armed (such a run is not ranked). */
  get cheatActive(): boolean {
    return this.cheat;
  }

  /** True while the crashed rider still lies on the road waiting for the ambulance to arrive and stop. */
  get riderStillDown(): boolean {
    return this.ambulance !== null
      && (this.ambulance.phase === AmbulancePhase.DRIVING_IN || this.ambulance.phase === AmbulancePhase.STOPPED);
  }

  /** Fresh state for a new run; silences a siren still playing. */
  reset(): void {
    this.host.sound.stopSiren();
    this.ambulance = null;
    this.willCome = false;
    this.used = false;
    this.cheat = false;
  }

  /**
   * Rolls whether an ambulance follows the crash that just started. Crashes are local only
   * (multiplayer ghosts just fade), so Math.random is safe here and the shared course RNG untouched.
   */
  decideOnCrash(): void {
    this.willCome = !this.host.multiplayer && !this.used && (this.cheat || Math.random() < AMBULANCE_CHANCE);
  }

  /**
   * Arms the IDDQD cheat.
   * @param crashing - True when typed mid-crash: the ambulance is already decided, so the cheat has to flip it.
   */
  activateCheat(crashing: boolean): void {
    this.cheat = true;
    if (crashing && !this.host.multiplayer && !this.used) this.willCome = true;
  }

  /**
   * Called when the crash animation has ended: starts the ambulance if one was rolled.
   * @returns False when no ambulance is coming (the run is over).
   */
  begin(): boolean {
    if (!this.willCome) return false;
    this.willCome = false;
    this.used = true;
    this.cheat = false;
    const player = this.host.player();
    this.host.setState(GameState.AMBULANCE);
    this.ambulance = createAmbulanceState(player.x, player.width, this.host.canvasW(), this.host.groundY());
    this.host.sound.playSiren();
    return true;
  }

  /** One AMBULANCE-state frame: drives in, stops, revives, then hands the run back. */
  update(dt: number, rawDt: number): void {
    if (!this.ambulance) return;
    const action = updateAmbulanceLogic(this.ambulance, dt, rawDt);
    if (action === AmbulanceAction.STOP_SIREN) {
      this.host.sound.stopSiren();
    } else if (action === AmbulanceAction.REVIVE) {
      this.revive();
      this.host.sound.playRevive();
    } else if (action === AmbulanceAction.RESUME_GAME) {
      this.host.setState(GameState.RUNNING);
      this.host.sound.startMusic();
    } else if (action === AmbulanceAction.REMOVE) {
      this.ambulance = null;
    }
  }

  /**
   * After the revive the ambulance drives off on its own, even if the rider crashes again
   * meanwhile. Called on every frame that is not an AMBULANCE frame.
   */
  driveOut(dt: number, rawDt: number): void {
    if (!this.ambulance) return;
    if (updateAmbulanceLogic(this.ambulance, dt, rawDt) === AmbulanceAction.REMOVE) this.ambulance = null;
  }

  /** Moves the ambulance with the road when the canvas is resized. */
  shiftY(dy: number): void {
    if (this.ambulance) this.ambulance.y += dy;
  }

  /** Pausing mid-sequence: the siren must not keep wailing over the pause menu. */
  pauseSiren(): void {
    this.host.sound.stopSiren();
  }

  /** Resuming: only an ambulance still driving in has a siren to bring back. */
  resumeSiren(): void {
    if (this.ambulance?.phase === AmbulancePhase.DRIVING_IN) this.host.sound.playSiren();
  }

  /** Puts the rider back on the road with a clear stretch ahead and a mercy slowdown. */
  private revive(): void {
    const { host } = this;
    const player = host.player();

    // Clear obstacles near the player (compacted in place: the Engine keeps the same array)
    const clearZone = player.x + player.width + REVIVE_CLEAR_ZONE_PX;
    const obstacles = host.obstacles();
    let kept = 0;
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.x > clearZone) obstacles[kept++] = obs;
    }
    obstacles.length = kept;

    // Reset player state to ground
    player.y = host.groundY() - player.height;
    player.velocityY = 0;
    player.isOnGround = true;
    player.jumpCount = 0;
    player.bikeTilt = 0;
    player.riderLean = 0;
    player.riderCrouch = 0;
    player.legTuck = 0;
    player.ridingObstacle = null;
    // A crash mid-air skips the landing that normally clears these, and a leftover pose or
    // ramp boost would carry into the next hop (free trick bonus, boosted jump)
    resetAllTrickState(player);
    player.rampBoost = null;
    player.rampSurfaceAngle = 0;

    host.setSpeed(host.speed() * REVIVE_SPEED_FACTOR);
    host.setSpawnGap(REVIVE_SPAWN_GAP_PX);

    host.emit({ type: "revive" });
    host.addFloatingText({
      text: REVIVE_TEXT,
      x: player.x + player.width / 2,
      y: player.y - REVIVE_TEXT_OFFSET_Y,
      opacity: 1,
      velocityY: REVIVE_TEXT_RISE,
      color: REVIVE_TEXT_COLOR,
    });
  }
}
