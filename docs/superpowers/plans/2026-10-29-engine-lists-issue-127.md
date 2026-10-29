# The track, resource and building lists from the engine (#127) Implementation Plan

**Goal:** each id list exists once in the client, read from the engine, and a new engine track can't be left out silently.

**Spec:** `docs/superpowers/specs/2026-10-29-engine-lists-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [ ] `tests/client-id-lists.test.mjs`: the lists match the engine; every engine track has a name, a symbol, a tint, a board track and a player-card track; the source guard.
- [ ] `client-shortcuts`: the keys from `TRACK_KEYS` and `TAB_KEYS`.
- [ ] Run them: FAIL.

### Task 2: The lists

- [ ] `ui.js`: `TRACKS` from `TRACK_IDS`, `RESOURCE_ORDER` and `RESOURCES` from it, `TrackId` from the engine.
- [ ] `hotkeys.js` (`TRACK_KEYS`, `TAB_KEYS`), `shortcuts.js`, `prompts.js`, `glyphs.js`, `describe.js`, `area/players.js`, `board.js`, `prompt-state.svelte.js`, `IncomeNotice` and the library sections.

### Task 3: Verify

- [ ] `npm run test:unit`, `npm run check`, the browser tests on the branch's own servers.
- [ ] docs/architecture.md and docs/status.md.
- [ ] Commit `Fix #127: …`.
