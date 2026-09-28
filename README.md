# 国学小书童 · Guo Xue Storybook

An interactive 3D choose-your-own-adventure through the *Three Character Classic* (《三字经》) and *Di Zi Gui* (《弟子规》), made for children.
The player is a time-travelling young scholar who helps each story's main character decide what to do.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5178. `npm run build` writes a static site to `dist/`.

## What's inside

- **11 chapters.** Seven are from 三字经 (人之初, 孟母三迁, 玉不琢, 黄香温席, 孔融让梨, 囊萤映雪, 勤有功) and four from 弟子规 (总叙, 入则孝, 信, 读书三到).
- **Branching choices.** A "what if" choice plays out gently, then the story returns to what the source records.
- **Taps in the 3D scene.** Plant the seed, chip the jade, warm the quilt, catch fireflies, light lanterns, and tap the eye, mouth and heart.
- **Choices carry across the journey.** The seed you tend in chapter 1 blooms in the finale, with one flower per good choice.
- **Lesson cards.** Each chapter ends with the original lines (pinyin toggle), their meaning, a "try it today" prompt, and the source of the story.
- **Storyteller mode.** It plays the source-faithful path hands-free with narration, for classrooms or broadcasting.
- **Chinese, English, or bilingual.** Every line is pre-recorded with Kokoro (a local neural TTS model): British English voices (Emma as the crane guide, George as the narrator, and separate voices for parents, the old carver and the children) and matching Mandarin voices. The classic lines are pronounced from the hand-checked pinyin. Browser speech is only a fallback.
- **A living landscape.** Rolling terrain, instanced grass, flowers, forests, rocks and clouds, distant 3D mountains in haze, a low sun with soft shadows, bloom on lanterns and fireflies, and a slow camera push-in on every narrated line.

Handy URL parameters: `?ch=kongrong` jumps to a chapter, and `?auto` starts in storyteller mode.

## Sources and accuracy

The classic text is checked against Wikisource: 《弟子規》 (李毓秀) and 《三字經釋句》 (the Chinese University of Hong Kong library edition).
Where popular children's editions differ, `src/data.js` uses the common modern wording and records the variant in `note`.
Stories follow their earliest sources: 《列女传》, 《东观汉记》/《后汉书》, 《晋书》, and 《韩非子》.
Later embellishments are labelled as such; for example, the popular "little brother" twist in 孔融让梨 is noted as a later addition.

## Code map

| Path | Role |
| --- | --- |
| `src/data.js` | Classic text, pinyin, meaning, practice, sources |
| `src/story.js` | Branching story graph per chapter |
| `src/scenes-a.js`, `src/scenes-b.js` | One Three.js scene per chapter, with `setState` / `pick` / `update` |
| `src/kit.js` | Shared low-poly builders (figures, props, ink-wash mountains) |
| `src/world.js` | Renderer, sky, lighting, camera |
| `src/main.js` | Dialogue, choices, lesson cards, storyteller mode |
| `src/narrator.js` | Web Speech narration |
| `src/env.js` | Terrain, mountains and instanced set dressing (grass, flowers, trees, rocks, clouds, fences) |
| `src/sound.js` | Synthesized pentatonic music and sound effects |
| `blender/build_hall.py` | Builds `public/models/hall.glb` headless in Blender |
| `scripts/voice-manifest.mjs`, `scripts/build_voice.py` | Collect every spoken line and pre-render it to `public/voice/` |
| `scripts/shoot.mjs` | Headless screenshot of any chapter at any story node |

## Rebuilding the Blender hall

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P blender/build_hall.py
```

Set `PREVIEW=/path/to/preview.png` to also render a still.
The model's materials are named (`Wall`, `Roof`, `Pillar`, …), so each scene recolours it.
If the model fails to load, `house()` falls back to procedural geometry.

## Rebuilding the narration

```bash
uv venv --python 3.12 .venv-tts
uv pip install --python .venv-tts/bin/python kokoro-onnx soundfile 'misaki[zh]'
node scripts/voice-manifest.mjs
.venv-tts/bin/python scripts/build_voice.py
```

The Kokoro model is read from `~/.cache/hyperframes/tts` (run `npx hyperframes tts --list` once to download it).
Clips are cached by their spoken text and voice, so only changed lines are re-rendered.
English voices mispronounce pinyin names, so `RESPELL` in `build_voice.py` gives speech-only spellings.

## Visual checks

```bash
node scripts/shoot.mjs kongrong small small out.png 1280x800
```

Plays the chapter to the given story node, choosing the listed choices, and saves a screenshot.

## Deploy

```bash
npm run deploy
```

Builds the site and force-pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves.
