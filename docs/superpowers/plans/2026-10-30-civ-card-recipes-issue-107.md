# CivilizationCard drawn from data (#107) Implementation Plan

**Goal:** `CivilizationCard` draws every civilization from a recipe built from the engine's data, takes the table's rules version, and stays pixel-identical.

**Spec:** `docs/superpowers/specs/2026-10-30-civ-card-recipes-design.md`

### Task 0: Baseline

- [x] Screenshots of every civilization card on main: the review page in both states, the library's 41 cards and the gallery's 41, from a dev server on its own port.

### Task 1: Tests first

- [x] `tests/client-civ-cards.test.mjs`: recipes for every base civilization, numbers from the engine, the Entertainers' links, the version's setup line, the sample views, no branches or `/art/` literals, server renders. They fail.

### Task 2: The engine's numbers

- [x] Named exports in `src/lib/engine/civs/` for the values the card needs and the engine held privately; no behaviour change.

### Task 3: The recipe

- [x] `src/lib/cards/civ-cards.js`: `civCard(id, { version, view })` with text segments, effect boxes and sections.
- [x] `reviewed-civilizations.js`: review status and `SAMPLE_VIEWS`; `SAMPLE_CIV_DATA` moves here from `civ-card.js`.

### Task 4: The components

- [x] `CardEffectBox` takes `pictogram`, with the pictogram styles moved out of `card-patterns.css`; its library section shows each.
- [x] `CivilizationCard` becomes one layout over the recipe, with `version`; the game's tabs and overview pass the table's version.

### Task 5: Check

- [x] `npm run check`, the unit tests, the card browser tests, Prettier, and the screenshots compared byte for byte.
