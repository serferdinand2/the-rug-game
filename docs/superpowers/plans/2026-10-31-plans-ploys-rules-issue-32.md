# Plans & Ploys rules (#32) Implementation Plan

**Goal:** a table can switch on Plans & Ploys: landmark cards (draft, goal, landmark) and the four new space tiles, with the approved look.

**Spec:** `docs/superpowers/specs/2026-10-31-plans-ploys-rules-design.md`

## Global Constraints

- docs/conventions.md throughout; engine pure, `PlayerError` for player mistakes, no `Math.random()`; `npm run check` clean; Prettier on changed files.
- A base game is unchanged: no new random calls or state reads without `'pp'`.
- Cite R111 and R112 in comments and test names.

### Task 1: Data (test first)

- [ ] `data/landmark-cards.js`: the 5 cards, their landmarks and goals.
- [ ] `data/landmarks.js`: `EXPANSION_LANDMARKS` (the 5 card landmarks and the Monolith, sourced `{ card }` and `{ spaceTile }`), `ALL_LANDMARKS`, `landmarksFor(expansions)`.
- [ ] `data/space-tiles.js`: tiles 16–19 with `expansion`, `art` and `ongoing`; `spaceTilesFor(expansions)`.
- [ ] `tests/engine-data.test.mjs` additions.

### Task 2: Setup and the draft (test first)

- [ ] `EXPANSIONS_BUILT = ['pp']`; supply: space stack, landmark supply, `supply.landmarkCards`; `seat.landmarkCard`.
- [ ] After-setup step `landmarkCards` before `start`; decision `chooseLandmarkCard` (hidden options); auto-keep the last card; solo: 2, keep 1.
- [ ] `view.js`: `landmarkCards` hidden deck.

### Task 3: The goal (test first)

- [ ] `landmarkGoal(seat, card)`; the check in `endTurn` for the ending player (R111): gain, place with `source: { landmarkCard }`, triggers, then end the turn.
- [ ] `landmarksOwned` reads every landmark.

### Task 4: The space tiles (test first)

- [ ] Ongoing tiles answer `advanced` with 5 VP (`source: { spaceTile }`).
- [ ] The Monolith tile's `landmark` effect gains and places it.

### Task 5: Invariants, views, simulation

- [ ] `checkState`: landmark cards and P&P space tiles and landmarks once each; `checkViews`: offers and deck hidden.
- [ ] The simulation plays P&P games too.

### Task 6: The client (test first where logic)

- [ ] Card data: P&P landmark cards' condition words; gallery shows them.
- [ ] `CardShelf` `landmark` kind; `DECISION_KINDS.chooseLandmarkCard`; titles, status and log words.
- [ ] Civ tab: "Landmark card", the goal line, the card, Gained.
- [ ] The placing panel's shelf and line for a card's landmark.
- [ ] Space tiles 16–19: art by slug, words from data.
- [ ] Library sections and the components README.

### Task 7: Docs and verify

- [ ] README: R111, R112 and the calls in Rules conventions; P&P in the expansion lists; current-interface screenshots (the draft and the Civ tab) from the running game.
- [ ] `docs/ui/README.md` (the mockup), `docs/status.md`, `docs/architecture.md` (new modules).
- [ ] Comments on #31, #33 and #35 with their hand-offs.
- [ ] `npm run test:unit`, `npm run check`, `PORT=3021 npx playwright test --workers=1`; commit `Fix #32: …`.
