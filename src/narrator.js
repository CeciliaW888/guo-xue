// Read-aloud using the browser's built-in speech voices.
// Each speaker gets a slightly different pitch so children can tell voices apart.
const PITCH = { guide: 1.15, narrator: 1, mother: 1.2, mengmu: 1.2, wife: 1.2, father: 0.8, zengzi: 0.8, carver: 0.7, mengzi: 1.45, kongrong: 1.5, huangxiang: 1.4, cheyin: 1.4, xiaoming: 1.45, son: 1.5 };

export class Narrator {
  // `sound` supplies the (tap-unlocked) AudioContext used to play pre-rendered voice clips.
  constructor(sound) {
    this.sound = sound;
    this.clips = null; // key -> url, from public/voice/manifest.json
    this.buffers = new Map();
    this.source = null;
    fetch('./voice/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => { this.clips = m; }).catch(() => {});
    this.synth = window.speechSynthesis;
    this.voices = { zh: null, en: null };
    this.gen = 0;
    if (!this.synth) return;
    const load = () => {
      const all = this.synth.getVoices();
      const score = (v, lang) => {
        let s = 0;
        const l = v.lang.toLowerCase().replace('_', '-');
        if (lang === 'zh') {
          if (l === 'zh-cn') s += 10;
          else if (l.startsWith('zh')) s += 4;
          else return -1;
          if (/tingting|xiaoxiao|yunxi|lili|meijia|google/i.test(v.name)) s += 3;
        } else {
          if (l === 'en-us' || l === 'en-gb') s += 10;
          else if (l.startsWith('en')) s += 4;
          else return -1;
          if (/samantha|google|aria|jenny|daniel/i.test(v.name)) s += 3;
        }
        if (/enhanced|premium|natural|neural/i.test(v.name)) s += 2;
        return s;
      };
      for (const lang of ['zh', 'en']) {
        const best = all.map((v) => [score(v, lang), v]).filter(([s]) => s >= 0).sort((a, b) => b[0] - a[0])[0];
        this.voices[lang] = best?.[1] ?? null;
      }
    };
    load();
    this.synth.addEventListener?.('voiceschanged', load);
  }

  // Must run inside a user gesture: iOS only allows speech after an utterance that
  // started from a tap, and it ignores silent or empty utterances. So say something real.
  unlock(text = '国学小书童') {
    if (!this.synth) return;
    this.synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    if (this.voices.zh) u.voice = this.voices.zh;
    u.rate = 0.9;
    this.synth.speak(u);
    this.unlocked = true;
  }

  get available() { return !!this.synth; }
  get hasZh() { return !!this.voices.zh; }

  stop() {
    this.gen++;
    this.synth?.cancel();
    if (this.source) {
      try { this.source.stop(); } catch { /* already stopped */ }
      this.source = null;
      this.onActivity?.(false);
    }
  }

  static key(lang, who, text) { return `${lang}|${who}|${text}`; }

  hasClip(lang, who, text) { return !!this.clips?.[Narrator.key(lang, who, text)]; }

  buffer(url) {
    if (!this.buffers.has(url)) {
      const ctx = this.sound.ctx;
      this.buffers.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).catch((e) => {
        this.buffers.delete(url);
        throw e;
      }));
    }
    return this.buffers.get(url);
  }

  // Warm the cache for lines that are about to be spoken.
  prefetch(lines) {
    if (!this.clips || !this.sound.ctx) return;
    for (const [lang, who, text] of lines) {
      const url = this.clips[Narrator.key(lang, who, text)];
      if (url) this.buffer(url).catch(() => {});
    }
  }

  playClip(url, gen, pause) {
    const ctx = this.sound.ctx;
    return this.buffer(url).then((buf) => new Promise((resolve) => {
      if (gen !== this.gen) return resolve();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.sound.voiceBus);
      this.source = src;
      this.onActivity?.(true);
      src.onended = () => {
        if (this.source === src) { this.source = null; this.onActivity?.(false); }
        setTimeout(resolve, pause);
      };
      src.start();
    }));
  }

  // Resolves when speech ends (or after a length-based fallback if speech is unavailable/stalls).
  say(text, lang = 'zh', { rate, who = 'narrator', pause = 0 } = {}) {
    // Pre-rendered neural voice (British English / Mandarin) when available.
    const url = this.clips?.[Narrator.key(lang, who, text)];
    if (url && this.sound.ready) {
      this.stop();
      const gen = this.gen;
      return this.playClip(url, gen, pause).catch(() => this.speak(text, lang, { rate, who, pause }));
    }
    return this.speak(text, lang, { rate, who, pause });
  }

  // Browser speech synthesis fallback.
  speak(text, lang = 'zh', { rate, who, pause = 0 } = {}) {
    const gen = ++this.gen;
    const estimate = 800 + [...text].length * (lang === 'zh' ? 260 : 75) / (rate ?? 0.9);
    if (!this.synth || !text.trim()) return wait(Math.min(estimate, 4000));
    // Cancelling an idle synth right before speak() makes iOS drop the next utterance.
    const busy = this.synth.speaking || this.synth.pending;
    if (busy) this.synth.cancel();
    return new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(guard);
        setTimeout(resolve, pause);
      };
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      if (this.voices[lang]) u.voice = this.voices[lang];
      u.rate = rate ?? (lang === 'zh' ? 0.88 : 0.95);
      u.pitch = PITCH[who] ?? 1;
      u.onstart = () => this.onActivity?.(true);
      u.onend = () => { this.onActivity?.(false); finish(); };
      u.onerror = () => { this.onActivity?.(false); finish(); };
      const guard = setTimeout(finish, estimate * 1.6 + 1500);
      // Chrome occasionally drops speak() right after cancel(); a tick of delay avoids it.
      const go = () => { if (gen === this.gen) this.synth.speak(u); else finish(); };
      if (busy) setTimeout(go, 60); else go();
    });
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
