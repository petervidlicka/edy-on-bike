import {
  COMBO_PITCH_MAX_STEPS,
  COMBO_PITCH_SEMITONES_PER_LINK,
  GRIND_SOUND_FREQ_HZ,
  GRIND_SOUND_GAIN,
  GRIND_SOUND_Q,
} from "./constants";
import type { CrashVariantId } from "./crashes/types";

export class SoundManager {
  // AudioContext is created lazily on first play to satisfy browser autoplay policy
  private ctx: AudioContext | null = null;
  private musicMuted = false;
  private sfxMuted = false;
  private musicPlaying = false;
  /** True while the game is paused — unmute and biome changes must not start music then. */
  private musicPaused = false;
  // Siren nodes for ambulance: two detuned tones whose pitch is stepped by one
  // ConstantSourceNode, rescheduled ahead of time by sirenScheduler.
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenStep: ConstantSourceNode | null = null;
  private sirenGain1: GainNode | null = null;
  private sirenGain2: GainNode | null = null;
  private sirenScheduler: ReturnType<typeof setInterval> | null = null;

  // Grind scrape: looping band-passed noise that runs while the rider rides an obstacle.
  private grindSource: AudioBufferSourceNode | null = null;
  private grindGain: GainNode | null = null;
  /** The scrape's noise, built once: refilling a second of samples on every grind stalls the frame. */
  private grindNoise: AudioBuffer | null = null;
  /** Output of the crash sound that is playing, so it can be cut short (see stopCrashSounds). */
  private crashBus: GainNode | null = null;

  // Dual-slot music system for crossfading between biome tracks
  private musicAudioA: HTMLAudioElement | null = null;
  private musicAudioB: HTMLAudioElement | null = null;
  private activeSlot: "A" | "B" = "A";
  private crossfadeTimer: ReturnType<typeof setInterval> | null = null;
  /** Track being faded out by an in-progress crossfade. */
  private crossfadeFrom: HTMLAudioElement | null = null;
  private currentTrack = "/music.mp3";
  /** Target volume when music is playing (not muted). */
  private readonly MUSIC_VOLUME = 0.45;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
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
    if (!muted && this.musicPlaying && !this.musicPaused && !this.crossfadeTimer) {
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
    const audio = this.ensureMusicAudio(this.activeSlot, this.currentTrack);
    audio.muted = false;
    audio.volume = this.MUSIC_VOLUME;
    if (audio.paused) audio.play().catch(() => {});
  }

  setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted;
    // A looping sound would otherwise keep scraping after the player muted effects
    if (muted) {
      this.stopGrind();
      this.stopCrashSounds();
    }
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

  /**
   * The crash sound for a variant: the classic thud for the plain tumble, a wet splat for
   * the faceplant, a wooden bonk plus rustling leaves for the tree, and springy boings
   * timed to the bounces on the car roof. All respect the SFX mute.
   * @param variant - The crash animation that is about to play.
   */
  playCrash(variant: CrashVariantId = "classic"): void {
    if (this.sfxMuted) return;
    this.stopCrashSounds();
    const ctx = this.getCtx();
    // Everything goes through one bus so a skipped, paused or restarted crash can be silenced,
    // including the boings and rustles scheduled up to 1.5 s ahead
    const out = ctx.createGain();
    out.connect(out);
    this.crashBus = out;
    switch (variant) {
      case "faceplant": this.playSplat(out); break;
      case "treeHang": this.playBonk(out); break;
      case "carBonk": this.playBoing(out); break;
      case "classic": this.playClassicCrash(out); break;
    }
  }

  /** Quickly fades out whatever the current crash still has playing or scheduled; a no-op otherwise. */
  stopCrashSounds(): void {
    const bus = this.crashBus;
    if (!bus || !this.ctx) return;
    this.crashBus = null;
    // A short fade rather than a hard cut, so it doesn't click; the scheduled nodes end silently
    bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.015);
  }

  /** A buffer of white noise, `seconds` long. */
  private noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const size = Math.ceil(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** One sine blip that falls (or rises) in pitch while it fades, the building block of the thumps. */
  private sweep(ctx: AudioContext, out: AudioNode, type: OscillatorType, from: number, to: number, at: number, length: number, level: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + length);
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + length);
    osc.connect(gain);
    gain.connect(out);
    osc.start(at);
    osc.stop(at + length);
  }

  /** Faceplant: a dull wet smack of band-passed noise, a body thump and a short squelch. */
  private playSplat(out: AudioNode): void {
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(ctx, 0.25);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(band);
    band.connect(noiseGain);
    noiseGain.connect(out);
    noise.start(now);

    this.sweep(ctx, out, "sine", 170, 45, now, 0.22, 0.65);
    // Squelch: a low saw sliding down through a muffling filter
    const squelch = ctx.createOscillator();
    const squelchFilter = ctx.createBiquadFilter();
    const squelchGain = ctx.createGain();
    squelch.type = "sawtooth";
    squelch.frequency.setValueAtTime(260, now + 0.04);
    squelch.frequency.exponentialRampToValueAtTime(95, now + 0.26);
    squelchFilter.type = "lowpass";
    squelchFilter.frequency.value = 700;
    squelchGain.gain.setValueAtTime(0.22, now + 0.04);
    squelchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    squelch.connect(squelchFilter);
    squelchFilter.connect(squelchGain);
    squelchGain.connect(out);
    squelch.start(now + 0.04);
    squelch.stop(now + 0.26);
  }

  /** Tree hang: a hollow wooden bonk, then a short rustle of leaves shaken loose. */
  private playBonk(out: AudioNode): void {
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    this.sweep(ctx, out, "sine", 300, 140, now, 0.18, 0.65);
    this.sweep(ctx, out, "triangle", 640, 330, now, 0.1, 0.25);

    // Leaves: bright noise whose level flutters in quick random steps and dies away
    const leaves = ctx.createBufferSource();
    leaves.buffer = this.noiseBuffer(ctx, 0.8);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 4800;
    band.Q.value = 0.7;
    const gain = ctx.createGain();
    const rustleStart = now + 0.1;
    gain.gain.setValueAtTime(0.001, now);
    for (let i = 0; i < 16; i++) {
      const fade = 1 - i / 16;
      gain.gain.setValueAtTime((0.03 + Math.random() * 0.09) * fade + 0.002, rustleStart + i * 0.04);
    }
    gain.gain.setValueAtTime(0.001, rustleStart + 0.68);
    leaves.connect(band);
    band.connect(gain);
    gain.connect(out);
    leaves.start(now);
  }

  /** Car bonk: a dull knock on the car, then rising springy boings as the rider lands and rebounds. */
  private playBoing(out: AudioNode): void {
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    this.sweep(ctx, out, "sine", 130, 55, now, 0.14, 0.6);
    // Landings on the roof come at 0.42, 1.04 and 1.42 s (see carBonk.ts); each rebound is a rising sweep
    const boings = [
      { at: 0.4, from: 190, to: 640, rise: 0.34, level: 0.42 },
      { at: 1.02, from: 230, to: 560, rise: 0.22, level: 0.3 },
      { at: 1.4, from: 280, to: 480, rise: 0.12, level: 0.2 },
    ];
    for (const b of boings) {
      const t = now + b.at;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Wobble the pitch with a fast vibrato so it twangs like a spring
      const vibrato = ctx.createOscillator();
      const vibratoDepth = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(b.from, t);
      osc.frequency.exponentialRampToValueAtTime(b.to, t + b.rise);
      vibrato.frequency.value = 26;
      vibratoDepth.gain.setValueAtTime(b.from * 0.1, t);
      vibratoDepth.gain.linearRampToValueAtTime(b.to * 0.04, t + b.rise);
      vibrato.connect(vibratoDepth);
      vibratoDepth.connect(osc.frequency);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(b.level, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + b.rise + 0.18);
      osc.connect(gain);
      gain.connect(out);
      osc.start(t);
      vibrato.start(t);
      osc.stop(t + b.rise + 0.2);
      vibrato.stop(t + b.rise + 0.2);
    }
  }

  private playClassicCrash(out: AudioNode): void {
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    // Low-pass filtered noise — removes the hiss, keeps the dull scrape/rumble
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(ctx, 0.45);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 350;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(out);
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
    thudGain.connect(out);
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
    clangGain.connect(out);
    clang.start(now + 0.03);
    clang.stop(now + 0.28);
  }

  startMusic(): void {
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicPaused = false;
    if (this.musicMuted) return;
    const audio = this.ensureMusicAudio(this.activeSlot, this.currentTrack);
    audio.currentTime = 0;
    audio.volume = this.MUSIC_VOLUME;
    audio.play().catch(() => {});
  }

  stopMusic(): void {
    this.musicPlaying = false;
    this.musicPaused = false;
    this.cancelCrossfade();
    this.crossfadeFrom = null;
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
    this.musicPaused = true;
    // Finish any crossfade now so the outgoing track doesn't keep playing
    // underneath the pause.
    if (this.crossfadeTimer) this.completeCrossfade();
    const active = this.getActiveAudio();
    if (active && !active.paused) {
      active.pause();
    }
  }

  resumeMusic(): void {
    this.musicPaused = false;
    if (this.musicPlaying && !this.musicMuted) {
      this.playCurrentTrack();
    }
  }

  /**
   * Smoothly crossfade from the current music track to a new one.
   * Ramps the active slot volume down while ramping the new slot up.
   */
  crossfadeTo(track: string, durationMs = 3000): void {
    if (!this.musicPlaying || this.musicMuted || this.musicPaused) {
      // Not audible — just switch track; startMusic/unmute/resume will play it
      this.currentTrack = track;
      return;
    }

    if (this.crossfadeTimer) this.completeCrossfade();

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
    this.crossfadeFrom = oldAudio;

    this.crossfadeTimer = setInterval(() => {
      step++;
      const t = Math.min(step / steps, 1);

      if (oldAudio) {
        oldAudio.volume = this.MUSIC_VOLUME * (1 - t);
      }
      newAudio.volume = this.MUSIC_VOLUME * t;

      if (t >= 1) this.completeCrossfade();
    }, stepMs);

    // Set active slot immediately so pause/resume works on the new track
    this.activeSlot = newSlot;
    this.currentTrack = track;
  }

  /**
   * Trick-landed arpeggio. The first link of a chain plays the plain C5-E5-A5; every
   * further link transposes it up, so the rising pitch tells the player the chain is growing.
   * @param links - Position of this landing in the chain (1 = first).
   */
  playComboStep(links = 1): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    const steps = Math.min(Math.max(0, links - 1), COMBO_PITCH_MAX_STEPS);
    const transpose = 2 ** ((steps * COMBO_PITCH_SEMITONES_PER_LINK) / 12);
    // Ascending 3-note arpeggio
    const notes = [523.25, 659.25, 880.00]; // C5, E5, A5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq * transpose;
      const t = now + i * 0.06;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  /**
   * "Cash-in" when a chain of 2+ links ends: a major chord with a coin-like shimmer,
   * fuller (extra octave note, brighter shimmer, a bit louder) at higher multipliers.
   * @param multiplier - The chain's final multiplier.
   */
  playComboCashIn(multiplier: number): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    const big = multiplier >= 3;
    const level = 0.16 + Math.min(multiplier, 4) * 0.025;

    // C major chord (C5 E5 G5, plus C6 when big), struck together
    const chord = big ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
    for (const freq of chord) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(level, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    }

    // Coin shimmer: two quick bright blips (B6 then E7)
    [1975.53, 2637.02].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const t = now + 0.07 + i * 0.07;
      gain.gain.setValueAtTime(big ? 0.08 : 0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  playSiren(): void {
    if (this.sfxMuted) return;
    // Never stack two sirens (e.g. resume after a pause that didn't stop it)
    this.stopSiren();
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    // Two-tone wee-woo siren — alternating 600/800 Hz every 0.3s. A
    // ConstantSourceNode adds 0 or +200 Hz to both oscillators' frequency.
    // Stepping it with setValueAtTime gives clean jumps (a square-wave LFO is
    // band-limited and overshoots/rings at each edge, which sounds chirpy).
    const step = ctx.createConstantSource();
    step.offset.value = 0;

    // Levels are set via .value (not automation) so stopSiren can read them
    // back reliably as the start of its fade.
    const gain1 = ctx.createGain();
    gain1.gain.value = 0.18;
    gain1.connect(ctx.destination);
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 600;
    step.connect(osc1.frequency);
    osc1.connect(gain1);

    // Slight detuned second oscillator for richness
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.08;
    gain2.connect(ctx.destination);
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 603;
    step.connect(osc2.frequency);
    osc2.connect(gain2);

    // Keep the tone switches scheduled ~1s ahead so timer jitter never shows
    const SWITCH_S = 0.3;
    const LOOKAHEAD_S = 1;
    let nextSwitch = now;
    let high = false;
    const scheduleSwitches = () => {
      while (nextSwitch < ctx.currentTime + LOOKAHEAD_S) {
        step.offset.setValueAtTime(high ? 200 : 0, nextSwitch);
        high = !high;
        nextSwitch += SWITCH_S;
      }
    };
    scheduleSwitches();
    this.sirenScheduler = setInterval(scheduleSwitches, (LOOKAHEAD_S * 1000) / 2);

    step.start(now);
    osc1.start(now);
    osc2.start(now);
    this.sirenStep = step;
    this.sirenOsc1 = osc1;
    this.sirenOsc2 = osc2;
    this.sirenGain1 = gain1;
    this.sirenGain2 = gain2;
  }

  stopSiren(): void {
    if (this.sirenScheduler) {
      clearInterval(this.sirenScheduler);
      this.sirenScheduler = null;
    }
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fade both voices before stopping so the siren doesn't end with a click
    for (const gain of [this.sirenGain1, this.sirenGain2]) {
      if (!gain) continue;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
    }
    for (const node of [this.sirenOsc1, this.sirenOsc2, this.sirenStep]) {
      node?.stop(now + 0.2);
    }
    this.sirenOsc1 = null;
    this.sirenOsc2 = null;
    this.sirenStep = null;
    this.sirenGain1 = null;
    this.sirenGain2 = null;
  }

  /**
   * Starts the looping grind scrape: band-passed white noise (a metallic hiss around
   * 3 kHz) at low gain. Safe to call repeatedly; a running scrape is replaced, never stacked.
   */
  startGrind(): void {
    if (this.sfxMuted) return;
    this.stopGrind();
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    // One second of noise is enough to loop without an audible repeat once filtered
    if (!this.grindNoise) {
      const bufferSize = ctx.sampleRate;
      this.grindNoise = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = this.grindNoise.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = this.grindNoise;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = GRIND_SOUND_FREQ_HZ;
    filter.Q.value = GRIND_SOUND_Q;

    // Short fade-in so the scrape doesn't click on
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(GRIND_SOUND_GAIN, now + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    this.grindSource = source;
    this.grindGain = gain;
  }

  /** Fades the grind scrape out and releases its nodes; a no-op when none is playing. */
  stopGrind(): void {
    const ctx = this.ctx;
    if (ctx && this.grindSource && this.grindGain) {
      const now = ctx.currentTime;
      // Fade before stopping so the scrape doesn't end with a click
      this.grindGain.gain.cancelScheduledValues(now);
      this.grindGain.gain.setValueAtTime(this.grindGain.gain.value, now);
      this.grindGain.gain.linearRampToValueAtTime(0, now + 0.08);
      this.grindSource.stop(now + 0.1);
    }
    this.grindSource = null;
    this.grindGain = null;
  }

  playRevive(): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;

    // Ascending major chord arpeggio: C5 → E5 → G5 → C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    });

    // Shimmer — high frequency sparkle
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(2093, now + 0.32);
    shimmer.frequency.exponentialRampToValueAtTime(3000, now + 0.6);
    shimmerGain.gain.setValueAtTime(0.1, now + 0.32);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.start(now + 0.32);
    shimmer.stop(now + 0.6);
  }

  /** Bright two-note chime for an in-run bike unlock. */
  playUnlock(): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    // G5 → C6 → E6 quick rising triad
    [783.99, 1046.5, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = now + i * 0.09;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  destroy(): void {
    this.stopSiren();
    this.stopGrind();
    this.stopCrashSounds();
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

  /** Full reset: stop music and revert to the default suburban track. Call on game restart. */
  reset(): void {
    this.stopGrind();
    this.stopCrashSounds();
    this.stopMusic();
    this.currentTrack = "/music.mp3";
    this.activeSlot = "A";
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
    if (active) active.volume = this.MUSIC_VOLUME;
  }

  private cancelCrossfade(): void {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
  }
}
