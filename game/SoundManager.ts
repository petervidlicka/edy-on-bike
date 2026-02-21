export class SoundManager {
  // AudioContext is created lazily on first play to satisfy browser autoplay policy
  private ctx: AudioContext | null = null;
  private muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
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

  destroy(): void {
    this.ctx?.close();
    this.ctx = null;
  }
}
