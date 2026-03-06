# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

## [1.0.0] - 2026-03-06

### Added
- Growth control (`flat|build`) to shape energy progression over time.
- Duration stretch control (`1..4x`) to create longer phrases.
- Drum backing expansions: clap, open hat, and perc toggles.
- Timing feel control (`tight|human|offbeat|loose`) with amount (`0..100`).
- Automatic MIDI stem export on MP3/MP4 runs (`melody`, `bass`, `drums`) with `--export-stems` override.

### Changed
- Drum rendering improved for clearer hat/percussion output in exports.

## [0.2.0] - 2026-03-06

### Added
- Single Track / AI Backing mode switch.
- Backing controls: drums, bass, metronome, swing, gate, mutate, deviate.
- Pitch controls: transpose, range, snap-to-scale.
- Modulate controls: rate, depth, target.
- Timeline event pipeline for playback/export (multi-track style events).
- Setup paths: `basic`, `surprise me`, and `advanced`.
- `Surprise me` one-step flow that auto-picks config and starts generation.

### Changed
- README expanded with new flow and CLI templates.
- Basic path simplified to a quick-start flow with sensible defaults.
- Transpose input in advanced flow changed to arrow-driven direction + amount.
- Export profile order changed to `MIDI + MP4`, `MIDI + MP3`, `MIDI only`.

## [0.1.0] - 2026-03-05

### Added
- Initial OpenNote CLI release.
- Provider support for mock/OpenAI/Gemini/Claude/Groq/Grok.
- MIDI export and optional MP3/MP4 rendering flow.
