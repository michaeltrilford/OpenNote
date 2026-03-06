# OpenNote

One note, unlimited vibes.

## Setup
```bash
npm install
```

## Run
```bash
npm run note
```

## Quick templates
Copy/paste one:

1. Dark grime lead
```bash
npm run note -- --no-interactive --provider=mock --instrument=lead --fx=grime --decay=long --theme="dark industrial pulse" --length=16 --bpm=130 --seed-source=manual --seed=60
```

2. Techno bass drive
```bash
npm run note -- --no-interactive --provider=mock --instrument=bass --fx=punch --decay=tight --theme="minimal techno groove" --length=16 --bpm=132 --seed-source=manual --seed=48
```

3. Lush ambient pad
```bash
npm run note -- --no-interactive --provider=mock --instrument=pad --fx=lush --decay=long --theme="ambient cinematic" --length=24 --bpm=96 --seed-source=manual --seed=52
```

4. Retro synthwave keys
```bash
npm run note -- --no-interactive --provider=mock --instrument=keys --fx=dark --decay=balanced --theme="synthwave retro neon" --length=16 --bpm=118 --seed-source=manual --seed=64
```

5. Trap lead sparse
```bash
npm run note -- --no-interactive --provider=mock --instrument=lead --fx=punch --decay=tight --theme="trap melodic lead" --length=12 --bpm=145 --seed-source=manual --seed=57
```

6. House keys groove
```bash
npm run note -- --no-interactive --provider=mock --instrument=keys --fx=clean --decay=balanced --theme="melodic house uplifting" --length=16 --bpm=124 --seed-source=manual --seed=62
```

7. Neo-soul keys smooth
```bash
npm run note -- --no-interactive --provider=mock --instrument=keys --fx=clean --decay=long --theme="jazz neo-soul phrasing" --length=16 --bpm=92 --seed-source=manual --seed=65
```

8. Industrial drums
```bash
npm run note -- --no-interactive --provider=mock --instrument=drums --fx=grime --decay=tight --theme="dark industrial pulse" --length=16 --bpm=136 --seed-source=manual --seed=60
```

9. Lo-fi chill line
```bash
npm run note -- --no-interactive --provider=mock --instrument=keys --fx=dark --decay=balanced --theme="lofi chillhop" --length=16 --bpm=88 --seed-source=manual --seed=58
```

10. Export-ready MP4 run
```bash
npm run note -- --no-interactive --provider=mock --instrument=lead --fx=grime --decay=long --theme="industrial" --length=16 --bpm=130 --seed-source=manual --seed=60 --export-midi=./exports/take-01.mid --export-audio=mp4 --open-after-export=finder
```

## Interactive flow
The CLI uses arrow keys + Enter and runs this setup:

1. Provider
- Demo mode (`mock`) or live provider (`openai`, `gemini`, `claude`, `groq`, `grok`)
- If provider key is missing, CLI prompts for it

2. Instrument
- `lead`, `bass`, `pad`, `keys`, `drums`

3. FX
- Preset: `clean`, `dark`, `grime`, `lush`, `punch`
- Decay: `tight`, `balanced`, `long`

4. Style
- Preset music categories or custom theme

5. Structure
- Length (notes)
- BPM

6. Input
- `keyboard` mode: press `1-8`, `Shift+1-8` for sharps, `+/-` octave
- `manual` mode: enter MIDI seed pitch (`0-127`)

7. Export open action
- `none`
- `finder`
- `garageband`

8. Export media profile
- `none` (MIDI only)
- `mp3`
- `mp4`

9. Summary + confirm
- `Start generation`
- `Back to setup`

After playback, action menu order is:
1. `Export MIDI + <open action> + finish`
2. `Export MIDI + <open action> + retry`
3. `Retry (new take)`
4. `Finish`

Notes:
- Export path auto-generates timestamped filename under `./exports/` unless `--export-midi=...` is provided.
- MP4 cover image is fixed to `./src/assets/cover.png` (replace that file in the repo to change cover art).

## Cover art workflow
- Replace `./src/assets/cover.png` with your own image.
- Drag your image into Figma or Affinity, design album art, export as PNG.
- Save it back to `./src/assets/cover.png`.
- Run OpenNote and export MP4.
- Start making music.

## Non-interactive usage
```bash
npm run note -- --no-interactive --provider=mock --theme="ambient" --length=16 --bpm=120 --seed-source=manual --seed=60
```

With export + Finder reveal:
```bash
npm run note -- --no-interactive --provider=mock --theme="ambient" --length=16 --bpm=120 --seed-source=manual --seed=60 --export-midi=./exports/take-01.mid --open-after-export=finder --export-audio=mp4
```

## CLI flags
- `--provider=mock|openai|gemini|claude|groq|grok`
- `--instrument=lead|bass|pad|keys|drums`
- `--fx=clean|dark|grime|lush|punch`
- `--decay=tight|balanced|long`
- `--theme="..."`
- `--length=<notes>`
- `--bpm=<tempo>`
- `--seed=<0-127>`
- `--seed-source=keyboard|manual`
- `--beep=true|false`
- `--export-midi=<path.mid>`
- `--open-after-export=none|finder|garageband`
- `--export-audio=none|mp3|mp4`
- `--no-interactive`
- `--help`

## Provider keys
- OpenAI: `OPENAI_API_KEY` (optional `OPENAI_MODEL`)
- Gemini: `GEMINI_API_KEY` (optional `GEMINI_MODEL`)
- Claude: `ANTHROPIC_API_KEY` (optional `CLAUDE_MODEL`)
- Groq: `GROQ_API_KEY` (optional `GROQ_MODEL`)
- Grok (xAI): `XAI_API_KEY` (optional `GROK_MODEL`)

## npm publish checklist
1. Keep `"private": true` during development to prevent accidental publish.
2. Run pack preview:
```bash
npm run pack:check
```
3. When ready to publish, set `"private": false` in `package.json`.
4. Publish:
```bash
npm publish
```

## Export behavior
- MIDI: always supported (`.mid`)
- MP3/MP4: uses `ffmpeg-static` bundled via npm dependency
- If bundled ffmpeg is unavailable on platform, install system ffmpeg and rerun
