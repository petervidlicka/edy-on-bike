/**
 * Background music: two <audio> slots so a biome change can crossfade from one track
 * to the next, plus mute, pause/resume and ducking (dipping under a voice line).
 * Owned by SoundManager, which exposes it through its own music methods.
 */

/** The suburban track every run starts on. */
const DEFAULT_TRACK = "/music.mp3";

/** Target volume when music is playing (not muted). */
const MUSIC_VOLUME = 0.45;

type Slot = "A" | "B";

/**
 * Starts playback, treating a rejected play() as "not now": browsers reject it when
 * autoplay is blocked (no user gesture yet) or when the element was paused again before
 * play resolved, and in both cases the right response is to stay silent until the next
 * start/unmute/resume call, which goes through playCurrentTrack again.
 */
function safePlay(audio: HTMLAudioElement): void {
  audio.play().catch(() => undefined);
}

/**
 * Dual-slot music player with crossfades and ducking.
 * @example
 * const music = new MusicPlayer();
 * music.start();                 // plays the default track
 * music.crossfadeTo("/dubai.mp3"); // 3 s crossfade on a biome change
 */
export class MusicPlayer {
  private muted = false;
  private playing = false;
  /** True while the game is paused — unmute and biome changes must not start music then. */
  private paused = false;
  private audioA: HTMLAudioElement | null = null;
  private audioB: HTMLAudioElement | null = null;
  private activeSlot: Slot = "A";
  private crossfadeTimer: ReturnType<typeof setInterval> | null = null;
  /** Track being faded out by an in-progress crossfade. */
  private crossfadeFrom: HTMLAudioElement | null = null;
  private currentTrack = DEFAULT_TRACK;
  /** Multiplier on the music volume (1 = normal); dips while a voice line plays. */
  private duckLevel = 1;
  private duckTimer: ReturnType<typeof setInterval> | null = null;

  private getActiveAudio(): HTMLAudioElement | null {
    return this.activeSlot === "A" ? this.audioA : this.audioB;
  }

  /** Music volume right now: the base volume scaled by the current duck. */
  private level(): number {
    return MUSIC_VOLUME * this.duckLevel;
  }

  /**
   * Eases the music volume to `level` times normal, used to make room for voice lines. A
   * crossfade drives the volumes itself and reads the duck on every tick, so while one runs
   * only the duck factor changes here.
   * @param level - 1 for normal volume, below 1 to duck.
   * @param rampMs - Time to reach it; 0 jumps there.
   */
  duck(level: number, rampMs: number): void {
    if (this.duckTimer) {
      clearInterval(this.duckTimer);
      this.duckTimer = null;
    }
    const from = this.duckLevel;
    const startedAt = performance.now();
    const step = () => {
      const t = rampMs <= 0 ? 1 : Math.min((performance.now() - startedAt) / rampMs, 1);
      this.duckLevel = from + (level - from) * t;
      const active = this.getActiveAudio();
      if (active && !this.crossfadeTimer) active.volume = this.level();
      if (t >= 1 && this.duckTimer) {
        clearInterval(this.duckTimer);
        this.duckTimer = null;
      }
    };
    if (rampMs <= 0) {
      step();
      return;
    }
    this.duckTimer = setInterval(step, 30);
  }

  /** The slot's element, replaced if it holds a different track. */
  private ensureAudio(slot: Slot, track: string): HTMLAudioElement {
    const current = slot === "A" ? this.audioA : this.audioB;
    if (current && current.src === new URL(track, location.href).href) return current;
    if (current) {
      current.pause();
      current.src = "";
    }
    const audio = new Audio(track);
    audio.loop = true;
    audio.volume = this.level();
    if (slot === "A") this.audioA = audio;
    else this.audioB = audio;
    return audio;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.audioA) this.audioA.muted = muted;
    if (this.audioB) this.audioB.muted = muted;
    if (!muted && this.playing && !this.paused && !this.crossfadeTimer) {
      this.playCurrentTrack();
    }
  }

  /**
   * Make sure the active slot is playing `currentTrack`. A run that started
   * muted never created its audio, and a biome change while muted or paused
   * only swapped `currentTrack` — so unmute and resume both go through here
   * rather than just un-pausing whatever element the slot holds.
   */
  private playCurrentTrack(): void {
    const audio = this.ensureAudio(this.activeSlot, this.currentTrack);
    audio.muted = false;
    audio.volume = this.level();
    if (audio.paused) safePlay(audio);
  }

  start(): void {
    if (this.playing) return;
    this.playing = true;
    this.paused = false;
    if (this.muted) return;
    const audio = this.ensureAudio(this.activeSlot, this.currentTrack);
    audio.currentTime = 0;
    audio.volume = this.level();
    safePlay(audio);
  }

  stop(): void {
    this.playing = false;
    this.paused = false;
    this.cancelCrossfade();
    this.crossfadeFrom = null;
    for (const audio of [this.audioA, this.audioB]) {
      if (!audio) continue;
      audio.pause();
      audio.currentTime = 0;
    }
  }

  pause(): void {
    this.paused = true;
    // Finish any crossfade now so the outgoing track doesn't keep playing
    // underneath the pause.
    if (this.crossfadeTimer) this.completeCrossfade();
    const active = this.getActiveAudio();
    if (active && !active.paused) {
      active.pause();
    }
  }

  resume(): void {
    this.paused = false;
    if (this.playing && !this.muted) {
      this.playCurrentTrack();
    }
  }

  /**
   * Smoothly crossfade from the current track to a new one.
   * Ramps the active slot volume down while ramping the new slot up.
   */
  crossfadeTo(track: string, durationMs = 3000): void {
    if (!this.playing || this.muted || this.paused) {
      // Not audible — just switch track; start/unmute/resume will play it
      this.currentTrack = track;
      return;
    }

    if (this.crossfadeTimer) this.completeCrossfade();

    const oldSlot = this.activeSlot;
    const newSlot: Slot = oldSlot === "A" ? "B" : "A";
    const oldAudio = this.getActiveAudio();
    const newAudio = this.ensureAudio(newSlot, track);

    newAudio.currentTime = 0;
    newAudio.volume = 0;
    newAudio.muted = this.muted;
    safePlay(newAudio);

    const stepMs = 50;
    const steps = Math.ceil(durationMs / stepMs);
    let step = 0;
    this.crossfadeFrom = oldAudio;

    this.crossfadeTimer = setInterval(() => {
      step++;
      const t = Math.min(step / steps, 1);

      if (oldAudio) {
        oldAudio.volume = this.level() * (1 - t);
      }
      newAudio.volume = this.level() * t;

      if (t >= 1) this.completeCrossfade();
    }, stepMs);

    // Set active slot immediately so pause/resume works on the new track
    this.activeSlot = newSlot;
    this.currentTrack = track;
  }

  /** Stop and revert to the default suburban track. Call on game restart. */
  reset(): void {
    this.stop();
    this.currentTrack = DEFAULT_TRACK;
    this.activeSlot = "A";
  }

  /** Stops everything and releases both elements. */
  destroy(): void {
    if (this.duckTimer) clearInterval(this.duckTimer);
    this.duckTimer = null;
    this.stop();
    for (const audio of [this.audioA, this.audioB]) {
      if (audio) audio.src = "";
    }
    this.audioA = null;
    this.audioB = null;
  }

  /** Jump an in-progress crossfade to its end: new track at full volume, old one stopped. */
  private completeCrossfade(): void {
    this.cancelCrossfade();
    if (this.crossfadeFrom) {
      this.crossfadeFrom.pause();
      this.crossfadeFrom.currentTime = 0;
      this.crossfadeFrom = null;
    }
    const active = this.getActiveAudio();
    if (active) active.volume = this.level();
  }

  private cancelCrossfade(): void {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
  }
}
