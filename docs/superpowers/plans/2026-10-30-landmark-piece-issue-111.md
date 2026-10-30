# LandmarkPiece owns its drag data, focus and keys (#111) Implementation Plan

**Goal:** no parent queries `LandmarkPiece`'s markup; its keys, label and titles are a tested module whose keys How to play lists.

**Spec:** `docs/superpowers/specs/2026-10-30-landmark-piece-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen, under the keyboard or under the mouse changes.
- Keep clear of #112: `CapitalGrid`'s snapping stays as it is.

### Task 1: Tests first

- [ ] `tests/client-landmark-keys.test.mjs`: `landmarkKeyAction`, `landmarkLabel`, `LANDMARK_TITLES`, the keys against `SHORTCUTS`, `TurnControl`'s keys, and the source guard.
- [ ] `tests/placement.test.mjs`: `grabAt`, `writeGrab`, `readGrab`.
- [ ] `tests/client-shortcuts.test.mjs`: the placing keys from the modules.
- [ ] Run them: FAIL.

### Task 2: The modules

- [ ] `TURN_KEYS` in `hotkeys.js`, read by `hotkeyAction`.
- [ ] `src/lib/landmark-keys.js`.
- [ ] `grabAt`, `writeGrab`, `readGrab` in `placement.js`.
- [ ] `shortcuts.js` lists the Exploring and placing group from them.

### Task 3: The components

- [ ] `LandmarkPiece`: its drag, `focus()`, the module's keys, label and titles; the two new callbacks in its typedef.
- [ ] `CapitalGrid` and `PlacementTray`: the callbacks, `bind:this` and `focus()`; no `querySelector`, `setDragImage` or `GRAB_TYPE`.
- [ ] `TurnControl`: titles and hint from `TURN_KEYS`.
- [ ] Library: LandmarkPiece's description, the capital example's stale "R rotates"; the components README row.

### Task 4: Verify

- [ ] `npm run test:unit`, `npm run check`.
- [ ] Browser (after merging): `library`, `player-area`, `hotkeys`.
- [ ] Commit `Fix #111: …`.
