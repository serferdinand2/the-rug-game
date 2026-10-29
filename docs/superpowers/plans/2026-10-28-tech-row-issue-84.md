# The Tech tab's display row fits its cards (#84, one item) Implementation Plan

**Spec:** `docs/superpowers/specs/2026-10-28-tech-row-design.md`

- [ ] `tests/browser/player-area.test.mjs`: every tech card's box on the Tech tab is as tall as its scaled card. Run: FAIL (120.1 px for 125.2 px).
- [ ] `PlayerTabs.svelte`: the display row's `--rg-player-tabs-height` is 298px. Run: PASS.
- [ ] Commit `Refs #84: …` (the other items of #84 are fixed elsewhere).
