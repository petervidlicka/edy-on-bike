# 04 — Haptics on mobile

**Goal:** Feel the landings, crashes and unlocks on phones.

**Size:** S · **Branch:** `feature/haptics` · **Depends on:** the game event callback (see [README](README.md#shared-groundwork-game-events))

## Platform reality
| Platform | API | Works? |
|---|---|---|
| iOS app (Capacitor) | `@capacitor/haptics` → Taptic Engine | ✅ the best experience |
| Android app (Capacitor) | `@capacitor/haptics` | ✅ |
| Android Chrome (web) | `navigator.vibrate()` | ✅ coarse buzzes only |
| iOS Safari (web) | none | ❌ silently no-op |

`@capacitor/haptics` was removed in `ad8a2d6` because nothing imported it. Re-add it and run `npx cap sync`, which brings back the iOS SPM and Android Gradle entries that commit took out.

## Design

### `lib/haptics.ts` (new)
```ts
export type HapticKind = "tap" | "land" | "bigLand" | "comboUp" | "crash" | "success";
/** Fire-and-forget; never throws, never awaits in the game loop. */
export function haptic(kind: HapticKind): void
export function setHapticsEnabled(on: boolean): void
```
- Native: `Capacitor.isNativePlatform()` → `Haptics.impact({ style })` / `Haptics.notification({ type })`. Import the plugin dynamically so the web bundle doesn't need it.
- Web: `navigator.vibrate?.(pattern)`.
- Mapping (starting point, tune on device):

| Event | Native | Web vibrate |
|---|---|---|
| clean trick landed | impact Medium | 20 ms |
| triple / big combo landed | impact Heavy | 40 ms |
| sketchy landing | impact Light | 10 ms |
| combo multiplier goes up ([05](05-combo-system.md)) | impact Light | 10 ms |
| crash | notification Error | [60, 40, 80] |
| revive, skin unlock, new best | notification Success | [30, 50, 30] |

Don't buzz on every jump. It's tiring and drains the battery; try it on device before adding it.

### Wiring
`GameCanvas` / `MultiplayerGameCanvas` subscribe to `onGameEvent` and call `haptic()`. The engine stays platform-free.

### Setting
Add a vibration toggle (📳 icon) in `AudioControls`, but only render it where haptics can work (native or `"vibrate" in navigator`). Store it in localStorage next to the mute state, which currently isn't persisted at all; consider persisting the mutes in the same change.

## Steps
1. Re-add `@capacitor/haptics`, `npx cap sync`, and check iOS/Android still build (`npm run build:mobile`).
2. `lib/haptics.ts`.
3. Subscribe in both canvases.
4. Toggle plus persistence.
5. Test on a real iPhone, since the Simulator has no Taptic Engine, and on an Android phone in Chrome.
