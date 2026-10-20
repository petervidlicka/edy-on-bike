/**
 * The trick "chain": landing tricks on consecutive jumps builds a score multiplier.
 * Pure state + rules, no DOM and no timers of its own, so the Engine drives it from
 * update() (it therefore freezes while the game is paused) and it can be unit-tested.
 *
 * Naming: "combo" in TrickSystem means pose + flip in the *same* jump; this module is
 * the cross-landing "chain". Players see the chain as "COMBO x3".
 */
import { COMBO_MAX_MULTIPLIER, COMBO_STEP, COMBO_WINDOW_MS } from "./constants";

/** Live chain state. `links` is 0 while no chain is running. */
export interface ComboChain {
  /** Trick landings in the running chain. */
  links: number;
  /** Multiplier applied to the most recent landing (1 when idle). */
  multiplier: number;
  /** Ground time left to land the next trick. */
  windowMs: number;
  /** Total points paid for the chain's landings so far. */
  chainPoints: number;
}

/** What a finished chain earned; shown as the "COMBO x3 · 5 tricks · +640" summary. */
export interface ComboSummary {
  links: number;
  multiplier: number;
  total: number;
}

/** @returns A fresh, idle chain. */
export function createChain(): ComboChain {
  return { links: 0, multiplier: 1, windowMs: 0, chainPoints: 0 };
}

/**
 * Multiplier for a chain of this length: 1 + COMBO_STEP per extra link, capped.
 * @param links - Landings in the chain (0 or 1 both give x1).
 */
export function multiplierForLinks(links: number): number {
  return Math.min(1 + COMBO_STEP * Math.max(0, links - 1), COMBO_MAX_MULTIPLIER);
}

/**
 * Adds a landing to the chain and refills the window. The landing is paid with the
 * multiplier *after* this link, so the first trick is x1 and every later one is worth more.
 * Whether a sketchy landing then ends the chain is policy, left to the caller.
 * @param chain - Chain to update in place.
 * @param bonus - The landing's bonus before the multiplier.
 * @returns The multiplier that applies and the points to pay (rounded).
 */
export function addLink(chain: ComboChain, bonus: number): { multiplier: number; paid: number } {
  chain.links += 1;
  chain.multiplier = multiplierForLinks(chain.links);
  chain.windowMs = COMBO_WINDOW_MS;
  const paid = Math.round(bonus * chain.multiplier);
  chain.chainPoints += paid;
  return { multiplier: chain.multiplier, paid };
}

/**
 * Drains the window by the time spent on the ground. Airborne or riding an obstacle
 * the timer holds, so a long jump never costs the chain.
 * @param chain - Chain to update in place.
 * @param dtMs - Elapsed game time (not wall time, so pauses don't count).
 * @param grounded - True only when on the ground and not riding an obstacle.
 * @returns True when the chain just ran out of time; the caller should end it.
 */
export function tickChain(chain: ComboChain, dtMs: number, grounded: boolean): boolean {
  if (chain.links === 0 || !grounded) return false;
  chain.windowMs = Math.max(0, chain.windowMs - dtMs);
  return chain.windowMs === 0;
}

/**
 * Ends the chain and resets it to idle.
 * @returns What the chain earned, or null if none was running.
 */
export function endChain(chain: ComboChain): ComboSummary | null {
  if (chain.links === 0) return null;
  const summary = { links: chain.links, multiplier: chain.multiplier, total: chain.chainPoints };
  chain.links = 0;
  chain.multiplier = 1;
  chain.windowMs = 0;
  chain.chainPoints = 0;
  return summary;
}

/**
 * Formats a multiplier without a needless decimal: 2 -> "2", 1.5 -> "1.5".
 * @example formatMultiplier(2.5) // "2.5"
 */
export function formatMultiplier(multiplier: number): string {
  return Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(1);
}
