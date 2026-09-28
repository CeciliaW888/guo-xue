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
- **Chinese, English, or bilingual.** Narration uses the browser's built-in speech voices.

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
| `blender/build_hall.py` | Builds `public/models/hall.glb` headless in Blender |

## Rebuilding the Blender hall

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P blender/build_hall.py
```

Set `PREVIEW=/path/to/preview.png` to also render a still.
The model's materials are named (`Wall`, `Roof`, `Pillar`, …), so each scene recolours it.
If the model fails to load, `house()` falls back to procedural geometry.

## Deploy

```bash
npm run deploy
```

Builds the site and force-pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves.
