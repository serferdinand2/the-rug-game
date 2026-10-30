# The track board for any number of tracks (#120) Implementation Plan

**Goal:** `TrackBoard` and `BoardSwitcher` follow the number of tracks they are given, so #35's fifth track fits, and `TrackSpace` takes the last space from `Track`.

**Spec:** `docs/superpowers/specs/2026-10-30-track-layout-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- The base game's four-track board and switcher stay pixel-identical. No arts content: no colour token, `TrackId` or spaces.

### Task 1: Tests first

- [ ] `tests/track-layout.test.mjs`: `trackMarks` for four and five tracks, `boardChoices`, the switcher's one `<svg>` and its bands, the tokens and the board's chrome, the board's counts, `last` from `Track`, `TrackSpace` and `ExplorationFace`.
- [ ] Run it: FAIL.

### Task 2: The icons

- [ ] `src/lib/board-icons.js`: `trackMarks`, `MAP_MARKS`, `ICON_VIEWBOX`, `boardChoices`.
- [ ] `BoardSwitcher`: the `tracks` prop and one `<svg>` loop.

### Task 3: The board

- [ ] `--track-heading` and `--track-prices` in `tokens.css`; `Track`'s rows use them.
- [ ] `TrackBoard`: `--rg-track-board-count`, `--rg-track-board-spaces` and the chrome from the tokens.
- [ ] `Track` passes `last`; `TrackSpace` and `ExplorationFace` take it.

### Task 4: Library and docs

- [ ] Five-track examples in the `TrackBoard` and `BoardSwitcher` sections; `last` in the `TrackSpace` and `ExplorationFace` sections.
- [ ] `src/lib/components/README.md` and `docs/architecture.md`.

### Task 5: Verify

- [ ] `npx vitest run tests/track-layout.test.mjs tests/library.test.mjs tests/styles.test.mjs tests/track-space.test.mjs`, then `npm run test:unit`, `npm run check`.
- [ ] Library screenshots at 1920×1080 before and after: the four-track board and the switchers byte-identical; five tracks fit.
- [ ] Browser (by the merger): setup-prompts, track-text, hotkeys, library.
- [ ] Commit `Fix #120: …`.
