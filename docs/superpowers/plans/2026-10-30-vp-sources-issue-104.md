# One VP sources list for the scoreboard and the standings (#104) Implementation Plan

**Goal:** `ScoreBoard` and `StandingRow` draw their VP sources with one `VpSources` component, and `scoreboard()` words the tiebreak line.

**Spec:** `docs/superpowers/specs/2026-10-30-vp-sources-design.md`

### Task 1: Tests first

- [x] `client-results`: the tiebreak line (landmark, none, plural, original rules), `VpSources` rendered in each state, and both components using it. Run them: FAIL.

### Task 2: The component and the words

- [x] `tiebreakLine` and `ScoreRow.tiebreak` in `results.js`.
- [x] `results/VpSources.svelte`; `ScoreBoard` and `StandingRow` use it and drop their list CSS; `ScoreBoard` draws `row.tiebreak`.
- [x] Library sections (`results/VpSources`, `log/ScoreBoard` built with `tiebreakLine`) and the components README row; the results browser test's selector.

### Task 3: Verify

- [x] `npm run check`, `client-results`, `library` and `styles` under Vitest, the results and library browser tests.
- [x] Commit `Fix #104: …`.
