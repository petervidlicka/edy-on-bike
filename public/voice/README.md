# Edy's voice lines

Short reactions ("Woohoo!", "Ouch!") that play on big moments. The game works with this folder
empty: lines light up as clips are added, with no code change.

## Adding a clip

1. Record or source the line (see `docs/plans/07-voice-lines.md` for ideas and licensing).
2. Process it to mono MP3, trimmed and loudness-normalised (needs ffmpeg: `brew install ffmpeg`):
   ```bash
   ffmpeg -i in.wav -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5" -ac 1 -ar 44100 -b:a 64k out.mp3
   ```
   Keep the whole folder under about 400 KB; a line should be about a second or less.
3. Save it here as `<name>-<n>.mp3` (lowercase, kebab-case, `<n>` = 1, 2, 3 ... for variants).
4. Add a row to `CREDITS.md`.
5. Run `npm run voice:manifest` to regenerate `manifest.json` (the list of clips the game loads).
   Commit the mp3s and the manifest together. A clip missing from the manifest is never requested.

The game fetches `manifest.json` at the first run start, decodes the listed clips in the
background and logs one `[voice] loaded N/M clips` line to the console. A listed file that is
missing or cannot be decoded is skipped and named in that line; nothing throws.

`manifest.json` format: `{ "files": ["crash-1.mp3", "crash-2.mp3"] }`.

## Names and play rules

Playing rules live in `game/voiceLines.ts` (chance, priority) and `game/VoiceManager.ts`
(cooldown, interrupts, ducking). Lines are picked at random and never repeat back to back.

| Name | When | Chance | Suggested lines |
|---|---|---|---|
| `run-start-<n>` | A run starts | 100 % | "Let's go!", "Here we go!" |
| `clean-trick-<n>` | A trick (or grind link) lands cleanly | 35 % | "Woohoo!", "Yeah!", "Awesome!" |
| `big-trick-<n>` | Big trick, chain multiplier 3x+, or a x3+ combo ends | 100 % | "Whoa!", "Did you see that?!", "Sick!" |
| `sketchy-<n>` | Wobbly landing | 70 % | "Whoa-whoa-whoa!", "Phew!", "That was close!" |
| `crash-<n>` | Any crash | 80 % | "Ouch!", "Oops!", "Ow ow ow!" |
| `crash-faceplant-<n>` | Faceplant (optional) | 80 % | e.g. "Mmph!" |
| `crash-tree-hang-<n>` | Stuck in a tree (optional) | 80 % | e.g. "Help!" |
| `crash-car-bonk-<n>` | Bounced off a car (optional) | 80 % | e.g. "Boing!" |
| `revive-<n>` | The ambulance brings Edy back | 100 % | "I'm OK!", "Thanks!" |
| `new-best-<n>` | New personal best at game over | 100 % | "New record!" |
| `skin-unlocked-<n>` | A bike unlocks mid-run | 100 % | "New bike!" |
| `biome-dubai-<n>` | Dubai starts | 100 % | "Dubai!" |
| `biome-<id>-<n>` | Another biome starts (`snow`, `desert`, ...) | 100 % | "Snow!" |
| `grind-<n>` | A long grind ends (optional) | 40 % | "Grind!" |

A `crash-<variant>-<n>` set, when present, is used for that crash type; otherwise the generic
`crash-<n>` lines play. Variant ids are the crash variant names in kebab-case.

Rules: at most one line at a time, 1.8 s between lines (a higher priority skips the wait and may
cut off a lower one: crash > new best / skin unlocked > big trick > revive / biome > sketchy >
run start > clean trick / grind), music dips to half while Edy speaks, and the SFX mute silences
the voice.
