# The game header as a screen part (#90) Implementation Plan

**Goal:** `Game.svelte` renders one `GameHeader`, and a tested `playerChips()` gives its chips.

**Spec:** `docs/superpowers/specs/2026-10-29-game-header-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [ ] `tests/client-area-players.test.mjs`: `playerChips` (order, VP, current, "Setting up", the civilization and its ability) and the source guard.
- [ ] Run it: FAIL.

### Task 2: The module and the part

- [ ] `playerChips` and the shared `civilizationOf` in `src/lib/area/players.js`.
- [ ] `src/screens/game/GameHeader.svelte`; `Game.svelte` renders it and drops the chips, clock, Undo, log button, `nameOf` and the dot's CSS.

### Task 3: Verify

- [ ] Header screenshots on one table, before and after, byte for byte.
- [ ] `npx vitest run tests/client-area-players.test.mjs tests/library.test.mjs tests/styles.test.mjs`, `npm run check`.
- [ ] Browser: hotkeys, first-income, game, pass-screen, menu, results.
- [ ] Commit `Fix #90: …`.
