// Collects every line the app speaks, for scripts/build_voice.py.
// Keys must match Narrator.key(): `${lang}|${who}|${text}`.
import { writeFileSync } from 'node:fs';
import { CHAPTERS } from '../src/data.js';
import { STORIES, LANTERNS, SCENE_LINES, UI_LINES } from '../src/story.js';

const items = new Map();
const add = (lang, who, text, extra = {}) => {
  const key = `${lang}|${who}|${text}`;
  if (!items.has(key)) items.set(key, { key, lang, who, text, ...extra });
};
const both = (line) => { add('zh', line.who, line.zh); add('en', line.who, line.en); };

for (const story of Object.values(STORIES)) {
  for (const node of Object.values(story)) (node.say || []).forEach(both);
}
LANTERNS.forEach((l) => both({ who: 'guide', ...l }));
Object.values(SCENE_LINES).forEach(both);
Object.values(UI_LINES).forEach(both);
for (const ch of CHAPTERS) {
  // The classic is always read in Mandarin, pronounced from the hand-checked pinyin.
  ch.lines.forEach(([han, py]) => add('zh', 'classic', han, { pinyin: py }));
  add('zh', 'narrator', ch.meaning.zh);
  add('en', 'narrator', ch.meaning.en);
}

const out = process.argv[2] || 'build/voice-lines.json';
writeFileSync(out, JSON.stringify([...items.values()], null, 1));
console.log(`${items.size} lines -> ${out}`);
