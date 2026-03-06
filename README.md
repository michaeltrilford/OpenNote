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
npm run note -- --no-interactive --provider=mock --instrument=lead --fx=grime --decay=long --theme="dark industrial pulse" --length=16 --bpm=130 --seed-source=manual --seed=60 --export-midi=./exports/template-01-dark-grime.mid --export-audio=mp4 --open-after-export=finder
```

2. Techno bass drive
```bash
npm run note -- --no-interactive --provider=mock --instrument=bass --fx=punch --decay=tight --theme="minimal techno groove" --length=16 --bpm=132 --seed-source=manual --seed=48 --export-midi=./exports/template-02-techno-bass.mid --export-audio=mp4 --open-after-export=finder
```

3. Lush ambient pad
```bash
npm run note -- --no-interactive --provider=mock --instrument=pad --fx=lush --decay=long --theme="ambient cinematic" --length=24 --bpm=96 --seed-source=manual --seed=52 --export-midi=./exports/template-03-lush-ambient.mid --export-audio=mp4 --open-after-export=finder
```

4. Retro synthwave keys
```bash
npm run note -- --no-interactive --provider=mock --instrument=keys --fx=dark --decay=balanced --theme="synthwave retro neon" --length=16 --bpm=118 --seed-source=manual --seed=64 --export-midi=./exports/template-04-synthwave-keys.mid --export-audio=mp4 --open-after-export=finder
```

5. Trap lead sparse
```bash
npm run note -- --no-interactive --provider=mock --instrument=lead --fx=punch --decay=tight --theme="trap melodic lead" --length=12 --bpm=145 --seed-source=manual --seed=57 --export-midi=./exports/template-05-trap-lead.mid --export-audio=mp4 --open-after-export=finder
```

6. House keys groove
```bash
npm run note -- --no-interactive --provider=mock --instrument=keys --fx=clean --decay=balanced --theme="melodic house uplifting" --length=16 --bpm=124 --seed-source=manual --seed=62 --export-midi=./exports/template-06-house-keys.mid --export-audio=mp4 --open-after-export=finder
```

7. Neo-soul keys smooth
```bash
npm run note -- --no-interactive --provider=mock --instrument=keys --fx=clean --decay=long --theme="jazz neo-soul phrasing" --length=16 --bpm=92 --seed-source=manual --seed=65 --export-midi=./exports/template-07-neo-soul.mid --export-audio=mp4 --open-after-export=finder
```

8. Industrial drums
```bash
npm run note -- --no-interactive --provider=mock --instrument=drums --fx=grime --decay=tight --theme="dark industrial pulse" --length=16 --bpm=136 --seed-source=manual --seed=60 --export-midi=./exports/template-08-industrial-drums.mid --export-audio=mp4 --open-after-export=finder
```

9. Lo-fi chill line
```bash
npm run note -- --no-interactive --provider=mock --instrument=keys --fx=dark --decay=balanced --theme="lofi chillhop" --length=16 --bpm=88 --seed-source=manual --seed=58 --export-midi=./exports/template-09-lofi.mid --export-audio=mp4 --open-after-export=finder
```

10. Export-ready MP4 run
```bash
npm run note -- --no-interactive --provider=mock --instrument=lead --fx=grime --decay=long --theme="industrial" --length=16 --bpm=130 --seed-source=manual --seed=60 --export-midi=./exports/take-01.mid --export-audio=mp4 --open-after-export=finder
```

11. AI backing (techno drums + bass)
```bash
npm run note -- --no-interactive --provider=mock --mode=backing --instrument=lead --fx=punch --decay=balanced --theme="minimal techno groove" --length=16 --bpm=132 --seed-source=manual --seed=60 --transpose=0 --pitch-range=mid --snap-scale=true --mod-rate=med --mod-depth=25 --mod-target=velocity --growth=build --duration-stretch=1.5 --timing-feel=offbeat --timing-amount=35 --backing-drums=true --backing-bass=true --backing-clap=true --backing-open-hat=true --backing-perc=true --metronome=count-in --swing=18 --gate=balanced --mutate=12 --deviate=10 --export-midi=./exports/template-11-ai-backing.mid --export-audio=mp4 --open-after-export=finder
```

12. Ambient growth (long phrases + human timing)
```bash
npm run note -- --no-interactive --provider=mock --mode=single --instrument=pad --fx=lush --decay=long --theme="ambient cinematic" --length=24 --bpm=94 --seed-source=manual --seed=52 --growth=build --duration-stretch=2 --timing-feel=human --timing-amount=22 --export-midi=./exports/template-12-ambient-growth.mid --export-audio=mp4 --open-after-export=finder
```

13. Trap pocket (offbeat hats + clap)
```bash
npm run note -- --no-interactive --provider=mock --mode=backing --instrument=lead --fx=grime --decay=tight --theme="trap melodic lead" --length=16 --bpm=145 --seed-source=manual --seed=57 --growth=build --duration-stretch=1 --timing-feel=offbeat --timing-amount=45 --backing-drums=true --backing-bass=true --backing-clap=true --backing-open-hat=true --backing-perc=false --metronome=count-in --swing=10 --gate=tight --mutate=14 --deviate=12 --export-midi=./exports/template-13-trap-pocket.mid --export-audio=mp4 --open-after-export=finder
```

14. Loose industrial groove (perc heavy)
```bash
npm run note -- --no-interactive --provider=mock --mode=backing --instrument=keys --fx=dark --decay=balanced --theme="dark industrial pulse" --length=16 --bpm=132 --seed-source=manual --seed=60 --growth=build --duration-stretch=1.25 --timing-feel=loose --timing-amount=38 --backing-drums=true --backing-bass=false --backing-clap=false --backing-open-hat=true --backing-perc=true --metronome=count-in --swing=14 --gate=balanced --mutate=16 --deviate=15 --export-midi=./exports/template-14-industrial-loose.mid --export-audio=mp4 --open-after-export=finder
```

## Interactive flow
The CLI uses arrow keys + Enter and runs this setup:

1. Provider
- Demo mode (`mock`) or live provider (`openai`, `gemini`, `claude`, `groq`, `grok`)
- If provider key is missing, CLI prompts for it

2. Setup path
- `basic`: quick run with smart defaults (`single`, `lead`, `clean`, `balanced`, `mp4 + Finder`) plus style/structure/seed
- `surprise me`: instantly auto-picks full config and goes straight to generation
- `advanced`: full controls for pitch, modulation, and groove

Advanced-only steps:

3. Mode
- `single` (default): melody-only flow
- `backing`: reveals drums/bass/metronome and groove controls

4. Instrument
- `lead`, `bass`, `pad`, `keys`, `drums`

5. FX
- Preset: `clean`, `dark`, `grime`, `lush`, `punch`
- Decay: `tight`, `balanced`, `long`

6. Pitch
- `transpose` via arrow flow: direction (`Down/Neutral/Up`) + amount (`1..12`)
- `range` (`low|mid|high`)
- `snap to scale` (`on|off`)

7. Modulate
- `rate` (`off|slow|med|fast`)
- `depth` (`0..100`)
- `target` (`velocity|duration|pitch`)

8. Movement
- `growth` (`flat|build`) for song energy over time
- `duration stretch` (`1.0x..3.0x`) for longer phrase feel
- `timing feel` (`tight|human|offbeat|loose`)
- `timing amount` (`0..100`)

9. Backing controls (only when mode is `backing`)
- Drums on/off
- Bass on/off
- Clap on/off
- Open hat on/off
- Perc on/off
- Metronome (`off|count-in|always`)
- Swing (`0..100`)
- Gate (`tight|balanced|long`)
- Mutate (`0..100`)
- Deviate (`0..100`)

All paths include:

10. Style
- Preset music categories or custom theme

11. Structure
- Length (notes)
- BPM

12. Input
- `basic` and `surprise me`: manual seed
- `advanced`: `keyboard` or `manual` mode

13. Export open action
- `none`
- `finder`
- `garageband`

14. Export media profile
- `mp4` (default highlighted in prompt)
- `mp3`
- `none` (MIDI only)

15. Summary + confirm (advanced only)
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

With AI backing + groove controls:
```bash
npm run note -- --no-interactive --provider=mock --mode=backing --theme="trap melodic lead" --length=16 --bpm=140 --seed-source=manual --seed=57 --transpose=0 --pitch-range=mid --snap-scale=false --mod-rate=slow --mod-depth=20 --mod-target=velocity --growth=build --duration-stretch=1.25 --timing-feel=offbeat --timing-amount=35 --backing-drums=true --backing-bass=false --backing-clap=true --backing-open-hat=true --backing-perc=false --metronome=count-in --swing=12 --gate=tight --mutate=10 --deviate=8 --export-midi=./exports/take-backing.mid --open-after-export=finder --export-audio=mp4
```

## CLI flags
- `--provider=mock|openai|gemini|claude|groq|grok`
- `--instrument=lead|bass|pad|keys|drums`
- `--fx=clean|dark|grime|lush|punch`
- `--decay=tight|balanced|long`
- `--mode=single|backing`
- `--transpose=-12..12`
- `--pitch-range=low|mid|high`
- `--snap-scale=true|false`
- `--mod-rate=off|slow|med|fast`
- `--mod-depth=0..100`
- `--mod-target=velocity|duration|pitch`
- `--growth=flat|build`
- `--duration-stretch=1..4`
- `--timing-feel=tight|human|offbeat|loose`
- `--timing-amount=0..100`
- `--backing-drums=true|false`
- `--backing-bass=true|false`
- `--backing-clap=true|false`
- `--backing-open-hat=true|false`
- `--backing-perc=true|false`
- `--metronome=off|count-in|always`
- `--swing=0..100`
- `--gate=tight|balanced|long`
- `--mutate=0..100`
- `--deviate=0..100`
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

## Versioning
- Versioning uses SemVer: `major.minor.patch`.
- Changelog lives in `CHANGELOG.md`.
- Bump version before release:
```bash
npm run version:patch   # fixes only
npm run version:minor   # new backward-compatible features
npm run version:major   # breaking changes
```

## Export behavior
- MIDI: always supported (`.mid`)
- MP3/MP4: uses `ffmpeg-static` bundled via npm dependency
- If bundled ffmpeg is unavailable on platform, install system ffmpeg and rerun
