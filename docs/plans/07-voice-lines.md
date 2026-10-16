# 07 — Edy says things (voice lines)

**Goal:** Short voice reactions ("Woohoo!", "Whoa!", "Ouch!") on big moments, so the rider has a personality.

**Size:** M (mostly sourcing and editing audio) · **Branch:** `feature/voice-lines` · **Depends on:** the game event callback ([README](README.md#shared-groundwork-game-events)); crash variant names from [08](08-funny-crashes.md) are nice to have

## Sourcing the clips

**Recommended: record Edy (and you).** It's the most charming option and the one with no licensing questions. A phone voice memo in a quiet room is enough. Do 3–4 takes of each line in the table below, with lots of energy; the editing step handles the rest.

**Placeholder / fill-in: free sound libraries.** Downloads need a yes from you first, and some sites need an account, so you might grab them yourself:

| Source | License | Notes |
|---|---|---|
| [kids_WOAH.wav (DesignDean, Freesound)](https://freesound.org/people/DesignDean/sounds/397317/) | CC0 | A group of kids saying "woah": good for big tricks |
| [whooo.wav (VacekH, Freesound)](https://freesound.org/people/VacekH/sounds/189503/) | CC0 | Boys cheering "whooo" |
| [Kenney Voiceover Pack](https://opengameart.org/content/voiceover-pack-40-lines) | CC0 | Adult announcer voice ("Go!", "Game over", numbers): good for a 3-2-1 countdown ([01](01-pause.md)) |
| [Pixabay "kid voice" search](https://pixabay.com/sound-effects/search/kid%20voice/) | Pixabay Content License (free, no attribution) | Lots of kid cheers and "yay"s; check each clip |
| [Uppbeat woohoo / kids clips](https://uppbeat.io/sfx/category/voice-clips/reactions/woohoo) | Uppbeat licence (not CC0) | Read the terms before using in a store app |

Freesound needs a free login to download. Keep a `public/voice/CREDITS.md` with the source, author and license of every non-recorded clip.

## Line list (v1, ~20 clips)
| Event | Lines (pick 2–3 variants each) | Play chance |
|---|---|---|
| Run starts | "Let's go!", "Here we go!" | 100 % |
| Clean trick | "Woohoo!", "Yeah!", "Awesome!" | 35 % |
| Big trick (triple, mixed, or combo ×3+) | "Whoa!", "Did you see that?!", "Sick!" | 100 % |
| Sketchy landing | "Whoa-whoa-whoa!", "Phew!", "That was close!" | 70 % |
| Crash | "Ouch!", "Oops!", "Ow ow ow!" | 80 % |
| Revived by the ambulance | "I'm OK!", "Thanks!" | 100 % |
| New best / skin unlocked | "New record!", "New bike!" | 100 % |
| Biome change | "Dubai!" (later "Snow!", "Night ride!") | 100 % |

## Audio prep
- Format: **mono MP3, 44.1 kHz, ~64 kbps**. MP3 plays everywhere, including the iOS WKWebView. Budget: under 400 KB in total.
- Trim silence and normalise loudness so every line sits at the same level:
  ```bash
  ffmpeg -i in.wav -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5" -ac 1 -b:a 64k out.mp3
  ```
- Files go in `public/voice/<event>-<n>.mp3`; static export copies them into the Capacitor build.

## Code

### `game/voiceLines.ts` (new)
A manifest of `event → { files: string[]; chance: number; priority: number }`.

### `game/VoiceManager.ts` (new), owned by `SoundManager`
- Shares SoundManager's `AudioContext` (make `getCtx()` package-visible or pass it in).
- **Preload** on the first user gesture (run start): `fetch` → `decodeAudioData` → `AudioBuffer`s. Lazy and non-blocking; if a clip isn't loaded yet, skip it.
- `say(event)` rules:
  - Roll the event's `chance`.
  - **Global cooldown of 1.8 s.** A higher-priority line (crash > big trick > others) may cut off a lower one that's playing.
  - Never repeat the last variant of that event.
  - **Duck the music** to ~50 % while a line plays and ramp it back up over 300 ms.
  - Follows the SFX mute. A separate "voice" toggle is optional; leave it out of v1 unless it gets annoying.
- Small random pitch variation (`playbackRate` 0.95–1.05) so repeats sound less canned.

### Engine
In the internal `emit()` from the shared groundwork, map game events → `sound.voice.say(...)`. Voice must play from inside the engine, not React, so timing stays tight.

## Steps
1. Record or collect clips (**asks you before downloading anything**), process them with ffmpeg, add `CREDITS.md`.
2. `voiceLines.ts` manifest and `VoiceManager`.
3. Hook up the events and ducking.
4. Playtest for annoyance: if it's too chatty, lower the chances or raise the cooldown.

## Implementation notes (code side, done)
- Clips are discovered from `public/voice/manifest.json` (`{ "files": [...] }`, regenerate with `npm run voice:manifest`) instead of a hard-coded file list, so adding a recording needs no code change and the game never requests a file that does not exist. `game/voiceLines.ts` holds the chance/priority table, the game-event mapping and the naming convention; how to add clips is in `public/voice/README.md`.
- Per-variant crash lines (`crash-faceplant-<n>`, `crash-tree-hang-<n>`, `crash-car-bonk-<n>`) fall back to the generic `crash-<n>` set.
- `newBest` and `skinUnlocked` are triggered from React through `Engine.announce(...)`.
- Still open: record/source the clips, then playtest chances and cooldown for annoyance.
