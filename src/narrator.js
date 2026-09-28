// Read-aloud using the browser's built-in speech voices.
// Each speaker gets a slightly different pitch so children can tell voices apart.
const PITCH = { guide: 1.15, narrator: 1, mother: 1.2, mengmu: 1.2, wife: 1.2, father: 0.8, zengzi: 0.8, carver: 0.7, mengzi: 1.45, kongrong: 1.5, huangxiang: 1.4, cheyin: 1.4, xiaoming: 1.45, son: 1.5 };

export class Narrator {
  constructor() {
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

  // Must run inside a user gesture on iOS/Safari so later speech is allowed.
  unlock() {
    if (!this.synth) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    this.synth.speak(u);
  }

  stop() {
    this.gen++;
    this.synth?.cancel();
  }

  // Resolves when speech ends (or after a length-based fallback if speech is unavailable/stalls).
  say(text, lang = 'zh', { rate, who, pause = 0 } = {}) {
    const gen = ++this.gen;
    const estimate = 800 + [...text].length * (lang === 'zh' ? 260 : 75) / (rate ?? 0.9);
    if (!this.synth || !text.trim()) return wait(Math.min(estimate, 4000));
    this.synth.cancel();
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
      u.onend = finish;
      u.onerror = finish;
      const guard = setTimeout(finish, estimate * 1.6 + 1500);
      // Chrome occasionally drops speak() right after cancel(); a tick of delay avoids it.
      setTimeout(() => { if (gen === this.gen) this.synth.speak(u); else finish(); }, 60);
    });
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
