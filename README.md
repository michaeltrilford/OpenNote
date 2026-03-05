# OpenNote

One note, unlimited vibes.

## Setup
```bash
npm install
```

## Run
```bash
npm run start
```

## Interactive flow
The CLI uses arrow keys + Enter and runs this setup:

1. Provider
- Demo mode (`mock`) or live provider (`openai`, `claude`)
- If provider key is missing, CLI prompts for it

2. Style
- Preset music categories or custom theme

3. Structure
- Length (notes)
- BPM

4. Input
- `keyboard` mode: press `1-8`, `Shift+1-8` for sharps, `+/-` octave
- `manual` mode: enter MIDI seed pitch (`0-127`)

5. Export open action
- `none`
- `finder`
- `garageband`

6. Export media profile
- `none` (MIDI only)
- `mp3`
- `mp4`

7. Summary + confirm
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
npm run start -- --no-interactive --provider=mock --theme="ambient" --length=16 --bpm=120 --seed-source=manual --seed=60
```

With export + Finder reveal:
```bash
npm run start -- --no-interactive --provider=mock --theme="ambient" --length=16 --bpm=120 --seed-source=manual --seed=60 --export-midi=./exports/take-01.mid --open-after-export=finder --export-audio=mp4
```

## CLI flags
- `--provider=mock|openai|claude`
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
- Claude: `ANTHROPIC_API_KEY` (optional `CLAUDE_MODEL`)

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
