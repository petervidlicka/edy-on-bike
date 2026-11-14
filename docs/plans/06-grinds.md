# 06 — Grinds on rideable obstacles

**Goal:** Riding along the top of containers, bus stops, billboards and the Dubai chocolate becomes a scored trick with sparks, and it links into combos.

**Size:** S–M · **Branch:** `feature/grinds` · **Depends on:** [05 combo chain](05-combo-system.md)

## What exists today
- Rideable obstacles: `BUS_STOP`, `SHIPPING_CONTAINER`, `CONTAINER_WITH_RAMP`, `DUBAI_CHOCOLATE`, `DUBAI_BILLBOARD` ([game/Obstacle.ts](../../game/Obstacle.ts)).
- Landing on top sets `player.ridingObstacle`. `processRidingState` ([game/RampPhysics.ts](../../game/RampPhysics.ts)) keeps the player on the surface and clears it when the obstacle scrolls past. `jumpPlayer` clears it on a super-jump off the top.
- Riding currently earns nothing.

## Design

### Scoring
- Track `grindMs` while `ridingObstacle` is set. Store it on the Engine, not on `PlayerState`, so ghost snapshots stay unchanged.
- When riding ends (rolled off the end **or** jumped off), award if `grindMs ≥ 300`:
  `points = round(GRIND_BASE + GRIND_PER_SEC × grindMs/1000)` (start with 10 + 40/s, so a full container is about 45).
- The label depends on the obstacle: "Container Grind", "Bus Stop Grind", "Billboard Grind", "Chocolate Grind 🍫". Put the names in a small map next to `OBSTACLE_SPECS`.
- It goes through `awardTrickBonus`, so it's **one combo link** and gets the multiplier.
- The combo window is **frozen** while grinding, as [05](05-combo-system.md) already specifies.
- **Grind → flip off the end → land** = 2 links. This is the main new combo route.

### Feel
- **Sparks:** at the rear wheel contact point, emit 2–3 short orange/yellow streaks per frame flying back and up. Add a `SparkEmitter` in `game/rendering/ParticleRenderer.ts` (the existing particles are biome overlays; sparks need their own short-lived pool).
- **Pose:** while grinding, ease `riderCrouch` → 0.6 and `bikeTilt` → a slight nose-down, so it reads as a different action from riding on the ground.
- **Sound:** a looping filtered-noise "scrape" (bandpass ~2–4 kHz, low gain) that starts when the grind starts and stops at its end. Use `SoundManager.startGrind()` / `stopGrind()`, with the same node lifecycle pattern as the siren.
- **Live counter:** a small floating "+12…" that ticks up above the rider during long grinds (optional; try it).

### Edge cases
- Ambulance revive sets `ridingObstacle = null`; don't award a grind there. Gate it on `state === RUNNING` and skip when reviving.
- `CONTAINER_WITH_RAMP` ends in a ramp lip. Rolling off it gives the curved auto-launch, so a flip there is the natural combo.
- Pause must also stop the grind sound loop (`pause()` → `stopGrind()`, and `resume()` restarts it if still riding).

### Multiplayer (optional)
Add `gr: boolean` to `GhostSnapshot` so ghosts show sparks too. That needs a matching update to the validator's allowed fields in `party/validation.ts`, so leave it out of v1.

## Steps
1. Grind tracking and award in Engine (`prevRiding` → `nowRiding` transition).
2. Obstacle name map and constants.
3. Spark emitter and grind pose.
4. Grind scrape sound and pause handling.
5. Playtest with the `?obstacles=debug` sequence, which already cycles containers and bus stops.
