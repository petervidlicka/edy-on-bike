/**
 * Trick scoring for one run: the combo chain that multiplies trick links, grinds along
 * rideable obstacles (with their sparks), and the combo feedback (meter, flash, confetti).
 * The Engine owns the run; this owns everything that turns landed tricks into points.
 */
import {
  BIG_TRICK_POINTS,
  COMBO_CONFETTI_COUNT,
  COMBO_CONFETTI_MULTIPLIER,
  COMBO_FLASH_MULTIPLIER,
  COMBO_MIN_LINKS_FOR_SUMMARY,
  GRIND_BASE,
  GRIND_MIN_MS,
  GRIND_PER_SEC,
} from "./constants";
import type { ComboEndReason, GameEvent } from "./events";
import type { ObstacleInstance, PlayerState, SkinDefinition } from "./types";
import { createChain, addLink, tickChain, endChain } from "./ComboChain";
import { createTrickFloatingText, createComboSummaryText } from "./TrickSystem";
import type { FloatingText } from "./TrickSystem";
import { getGrindLabel } from "./Obstacle";
import {
  createConfettiBurst, updateConfetti, drawConfetti,
  createComboFx, triggerComboFx, clearComboFx, updateComboFx,
  drawComboMeter, drawComboFlash,
  getRearWheelContact, emitSparks, updateSparks, drawSparks,
} from "./rendering";
import type { ConfettiPiece, Spark } from "./rendering";
import type { SoundManager } from "./SoundManager";
import type { TrickBoost } from "./multiplayer/TrickBoost";

/** What scoring needs from the run around it. Getters, since the Engine replaces the player and size on restart/resize. */
export interface ScoringHost {
  player(): PlayerState;
  skin(): SkinDefinition;
  canvasW(): number;
  readonly sound: SoundManager;
  /** Multiplayer only: landed points push the rider forward. */
  readonly boost: TrickBoost | null;
  /** Adds paid trick points to the run score. */
  addPoints(points: number): void;
  emit(event: GameEvent): void;
  addFloatingText(text: FloatingText): void;
}

/** An in-progress grind: the obstacle being ridden and how long (game time) it has been ridden. */
interface GrindState {
  obstacle: ObstacleInstance;
  ms: number;
}

/**
 * Chain, grind and combo-feedback state for a run.
 * @example
 * const scoring = new TrickScoring(host);
 * const paid = scoring.award("Backflip", 200); // through the chain multiplier
 * scoring.tick(dtMs, dt);                       // every running frame
 */
export class TrickScoring {
  /** Trick chain across landings; ticked by the Engine's update so it freezes while paused. */
  private chain = createChain();
  private comboFx = createComboFx();
  private confetti: ConfettiPiece[] = [];
  /**
   * The ride in progress along a rideable obstacle, if any. Lives here rather than on
   * PlayerState so multiplayer ghost snapshots stay unchanged.
   */
  private grind: GrindState | null = null;
  private sparks: Spark[] = [];

  constructor(private readonly host: ScoringHost) {}

  /** True while riding along a rideable obstacle (for the scrape sound on resume/unmute). */
  get grinding(): boolean {
    return this.grind !== null;
  }

  /** Whether the combo meter has anything to show. */
  get chainRunning(): boolean {
    return this.chain.links > 0;
  }

  /** Fresh state for a new run. */
  reset(): void {
    this.cancelGrind();
    this.chain = createChain();
    clearComboFx(this.comboFx);
    this.confetti = [];
  }

  /** A crash: the chain ends without a cash-in, the ride pays nothing, effects stop. */
  onCrash(): void {
    this.finishChain("crash");
    this.cancelGrind();
    clearComboFx(this.comboFx);
    this.confetti = [];
  }

  /**
   * Pays a trick link through the chain.
   * @returns Points actually paid (after the chain multiplier).
   */
  award(label: string, bonus: number, sketchy = false): number {
    const { host } = this;
    const prevMultiplier = this.chain.multiplier;
    const { multiplier, paid } = addLink(this.chain, bonus);
    host.addPoints(paid);
    // Multiplied points, so a climbing combo chain pushes the rider further
    host.boost?.onTrick(paid, sketchy);
    host.sound.playComboStep(this.chain.links);
    const player = host.player();
    host.addFloatingText(createTrickFloatingText(label, paid, player.x, player.y, player.width, sketchy, multiplier));
    host.emit({ type: "trickLanded", label, points: paid, sketchy, big: bonus >= BIG_TRICK_POINTS, multiplier });
    host.emit({ type: "comboChanged", links: this.chain.links, multiplier });

    // A sketchy landing still counts as a link, but it breaks the chain
    if (sketchy) {
      this.finishChain("sketchy");
      return paid;
    }
    // Feedback only when the multiplier actually climbs into a tier
    const climbed = multiplier > prevMultiplier;
    triggerComboFx(this.comboFx, climbed && multiplier >= COMBO_FLASH_MULTIPLIER);
    if (climbed && multiplier >= COMBO_CONFETTI_MULTIPLIER) {
      this.confetti.push(...createConfettiBurst(host.canvasW() / 2, 70, COMBO_CONFETTI_COUNT));
    }
    return paid;
  }

  /**
   * Per-frame chain and feedback update. The chain window only drains on the ground
   * (not in the air, not riding an obstacle).
   */
  tick(dtMs: number, dt: number): void {
    updateComboFx(this.comboFx, dtMs);
    updateConfetti(this.confetti, dt);
    const player = this.host.player();
    if (tickChain(this.chain, dtMs, player.isOnGround && !player.ridingObstacle)) {
      this.finishChain("expired");
    }
  }

  /** Starts timing a ride along `obstacle` and its scrape sound; replaces (and pays out) any earlier one. */
  beginGrind(obstacle: ObstacleInstance): void {
    if (this.grind) this.endGrind();
    this.grind = { obstacle, ms: 0 };
    this.host.sound.startGrind();
  }

  /**
   * Per-frame grind bookkeeping, run right after the riding state is resolved: pays out
   * a ride that just ended (rolled off the end), otherwise adds the frame to the ride,
   * throws sparks from the rear wheel and keeps existing sparks flying.
   */
  updateGrind(dtMs: number, dt: number): void {
    if (this.grind) {
      if (this.host.player().ridingObstacle !== this.grind.obstacle) {
        this.endGrind();
      } else {
        this.grind.ms += dtMs;
        const contact = getRearWheelContact(this.host.player(), this.host.skin());
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
  endGrind(): void {
    const grind = this.grind;
    if (!grind) return;
    this.grind = null;
    this.host.sound.stopGrind();
    if (grind.ms < GRIND_MIN_MS) return;
    const base = Math.round(GRIND_BASE + (GRIND_PER_SEC * grind.ms) / 1000);
    const points = this.award(getGrindLabel(grind.obstacle.type), base);
    this.host.emit({ type: "grindEnded", obstacle: grind.obstacle.type, points });
  }

  /** Drops the current ride without paying (crash, restart): no award, no sound, no sparks. */
  cancelGrind(): void {
    this.grind = null;
    this.sparks = [];
    this.host.sound.stopGrind();
  }

  /** Grind sparks, in world space with the rider. */
  drawSparks(ctx: CanvasRenderingContext2D): void {
    drawSparks(ctx, this.sparks);
  }

  /**
   * Combo overlay in screen space (never shaken): confetti, the meter while a chain runs,
   * and the tier-up flash.
   * @param showMeter - False outside a running ride (crash, game over).
   * @param fontFamily - Resolves the display font on first use (needs the mounted DOM).
   */
  drawOverlay(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, showMeter: boolean, fontFamily: () => string): void {
    drawConfetti(ctx, this.confetti);
    if (showMeter && this.chainRunning) {
      drawComboMeter(ctx, this.chain, this.comboFx, canvasW, canvasH, fontFamily(), performance.now());
    }
    drawComboFlash(ctx, this.comboFx, canvasW, canvasH);
  }

  /**
   * Ends the trick chain. A chain of 2+ links is announced with an event; unless it
   * ended in a crash it also pays out a "cash-in" sound and summary text (the points
   * were already paid link by link).
   */
  private finishChain(reason: ComboEndReason): void {
    const summary = endChain(this.chain);
    if (!summary || summary.links < COMBO_MIN_LINKS_FOR_SUMMARY) return;
    const { host } = this;
    host.emit({ type: "comboEnded", links: summary.links, multiplier: summary.multiplier, total: summary.total, reason });
    if (reason === "crash") return;
    host.sound.playComboCashIn(summary.multiplier);
    const player = host.player();
    host.addFloatingText(createComboSummaryText(summary, player.x, player.y, player.width, host.canvasW()));
  }
}
