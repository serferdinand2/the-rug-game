# A territory's face, drawn once (#113) Implementation Plan

**Goal:** `TerritoryArt` draws every territory face from `territoryShapes`, and `territoryWords` words every tile.

**Spec:** `docs/superpowers/specs/2026-10-28-territory-face-design.md`

## Global Constraints

- Pixel-identical: same images, lines and polygons, in the same order, with the same rendering.
- Conventions: JSDoc, Prettier on the changed files only, `npm run check` clean; a library section and a README row per new component.
- `explore-prompt.test.mjs` belongs to #79: run it, don't edit it.
- Commits: `Refs #113: …` for steps, `Fix #113: …` for the last.

### Task 1: The shapes and the words, test-first

**Files:** `tests/client-hexmap.test.mjs`, `tests/client-area-explore.test.mjs`, `src/lib/hexmap.js`, `src/lib/area/explore.js`.

- [ ] Tests for `territoryShapes`, `territoryClips` and `territoryWords`, and `tileWords` built from it. Run: FAIL.
- [ ] Implement them in `hexmap.js`; `hexLabel` and `tileWords` use `territoryWords`. Run: PASS.

### Task 2: TerritoryClips and TerritoryArt

**Files:** `src/lib/components/board/TerritoryClips.svelte`, `TerritoryArt.svelte`, their library sections in `src/library/sections/board/`, `src/lib/components/README.md`.

- [ ] Sections first (a coast, islands of 1 and 4 parts, clouds, a volcano, a smaller size; no printed tile is all land); the library test fails until the components exist. Implement. Library and style tests PASS.

### Task 3: The three users

**Files:** `WorldMap.svelte`, `TerritoryTile.svelte`, `prompts/PromptArt.svelte`.

- [ ] `WorldMap` and `TerritoryTile` draw `TerritoryClips` and `TerritoryArt`; their copied face code and CSS go. `PromptArt` uses `tilePreview`.
- [ ] Compare the library's WorldMap, TerritoryTile, TilePicker and PromptArt sections before and after, at 1920×1080: identical.
- [ ] `npm run check` clean; the map and explore browser tests pass.
- [ ] Commit `Fix #113: …`.
