// Melody: [frequency_hz, duration_s]. freq=0 means rest.
// C pentatonic arpeggio at ~140 BPM, square wave at low volume for a chiptune feel.
const MELODY: [number, number][] = [
  [523.25, 0.10], // C5
  [0,      0.05],
  [659.25, 0.10], // E5
  [0,      0.05],
  [783.99, 0.10], // G5
  [0,      0.05],
  [659.25, 0.10], // E5
  [0,      0.05],
  [880.00, 0.10], // A5
  [0,      0.05],
  [659.25, 0.10], // E5
  [0,      0.05],
  [587.33, 0.15], // D5
  [0,      0.05],
  [523.25, 0.15], // C5
  [0,      0.15], // pause at bar end
];

const MELODY_DURATION = MELODY.reduce((sum, [, d]) => sum + d, 0);

export class SoundManager {
  // AudioContext is created lazily on first play to satisfy browser autoplay policy
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicPlaying = false;
  private musicTimeout: ReturnType<typeof setTimeout> | null = null;
  private musicNextStart = 0;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      // Cancel next scheduled bar — currently playing notes fade naturally
      if (this.musicTimeout) {
        clearTimeout(this.musicTimeout);
        this.musicTimeout = null;
      }
    } else if (this.musicPlaying) {
      // Resume scheduling from now
      this.musicNextStart = this.getCtx().currentTime + 0.05;
      this.scheduleMusicBar();
    }
  }

  // isDouble = true for the second (in-air) jump — higher pitch
  playJump(isDouble = false): void {
    if (this.muted) return;
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
    if (this.muted) return;
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
    if (this.muted) return;
    this.musicNextStart = this.getCtx().currentTime + 0.05;
    this.scheduleMusicBar();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }

  private scheduleMusicBar(): void {
    if (!this.musicPlaying || this.muted) return;
    const ctx = this.getCtx();
    let t = this.musicNextStart;

    for (const [freq, dur] of MELODY) {
      if (freq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.value = freq;
        // Low volume with quick fade for a plucky chiptune feel
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);
        osc.start(t);
        osc.stop(t + dur);
      }
      t += dur;
    }

    // Schedule next bar ~50ms before current one ends to avoid gaps
    this.musicNextStart += MELODY_DURATION;
    const msUntilNext = (this.musicNextStart - ctx.currentTime - 0.05) * 1000;
    this.musicTimeout = setTimeout(
      () => this.scheduleMusicBar(),
      Math.max(0, msUntilNext),
    );
  }

  destroy(): void {
    this.stopMusic();
    this.ctx?.close();
    this.ctx = null;
  }
}
