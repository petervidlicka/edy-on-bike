import { PlayerState, TrickType } from "./types";
import {
  BACKFLIP_BONUS,
  SUPERMAN_BONUS,
  NO_HANDER_BONUS,
  DOUBLE_CHAIN_BONUS,
  TRIPLE_CHAIN_BONUS,
  COMBO_MULTIPLIER,
} from "./constants";

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  opacity: number;
  velocityY: number;
}

export interface TrickResult {
  crashed: boolean;
  label?: string;
  bonus?: number;
}

function computeTrickScore(baseName: string, basePoints: number, count: number): { label: string; totalBonus: number } {
  if (count === 1) return { label: baseName, totalBonus: basePoints };
  if (count === 2) return { label: `Double ${baseName}`, totalBonus: 2 * basePoints + DOUBLE_CHAIN_BONUS };
  const prefix = count === 3 ? "Triple" : `${count}x`;
  return { label: `${prefix} ${baseName}`, totalBonus: count * basePoints + TRIPLE_CHAIN_BONUS };
}

function countPrefix(count: number): string {
  if (count <= 1) return "";
  if (count === 2) return "Double ";
  if (count === 3) return "Triple ";
  return `${count}x `;
}

/** Evaluate a flip-only landing. Returns crash or awarded label+bonus. */
export function evaluateFlipLanding(angle: number, direction: number, fullFlip: number, tolerance: number): TrickResult {
  const completedFlips = Math.floor(angle / fullFlip);
  const remainder = angle - completedFlips * fullFlip;
  const totalFlips = completedFlips + (remainder >= fullFlip - tolerance ? 1 : 0);

  if (totalFlips >= 1) {
    const baseName = direction >= 0 ? "Backflip" : "Frontflip";
    const { label, totalBonus } = computeTrickScore(baseName, BACKFLIP_BONUS, totalFlips);
    return { crashed: false, label, bonus: totalBonus };
  }
  return { crashed: true };
}

/** Evaluate a pose-trick-only landing. */
export function evaluatePoseTrickLanding(player: PlayerState): TrickResult {
  const completions = player.trickCompletions;

  if (completions >= 1) {
    const isSuperman = player.activeTrick === TrickType.SUPERMAN;
    const baseName = isSuperman ? "Superman" : "No Hander";
    const basePoints = isSuperman ? SUPERMAN_BONUS : NO_HANDER_BONUS;
    const { label, totalBonus } = computeTrickScore(baseName, basePoints, completions);
    return { crashed: false, label, bonus: totalBonus };
  }
  // Trick started but never completed — crash
  return { crashed: true };
}

/** Evaluate a combo landing (flip + pose simultaneously). */
export function evaluateComboLanding(
  player: PlayerState,
  angle: number,
  direction: number,
  fullFlip: number,
  tolerance: number
): TrickResult {
  const completedFlips = Math.floor(angle / fullFlip);
  const remainder = angle - completedFlips * fullFlip;
  const totalFlips = completedFlips + (remainder >= fullFlip - tolerance ? 1 : 0);

  const poseCompletions = player.trickCompletions;
  const posePhase = player.trickPhase;
  // Relaxed for combos: accept if ≥1 cycle done, or trick reached peak extension
  const poseSafe = poseCompletions >= 1 || posePhase === "return";

  if (totalFlips >= 1 && poseSafe) {
    const isSuperman = player.activeTrick === TrickType.SUPERMAN;
    const poseName = isSuperman ? "Superman" : "No-Hander";
    const flipName = direction >= 0 ? "Backflip" : "Frontflip";
    const posePoints = isSuperman ? SUPERMAN_BONUS : NO_HANDER_BONUS;
    const effectivePoseCount = Math.max(poseCompletions, 1);

    const comboLabel = `${countPrefix(effectivePoseCount)}${poseName} ${countPrefix(totalFlips)}${flipName}`;

    const baseScore = posePoints * effectivePoseCount + BACKFLIP_BONUS * totalFlips;
    const totalTrickCount = effectivePoseCount + totalFlips;
    let chainBonus = 0;
    if (totalTrickCount === 2) chainBonus = DOUBLE_CHAIN_BONUS;
    else if (totalTrickCount >= 3) chainBonus = TRIPLE_CHAIN_BONUS;
    const comboScore = (baseScore + chainBonus) * COMBO_MULTIPLIER;

    return { crashed: false, label: comboLabel, bonus: comboScore };
  }

  return { crashed: true };
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

/** Create a floating text instance for an awarded trick. */
export function createTrickFloatingText(
  label: string,
  bonus: number,
  playerX: number,
  playerY: number,
  playerWidth: number
): FloatingText {
  return {
    text: `${label}! +${bonus}`,
    x: playerX + playerWidth / 2,
    y: playerY - 10,
    opacity: 1,
    velocityY: -1.5,
  };
}

/** Advance floating texts upward and fade out. Returns only still-visible texts. */
export function updateFloatingTexts(texts: FloatingText[], dt: number): FloatingText[] {
  for (const ft of texts) {
    ft.y += ft.velocityY * dt;
    ft.opacity -= 0.01333 * dt;
  }
  return texts.filter((ft) => ft.opacity > 0);
}
