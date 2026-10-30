# AI Singularity's token on the board (#147) Implementation Plan

**Goal:** the track board and the player cards read a track whose token AI Singularity took off as complete (12), as the engine does.

**Spec:** `docs/superpowers/specs/2026-10-30-ai-singularity-lane-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- No engine rule changes: the engine already follows 01 §3.4, FAQ #9 and R109.
- Keep clear of the parallel work: #144 (tech cards), #145 (player sidebar and header), #153 (a mockup).

### Task 1: Reproduce

- [x] Play AI Singularity through the engine and read `trackBoard` and `playerCards`: the technology lane is at 0.

### Task 2: Tests first

- [x] `tests/client-board.test.mjs` and `tests/client-area-players.test.mjs`: the restarted track reads 12, the other tracks their most advanced token. Run them: FAIL (0, not 12).

### Task 3: Fix

- [x] Export `spacesAdvanced` from `game.js`; `trackBoard` and `playerCards` use it.

### Task 4: Verify

- [x] The two test files, `npx vitest run tests/simulation.test.mjs` and `npm run check`.
- [x] Commit `Fix #147: …`.
