# The play screen's frame in one component (#105) Implementation Plan

**Goal:** `Game.svelte` and `Results.svelte` draw the header, middle and footer grid and the 3/4 + 1/4 areas through one `PlayLayout`, and look exactly as before.

**Spec:** `docs/superpowers/specs/2026-10-30-play-layout-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes: screenshots at 1920×1080 are byte-identical before and after.
- In `Game.svelte`, change only the frame's markup and its grid CSS: #116 and #122 change other parts of it at the same time.

### Task 1: Baseline

- [ ] Build `main`, serve it on a port of my own, and set up two hot-seat tables through the API: one a few turns into play, one finished.
- [ ] Screenshot the game (first-income notice, plain tracks, players overview, World Map, a second player tab), the results and the board review. Shoot twice to check they are stable.

### Task 2: Tests first

- [ ] `tests/client-play-layout.test.mjs`: each screen draws one `PlayLayout` and keeps none of the frame's grid; `PlayLayout` holds it and renders `header`, `shared`, `player`, `footer` and `overlays`.
- [ ] Run it: FAIL.

### Task 3: The component

- [ ] `src/lib/components/ui/PlayLayout.svelte`: the snippets, `sharedLabel`, `playerLabel`, `areasInert`, `--rg-play-layout-height`.
- [ ] Its library section `src/library/sections/ui/PlayLayout.svelte` (the four parts, overlays, `areasInert`) and a row in `src/lib/components/README.md`.

### Task 4: The screens

- [ ] `Game.svelte`: `PlayLayout` with `GameHeader`, `.rg-game--shared` and `.rg-game--private` as the areas' content, the panels as overlays and `TurnFooter` as `footer={turnFooter}`; drop `.rg-game`, `.rg-game--middle` and the areas' shared rules.
- [ ] `Results.svelte`: `PlayLayout` with `PageHeader`, the standings and details as `<div>`s and the results bar; drop `.rg-results`, `.rg-results--middle` and the areas' background.

### Task 5: Verify

- [ ] `npx vitest run tests/client-play-layout.test.mjs tests/library.test.mjs tests/styles.test.mjs`, then `npm run test:unit` and `npm run check`.
- [ ] Rebuild and screenshot again: byte-identical.
- [ ] Commit `Fix #105: …`.
