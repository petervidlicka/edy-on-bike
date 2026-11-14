# Fun & QoL roadmap

Plans for the last round of game improvements. Each plan was one feature branch off `dev` (`feature/<name>`), merged by PR once it had been played and approved. **All eight have shipped**; the plans are kept as design notes, so the code is the reference where they differ.

| # | Plan | Size | Depends on | Status |
|---|---|---|---|---|
| 01 | [Pause button + Esc/P](01-pause.md) | S | — | Shipped |
| 02 | [Faster restart after game over](02-quick-retry.md) | S | — | Shipped |
| 03 | ["Next unlock" progress](03-next-unlock-progress.md) | S | after 02 (both edit the game over screen) | Shipped |
| 04 | [Haptics on mobile](04-haptics.md) | S | game events | Shipped |
| 05 | [Combo chain + combo meter](05-combo-system.md) | M | game events | Shipped |
| 06 | [Grinds on rideable obstacles](06-grinds.md) | S–M | 05 | Shipped |
| 07 | [Edy says things (voice lines)](07-voice-lines.md) | M | game events, clips recorded/sourced | Shipped |
| 08 | [Funnier, varied crashes](08-funny-crashes.md) | M–L | — | Shipped |

## Suggested order

1. **Quick wins:** 01 → 02 → 03. Small, mostly UI, and they make every later playtest nicer.
2. **Trick loop:** game events → 05 → 06 → 04. Combo plus grinds is the biggest fun upgrade, and haptics hook straight into the same events.
3. **Personality:** 08 phase 1 → 07 → 08 phases 2–3. Start recording Edy's lines early, since that runs in parallel with the coding.

Nearly every plan touches `components/GameCanvas.tsx` and `game/Engine.ts`, so run them **one at a time** rather than in parallel sessions to avoid merge pain.

## Shared groundwork: game events

04, 05, 07 and 08 all need to react to the same moments. Before the first of them, add one small typed event channel instead of growing `EngineCallbacks` one callback at a time:

```ts
// game/events.ts
export type GameEvent =
  | { type: "runStart" }
  | { type: "trickLanded"; label: string; points: number; sketchy: boolean; big: boolean }
  | { type: "comboChanged"; links: number; multiplier: number }
  | { type: "comboEnded"; links: number; multiplier: number; total: number }
  | { type: "grindEnded"; obstacle: ObstacleType; points: number }
  | { type: "crash"; variant: string }
  | { type: "revive" }
  | { type: "biomeChanged"; biome: BiomeId }
  | { type: "newBest" } | { type: "skinUnlocked"; skinId: SkinId };
```

- The engine has a private `emit(e)` that routes events internally (voice lines, sounds) **and** calls `callbacks.onGameEvent?.(e)` for React (haptics, toasts).
- Fold the existing `onTrickLanded` into it once nothing else uses it.
- Ship it as part of whichever of 04 / 05 lands first.

## Parked for later
- ~~Biomes 3 & 4: Snow and Night.~~ Shipped as Austria and Night Tokyo (`game/environments/`).
- Other brainstorm ideas not picked this round: swipe gestures, hold-to-jump-higher, best-run ghost, collectibles, power-ups, missions/stickers, photo mode, easy mode, multiplayer emotes and trick-off.

## Known issue found while planning (fixed)
`party/validation.ts` used to cap a single score jump at 600 (`MAX_BONUS_BURST`), which clamped big tricks in multiplayer. The cap is now derived from `MAX_CHAIN_LANDING_BONUS` in `game/constants.ts`, so it follows trick tuning.
