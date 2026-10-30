# The engine's options decide where a landmark moves on CapitalGrid (#112) Implementation Plan

**Goal:** an unlocked landmark on CapitalGrid moves, turns and snaps only among the engine's positions, overhanging ones included, with the geometry in tested modules.

**Spec:** `docs/superpowers/specs/2026-10-30-landmark-positions-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes. LandmarkPiece's markup is left alone (#110).

### Task 1: Tests first

- [ ] `tests/placement.test.mjs`: `fitsAt`, `snapAmong`, `stepAmong`, `turnAmong`, `overhangReach`, `overhangOffset`, `plotFromPointer`.
- [ ] `tests/capital.test.mjs`: `plotPosition`.
- [ ] `tests/client-area-placement.test.mjs`: `landmarkPositions`, `optionAt`, and the real game's positions; `nextRotation`'s tests move to `turnAmong`.
- [ ] Run them: FAIL.

### Task 2: The geometry

- [ ] `placement.js`, `capital.js` and `placement-targets.js`; remove `nextRotation`.
- [ ] The Vitest files pass.

### Task 3: The grid and the screen

- [ ] `CapitalGrid`: the `positions` prop, the handlers through the new functions, `GRID_SIZE` for the 9s, `BUILDING_IDS`, one surface rule.
- [ ] `PlayerTabs`: pass the positions; moves and turns find their option with `optionAt`.
- [ ] The library: one example with positions over the edge, and its browser test.

### Task 4: Check

- [ ] `npm run check`, the Vitest files, `tests/browser/library.test.mjs` and `tests/browser/player-area.test.mjs`.
