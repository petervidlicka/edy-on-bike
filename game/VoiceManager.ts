/**
 * Plays Edy's voice lines. Owned by `SoundManager`, which lends it the shared AudioContext
 * (created on the first user gesture) and the SFX mute, and ducks the music while a line plays.
 *
 * Clips are optional: with none installed `say` simply does nothing, and lines light up as
 * files are added to `public/voice/` (see `voiceLines.ts` and `public/voice/README.md`).
 */
import {
  VOICE_DIR,
  VOICE_EVENTS,
  VOICE_MANIFEST_FILE,
  clipKeyOfFile,
  clipKeysFor,
  type VoiceEvent,
} from "./voiceLines";

/** What the voice needs from its owner, kept as an interface so it stays decoupled from SoundManager. */
export interface VoiceHost {
  /** The shared AudioContext, created and resumed on demand. */
  getContext(): AudioContext;
  /** True while sound effects are muted; voice follows the SFX mute. */
  isMuted(): boolean;
  /** Scales the music volume to `level` (1 = normal) over `rampMs`. */
  duckMusic(level: number, rampMs: number): void;
}

/** Optional detail for `VoiceManager.say`. */
export interface SayOptions {
  /** Picks a more specific clip set: a crash variant id, or a biome id. */
  variant?: string;
}

/** Minimum time between two lines starting, unless the new one outranks the last. */
const GLOBAL_COOLDOWN_MS = 1800;
/** Music level while Edy speaks, how fast it drops, and how long it takes to come back. */
const DUCK_LEVEL = 0.5;
const DUCK_IN_MS = 80;
const DUCK_RELEASE_MS = 300;
/** Playback-rate spread around 1 (±5 %) so repeats sound less canned. */
const RATE_JITTER = 0.05;

interface Playing {
  source: AudioBufferSourceNode;
  priority: number;
}

/** Shape of public/voice/manifest.json. */
function isManifest(value: unknown): value is { files: string[] } {
  if (typeof value !== "object" || value === null || !("files" in value)) return false;
  const { files } = value;
  return Array.isArray(files) && files.every((f) => typeof f === "string");
}

export class VoiceManager {
  /** Decoded clips by clip-set key (`crash`, `crash-faceplant`, `biome-dubai`, ...). */
  private clips = new Map<string, AudioBuffer[]>();
  /** Index of the clip played last per key, so a line is never repeated back to back. */
  private lastIndex = new Map<string, number>();
  private preloadStarted = false;
  private destroyed = false;
  private playing: Playing | null = null;
  private lastStartMs = -Infinity;
  private lastPriority = 0;

  /**
   * @param host - Shared audio context, mute state and music ducking.
   * @param random - Randomness source; injectable so the rules can be tested deterministically.
   */
  constructor(
    private readonly host: VoiceHost,
    private readonly random: () => number = Math.random,
  ) {}

  /**
   * Starts loading every clip listed in the manifest. Call on the first user gesture (run start);
   * it returns immediately, runs only once, and lines whose clips are not decoded yet are skipped.
   * Missing or broken clips are reported in one `console.info` summary, never as per-file errors.
   */
  preload(): void {
    if (this.preloadStarted || this.destroyed) return;
    this.preloadStarted = true;
    void this.loadClips();
  }

  private async loadClips(): Promise<void> {
    let files: string[];
    try {
      const response = await fetch(`${VOICE_DIR}/${VOICE_MANIFEST_FILE}`);
      // No manifest simply means no voice clips yet
      if (!response.ok) return;
      const manifest: unknown = await response.json();
      if (!isManifest(manifest)) {
        console.info("[voice] manifest.json has no valid \"files\" list; voice lines are off");
        return;
      }
      files = manifest.files;
    } catch {
      // Offline or an unreadable manifest: allow another attempt on the next run
      this.preloadStarted = false;
      return;
    }
    if (files.length === 0) return;

    const ctx = this.host.getContext();
    const skipped: string[] = [];
    await Promise.all(
      files.map(async (file) => {
        const key = clipKeyOfFile(file);
        if (!key) {
          skipped.push(file);
          return;
        }
        try {
          const response = await fetch(`${VOICE_DIR}/${file}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
          if (this.destroyed) return;
          this.clips.set(key, [...(this.clips.get(key) ?? []), buffer]);
        } catch {
          skipped.push(file);
        }
      }),
    );
    if (this.destroyed) return;
    const loaded = files.length - skipped.length;
    const note = skipped.length > 0 ? ` (skipped: ${skipped.join(", ")})` : "";
    console.info(`[voice] loaded ${loaded}/${files.length} clips${note}`);
  }

  /**
   * Says a line for `event`, if the rules allow: SFX not muted, a clip is loaded, nothing of equal
   * or higher priority is playing, the global cooldown has passed (or this line outranks the last
   * one) and the event's chance roll succeeds. Never repeats the previous clip of the same set.
   * @param event - What happened.
   * @param options - Optional variant (crash type or biome) for a more specific line.
   * @returns True when a line started playing.
   * @example
   * voice.say("crash", { variant: "faceplant" });
   */
  say(event: VoiceEvent, options: SayOptions = {}): boolean {
    if (this.destroyed || this.host.isMuted()) return false;
    const key = clipKeysFor({ event, variant: options.variant }).find((k) => (this.clips.get(k)?.length ?? 0) > 0);
    if (!key) return false;
    const buffers = this.clips.get(key);
    if (!buffers) return false;

    const { chance, priority } = VOICE_EVENTS[event];
    const now = performance.now();
    if (this.playing) {
      if (priority <= this.playing.priority) return false;
    } else if (now - this.lastStartMs < GLOBAL_COOLDOWN_MS && priority <= this.lastPriority) {
      return false;
    }
    // Roll last, so a failed roll costs neither the cooldown nor a repeat-guard slot
    if (this.random() >= chance) return false;

    let index = Math.floor(this.random() * buffers.length);
    const previous = this.lastIndex.get(key);
    if (buffers.length > 1 && index === previous) index = (index + 1) % buffers.length;
    this.lastIndex.set(key, index);

    // The interrupted line hands over to this one without letting the music swell in between
    this.stopSource(false);
    this.play(buffers[index], priority);
    this.lastStartMs = now;
    this.lastPriority = priority;
    return true;
  }

  private play(buffer: AudioBuffer, priority: number): void {
    const ctx = this.host.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (this.random() * 2 - 1) * RATE_JITTER;
    source.connect(ctx.destination);
    source.onended = () => {
      source.disconnect();
      if (this.playing?.source !== source) return;
      this.playing = null;
      this.host.duckMusic(1, DUCK_RELEASE_MS);
    };
    this.playing = { source, priority };
    this.host.duckMusic(DUCK_LEVEL, DUCK_IN_MS);
    source.start();
  }

  /**
   * Cuts off the line that is playing, if any, and brings the music back. Used on pause,
   * restart and SFX mute so Edy never keeps talking over a frozen or fresh game.
   */
  stop(): void {
    this.stopSource(true);
  }

  private stopSource(releaseDuck: boolean): void {
    const current = this.playing;
    if (!current) return;
    this.playing = null;
    current.source.onended = null;
    current.source.stop();
    current.source.disconnect();
    if (releaseDuck) this.host.duckMusic(1, DUCK_RELEASE_MS);
  }

  /** Stops playback for good and drops the decoded clips; a late preload result is discarded. */
  destroy(): void {
    this.destroyed = true;
    this.stopSource(false);
    this.clips.clear();
  }
}
