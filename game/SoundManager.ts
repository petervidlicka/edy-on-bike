/**
 * All game audio: synthesised sound effects (jumps, crashes, siren, grind, jingles) on
 * a lazily created AudioContext, the background music (see MusicPlayer) and Edy's voice
 * lines (see VoiceManager). Everything respects the SFX and music mutes.
 */
import {
  COMBO_PITCH_MAX_STEPS,
  COMBO_PITCH_SEMITONES_PER_LINK,
  GRIND_SOUND_FREQ_HZ,
  GRIND_SOUND_GAIN,
  GRIND_SOUND_Q,
} from "./constants";
import type { CrashVariantId } from "./crashes/types";
import { VoiceManager } from "./VoiceManager";
import { MusicPlayer } from "./MusicPlayer";

/** One synthesised note: an oscillator through a gain envelope that fades out over `length`. */
interface Tone {
  type: OscillatorType;
  /** Frequency in Hz. */
  freq: number;
  /** Start time on the context clock. */
  at: number;
  /** Seconds from the start to silence. */
  length: number;
  /** Peak gain. */
  level: number;
}

/**
 * Plays one note: osc → gain → `out`, with the gain falling exponentially to silence at
 * `at + length`. Every jingle is a table of these.
 */
function tone(ctx: AudioContext, out: AudioNode, { type, freq, at, length, level }: Tone): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(level, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + length);
  osc.connect(gain);
  gain.connect(out);
  osc.start(at);
  osc.stop(at + length);
}

// --- Jingles as note tables (Hz) ---

/** Trick-landed arpeggio: C5 E5 A5. */
const COMBO_STEP_NOTES = [523.25, 659.25, 880.0];
/** Cash-in chord: C5 E5 G5, plus C6 at high multipliers. */
const CASH_IN_CHORD = [523.25, 659.25, 783.99];
const CASH_IN_CHORD_BIG = [...CASH_IN_CHORD, 1046.5];
/** Cash-in coin shimmer: B6 then E7. */
const CASH_IN_SHIMMER = [1975.53, 2637.02];
/** Revive arpeggio: C5 E5 G5 C6. */
const REVIVE_NOTES = [523.25, 659.25, 783.99, 1046.5];
/** Unlock chime: G5 C6 E6. */
const UNLOCK_NOTES = [783.99, 1046.5, 1318.51];
/** Car-bonk rebounds: when each lands (s after the knock) and how its pitch springs up. */
const BOINGS = [
  { at: 0.4, from: 190, to: 640, rise: 0.34, level: 0.42 },
  { at: 1.02, from: 230, to: 560, rise: 0.22, level: 0.3 },
  { at: 1.4, from: 280, to: 480, rise: 0.12, level: 0.2 },
];

export class SoundManager {
  // AudioContext is created lazily on first play to satisfy browser autoplay policy
  private ctx: AudioContext | null = null;
  private sfxMuted = false;
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
  /**
   * White-noise buffers by length in seconds, built once each: refilling up to a second
   * of random samples on the crash frame (or on every grind) stalls the frame.
   */
  private noiseBuffers = new Map<number, AudioBuffer>();
  /** Output of the crash sound that is playing, so it can be cut short (see stopCrashSounds). */
  private crashBus: GainNode | null = null;

  /** Background music with crossfades and ducking. */
  private readonly music = new MusicPlayer();

  /** Edy's voice lines. Shares this manager's AudioContext, SFX mute and music ducking. */
  readonly voice = new VoiceManager({
    getContext: () => this.getCtx(),
    isMuted: () => this.sfxMuted,
    duckMusic: (level, rampMs) => this.music.duck(level, rampMs),
  });

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMusicMuted(muted: boolean): void {
    this.music.setMuted(muted);
  }

  setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted;
    // A looping sound would otherwise keep scraping after the player muted effects
    if (muted) {
      this.stopGrind();
      this.stopCrashSounds();
      this.voice.stop();
    }
  }

  // isDouble = true for the second (in-air) jump — higher pitch
  playJump(isDouble = false): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    // Sine wave with a fast upward sweep — clean and punchy, not muffled
    const freqFrom = isDouble ? 500 : 350;
    const freqTo = isDouble ? 950 : 720;
    this.sweep(ctx, ctx.destination, "sine", freqFrom, freqTo, now, 0.09, 0.28, 0.06);
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
    out.connect(ctx.destination);
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

  /** A buffer of white noise, `seconds` long, built once per length and reused. */
  private noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    let buffer = this.noiseBuffers.get(seconds);
    if (buffer) return buffer;
    const size = Math.ceil(ctx.sampleRate * seconds);
    buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffers.set(seconds, buffer);
    return buffer;
  }

  /**
   * One blip that slides in pitch while it fades, the building block of the thumps.
   * @param slide - Seconds the pitch takes to reach `to`; the whole `length` if omitted.
   */
  private sweep(ctx: AudioContext, out: AudioNode, type: OscillatorType, from: number, to: number, at: number, length: number, level: number, slide = length): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + slide);
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
    for (const b of BOINGS) {
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

    // Heavy impact thud — body hitting ground (pitch bottoms out before the fade ends)
    this.sweep(ctx, out, "sine", 110, 28, now, 0.3, 0.7, 0.25);
    // Secondary low resonance — metal/frame impact
    this.sweep(ctx, out, "triangle", 52, 26, now + 0.03, 0.25, 0.35, 0.19);
  }

  startMusic(): void {
    this.music.start();
  }

  stopMusic(): void {
    this.music.stop();
  }

  pauseMusic(): void {
    this.music.pause();
  }

  resumeMusic(): void {
    this.music.resume();
  }

  /**
   * Smoothly crossfade from the current music track to a new one.
   * Ramps the active slot volume down while ramping the new slot up.
   */
  crossfadeTo(track: string, durationMs = 3000): void {
    this.music.crossfadeTo(track, durationMs);
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
    for (let i = 0; i < COMBO_STEP_NOTES.length; i++) {
      tone(ctx, ctx.destination, { type: "sine", freq: COMBO_STEP_NOTES[i] * transpose, at: now + i * 0.06, length: 0.12, level: 0.22 });
    }
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

    // The chord, struck together
    for (const freq of big ? CASH_IN_CHORD_BIG : CASH_IN_CHORD) {
      tone(ctx, ctx.destination, { type: "triangle", freq, at: now, length: 0.5, level });
    }
    // Coin shimmer: two quick bright blips
    for (let i = 0; i < CASH_IN_SHIMMER.length; i++) {
      tone(ctx, ctx.destination, { type: "square", freq: CASH_IN_SHIMMER[i], at: now + 0.07 + i * 0.07, length: 0.25, level: big ? 0.08 : 0.05 });
    }
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
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(ctx, 1);
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

  /** Revive: an ascending major arpeggio with a high sparkle on the end. */
  playRevive(): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    for (let i = 0; i < REVIVE_NOTES.length; i++) {
      tone(ctx, ctx.destination, { type: "sine", freq: REVIVE_NOTES[i], at: now + i * 0.08, length: 0.25, level: 0.25 });
    }
    // Shimmer — high frequency sparkle rising out of the last note
    this.sweep(ctx, ctx.destination, "sine", 2093, 3000, now + 0.32, 0.28, 0.1);
  }

  /** Bright rising triad for an in-run bike unlock. */
  playUnlock(): void {
    if (this.sfxMuted) return;
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    for (let i = 0; i < UNLOCK_NOTES.length; i++) {
      tone(ctx, ctx.destination, { type: "triangle", freq: UNLOCK_NOTES[i], at: now + i * 0.09, length: 0.35, level: 0.22 });
    }
  }

  destroy(): void {
    this.voice.destroy();
    this.stopSiren();
    this.stopGrind();
    this.stopCrashSounds();
    this.music.destroy();
    this.noiseBuffers.clear();
    this.ctx?.close();
    this.ctx = null;
  }

  /** Full reset: stop music and revert to the default suburban track. Call on game restart. */
  reset(): void {
    this.voice.stop();
    this.stopGrind();
    this.stopCrashSounds();
    this.music.reset();
  }
}
