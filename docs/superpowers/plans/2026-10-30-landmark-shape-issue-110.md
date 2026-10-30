# One component draws a landmark's footprint (#110) Implementation Plan

**Goal:** `LandmarkShape` draws a landmark's footprint; `LandmarkPiece` and `LandmarkCard` use it, and the screens look the same.

**Spec:** `docs/superpowers/specs/2026-10-30-landmark-shape-design.md`

### Task 1: Tests first

- [x] `tests/placement.test.mjs`: `pictureTransform` for each turn, and `fillPath` with a gap. Run them: FAIL.

### Task 2: The geometry

- [x] `pictureTransform` and `fillPath`'s gap in `src/lib/placement.js`. The tests pass.

### Task 3: The component

- [x] `src/lib/components/player/LandmarkShape.svelte`, its library section and its row in `src/lib/components/README.md`.
- [x] `LandmarkPiece` draws with it, the drag image through its bindable `element`; `LandmarkCard` draws the plain plots with it, and `landmark-card.css` drops the span grid.

### Task 4: Verify

- [x] `npm run check`; `tests/library.test.mjs`, `styles`, `placement`, `art-landmark-card`, `art-landmarks` and `client-area-placement`.
- [x] Before-and-after screenshots of the LandmarkPiece, CapitalGrid, PlacementTray and LandmarkCard sections.
- [x] `tests/browser/library.test.mjs`.
- [x] Commit `Fix #110: …`.
