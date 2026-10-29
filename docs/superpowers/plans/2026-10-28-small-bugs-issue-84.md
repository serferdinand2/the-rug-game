# Small bugs from the client scan (#84, four of nine) Implementation Plan

**Goal:** Fix TV Station's name, "an armory", the landmark's rotate title and `CardRewardColumns`' class.

**Spec:** `docs/superpowers/specs/2026-10-28-small-bugs-design.md`

## Global Constraints

- docs/conventions.md throughout; Prettier on the changed files only; `npm run check` clean.
- Every commit is `Refs #84: …`: the other five items are fixed elsewhere.
- Don't edit `src/lib/art/catalog.js`: import it.

### Task 1: Landmark names from the catalog

- [x] Failing tests: `landmarkName('tv-station')` is "TV Station"; a hex label names a TV Station.
- [x] `landmarkName` reads `ASSETS`; `hexmap.js` calls it. PASS. Commit.

### Task 2: "an armory"

- [x] `IncomeMat`'s covered label uses `article()` (no test fits: the label is markup until #125).

### Task 3: The rotate title and the dropped class

- [x] `LandmarkPiece`'s rotate title says "Rotate (. or ,)".
- [x] `CardRewardColumns` merges the caller's class for both kinds.
- [x] `npm run check`, `tests/library.test.mjs`; browser `player-area`. Commit.
