# The player area's words from shared helpers, and its resources as ResourceChips (#125) Implementation Plan

**Goal:** `SelfSummary` draws `ResourceChip`s, and the income mat's and era slots' words come from `src/lib/area/income.js`, with nothing changing on screen.

**Spec:** `docs/superpowers/specs/2026-10-29-player-area-words-design.md`

## Global Constraints

- docs/conventions.md throughout. Components stay presentational; the words live in plain, tested modules.
- Pixel-identical: screenshot the six library sections (SelfSummary, ResourceChip, IncomeMat, EraSlots, PlayerCard, IncomeNotice) before the change and compare after.
- Commits are `Fix #125: …`.

### Task 1: pluralOf

**Files:** `src/lib/words.js`, `src/lib/describe.js`; tests in `tests/client-words.test.mjs` and `tests/client-game-names.test.mjs`.

- [ ] Failing tests: `pluralOf('Market')`, `pluralOf('Armory')`, `pluralOf('Day')`; the source guard rejects `ROW_NAMES`, `RESOURCE_ROWS`, a hand-built "ies" plural and a `pluralOf` defined outside `words.js`.
- [ ] Add `pluralOf`; `gainNouns` uses it. The `client-describe` test still reads "Gain 2 Armories".

### Task 2: the words in income.js

**Files:** `src/lib/area/income.js`, `IncomeMat.svelte`, `EraSlots.svelte`; tests in `tests/client-area-income.test.mjs`.

- [ ] Failing tests: rows' `name`, spaces' `label`, slots' `heading` and `text`.
- [ ] `incomeRows()` and `eraSlots()` return them; `IncomeMat` drops `ROW_NAMES` and its inline label, `EraSlots` its ternary and heading. PASS.

### Task 3: ResourceChip in SelfSummary

**Files:** `ResourceChip.svelte`, `SelfSummary.svelte`, their library sections, `src/lib/components/README.md`.

- [ ] `ResourceChip` gains `changed` and `size`; the library section shows both.
- [ ] `SelfSummary` draws four medium chips and drops `RESOURCE_ROWS`, `ResourceIcon` and the chip CSS.
- [ ] Screenshot and compare the six sections.

### Task 4: check and record

- [ ] `npm run check`, `npm run format`, `npm run test:unit`, `npm run test:e2e`.
- [ ] `docs/status.md`: the summary and #125's entry.
- [ ] Commit `Fix #125: …`, push, open the pull request.
