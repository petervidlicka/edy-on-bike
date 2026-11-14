/**
 * What Edy can say and when. This module is pure data and mapping: which voice event a game
 * event turns into, how likely and how important it is, and the clip naming convention the
 * loader uses to find files. The playing rules live in `VoiceManager`.
 *
 * Clips are NOT listed here. They are discovered from `public/voice/manifest.json`, so adding a
 * recording is "drop the mp3 in, run `npm run voice:manifest`" with no code change, and the game
 * never requests a file that does not exist (no 404 spam while the set is still being recorded).
 * See `public/voice/README.md`.
 */
import type { GameEvent } from "./events";

/** Every kind of line Edy can say. */
export type VoiceEvent =
  | "runStart"
  | "cleanTrick"
  | "bigTrick"
  | "sketchy"
  | "crash"
  | "revive"
  | "newBest"
  | "skinUnlocked"
  | "biome"
  | "grind";

/**
 * How a voice event behaves.
 * - `chance`: probability (0..1) that the line plays when the moment comes up.
 * - `priority`: a higher priority may cut off a lower one that is still playing, and may speak
 *   during the global cooldown that blocks equal or lower priorities.
 */
export interface VoiceEventConfig {
  chance: number;
  priority: number;
}

/**
 * Tuning table for all voice events. Values follow docs/plans/07-voice-lines.md; lower the
 * chances if playtesting finds Edy too chatty.
 */
export const VOICE_EVENTS: Readonly<Record<VoiceEvent, VoiceEventConfig>> = {
  runStart: { chance: 1, priority: 40 },
  cleanTrick: { chance: 0.35, priority: 10 },
  bigTrick: { chance: 1, priority: 70 },
  sketchy: { chance: 0.7, priority: 50 },
  crash: { chance: 0.8, priority: 100 },
  revive: { chance: 1, priority: 60 },
  newBest: { chance: 1, priority: 80 },
  skinUnlocked: { chance: 1, priority: 80 },
  biome: { chance: 1, priority: 60 },
  // Same priority as cleanTrick on purpose: a grind pays a trick link too, so its landing line
  // fires first and the cooldown then keeps the grind line from cutting it off.
  grind: { chance: 0.4, priority: 10 },
};

/** A voice event plus the detail that picks a more specific clip set (crash variant, biome id). */
export interface VoiceCue {
  event: VoiceEvent;
  variant?: string;
}

/** Chain multiplier from which a trick or finished combo counts as a "big" moment. */
export const BIG_MULTIPLIER = 3;

/** A grind must pay at least this much (after the multiplier, roughly 0.75 s ridden) to earn a line. */
export const LONG_GRIND_POINTS = 40;

/** Folder the clips are served from. */
export const VOICE_DIR = "/voice";

/** The list of available clip files, relative to `VOICE_DIR`. */
export const VOICE_MANIFEST_FILE = "manifest.json";

/**
 * Translates an engine event into the voice cue it should trigger, if any. This is where the
 * rules about "what counts as a big trick" live.
 * @param event - Any event the engine emits.
 * @returns The cue to say, or null when the event is silent.
 * @example
 * voiceCueFor({ type: "crash", variant: "faceplant" }); // { event: "crash", variant: "faceplant" }
 */
export function voiceCueFor(event: GameEvent): VoiceCue | null {
  switch (event.type) {
    case "runStart":
      return { event: "runStart" };
    case "trickLanded":
      if (event.sketchy) return { event: "sketchy" };
      return { event: event.big || event.multiplier >= BIG_MULTIPLIER ? "bigTrick" : "cleanTrick" };
    case "comboEnded":
      // A sketchy end already got its own line and a crash is voiced by the crash event.
      return event.reason === "expired" && event.multiplier >= BIG_MULTIPLIER ? { event: "bigTrick" } : null;
    case "grindEnded":
      return event.points >= LONG_GRIND_POINTS ? { event: "grind" } : null;
    case "crash":
      return { event: "crash", variant: event.variant };
    case "revive":
      return { event: "revive" };
    case "biomeChanged":
      return { event: "biome", variant: event.biome };
    case "comboChanged":
      return null;
  }
}

/** camelCase to kebab-case, so `runStart` is `run-start` and `treeHang` is `tree-hang` in file names. */
function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Clip-set keys a cue can be voiced from, most specific first. A crash variant falls back to
 * the generic crash lines; a biome has no generic set (each biome announces itself).
 * A key is the file name without the `-<n>.mp3` suffix.
 * @param cue - The cue to resolve.
 * @returns For example `["crash-faceplant", "crash"]` or `["biome-dubai"]`.
 */
export function clipKeysFor(cue: VoiceCue): string[] {
  const base = kebab(cue.event);
  if (!cue.variant) return [base];
  const specific = `${base}-${kebab(cue.variant)}`;
  return cue.event === "biome" ? [specific] : [specific, base];
}

/**
 * Extracts the clip-set key from a file name.
 * @param file - A file name like `crash-faceplant-2.mp3`.
 * @returns The key (`crash-faceplant`), or null when the name does not follow `<key>-<n>.mp3`.
 */
export function clipKeyOfFile(file: string): string | null {
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)-\d+\.mp3$/.exec(file);
  return match ? match[1] : null;
}
