import { PlayerState, TrickType } from "./types";
import { formatMultiplier } from "./ComboChain";
import type { ComboSummary } from "./ComboChain";
import {
  BACKFLIP_BONUS,
  SUPERMAN_BONUS,
  NO_HANDER_BONUS,
  DOUBLE_CHAIN_BONUS,
  TRIPLE_CHAIN_BONUS,
  COMBO_MULTIPLIER,
  SKETCHY_PENALTY,
} from "./constants";

export const TRICK_COLOR_CLEAN = "#1a7a2e";
export const TRICK_COLOR_SKETCHY = "#d97706";

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  opacity: number;
  velocityY: number;
  color: string;
  /** Font size in px; the renderer's default when omitted. */
  size?: number;
  /** Tilt in radians (clockwise); set for comic pops. */
  rotation?: number;
  /** Outline colour; the renderer's dark default when omitted. */
  outline?: string;
  /** Comic pop: bounces in, stays solid, then fades. */
  pop?: boolean;
}

export interface TrickResult {
  crashed: boolean;
  /** For a crash: the trick was not finished (true) rather than overdone (false). */
  underRotated?: boolean;
  label?: string;
  bonus?: number;
  sketchy?: boolean;
}

function computeTrickScore(baseName: string, basePoints: number, count: number): { label: string; totalBonus: number } {
  if (count === 1) return { label: baseName, totalBonus: basePoints };
  if (count === 2) return { label: `Double ${baseName}`, totalBonus: 2 * basePoints + DOUBLE_CHAIN_BONUS };
  const prefix = count === 3 ? "Triple" : `${count}x`;
  return { label: `${prefix} ${baseName}`, totalBonus: count * basePoints + TRIPLE_CHAIN_BONUS };
}

/** True when a flip of `angle` radians stopped short of its nearest whole turn (or never got a full one). */
function isUnderRotated(angle: number, fullFlip: number): boolean {
  const targetFlips = Math.round(angle / fullFlip);
  return targetFlips < 1 || angle < targetFlips * fullFlip;
}

function countPrefix(count: number): string {
  if (count <= 1) return "";
  if (count === 2) return "Double ";
  if (count === 3) return "Triple ";
  return `${count}x `;
}

/** Evaluate a flip-only landing. Returns crash, clean success, or sketchy success.
 *  Uses Math.round to find the nearest target flip count, then checks the absolute
 *  distance from that target. This correctly handles both over-rotation and under-rotation. */
export function evaluateFlipLanding(angle: number, direction: number, fullFlip: number, tolerance: number, sketchyTolerance: number): TrickResult {
  const targetFlips = Math.round(angle / fullFlip);
  if (targetFlips >= 1) {
    const diff = Math.abs(angle - targetFlips * fullFlip);
    const baseName = direction >= 0 ? "Backflip" : "Frontflip";
    if (diff <= tolerance) {
      const { label, totalBonus } = computeTrickScore(baseName, BACKFLIP_BONUS, targetFlips);
      return { crashed: false, label, bonus: totalBonus, sketchy: false };
    }
    if (diff <= tolerance + sketchyTolerance) {
      const { label, totalBonus } = computeTrickScore(baseName, BACKFLIP_BONUS, targetFlips);
      return { crashed: false, label: `Sketchy ${label}`, bonus: Math.round(totalBonus * SKETCHY_PENALTY), sketchy: true };
    }
  }
  return { crashed: true, underRotated: isUnderRotated(angle, fullFlip) };
}

/** Evaluate a pose-trick-only landing. */
export function evaluatePoseTrickLanding(player: PlayerState): TrickResult {
  const completions = player.trickCompletions;

  if (completions >= 1) {
    const isSuperman = player.activeTrick === TrickType.SUPERMAN;
    const baseName = isSuperman ? "Superman" : "No Hander";
    const basePoints = isSuperman ? SUPERMAN_BONUS : NO_HANDER_BONUS;
    const { label, totalBonus } = computeTrickScore(baseName, basePoints, completions);
    return { crashed: false, label, bonus: totalBonus, sketchy: false };
  }
  // Trick started but never completed — crash
  return { crashed: true, underRotated: true };
}

/** Evaluate a combo landing (flip + pose simultaneously).
 *  Uses Math.round for flip detection to handle over/under-rotation correctly. */
export function evaluateComboLanding(
  player: PlayerState,
  angle: number,
  direction: number,
  fullFlip: number,
  tolerance: number,
  sketchyTolerance: number
): TrickResult {
  const targetFlips = Math.round(angle / fullFlip);
  const diff = targetFlips >= 1 ? Math.abs(angle - targetFlips * fullFlip) : Infinity;
  const flipClean = targetFlips >= 1 && diff <= tolerance;
  const flipSketchy = !flipClean && targetFlips >= 1 && diff <= tolerance + sketchyTolerance;
  const sketchy = flipSketchy;

  const poseCompletions = player.trickCompletions;
  const posePhase = player.trickPhase;
  // Relaxed for combos: accept if ≥1 cycle done, or trick reached peak extension
  const poseSafe = poseCompletions >= 1 || posePhase === "return";

  if ((flipClean || flipSketchy) && poseSafe) {
    const isSuperman = player.activeTrick === TrickType.SUPERMAN;
    const poseName = isSuperman ? "Superman" : "No Hander";
    const flipName = direction >= 0 ? "Backflip" : "Frontflip";
    const posePoints = isSuperman ? SUPERMAN_BONUS : NO_HANDER_BONUS;
    const effectivePoseCount = Math.max(poseCompletions, 1);

    const comboLabel = `${countPrefix(effectivePoseCount)}${poseName} ${countPrefix(targetFlips)}${flipName}`;

    const baseScore = posePoints * effectivePoseCount + BACKFLIP_BONUS * targetFlips;
    const totalTrickCount = effectivePoseCount + targetFlips;
    let chainBonus = 0;
    if (totalTrickCount === 2) chainBonus = DOUBLE_CHAIN_BONUS;
    else if (totalTrickCount >= 3) chainBonus = TRIPLE_CHAIN_BONUS;
    const comboScore = (baseScore + chainBonus) * COMBO_MULTIPLIER;

    const finalScore = sketchy ? Math.round(comboScore * SKETCHY_PENALTY) : comboScore;
    const finalLabel = sketchy ? `Sketchy ${comboLabel}` : comboLabel;
    return { crashed: false, label: finalLabel, bonus: finalScore, sketchy };
  }

  // A flip that was off decides under/over; a flip that was fine means the pose was unfinished
  const flipOff = !flipClean && !flipSketchy;
  return { crashed: true, underRotated: flipOff ? isUnderRotated(angle, fullFlip) : true };
}

/** Reset flip-specific state on a player after landing. */
export function resetFlipState(player: PlayerState): void {
  player.backflipAngle = 0;
  player.isBackflipping = false;
  player.targetFlipCount = 0;
}

/** Reset pose-trick-specific state on a player after landing. */
export function resetPoseState(player: PlayerState): void {
  player.activeTrick = TrickType.NONE;
  player.trickProgress = 0;
  player.trickCompletions = 0;
  player.targetTrickCount = 0;
}

/** Reset all trick state (flip + pose) on a player. */
export function resetAllTrickState(player: PlayerState): void {
  resetFlipState(player);
  resetPoseState(player);
}

/**
 * Create a floating text instance for an awarded trick.
 * @param bonus - Points actually paid (already includes the chain multiplier).
 * @param multiplier - Chain multiplier; shown as " x1.5" when above 1.
 */
export function createTrickFloatingText(
  label: string,
  bonus: number,
  playerX: number,
  playerY: number,
  playerWidth: number,
  sketchy: boolean = false,
  multiplier: number = 1
): FloatingText {
  const multiplierSuffix = multiplier > 1 ? ` \u00d7${formatMultiplier(multiplier)}` : "";
  return {
    text: `${label}! +${bonus}${multiplierSuffix}`,
    x: playerX + playerWidth / 2,
    y: playerY - 10,
    opacity: 1,
    velocityY: -1.5,
    color: sketchy ? TRICK_COLOR_SKETCHY : TRICK_COLOR_CLEAN,
  };
}

/** Colour of the chain summary text. */
export const COMBO_SUMMARY_COLOR = "#facc15";
const COMBO_SUMMARY_SIZE = 26;
/** Rough glyph width / font size, to keep the centred summary on screen. */
const SUMMARY_CHAR_WIDTH_EM = 0.55;

/**
 * Create the big "COMBO x3 · 5 tricks · +640" text shown when a chain cashes in.
 * It sits above the rider and is nudged right so it never runs off the left edge
 * on narrow screens (the rider is only 20% in from the left).
 * @param summary - What the finished chain earned.
 * @param playerX - Rider's left edge.
 * @param playerY - Rider's top edge.
 * @param playerWidth - Rider's width.
 * @param canvasW - Canvas width, for keeping the text on screen.
 */
export function createComboSummaryText(
  summary: ComboSummary,
  playerX: number,
  playerY: number,
  playerWidth: number,
  canvasW: number
): FloatingText {
  const text = `COMBO \u00d7${formatMultiplier(summary.multiplier)} \u00b7 ${summary.links} tricks \u00b7 +${summary.total}`;
  const halfWidth = (text.length * COMBO_SUMMARY_SIZE * SUMMARY_CHAR_WIDTH_EM) / 2 + 8;
  const x = Math.min(Math.max(playerX + playerWidth / 2, halfWidth), canvasW - halfWidth);
  return { text, x, y: playerY - 70, opacity: 1, velocityY: -0.7, color: COMBO_SUMMARY_COLOR, size: COMBO_SUMMARY_SIZE };
}

/** Advance floating texts upward and fade out. Returns only still-visible texts. */
export function updateFloatingTexts(texts: FloatingText[], dt: number): FloatingText[] {
  for (const ft of texts) {
    ft.y += ft.velocityY * dt;
    ft.opacity -= 0.01333 * dt;
  }
  return texts.filter((ft) => ft.opacity > 0);
}

export interface TrickContext {
  player: PlayerState;
  /** Called on a bad landing; `underRotated` says whether the trick was unfinished rather than overdone. */
  onCrash: (underRotated: boolean) => void;
  onAwardBonus: (label: string, bonus: number, sketchy: boolean) => void;
}

export function handleFlipLanding(
  ctx: TrickContext,
  angle: number,
  direction: number,
  fullFlip: number,
  tolerance: number,
  sketchyTolerance: number
): boolean {
  const result = evaluateFlipLanding(angle, direction, fullFlip, tolerance, sketchyTolerance);
  resetFlipState(ctx.player);
  if (result.crashed) {
    ctx.onCrash(result.underRotated ?? true);
    return true;
  }
  ctx.onAwardBonus(result.label!, result.bonus!, result.sketchy ?? false);
  return false;
}

export function handlePoseTrickLanding(ctx: TrickContext): boolean {
  const result = evaluatePoseTrickLanding(ctx.player);
  resetPoseState(ctx.player);
  if (result.crashed) {
    ctx.onCrash(result.underRotated ?? true);
    return true;
  }
  ctx.onAwardBonus(result.label!, result.bonus!, result.sketchy ?? false);
  return false;
}

export function handleComboLanding(
  ctx: TrickContext,
  angle: number,
  direction: number,
  fullFlip: number,
  tolerance: number,
  sketchyTolerance: number
): boolean {
  const result = evaluateComboLanding(ctx.player, angle, direction, fullFlip, tolerance, sketchyTolerance);
  resetAllTrickState(ctx.player);
  if (result.crashed) {
    ctx.onCrash(result.underRotated ?? true);
    return true;
  }
  ctx.onAwardBonus(result.label!, result.bonus!, result.sketchy ?? false);
  return false;
}

export function processTrickLanding(
  ctx: TrickContext,
  hadFlip: boolean,
  hadPose: boolean,
  prevBackflipAngle: number,
  prevFlipDirection: number,
  fullFlip: number,
  tolerance: number,
  sketchyTolerance: number
): boolean {
  if (hadFlip && hadPose) {
    return handleComboLanding(ctx, prevBackflipAngle, prevFlipDirection, fullFlip, tolerance, sketchyTolerance);
  } else if (hadFlip) {
    return handleFlipLanding(ctx, prevBackflipAngle, prevFlipDirection, fullFlip, tolerance, sketchyTolerance);
  } else if (hadPose) {
    return handlePoseTrickLanding(ctx);
  }
  return false;
}
