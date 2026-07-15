/**
 * Tiny procedural sound engine for BMO's sound effects. Everything here is
 * synthesized with oscillators (Web Audio API) - no audio files - which
 * keeps this copyright-clean and gives that chiptune/game-console feel that
 * matches BMO's character.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this._lastHover = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.32;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.32;
    }
  }

  // A single short tone with a quick attack/decay envelope - the basic
  // building block for every effect below.
  _tone({ freq, duration = 0.12, type = "square", gain = 0.3, delay = 0, glideTo = null }) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(glideTo, 1), t0 + duration);
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  _sequence(notes) {
    // notes: [{freq, duration, delay, type, gain, glideTo}, ...]
    notes.forEach((n) => this._tone(n));
  }

  // ---- named effects ----

  playHover() {
    const now = performance.now();
    if (now - this._lastHover < 250) return; // avoid spamming on re-hover
    this._lastHover = now;
    this._tone({ freq: 1100, duration: 0.05, type: "sine", gain: 0.12 });
  }

  playSingleClick() {
    this._sequence([
      { freq: 660, duration: 0.06, type: "square", gain: 0.28 },
      { freq: 990, duration: 0.09, type: "square", gain: 0.25, delay: 0.06 },
    ]);
  }

  playDoubleClick() {
    this._sequence([
      { freq: 520, duration: 0.05, type: "square", gain: 0.28 },
      { freq: 780, duration: 0.05, type: "square", gain: 0.26, delay: 0.055 },
      { freq: 1040, duration: 0.09, type: "square", gain: 0.26, delay: 0.11 },
    ]);
  }

  playFallSequence() {
    // descending "whoop" as it topples...
    this._tone({ freq: 500, duration: 0.4, type: "triangle", gain: 0.3, glideTo: 110 });
    // ...a couple of comedic low bonks while it's down...
    this._tone({ freq: 140, duration: 0.08, type: "square", gain: 0.22, delay: 0.45 });
    this._tone({ freq: 120, duration: 0.08, type: "square", gain: 0.2, delay: 0.62 });
    // ...then a rising chirp as it gets back up.
    this._tone({ freq: 220, duration: 0.35, type: "triangle", gain: 0.28, delay: 1.75, glideTo: 660 });
  }

  playMessageSent() {
    this._tone({ freq: 700, duration: 0.05, type: "sine", gain: 0.22 });
  }

  playThinkingStart() {
    this._sequence([
      { freq: 440, duration: 0.07, type: "sine", gain: 0.14 },
      { freq: 380, duration: 0.09, type: "sine", gain: 0.12, delay: 0.09 },
    ]);
  }

  playReceiveChime() {
    this._sequence([
      { freq: 523.25, duration: 0.1, type: "square", gain: 0.22 }, // C5
      { freq: 659.25, duration: 0.1, type: "square", gain: 0.22, delay: 0.09 }, // E5
      { freq: 783.99, duration: 0.16, type: "square", gain: 0.24, delay: 0.18 }, // G5
    ]);
  }
}

export const soundEngine = new SoundEngine();
