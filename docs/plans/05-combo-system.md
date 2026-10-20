# 05 — Combo chain + combo meter

**Goal:** Make linking tricks the core "one more run" loop. Landing trick after trick builds a multiplier you can see, hear and feel. Waiting too long or landing sketchy ends it.

**Size:** M · **Branch:** `feature/combo-chain` · **Depends on:** the game event callback ([README](README.md#shared-groundwork-game-events))

## Naming (avoid a clash)
The code already says **combo** for *pose + flip in the same jump* (`evaluateComboLanding`, `COMBO_MULTIPLIER = 2`). That stays as is. The new cross-landing system is called the **chain** in code (`ComboChain`); players see it as **"COMBO x3"**.

## Rules (default; tune by playing)
- **Links.** Each trick landing adds one link: clean or sketchy, flip, pose or mixed. A grind ([06](06-grinds.md)) also adds one.
- **Multiplier** = `min(1 + 0.5 × (links − 1), 4)`, so 1 link → ×1, 2 → ×1.5, 3 → ×2, 5 → ×3, 7+ → ×4.
- **Scoring.** Each landing's bonus × the multiplier *after* adding that link is **paid immediately**, the same as today. Nothing is lost on a crash, which keeps it kind for a kid and keeps the leaderboard simple.
- **Window.** `COMBO_WINDOW_MS = 2500` of time **on the ground**. The timer freezes while airborne or grinding and resets to full on each new link. When it runs out, the chain ends.
- **Sketchy landing** counts as a link, then **ends the chain** ("Sketchy! Combo over").
- **Crash** ends the chain.
- **Chain end** (2+ links) shows a summary: **"COMBO ×3 · 5 tricks · +640"** as a big floating text, plus a "cash-in" sound.

> **Open question:** Tony Hawk-style "pot" scoring, where points are only banked when the chain ends and lost on a crash, is more exciting but harsher. The default above is the gentle version. The pot could be a toggle later.

## Code

### `game/ComboChain.ts` (new, pure, no DOM)
```ts
export interface ComboChain { links: number; multiplier: number; windowMs: number; chainPoints: number; }
export function createChain(): ComboChain
/** Adds a link; returns the multiplier to apply to this landing's bonus. */
export function addLink(c: ComboChain, opts: { sketchy: boolean }): number
/** Drains the window while grounded; returns true when the chain just expired. */
export function tickChain(c: ComboChain, dtMs: number, grounded: boolean): boolean
export function endChain(c: ComboChain): { links: number; multiplier: number; total: number } | null
```

### Engine ([game/Engine.ts](../../game/Engine.ts))
- `awardTrickBonus(label, bonus, sketchy)` → `const m = addLink(chain, …); const paid = Math.round(bonus * m);`. Pay `paid`, put `×m` in the floating text, emit `trickLanded` and `comboChanged`.
- In `update()`, call `tickChain(chain, rawDt, player.isOnGround && !player.ridingObstacle)`. On expiry → `endChain`, show the summary text, emit `comboEnded`.
- In `startCrash()`, end the chain silently (no summary). In `restart()`, reset it.
- Since the chain is ticked inside `update()`, it automatically freezes while paused ([01](01-pause.md)).

### Combo meter: draw it on the canvas, not in React
It changes every frame (the draining window), so React state would re-render 60×/s. Add `game/rendering/ComboRenderer.ts`:
- Top-centre badge: **"×2.5"** in big Fredoka-style type, with a ring or bar below it that drains with `windowMs`.
- It grows and pulses on each new link (scale 1.3 → 1 over ~200 ms) and shifts colour by tier: white → green → orange → pink → rainbow at ×4.
- At ×3 and above, add a light white screen flash. At ×4, burst confetti using the existing particle system.
- Keep it visible but small at ×1 (or hidden until the 2nd link; try both).

### Sound ([game/SoundManager.ts](../../game/SoundManager.ts))
- `playComboStep(level)`: the existing `playBackflipSuccess` arpeggio, transposed up a semitone or two per link, so the rising pitch tells the player the chain is growing.
- `playComboCashIn(multiplier)`: a short major chord plus a coin-like shimmer, bigger for higher multipliers.

### HUD
`TrickFeedbackPopup` shows "Backflip +75 (×1.5)". The score colour flash already exists.

## Multiplayer ⚠️
[party/validation.ts](../../party/validation.ts) clamps score jumps: `MAX_BONUS_BURST = 600`, refill 250/s. Today's mixed tricks can **already** exceed that, e.g. a triple Superman + triple Backflip = (180+150+200)×2 = 1060, so legitimate scores get silently clamped in races. With a ×4 chain, one landing could be about 4000.
- Raise `MAX_BONUS_BURST` to about 5000 and the refill rate to match, or, better, compute the true maximum from the constants.
- This means redeploying the Cloudflare worker (see the multiplayer deployment notes) **before** the client ships.

## Steps
1. `ComboChain.ts` and constants (`COMBO_WINDOW_MS`, `COMBO_MAX_MULTIPLIER`, `COMBO_STEP`).
2. Engine integration and floating texts.
3. `ComboRenderer` meter.
4. Sounds.
5. Raise the multiplayer validation limits and deploy the worker.
6. Playtest and tune the window and step. The obstacle gap is ~0.6–4 s apart, so 2.5 s should be reachable but not automatic.
