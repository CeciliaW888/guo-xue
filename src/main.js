import * as THREE from 'three';
import { World } from './world.js';
import { BOOKS, CHAPTERS } from './data.js';
import { STORIES, NAMES, canonicalChoice } from './story.js';
import { coverScene, seedsScene, mengmuScene, jadeScene, warmBedScene, pearsScene } from './scenes-a.js';
import { firefliesScene, lanternsScene, callHomeScene, promiseScene, threeArrivalsScene, finaleScene } from './scenes-b.js';
import { Narrator } from './narrator.js';
import { loadAssets } from './assets.js';
import { Sound } from './sound.js';

const SCENES = {
  cover: coverScene, seeds: seedsScene, mengmu: mengmuScene, jade: jadeScene, warmbed: warmBedScene, pears: pearsScene,
  fireflies: firefliesScene, lanterns: lanternsScene, callhome: callHomeScene, promise: promiseScene,
  threearrivals: threeArrivalsScene, finale: finaleScene,
};

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('guoxue:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('guoxue:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

const app = {
  lang: store.get('lang', 'both'),
  voice: store.get('voice', true),
  music: store.get('music', true),
  auto: false,
  chapterIdx: -1,
  nodeId: null,
  node: null,
  lineIdx: 0,
  // Journey-wide state: good choices and seed care carry into the finale.
  vars: { good: store.get('good', 0), care: store.get('care', 0), flags: new Set() },
  goodKeys: new Set(store.get('goodKeys', [])),
  done: new Set(store.get('done', [])),
  token: 0,
};

applyLang();
const world = new World($('stage'));
const narrator = new Narrator();
const sound = new Sound();
sound.musicOn = app.music;
narrator.onActivity = (speaking) => sound.duck(speaking);
const NIGHT_SCENES = new Set(['warmbed', 'fireflies', 'lanterns']);
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Audio can only start from a user gesture; every tap re-arms it (cheap after the first).
function unlockAudio() {
  sound.unlock();
  if (!narrator.unlocked && app.voice) narrator.unlock();
}
window.addEventListener('pointerdown', () => sound.unlock(), { passive: true });

// ---------------------------------------------------------------- i18n helpers
function applyLang() {
  document.body.dataset.lang = app.lang;
  document.querySelectorAll('[data-zh]').forEach((el) => {
    const { zh, en } = el.dataset;
    if (app.lang === 'both' && el.classList.contains('btn')) {
      // Buttons show Chinese with a smaller English line underneath.
      el.innerHTML = `${zh}<small class="btn-en">${en}</small>`;
    } else {
      el.textContent = app.lang === 'en' ? en : zh;
    }
  });
  document.querySelectorAll('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === app.lang)));
  $('lang-label').textContent = { zh: '中', en: 'EN', both: '双' }[app.lang];
  document.documentElement.lang = app.lang === 'en' ? 'en' : 'zh-CN';
  if (app.chapterIdx >= 0) updateHud();
}
const bi = (o) => (o ? `<span class="zh">${o.zh}</span><span class="en">${o.en}</span>` : '');
const pick = (o) => (app.lang === 'en' ? o.en : o.zh);
const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => app.vars[k] ?? 0);

// ---------------------------------------------------------------- scene + chapter flow
function transition(fn) {
  const fade = $('fade');
  fade.classList.add('on');
  return new Promise((res) => setTimeout(() => { fn(); setTimeout(() => fade.classList.remove("on"), 30); res(); }, 500));
}

function showCover() {
  narrator.stop();
  app.chapterIdx = -1;
  app.token++;
  hideAll();
  $('cover').classList.remove('hidden');
  world.setFocusOffset(window.innerWidth >= 900 ? -0.2 : 0, window.innerWidth >= 900 ? 0 : 0.18);
  world.show(SCENES.cover);
}

function hideAll() {
  ['cover', 'hud', 'dialog', 'lesson', 'ending', 'chapters'].forEach((id) => $(id).classList.add('hidden'));
}

async function startChapter(idx) {
  narrator.stop();
  app.token++;
  const ch = CHAPTERS[idx];
  await transition(() => {
    hideAll();
    app.chapterIdx = idx;
    app.vars.flags = new Set();
    if (idx === 0) { app.vars.care = 0; }
    world.show(SCENES[ch.scene]);
    sound.setMood(NIGHT_SCENES.has(ch.scene) ? 'night' : 'day');
    world.setFocusOffset(0, window.innerWidth < 640 ? 0.12 : 0.08);
    $('hud').classList.remove('hidden');
    updateHud();
  });
  goNode('start');
}

function updateHud() {
  const ch = CHAPTERS[app.chapterIdx];
  if (!ch) return;
  $('hud-book').textContent = app.lang === 'en' ? BOOKS[ch.book].en : `《${BOOKS[ch.book].zh}》`;
  $('hud-title').textContent = pick(ch.title);
  $('good-n').textContent = app.vars.good;
}

function story() { return STORIES[CHAPTERS[app.chapterIdx].id]; }

function goNode(id) {
  const tok = ++app.token;
  narrator.stop();
  let node = story()[id];
  while (node.branch) { id = node.branch(app.vars); node = story()[id]; }
  app.nodeId = id;
  app.node = node;
  app.lineIdx = 0;
  world.active.setState?.(node.state, app.vars);
  if (node.lesson) { showLesson(tok); return; }
  $('lesson').classList.add('hidden');
  $('dialog').classList.remove('hidden');
  showLine(tok);
}

function showLine(tok) {
  const node = app.node;
  const line = node.say?.[app.lineIdx];
  $('choices').innerHTML = '';
  $('hint').classList.add('hidden');
  $('btn-tap').classList.add('hidden');
  if (!line) return;
  renderSay(line, tok, () => {
    if (tok !== app.token) return;
    if (app.lineIdx < node.say.length - 1) {
      $('btn-next').classList.remove('hidden');
      if (app.auto) setTimeout(() => tok === app.token && advance(), 900);
    } else {
      endOfLines(tok);
    }
  });
}

// Types out one line of dialogue and narrates it. `done` fires when both finish.
function renderSay(line, tok, done) {
  const who = NAMES[line.who] || NAMES.narrator;
  const sp = $('speaker');
  sp.textContent = pick(who);
  sp.dataset.who = line.who;
  const zh = fill(line.zh), en = fill(line.en);
  $('say-en').textContent = app.lang === 'zh' ? '' : en;
  $('btn-next').classList.add('hidden');
  typewrite($('say-zh'), app.lang === 'en' ? '' : zh, tok);
  if (app.lang === 'en') typewrite($('say-en'), en, tok);
  const speakText = app.lang === 'en' ? en : zh;
  const speakLang = app.lang === 'en' ? 'en' : 'zh';
  // Interactive: move on as soon as the text is on screen; narration keeps playing.
  // Storyteller mode: wait for narration so the audience hears every line.
  const typed = new Promise((r) => setTimeout(r, (app.lang === 'en' ? 18 : 45) * [...(app.lang === 'en' ? en : zh)].length + 350));
  const minRead = new Promise((r) => setTimeout(r, Math.min(900 + speakText.length * (speakLang === 'zh' ? 180 : 55), 6000)));
  const spoken = app.voice ? narrator.say(speakText, speakLang, { who: line.who }) : minRead;
  (app.auto ? Promise.all([spoken, typed]) : typed).then(() => tok === app.token && done());
  // Let people move on before narration finishes.
  setTimeout(() => {
    if (tok === app.token && app.lineIdx < (app.node.say?.length ?? 0) - 1) $('btn-next').classList.remove('hidden');
  }, 700);
}

let typeTimer;
function typewrite(el, text, tok) {
  clearInterval(typeTimer);
  el.textContent = '';
  const chars = [...text];
  let i = 0;
  const reduced = world.reducedMotion;
  if (reduced) { el.textContent = text; return; }
  typeTimer = setInterval(() => {
    if (tok !== app.token) { clearInterval(typeTimer); return; }
    i += 1;
    el.textContent = chars.slice(0, i).join('');
    if (i >= chars.length) clearInterval(typeTimer);
  }, app.lang === 'en' ? 18 : 45);
  el.dataset.full = text;
}
function finishType() {
  clearInterval(typeTimer);
  for (const id of ['say-zh', 'say-en']) {
    const el = $(id);
    if (el.dataset.full != null && el.textContent !== el.dataset.full && !(id === 'say-zh' && app.lang === 'en')) el.textContent = el.dataset.full;
  }
}

function advance() {
  const node = app.node;
  if (!node || node.lesson) return;
  finishType();
  if (app.lineIdx < (node.say?.length ?? 0) - 1) {
    narrator.stop();
    app.lineIdx++;
    const tok = ++app.token;
    showLine(tok);
  } else if (node.next && !node.choices && !node.hint) {
    goNode(node.next);
  }
}

function endOfLines(tok) {
  const node = app.node;
  $('btn-next').classList.add('hidden');
  if (node.hint) {
    $('hint-text').textContent = pick(node.hint);
    $('hint').classList.remove('hidden');
  }
  $('btn-tap').classList.toggle('hidden', !(node.hint && !world.renderer));
  if (node.choices) {
    const box = $('choices');
    box.innerHTML = '';
    node.choices.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.dataset.ev = c.ev;
      b.innerHTML = app.lang === 'en' ? c.en : app.lang === 'zh' ? c.zh : `${c.zh}<small>${c.en}</small>`;
      b.addEventListener('click', () => { sound.sfx('choice'); handleEvent(c); });
      box.appendChild(b);
    });
  }
  if (node.next && !node.choices && !node.hint) {
    $('btn-next').classList.remove('hidden');
    if (app.auto) setTimeout(() => tok === app.token && goNode(node.next), 1200);
  }
  if (app.auto) autoAct(tok);
}

// Storyteller mode: follow the path that matches the source story, tapping for the viewer.
function autoAct(tok) {
  const node = app.node;
  if (node.choices && Object.keys(node.on || {}).length) {
    const ev = canonicalChoice(node);
    setTimeout(() => {
      if (tok !== app.token) return;
      const btn = $('choices').querySelector(`[data-ev="${ev}"]`);
      btn?.classList.add('auto-pick');
      setTimeout(() => tok === app.token && handleEvent(node.choices.find((c) => c.ev === ev)), 1100);
    }, 1800);
  } else if (node.hint) {
    const tapLoop = () => {
      if (tok !== app.token || !app.auto) return;
      processSceneEvents(world.active.autoTap?.() || []);
      setTimeout(tapLoop, 1300);
    };
    setTimeout(tapLoop, 1200);
  }
}

function handleEvent(e) {
  const node = app.node;
  const next = node?.on?.[e.ev];
  if (!next) return;
  if (e.good) {
    const key = `${CHAPTERS[app.chapterIdx].id}:${app.nodeId}`;
    if (!app.goodKeys.has(key)) {
      app.goodKeys.add(key);
      app.vars.good++;
      persist();
      sound.sfx('good');
      const sc = $('seal-count');
      sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
      updateHud();
    }
  }
  if (e.care) { app.vars.care += e.care; persist(); }
  app.vars.flags.add(e.ev);
  world.active.onEvent?.(e.ev);
  goNode(next);
}

function processSceneEvents(events) {
  for (const e of events) {
    if (e.say) {
      const tok = ++app.token;
      renderSay(e.say, tok, () => {
        if (app.node.hint && tok === app.token) {
          $('hint').classList.remove('hidden');
          if (app.auto) autoAct(tok);
        }
      });
      if (app.node.hint) $('hint-text').textContent = pick(app.node.hint);
      $('hint').classList.toggle('hidden', !app.node.hint);
    } else if (e.ev) {
      if (e.delay) setTimeout(() => handleEvent(e), e.delay);
      else handleEvent(e);
    }
  }
}

function persist() {
  store.set('good', app.vars.good);
  store.set('care', app.vars.care);
  store.set('goodKeys', [...app.goodKeys]);
  store.set('done', [...app.done]);
}

// ---------------------------------------------------------------- lesson card
function showLesson(tok) {
  const ch = CHAPTERS[app.chapterIdx];
  sound.sfx('page');
  $('dialog').classList.add('hidden');
  $('lesson').classList.remove('hidden');
  $('lesson-book').textContent = `《${BOOKS[ch.book].zh}》 ${BOOKS[ch.book].en}`;
  $('lesson-title').innerHTML = `${ch.title.zh}<span class="en">${ch.title.en}</span>`;
  const cl = $('classic');
  cl.innerHTML = '';
  ch.lines.forEach(([han, py]) => {
    const syl = py.split(' ');
    const phrase = document.createElement('div');
    phrase.className = 'phrase';
    phrase.innerHTML = [...han].map((c, i) => `<ruby>${c}<rt>${syl[i] || ''}</rt></ruby>`).join('');
    cl.appendChild(phrase);
  });
  $('meaning').innerHTML = bi(ch.meaning);
  $('practice').innerHTML = bi(ch.practice);
  $('note').innerHTML = bi(ch.note);
  $('source').innerHTML = bi(ch.source);
  const last = app.chapterIdx === CHAPTERS.length - 1;
  const cont = $('btn-continue');
  cont.dataset.zh = last ? '完成旅程' : '下一章';
  cont.dataset.en = last ? 'Finish the journey' : 'Next chapter';
  applyLang();
  app.done.add(ch.id);
  persist();
  readClassic(tok).then(() => {
    if (app.auto && tok === app.token) setTimeout(() => tok === app.token && continueOn(), 2500);
  });
}

async function readClassic(tok) {
  const ch = CHAPTERS[app.chapterIdx];
  const phrases = [...$('classic').children];
  phrases.forEach((p) => p.classList.remove('on', 'reading'));
  for (let i = 0; i < ch.lines.length; i++) {
    if (tok !== app.token) return;
    phrases[i].classList.add('on', 'reading');
    world.setBeat(i + 1);
    if (app.voice) await narrator.say(ch.lines[i][0], 'zh', { rate: 0.7, pause: 250 });
    else await new Promise((r) => setTimeout(r, 900));
    phrases[i].classList.remove('reading');
  }
  if (tok !== app.token) return;
  if (app.voice) {
    if (app.lang !== 'en') await narrator.say(ch.meaning.zh, 'zh');
    if (tok === app.token && app.lang === 'en') await narrator.say(ch.meaning.en, 'en');
  }
}

function continueOn() {
  narrator.stop();
  if (app.chapterIdx >= CHAPTERS.length - 1) return showEnding();
  startChapter(app.chapterIdx + 1);
}

function showEnding() {
  app.token++;
  $('lesson').classList.add('hidden');
  $('ending').classList.remove('hidden');
  const n = app.vars.good;
  $('ending-text').innerHTML = bi({
    zh: `你读完了《三字经》和《弟子规》里的 ${CHAPTERS.length} 个故事，一路上做了 ${n} 个好选择。你就是真正的国学小书童！把今天学到的一句话，讲给家人听吧。`,
    en: `You finished ${CHAPTERS.length} stories from the Three Character Classic and Di Zi Gui, making ${n} good choices along the way. You are a true young scholar! Share one line you learned today with your family.`,
  });
  if (app.voice) narrator.say(app.lang === 'en' ? 'You are a true young scholar!' : '你就是真正的国学小书童！', app.lang === 'en' ? 'en' : 'zh');
}

// ---------------------------------------------------------------- chapter list
function renderChapters() {
  const list = $('chapter-list');
  list.innerHTML = '';
  for (const key of ['szj', 'dzg']) {
    const grp = document.createElement('div');
    grp.className = 'book-group';
    grp.innerHTML = `<h3>《${BOOKS[key].zh}》<small>${BOOKS[key].en}</small></h3><p class="bi">${bi(BOOKS[key].about)}</p>`;
    const grid = document.createElement('div');
    grid.className = 'chapter-grid';
    CHAPTERS.forEach((ch, i) => {
      if (ch.book !== key) return;
      const b = document.createElement('button');
      b.className = 'chapter-btn' + (app.done.has(ch.id) ? ' done' : '');
      b.innerHTML = `<b>${ch.title.zh}</b><span>${ch.title.en}</span>`;
      b.addEventListener('click', () => { $('chapters').classList.add('hidden'); startChapter(i); });
      grid.appendChild(b);
    });
    grp.appendChild(grid);
    list.appendChild(grp);
  }
  $('chapters').classList.remove('hidden');
}

// ---------------------------------------------------------------- 3D picking
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function hitPickable(e) {
  const s = world.active;
  if (!s?.pickables?.length || app.chapterIdx < 0) return null;
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, world.camera);
  const hits = raycaster.intersectObjects(s.pickables.filter((p) => p.userData.active && p.visible), true);
  for (const h of hits) {
    if (h.object.userData.isHint) continue;
    let o = h.object;
    while (o && !o.userData.pick) o = o.parent;
    if (o?.userData.active) return o;
  }
  return null;
}
$('stage').addEventListener('pointerdown', (e) => {
  const o = hitPickable(e);
  if (!o) return;
  sound.sfx('tap');
  processSceneEvents(world.active.pick(o.userData.pick, o) || []);
});
// Without 3D there is nothing to tap, so offer a button that performs the scene action.
$('btn-tap').addEventListener('click', () => { sound.sfx('tap'); processSceneEvents(world.active.autoTap?.() || []); });
$('stage').addEventListener('pointermove', (e) => {
  $('stage').style.cursor = hitPickable(e) ? 'pointer' : '';
});

// ---------------------------------------------------------------- controls
document.querySelectorAll('.lang-switch button').forEach((b) => b.addEventListener('click', () => {
  app.lang = b.dataset.lang;
  store.set('lang', app.lang);
  applyLang();
}));
$('btn-lang').addEventListener('click', () => {
  app.lang = { zh: 'both', both: 'en', en: 'zh' }[app.lang];
  store.set('lang', app.lang);
  applyLang();
  if (app.node && !app.node.lesson) { const tok = ++app.token; showLine(tok); }
});
$('btn-voice').addEventListener('click', () => {
  app.voice = !app.voice;
  if (app.voice) narrator.unlock(app.lang === 'en' ? 'Narration on' : '朗读已打开');
  store.set('voice', app.voice);
  $('btn-voice').setAttribute('aria-pressed', String(app.voice));
  if (!app.voice) narrator.stop();
});
$('btn-auto').addEventListener('click', () => setAuto(!app.auto));
$('btn-music').addEventListener('click', () => {
  app.music = !app.music;
  store.set('music', app.music);
  $('btn-music').setAttribute('aria-pressed', String(app.music));
  sound.unlock();
  sound.setMusic(app.music);
});
function setAuto(on) {
  app.auto = on;
  $('btn-auto').setAttribute('aria-pressed', String(on));
  if (on && app.node) {
    const tok = app.token;
    if (app.node.lesson) setTimeout(() => tok === app.token && continueOn(), 1500);
    else if ($('btn-next').offsetParent) advance();
    else autoAct(tok);
  }
}
$('btn-full').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
});
$('btn-next').addEventListener('click', (e) => { e.stopPropagation(); advance(); });
$('dialog').addEventListener('click', (e) => { if (!e.target.closest('button')) advance(); });
$('btn-start').addEventListener('click', () => { unlockAudio(); setAuto(false); startChapter(0); });
$('btn-broadcast').addEventListener('click', () => { unlockAudio(); setAuto(true); startChapter(0); });
$('btn-chapters-cover').addEventListener('click', () => { unlockAudio(); renderChapters(); });
$('btn-chapters').addEventListener('click', renderChapters);
$('btn-chapters-end').addEventListener('click', renderChapters);
$('btn-close-chapters').addEventListener('click', () => $('chapters').classList.add('hidden'));
$('btn-continue').addEventListener('click', continueOn);
$('btn-replay').addEventListener('click', () => startChapter(app.chapterIdx));
$('btn-read').addEventListener('click', () => { narrator.stop(); readClassic(++app.token); });
$('btn-restart').addEventListener('click', () => {
  app.vars.good = 0; app.vars.care = 0; app.goodKeys.clear(); persist();
  startChapter(0);
});
$('pinyin-toggle').addEventListener('change', (e) => document.body.classList.toggle('no-pinyin', !e.target.checked));
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
    if (document.activeElement?.tagName === 'BUTTON' && e.key !== 'ArrowRight') return;
    if (!$('dialog').classList.contains('hidden')) { e.preventDefault(); advance(); }
  }
  if (e.key === 'Escape') $('chapters').classList.add('hidden');
  const n = Number(e.key);
  if (n >= 1 && n <= 4 && !$('dialog').classList.contains('hidden')) $('choices').children[n - 1]?.click();
});

// ---------------------------------------------------------------- boot
$('btn-voice').setAttribute('aria-pressed', String(app.voice));
$('btn-music').setAttribute('aria-pressed', String(app.music));
if (!world.renderer) {
  document.body.classList.add('no-3d');
  $('no3d').classList.remove('hidden');
}
if (IS_IOS) $('ios-tip').classList.remove('hidden');
// iPhone Safari/Brave have no Fullscreen API; don't show a button that does nothing.
if (!document.documentElement.requestFullscreen) $('btn-full').classList.add('hidden');
Promise.all([
  loadAssets(),
  Promise.race([
    Promise.all([document.fonts.load('64px "Ma Shan Zheng"'), document.fonts.load('32px "Noto Serif SC"')]),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => {}),
]).finally(() => {
  showCover();
  world.start();
  const q = new URLSearchParams(location.search);
  if (q.has('ch')) { const i = CHAPTERS.findIndex((c) => c.id === q.get('ch')); if (i >= 0) startChapter(i); }
  if (q.has('auto')) setAuto(true);
});
// Debug/test hooks.
window.__app = app;
window.__world = world;
window.__sound = sound;
window.__narrator = narrator;
window.__test = {
  tap: () => processSceneEvents(world.active.autoTap?.() || []),
  // Advance the 3D simulation without rAF (for hidden/background tabs).
  settle(sec = 3) { for (let i = 0; i < sec * 30; i++) world.step(1 / 30); },
  go: (id) => startChapter(CHAPTERS.findIndex((c) => c.id === id)),
  // Plays a chapter: picks choices by event name in order, taps when a hint is shown.
  async drive(id, picks = [], stopAt = null, maxSteps = 30) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    app.voice = false;
    narrator.stop();
    if (id) { await this.go(id); await sleep(900); }
    let pi = 0;
    for (let i = 0; i < maxSteps; i++) {
      if (app.node?.lesson || (stopAt && app.nodeId === stopAt)) break;
      const cs = [...document.querySelectorAll('.choice')];
      if (cs.length) { const want = picks[pi++]; (cs.find((c) => c.dataset.ev === want) || cs[0]).click(); }
      else if (!$('hint').classList.contains('hidden')) this.tap();
      else if (!$('btn-next').classList.contains('hidden')) $('btn-next').click();
      await sleep(1500);
    }
    return app.nodeId;
  },
};
