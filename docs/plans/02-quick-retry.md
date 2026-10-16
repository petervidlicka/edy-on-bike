# 02 — Faster restart after game over

**Goal:** Get from crash to the next run in one press. Keep the leaderboard for runs that are worth saving.

**Size:** S · **Branch:** `feature/quick-retry`

## What exists today

[components/GameOverScreen.tsx](../../components/GameOverScreen.tsx) has two steps:
1. Score, best, unlocks and the name form. Space here means **save & continue** ([LeaderboardForm.tsx](../../components/LeaderboardForm.tsx)), so with no name entered it just shows an error.
2. The top-scores list. Space or click restarts.

So every run takes at least 2 presses, and a run with no name saved hits an error first.

## Design

### Decide whether the leaderboard matters for this run
When the run ends, fetch the leaderboard straight away (it's already fetched later, so move the fetch earlier) and work out:

```ts
const qualifies = score > 0 && (entries.length < LEADERBOARD_SIZE || score > entries.at(-1)!.score);
```

### Two layouts
**A. Doesn't qualify (most runs):** a compact card showing score, best, unlocks, a progress bar (see [03](03-next-unlock-progress.md)), a big **▶ Play again** button, and a small "See leaderboard" link.
- Space / Enter / tap anywhere = play again.

**B. Qualifies:** a "🏆 You made the top 10!" banner and the name form, prefilled with the saved name.
- If a name is already saved: the primary button is **"Save as {name} & play"**, which submits and restarts in one press. Space does the same.
- A secondary **Skip** button restarts without saving.
- Step 2 (the leaderboard view) shows only after an explicit "See leaderboard" click, highlighting the player's row.

If the fetch fails or there's no API (offline / Capacitor without network), fall back to layout A with a "Save score" link.

### Input lockout
Ignore restart input for **~700 ms** after the game over screen appears. Kids mash Space through the crash animation, and without this they'd skip the screen without seeing their score. Show the button as disabled and fading in during the lockout.

### Keyboard
- `Enter` and `R` also restart, alongside `Space`.
- The input box keeps swallowing Space as it does now (`stopPropagation` on " ").

## Steps
1. Move the leaderboard fetch to mount; compute `qualifies` (put the helper in `lib/leaderboardConfig.ts` or a small util).
2. Split `GameOverScreen` into `GameOverSummary` (layout A) and the existing form flow (layout B). Keep each component small, per CLAUDE.md.
3. One-press "Save as {name} & play" in `LeaderboardForm` (an `onSavedAndRestart` prop).
4. Lockout timer plus Enter/R keys.
5. Test: a first-ever run with no name, a qualifying run with a saved name, a non-qualifying run, and the API being down.

## Notes
- Multiplayer has its own results screen ([MultiplayerResults.tsx](../../components/MultiplayerResults.tsx)) and is out of scope.
- Watch out for the two capture-phase Space listeners (form plus screen). After the split only one should be mounted at a time.
