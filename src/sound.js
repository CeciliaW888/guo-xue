// Background music and sound effects, synthesized with Web Audio (no audio files).
// Music: slow plucked-string phrases on the Chinese pentatonic scale (宫商角徵羽) over a soft drone.

const PENTA = [0, 2, 4, 7, 9]; // gong shang jue zhi yu
const BASE = 293.66; // D4

// iOS mutes Web Audio when the ringer switch is on silent. Playing a (silent) <audio>
// element and declaring a "playback" session moves the page into the media category.
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

export class Sound {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this.musicTimer = null;
    this.mood = 'day';
  }

  // Call from a user gesture (tap/click). Safe to call repeatedly.
  unlock() {
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch { /* not supported */ }
    if (!this.keepAlive) {
      this.keepAlive = new Audio(SILENT_WAV);
      this.keepAlive.loop = true;
      this.keepAlive.setAttribute('playsinline', '');
      this.keepAlive.play().catch(() => {});
    }
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.voiceBus = this.ctx.createGain();
      this.voiceBus.gain.value = 1.15;
      this.voiceBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);
      // A touch of echo makes the plucks feel like a hall.
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.32;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.28;
      delay.connect(fb).connect(delay);
      this.musicBus.connect(delay);
      delay.connect(this.master);
    }
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    if (this.musicOn) this.startMusic();
  }

  get ready() { return this.ctx?.state === 'running'; }

  pluck(freq, when, { vol = 0.18, dur = 2.2, bus } = {}) {
    const c = this.ctx;
    const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o1.type = 'triangle';
    o2.type = 'sine';
    o1.frequency.value = freq;
    o2.frequency.value = freq * 2.01;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq * 8, when);
    f.frequency.exponentialRampToValueAtTime(freq * 1.5, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    const g2 = c.createGain();
    g2.gain.value = 0.25;
    o1.connect(f);
    o2.connect(g2).connect(f);
    f.connect(g).connect(bus || this.master);
    o1.start(when); o2.start(when);
    o1.stop(when + dur + 0.05); o2.stop(when + dur + 0.05);
  }

  note(step, octave = 0) {
    const n = PENTA.length;
    const i = ((step % n) + n) % n;
    const o = Math.floor(step / n) + octave;
    return BASE * 2 ** ((PENTA[i] + 12 * o) / 12);
  }

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const now = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setTargetAtTime(this.mood === 'night' ? 0.45 : 0.6, now, 1.5);
    let t = now + 0.3;
    let step = 2;
    const schedule = () => {
      if (!this.ctx) return;
      // Keep ~2 seconds of music scheduled ahead.
      while (t < this.ctx.currentTime + 2) {
        const phraseLen = 4 + Math.floor(Math.random() * 4);
        for (let k = 0; k < phraseLen; k++) {
          step += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
          step = Math.max(-2, Math.min(9, step));
          const dur = [0.55, 0.55, 0.8, 1.1][Math.floor(Math.random() * 4)];
          this.pluck(this.note(step), t, { vol: 0.11, dur: 2.4, bus: this.musicBus });
          if (k === 0) this.pluck(this.note(step - 5, -1), t, { vol: 0.08, dur: 3.5, bus: this.musicBus });
          t += dur;
        }
        t += 1.6 + Math.random() * 1.4; // breathe between phrases
      }
    };
    schedule();
    this.musicTimer = setInterval(schedule, 500);
  }

  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
  }

  setMusic(on) {
    this.musicOn = on;
    if (on) this.startMusic(); else this.stopMusic();
  }

  setMood(mood) {
    this.mood = mood;
    if (this.ctx && this.musicTimer) this.musicBus.gain.setTargetAtTime(mood === 'night' ? 0.45 : 0.6, this.ctx.currentTime, 1.5);
  }

  // Quieter music while a line is narrated.
  duck(on) {
    if (!this.ctx || !this.musicTimer) return;
    const base = this.mood === 'night' ? 0.45 : 0.6;
    this.musicBus.gain.setTargetAtTime(on ? base * 0.4 : base, this.ctx.currentTime, 0.3);
  }

  sfx(kind) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.01;
    if (kind === 'tap') this.pluck(this.note(7), t, { vol: 0.2, dur: 0.9 });
    else if (kind === 'choice') { this.pluck(this.note(4), t, { vol: 0.16, dur: 0.8 }); }
    else if (kind === 'good') [5, 7, 10].forEach((s, i) => this.pluck(this.note(s), t + i * 0.09, { vol: 0.18, dur: 1.4 }));
    else if (kind === 'page') this.pluck(this.note(0, -1), t, { vol: 0.14, dur: 1.2 });
  }
}
