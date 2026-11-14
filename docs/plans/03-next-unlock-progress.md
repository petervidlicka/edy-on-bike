# 03 — "Next unlock" progress

**Goal:** Always show the player what they're working towards: the next locked bike and how far away it is.

**Size:** S · **Branch:** `feature/next-unlock-progress`

## What exists today
- Skins unlock by **best score** (`unlockScore`: 300 / 400 / 550 / 750 / 1050) in [game/skins.ts](../../game/skins.ts), checked by `isSkinUnlocked()`.
- `SkinPicker` dims locked bikes and shows "Score 750". `GameOverScreen` lists bikes unlocked by the run. Nothing shows progress in between.

## Design

### Helper — `game/skins.ts`
```ts
/** The cheapest still-locked skin and how far the player is from it; null when everything is unlocked. */
export function getNextUnlock(bestScore: number, cheatUnlocked: boolean):
  { skin: SkinDefinition; remaining: number; progress: number /* 0..1 from previous tier */ } | null
```
Measure `progress` from the previous tier's threshold, not from 0, so the bar visibly moves.

### Start screen
Under the `SkinPicker`, add a slim bar: a mini preview of the locked bike (reuse `drawSkinPreview` on a small canvas), the text **"180 more points to unlock Neon Night"**, and a fill bar. Hide it when everything is unlocked, or show "All bikes unlocked! 🏆".

### In-run toast (the fun part)
When the **live** score passes the next unlock threshold mid-run, show a toast: **"🔓 Neon Night unlocked!"**, with a chime (reuse `playRevive`, or add `playUnlock`) and haptic `success` (see [04](04-haptics.md)).
- `GameCanvas` already gets every score update. Compute the target once at run start (`getNextUnlock(bestScore)`) and compare against it in `onScoreUpdate`. After it fires, move on to the next tier, because one run can unlock two bikes.
- Don't persist anything mid-run. `recordBestScore` at game over stays the source of truth.

### Game over
Animate the bar from the old best to the new score (CSS transition on width, ~800 ms). If it crosses a threshold, flash the unlocked bike and start the bar again for the next tier. This replaces the plain "New bike unlocked:" text box.

## Steps
1. `getNextUnlock()` plus a unit-style check (no test runner in the repo yet, so verify in the browser for now).
2. `UnlockProgress` component (shared by the start and game over screens).
3. In-run toast in `GameCanvas` / `HUD`.
4. Game over animation.

## Notes
- Leave the IDKFA cheat (`cheatUnlocked`) alone. When it's on, hide the bar.
- The trick-based unlocks from the brainstorm (#19) would plug into the same helper later. Keep the return type generic (`requirement` text, not just `remaining` points) if that's cheap.
