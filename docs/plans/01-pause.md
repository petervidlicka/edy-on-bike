# 01 — Pause button + Esc/P

**Goal:** Let the player pause a single-player run on purpose, and stop the game from un-pausing by itself into an obstacle.

**Size:** S · **Branch:** `feature/pause-menu`

## What exists today

- `Engine.pause()` / `Engine.resume()` already work. They cancel the rAF loop, pause the music, and stop the siren ([game/Engine.ts](../../game/Engine.ts), near the bottom).
- `usePauseOnHidden` ([hooks/usePauseOnHidden.ts](../../hooks/usePauseOnHidden.ts)) pauses when the tab is hidden or the phone is in portrait. It calls `resume()` as soon as the tab is visible again, so the run restarts mid-air with no warning.

## Design

### Engine: pause *reasons*, not a boolean
With a single `isPaused` flag, the visibility hook would un-pause a game the player paused. Replace it with a set of reasons:

```ts
type PauseReason = "user" | "hidden" | "orientation";
pause(reason: PauseReason): void   // adds reason; first reason stops the loop
resume(reason: PauseReason): void  // removes reason; loop restarts when the set is empty
isPausedBy(reason): boolean
```

- Only allow `"user"` pauses in `RUNNING` and `AMBULANCE` states (not IDLE/CRASHING/GAME_OVER).
- `restart()` clears all reasons.
- Add `onPauseChange?: (paused: boolean) => void` to `EngineCallbacks` so React knows when to show the overlay.

### Auto-pause becomes a user pause
When the tab goes hidden during a run, the hook also adds `"user"`. Coming back then shows the pause menu instead of throwing the player straight back in. The multiplayer screen must **not** do this, because the race keeps running on the server; keep the current behaviour there behind a hook option (`usePauseOnHidden(engineRef, { promoteToUserPause: !multiplayer })`).

### Resume countdown
Resuming shows a quick **3 · 2 · 1** (about 1.5 s total) before the loop starts again. Render it as a React overlay and call `engine.resume("user")` when it finishes. Kids need this, otherwise they crash the instant they resume.

### UI — `components/PauseMenu.tsx` (new)
- A ⏸ button in the top-left `AudioControls` row ([components/HUD.tsx](../../components/HUD.tsx)), passed in as `children` the same way multiplayer passes LEAVE.
- Overlay: big **Resume**, **Restart**, **Home** (restart → IDLE), plus the music/SFX toggles. Use the same glass styling (`btnStyle`, `glassBtn`).
- Keys: `Esc` / `P` toggle the menu. `Space` resumes while paused and must **not** also jump: handle it in the capture phase and `stopImmediatePropagation`, the same pattern `GameOverScreen` uses.
- While paused, `GameCanvas.handleKeyDown` / `handleTouch` ignore input (check `engine.isPaused()`).

### Out of scope
- No pausing in multiplayer.

## Steps
1. Engine: pause-reason set, `isPaused()`, `onPauseChange` callback; update the two existing callers.
2. `usePauseOnHidden`: pass reasons, add the `promoteToUserPause` option.
3. `PauseMenu` component with the countdown; wire it into `GameCanvas`.
4. Pause button in the HUD; Esc/P/Space key handling.
5. Manual test: pause mid-air, during the ambulance, switch tabs during a run, rotate the phone to portrait, and check multiplayer is unchanged.

## Edge cases
- Pause during a biome crossfade: `pauseMusic()` already finishes the crossfade, so nothing to do.
- Resize while paused: `resize()` redraws nothing because the loop is stopped. Call `render()` once in `resize()` while paused so the frozen frame isn't blank.
- If a combo timer from [05](05-combo-system.md) is running, it must not tick while paused. It won't, as long as it's driven by `dt` inside `update()`.
