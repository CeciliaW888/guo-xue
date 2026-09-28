"""Pre-render every narrated line with Kokoro-82M (British English + Mandarin voices).

  node scripts/voice-manifest.mjs            # -> build/voice-lines.json
  .venv-tts/bin/python scripts/build_voice.py

Writes public/voice/<hash>.mp3 and public/voice/manifest.json. Clips are cached by
(text, voice, speed), so re-running only renders lines that changed.
Setup: uv venv --python 3.12 .venv-tts && uv pip install --python .venv-tts/bin/python kokoro-onnx soundfile 'misaki[zh]'
Needs the Kokoro model in ~/.cache/hyperframes/tts (downloaded by `npx hyperframes tts`) and ffmpeg.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata

import kokoro_onnx
import soundfile as sf
from misaki import zh

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT_DIR = os.path.join(ROOT, "public", "voice")
MODEL_DIR = os.path.expanduser("~/.cache/hyperframes/tts")

# Voice cast: (voice, speed) per speaker. English voices are all British ("b" prefix).
CAST = {
    "en": {
        "guide": ("bf_emma", 0.95), "narrator": ("bm_george", 0.93),
        "mother": ("bf_isabella", 0.95), "mengmu": ("bf_isabella", 0.95), "wife": ("bf_isabella", 0.95),
        "father": ("bm_lewis", 0.93), "zengzi": ("bm_lewis", 0.93), "carver": ("bm_fable", 0.9),
        "child": ("bf_lily", 1.0),
    },
    "zh": {
        "guide": ("zf_xiaoxiao", 0.95), "narrator": ("zm_yunyang", 0.92), "classic": ("zm_yunyang", 0.72),
        "mother": ("zf_xiaoyi", 0.95), "mengmu": ("zf_xiaoyi", 0.95), "wife": ("zf_xiaoyi", 0.95),
        "father": ("zm_yunjian", 0.93), "zengzi": ("zm_yunjian", 0.93), "carver": ("zm_yunxia", 0.88),
        "child": ("zf_xiaobei", 1.0),
    },
}
CHILDREN = {"mengzi", "kongrong", "huangxiang", "cheyin", "xiaoming", "son", "you"}

# English voices guess pinyin names badly; respell them for speech only (display text is unchanged).
RESPELL = [
    (r"\bMencius's\b", "Menshius's"), (r"\bMencius\b", "Menshius"), (r"\bHuang Xiang\b", "Hoo-ahng Shyahng"),
    (r"\bXiao Ming\b", "Shyow Ming"), (r"\bChe Yin\b", "Chuh Yin"), (r"\bZengzi's\b", "Zung-zuh's"),
    (r"\bZengzi\b", "Zung-zuh"), (r"\bDi Zi Gui\b", "Dee Zee Gway"), (r"\bZhu Xi\b", "Zhoo Shee"),
    (r"信", "sin"),
]

TONE_MARKS = {"ā": ("a", 1), "á": ("a", 2), "ǎ": ("a", 3), "à": ("a", 4), "ē": ("e", 1), "é": ("e", 2), "ě": ("e", 3), "è": ("e", 4),
              "ī": ("i", 1), "í": ("i", 2), "ǐ": ("i", 3), "ì": ("i", 4), "ō": ("o", 1), "ó": ("o", 2), "ǒ": ("o", 3), "ò": ("o", 4),
              "ū": ("u", 1), "ú": ("u", 2), "ǔ": ("u", 3), "ù": ("u", 4), "ǖ": ("v", 1), "ǘ": ("v", 2), "ǚ": ("v", 3), "ǜ": ("v", 4), "ü": ("v", 0)}


def tone3(syllable):
    """'xiāng' -> 'xiang1' (tone 5 = neutral)."""
    out, tone = "", 5
    for ch in syllable:
        if ch in TONE_MARKS:
            base, t = TONE_MARKS[ch]
            out += base
            if t:
                tone = t
        else:
            out += ch
    return out + str(tone)


def voice_for(lang, who):
    cast = CAST[lang]
    if who in cast:
        return cast[who]
    return cast["child"] if who in CHILDREN else cast["narrator"]


def main():
    lines = json.load(open(os.path.join(ROOT, "build", "voice-lines.json")))
    os.makedirs(OUT_DIR, exist_ok=True)
    kokoro = kokoro_onnx.Kokoro(os.path.join(MODEL_DIR, "models", "kokoro-v1.0.onnx"), os.path.join(MODEL_DIR, "voices", "voices-v1.0.bin"))
    g2p = zh.ZHG2P()
    manifest, made = {}, 0
    for i, item in enumerate(lines):
        voice, speed = voice_for(item["lang"], item["who"])
        text = item["text"]
        spoken = text
        if item["lang"] == "en":
            for pat, rep in RESPELL:
                spoken = re.sub(pat, rep, spoken)
        # Cache on what is actually spoken, so respelling changes re-render.
        digest = hashlib.sha1(f"{voice}|{speed}|{item.get('pinyin', '')}|{spoken}".encode()).hexdigest()[:14]
        rel = f"voice/{digest}.mp3"
        path = os.path.join(ROOT, "public", rel)
        if not os.path.exists(path):
            if item["lang"] == "zh":
                if item.get("pinyin"):
                    # Pronounce exactly as annotated (e.g. 弟 as tì, 长 as zhǎng).
                    phonemes = "".join(zh.ZHG2P.py2ipa(tone3(s)) for s in item["pinyin"].split())
                else:
                    phonemes, _ = g2p(unicodedata.normalize("NFC", text))
                samples, rate = kokoro.create(phonemes, voice=voice, speed=speed, is_phonemes=True)
            else:
                samples, rate = kokoro.create(spoken, voice=voice, speed=speed, lang="en-gb")
            with tempfile.NamedTemporaryFile(suffix=".wav") as wav:
                sf.write(wav.name, samples, rate)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav.name, "-af", "silenceremove=start_periods=1:start_threshold=-50dB",
                                "-ac", "1", "-b:a", "56k", path], check=True)
            made += 1
            print(f"[{i + 1}/{len(lines)}] {item['lang']} {item['who']:>10} {voice}: {text[:40]}", flush=True)
        manifest[item["key"]] = rel
    json.dump(manifest, open(os.path.join(OUT_DIR, "manifest.json"), "w"), ensure_ascii=False, indent=0)
    # Drop clips no longer referenced.
    keep = {os.path.basename(v) for v in manifest.values()}
    for f in os.listdir(OUT_DIR):
        if f.endswith(".mp3") and f not in keep:
            os.remove(os.path.join(OUT_DIR, f))
    print(f"rendered {made} new clips, {len(manifest)} total", file=sys.stderr)


if __name__ == "__main__":
    main()
