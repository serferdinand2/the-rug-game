# A player's capital and tech rows drawn once (#94) Implementation Plan

**Goal:** `PlayerTabs` and `PlayersOverview` draw a capital with `CapitalCity` and the tech rows with `TechRows`, and keep no copy of either.

**Spec:** `docs/superpowers/specs/2026-10-30-capital-tech-rows-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Pixel-identical: the looks the two screens differ in stay as they are, and go to the owner as questions.

### Task 1: Before

- [ ] Play a hot-seat game through the API to seats with tech cards and landmarks; screenshot the Capital and Tech tabs (own and another seat's) and the overview's capital and tech (mounted in a scratch page), twice, to check the capture is deterministic.

### Task 2: Tests first

- [ ] `tests/capital-tech-rows.test.mjs`: `TECH_ROWS`, `CapitalCity`, `TechRows` in both layouts, the Capital and Tech tabs, the source guard on both screens.
- [ ] Run it: FAIL.

### Task 3: The components

- [ ] `src/lib/area/tech-rows.js`.
- [ ] `CapitalCity.svelte` and `TechRows.svelte`, roots `display: contents`, the title gap a custom property.
- [ ] `PlayerTabs` and `PlayersOverview` use them; their copies and CSS go.
- [ ] Library sections, README rows, `docs/architecture.md`.

### Task 4: Verify

- [ ] Screenshot again and compare byte for byte.
- [ ] `npx vitest run tests/capital-tech-rows.test.mjs tests/library.test.mjs tests/styles.test.mjs tests/scaled-card.test.mjs tests/client-area-inspect.test.mjs tests/tabs.test.mjs`, `npm run check`.
- [ ] Browser: `player-area`, `opponent-tabs`, `hotkeys`, `library`.
- [ ] Commit `Fix #94: …`.
