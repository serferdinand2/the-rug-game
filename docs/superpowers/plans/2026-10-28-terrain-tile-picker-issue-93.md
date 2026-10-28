# TilePicker draws the Terrain tab's pickable tiles (#93) Implementation Plan

**Goal:** The Terrain tab draws its territory tiles with `TilePicker`, so the picked look lives in one component.

**Spec:** `docs/superpowers/specs/2026-10-28-terrain-tile-picker-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- The decision panel's picker looks the same; the Terrain tab's tiles look the same except a picked tile's hover (spec §3).
- `tests/browser/pick-prompts.test.mjs` belongs to #79: run it, never edit it.

### Task 1: Tests first

- [ ] `tests/tile-picker.test.mjs`: `pickable`, the default, `size`, `dataIdPrefix`, and the Terrain tab's source has no tile button of its own. Run: FAIL.

### Task 2: TilePicker

- [ ] `size`, `pickable`, `dataIdPrefix`; the rest and hover fills as custom properties by size; a picked tile keeps its fill on hover; `cursor: default` when disabled.
- [ ] The library section: large with plain and pickable tiles mixed, picked and disabled.

### Task 3: PlayerTabs

- [ ] The Terrain tab draws `TilePicker size="large"` with `pickable`, `selected`, `disabled`, `dataIdPrefix="terrain-tile"`; drop the copied button and CSS.

### Task 4: Verify

- [ ] Vitest: the new file, `library`, `styles`; `npm run check`.
- [ ] Browser: `pick-prompts`, `explore-prompt`, `player-area`, `library`.
- [ ] Commit `Fix #93: …`.
