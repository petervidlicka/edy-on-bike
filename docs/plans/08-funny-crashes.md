# 08 — Funnier, varied crashes

**Goal:** Crashes become something to laugh at instead of just a fail screen. *What* you hit decides *how* you crash.

**Size:** M–L (drawing work) · **Branch:** `feature/crash-variants` · **Depends on:** nothing; works best together with [07 voice lines](07-voice-lines.md)

## What exists today
- `Engine.startCrash()` takes **no arguments**, so it doesn't know what was hit.
- [game/CrashSequence.ts](../../game/CrashSequence.ts) runs one ragdoll: the rider is thrown forward, the bike slides, both bounce twice. Then there's a 25 % ambulance revive.
- [game/rendering/CrashRenderer.ts](../../game/rendering/CrashRenderer.ts) draws the tumbling rider and bike.
- The world stops scrolling while crashing (`updateCrash` doesn't move obstacles), so the obstacle that was hit stays in place and variants can anchor to it.

## Design

### Crash cause → variant
```ts
type CrashCause =
  | { kind: "obstacle"; obstacle: ObstacleInstance }
  | { kind: "badLanding"; underRotated: boolean }   // from processTrickLanding → onCrash
  | { kind: "eliminated" };                          // multiplayer
startCrash(cause: CrashCause)
```
A registry picks the variant: specific variants take precedence, with **~25 % classic ragdoll mixed in** so it stays surprising.

| Variant | Triggered by | What happens | Pop text / sound |
|---|---|---|---|
| **Classic** (existing) | fallback | Ragdoll tumble | "OOF!" |
| **Faceplant** | bad trick landing | Rider stuck head-first in the ground, legs up and wiggling ~0.7 s, then tips over | "SPLAT!" + thud |
| **Tree hang** | `SMALL/TALL/GIANT_TREE` | Rider snagged in the branches, dangling and swinging; bike falls below; a few leaves drop | "BONK!" + leaf rustle |
| **Cactus** | `CACTUS` | Rider bounces off with little spike lines, holding their bum | "OUCH!" (voice line) |
| **Car bonk** | `CAR`, `LAND_CRUISER`, `PINK_G_CLASS`, `LAMBORGHINI_HURACAN` | Rider bounces high off the roof like a trampoline and lands spread-eagle | "BOING!" (rising sine sweep) |
| **Sand buried** | `SAND_TRAP` | Rider sinks to the waist, arms flailing; bike half-sunk | "FLUMP" + sand puff particles |
| **Trolley ride** | `SHOPPING_TROLLEY` | Rider lands *in* the trolley and rolls off to the right | squeaky wheel loop |
| **Camel** | `CAMEL` | Rider lands sitting on the hump, looking confused; the camel shrugs | camel grunt |

**Garnish on every variant:**
- **Cartoon stars / birds** circling the rider's head once they settle.
- **Wheel escape** (10 %): the front wheel comes off and rolls away on its own.
- Comic pop text (reuse `FloatingText`, but bigger and rotated, in a comic-style colour).

**Ambulance variant:** about 1 in 4 revives is a **helicopter** that drops in from the top with a rope, lifts the rider and puts them back on the bike. It needs its own phase logic next to `updateAmbulanceLogic`, and the rotor sound is filtered noise with a 15 Hz amplitude pulse.

### Code structure — `game/crashes/` (new folder)
```
game/crashes/
  types.ts        CrashCause, CrashVariant interface { init, update, draw, duration }
  registry.ts     pickVariant(cause, rng) → CrashVariant
  classic.ts      existing physics + renderer moved here
  faceplant.ts
  treeHang.ts
  carBonk.ts
  ...             one file per variant (small, focused)
  garnish.ts      stars, wheel escape, pop text
```
- `CrashState` gets `variantId` and a variant-specific `data` blob, typed as a discriminated union (no `any`).
- `CRASH_DURATION` becomes per variant (some need ~1.6 s). The ambulance still starts from wherever the rider ended up. `revivePlayer()` already resets the pose, so that just works.
- Pose drawing reuses the existing rider and bike part functions from `PlayerRenderer` (`drawHelmet`, `drawWheel`, …) so every skin works automatically.

### Multiplayer
Crashes are local only (ghosts just fade), so no protocol change. `{ kind: "eliminated" }` → classic.

### Quick retry interaction ([02](02-quick-retry.md))
Longer crash animations make the wait to retry feel longer. Allow a tap/Space after ~0.6 s to **skip to game over**, but not into the ambulance: if the ambulance rolls, it always plays.

## Phasing
- **Phase 1:** cause plumbing, the variant framework (classic moved over), **faceplant, tree hang, car bonk**, stars garnish.
- **Phase 2:** cactus, sand buried, trolley, camel, wheel escape.
- **Phase 3:** helicopter revive.

## Steps (phase 1)
1. Add `CrashCause` and pass it from every `startCrash` call site (collision loop, rideable crash, `processTrickLanding` → `onCrash`, multiplayer elimination).
2. Move the existing crash into `crashes/classic.ts` with no visual change; check it looks identical.
3. Registry and the three new variants plus stars.
4. Sounds and pop texts.
5. Playtest each variant with the `?obstacles=debug` sequence (extend it with trees and cars).
