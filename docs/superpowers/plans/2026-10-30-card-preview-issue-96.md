# One CardPreview component for a card shown in full (#96) Implementation Plan

**Goal:** one component draws a card in full, and no caller builds card data for it.

**Spec:** `docs/superpowers/specs/2026-10-30-card-preview-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [x] `tests/client-prompt-state.test.mjs`: `inspectShelf()` on an invent's shelf (a card, the deck, null), `inspectPick()` on a tapestry payment, and the source guard.
- [x] Run: the new tests FAIL.

### Task 2: The component

- [x] `src/lib/components/player/CardPreview.svelte` with the overlay CSS moved from `Game.svelte`; `kind` with `id` or `data`.
- [x] `src/library/sections/player/CardPreview.svelte` and the README row.

### Task 3: The callers

- [x] `Inspected` is `{ kind, id?, data?, side? }`; the prompt state passes the shelf's face (#118).
- [x] `CardFan` reports `{ index, item }`; its library section, `TechRows` and `CardShelf` read `item`.
- [x] `PlayerTabs.inspect(kind, id, event)` reports `{ kind, id }`; the index look-ups go.
- [x] `Game.svelte` renders `CardPreview` and drops its overlay CSS.

### Task 4: Verify

- [x] `npx vitest run tests/client-prompt-state.test.mjs tests/library.test.mjs tests/styles.test.mjs tests/client-prompts.test.mjs`, `npm run check`.
- [x] Browser: `player-area` hovers a display card and sees the preview; `library`, `pick-prompts`, `decision-prompt`, `setup-prompts`.
- [x] Commit `Fix #96: …`.
