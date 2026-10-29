# Each decision kind's client facts in one table (#129) Implementation Plan

**Goal:** one `DECISION_KINDS` entry per engine kind (shelf, tab, confirm label, art shape), read by `prompts.js` and `area/tabs.js`, with a test that walks the engine's kinds.

**Spec:** `docs/superpowers/specs/2026-10-29-decision-kinds-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [ ] `tests/client-decision-kinds.test.mjs`: every engine kind has an entry and words, the facts are known ones, unknown kinds have none, the guard.
- [ ] Run it: FAIL.

### Task 2: The table

- [ ] `src/lib/decision-kinds.js` with `DECISION_KINDS`, `ART_SHAPES` and `kindFacts`.
- [ ] `prompts.js`: `placeOf`, `artOf` (one maker per shape), the shelf and the Confirm label from the table; `SHELVES`, `CONFIRM_LABELS` and `TRACK_ANSWERS` go.
- [ ] `area/tabs.js`: `tabFor` from the table; `TAB_OF` goes.

### Task 3: Verify

- [ ] `npm run test:unit`, `npm run check`, the browser tests on the branch's own servers.
- [ ] docs/architecture.md and docs/status.md.
- [ ] Commit `Fix #129: …`.
