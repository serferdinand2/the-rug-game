# Every game name and English list from one helper (#123) Implementation Plan

**Goal:** each game name and English helper is one tested function in `words.js` or `game-names.js`, and the copies go.

**Spec:** `docs/superpowers/specs/2026-10-29-game-names-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes in a real game.

### Task 1: Tests first

- [ ] `tests/client-words.test.mjs`: every helper; the amount tests from `client-describe` and `ordinal`'s from `client-results` move here.
- [ ] `tests/client-game-names.test.mjs`: every name, the moved name tests from `client-describe` and `ui.test.mjs`, all 33 landmarks, the trap copies, the seat and hex fallbacks, and the source guard.
- [ ] `client-hexmap`: the one hex form.
- [ ] Run them: FAIL.

### Task 2: The modules

- [ ] `src/lib/words.js` from `describe.js` and `results.js`.
- [ ] `src/lib/game-names.js` from `describe.js` and `ui.js`, with `tapestryCardOf`, `civilizationOf` and `achievementName`.
- [ ] The two new test files pass.

### Task 3: The callers

- [ ] `describe.js`, `ui.js`, `log.js`, `hexmap.js`, `picks.js`, `results.js`, `turn.js`, `pass.js`, `dice.js`, `civ-card.js`, `board.js` and `area/`.
- [ ] The components and screens that named things.
- [ ] The source guard passes.

### Task 4: Verify

- [ ] `npm run test:unit`, `npm run check`, then `npm run test:e2e`.
- [ ] docs/architecture.md and docs/status.md.
- [ ] Commit `Fix #123: …`.
