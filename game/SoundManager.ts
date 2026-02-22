export class SoundManager {
  // AudioContext is created lazily on first play to satisfy browser autoplay policy
  private ctx: AudioContext | null = null;
  private musicMuted = false;
  private sfxMuted = false;
  private musicPlaying = false;

  // Dual-slot music system for crossfading between biome tracks
  private musicAudioA: HTMLAudioElement | null = null;
  private musicAudioB: HTMLAudioElement | null = null;
  private activeSlot: "A" | "B" = "A";
  private crossfadeTimer: ReturnType<typeof setInterval> | null = null;
  private currentTrack = "/music.mp3";
  /** Target volume when music is playing (not muted). */
  private readonly MUSIC_VOLUME = 0.45;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private getActiveAudio(): HTMLAudioElement | null {
    return this.activeSlot === "A" ? this.musicAudioA : this.musicAudioB;
  }

  private ensureMusicAudio(slot: "A" | "B", track: string): HTMLAudioElement {
    if (slot === "A") {
      if (!this.musicAudioA || this.musicAudioA.src !== new URL(track, location.href).href) {
        if (this.musicAudioA) {
          this.musicAudioA.pause();
          this.musicAudioA.src = "";
        }
        this.musicAudioA = new Audio(track);
        this.musicAudioA.loop = true;
        this.musicAudioA.volume = this.MUSIC_VOLUME;
      }
      return this.musicAudioA;
    } else {
      if (!this.musicAudioB || this.musicAudioB.src !== new URL(track, location.href).href) {
        if (this.musicAudioB) {
          this.musicAudioB.pause();
          this.musicAudioB.src = "";
        }
        this.musicAudioB = new Audio(track);
        this.musicAudioB.loop = true;
        this.musicAudioB.volume = this.MUSIC_VOLUME;
      }
      return this.musicAudioB;
    }
  }

  setMusicMuted(muted: boolean): void {
    this.musicMuted = muted;
    if (this.musicAudioA) this.musicAudioA.muted = muted;
    if (this.musicAudioB) this.musicAudioB.muted = muted;
  }

  setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted;
  }

  // isDouble = true for the second (in-air) jump — higher pitch
  playJump(isDouble = false): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Sine wave with a fast upward sweep — clean and punchy, not muffled
    osc.type = "sine";
    const freqFrom = isDouble ? 500 : 350;
    const freqTo = isDouble ? 950 : 720;
    osc.frequency.setValueAtTime(freqFrom, now);
    osc.frequency.exponentialRampToValueAtTime(freqTo, now + 0.06);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playCrash(): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    // Low-pass filtered noise — removes the hiss, keeps the dull scrape/rumble
    const bufferSize = Math.ceil(ctx.sampleRate * 0.45);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 350;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Heavy impact thud — body hitting ground
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = "sine";
    thud.frequency.setValueAtTime(110, now);
    thud.frequency.exponentialRampToValueAtTime(28, now + 0.25);
    thudGain.gain.setValueAtTime(0.7, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.3);

    // Secondary low resonance — metal/frame impact
    const clang = ctx.createOscillator();
    const clangGain = ctx.createGain();
    clang.type = "triangle";
    clang.frequency.setValueAtTime(52, now + 0.03);
    clang.frequency.exponentialRampToValueAtTime(26, now + 0.22);
    clangGain.gain.setValueAtTime(0.35, now + 0.03);
    clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    clang.connect(clangGain);
    clangGain.connect(ctx.destination);
    clang.start(now + 0.03);
    clang.stop(now + 0.28);
  }

  startMusic(): void {
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    if (this.musicMuted) return;
    const audio = this.ensureMusicAudio(this.activeSlot, this.currentTrack);
    audio.currentTime = 0;
    audio.volume = this.MUSIC_VOLUME;
    audio.play().catch(() => {});
  }

  stopMusic(): void {
    this.musicPlaying = false;
    this.cancelCrossfade();
    if (this.musicAudioA) {
      this.musicAudioA.pause();
      this.musicAudioA.currentTime = 0;
    }
    if (this.musicAudioB) {
      this.musicAudioB.pause();
      this.musicAudioB.currentTime = 0;
    }
  }

  pauseMusic(): void {
    const active = this.getActiveAudio();
    if (active && !active.paused) {
      active.pause();
    }
  }

  resumeMusic(): void {
    if (this.musicPlaying && !this.musicMuted) {
      const active = this.getActiveAudio();
      if (active && active.paused) {
        active.play().catch(() => {});
      }
    }
  }

  /**
   * Smoothly crossfade from the current music track to a new one.
   * Ramps the active slot volume down while ramping the new slot up.
   */
  crossfadeTo(track: string, durationMs = 3000): void {
    if (!this.musicPlaying || this.musicMuted) {
      // Not playing — just switch track for next startMusic()
      this.currentTrack = track;
      return;
    }

    this.cancelCrossfade();

    const oldSlot = this.activeSlot;
    const newSlot = oldSlot === "A" ? "B" : "A";
    const oldAudio = this.getActiveAudio();
    const newAudio = this.ensureMusicAudio(newSlot, track);

    newAudio.currentTime = 0;
    newAudio.volume = 0;
    newAudio.muted = this.musicMuted;
    newAudio.play().catch(() => {});

    const stepMs = 50;
    const steps = Math.ceil(durationMs / stepMs);
    let step = 0;

    this.crossfadeTimer = setInterval(() => {
      step++;
      const t = Math.min(step / steps, 1);

      if (oldAudio) {
        oldAudio.volume = this.MUSIC_VOLUME * (1 - t);
      }
      newAudio.volume = this.MUSIC_VOLUME * t;

      if (t >= 1) {
        this.cancelCrossfade();
        if (oldAudio) {
          oldAudio.pause();
          oldAudio.currentTime = 0;
        }
        this.activeSlot = newSlot;
        this.currentTrack = track;
      }
    }, stepMs);

    // Set active slot immediately so pause/resume works on the new track
    this.activeSlot = newSlot;
    this.currentTrack = track;
  }

  playBackflipSuccess(): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    // Ascending 3-note arpeggio
    const notes = [523.25, 659.25, 880.00]; // C5, E5, A5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.06;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  destroy(): void {
    this.stopMusic();
    if (this.musicAudioA) {
      this.musicAudioA.src = "";
      this.musicAudioA = null;
    }
    if (this.musicAudioB) {
      this.musicAudioB.src = "";
      this.musicAudioB = null;
    }
    this.ctx?.close();
    this.ctx = null;
  }

  private cancelCrossfade(): void {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
  }
}
