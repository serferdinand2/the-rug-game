# Civilization choices made on the card (#78) Implementation Plan

**Goal:** the six civilizations' cards show their live state, and their choices are made on the card in the Civ tab.

**Spec:** `docs/superpowers/specs/2026-10-29-civ-card-choices-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- The library's existing CivilizationCard examples stay byte-identical.
- The issue stays open (`Refs #78`) until the owner approves the library section.

### Task 1: The card's state (tests first)

- [ ] `tests/client-civ-card.test.mjs`, then `src/lib/civ-card.js`; export the Historians' squares and the Mystics' prophecies.

### Task 2: The prompt (tests first)

- [ ] `tests/client-prompt-state.test.mjs` and `tests/client-prompts.test.mjs`, then `place: 'card'`, the `card` layout and its instruction in `prompts.js`, and `spot`, `selectSpot` and `civPick` in `PromptState`.

### Task 3: The card

- [ ] `CivilizationCard`: `live`, `seat`, `selected`, `onCivilizationCardPick`; `CardSlot` buttons; the library's live and choosing examples; screenshots of the existing examples before and after.

### Task 4: The screens

- [ ] The Civ tab and the players overview draw the live card; `Game.svelte` passes `civPick` and `selectSpot`.
- [ ] `tests/browser/civ-card.test.mjs`.

### Task 5: Verify and record

- [ ] `npm run check`, the full Vitest and Playwright suites.
- [ ] The README, `docs/ui/README.md` and `docs/ui/screens/` show the new Civ tab; `docs/status.md` and `docs/architecture.md`.
- [ ] Commit `Refs #78: …` and push.
