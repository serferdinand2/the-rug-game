# A&A content, part 1: the tech deck and the 11 tech cards (#37) — plan

> Built inline in the main session (owner's standing rule), test-first, no agents. Steps use `- [ ]`.

**Goal:** a table with Arts & Architecture deals A&A's 11 tech cards (7 without the arts track, R124), and every one plays, the landmark-on-this-card cards included.

**Architecture:** the cards are data in `data/tech-cards.js`, played by effects that already exist (advance, gain, create, inspire, anyBuilding, exploreSpace, vp per space). New: two prerequisite shapes (`{ landmark: true }`, `{ none: true }`), Oil Paint's original-version "you only" (R125), an upgrade that ignores prerequisites (Duct Tape), and a landmark tech card as a place for a gained landmark (`{ tech: id }`, R126), which upgrades it at once.

**Spec:** [2026-11-08-aa-content-design.md](../specs/2026-11-08-aa-content-design.md) §4, §5.

## Global constraints

- A game without `'aa'` is unchanged, seed for seed: no new draw, no new state field.
- Every number as 03 §2's A&A tech table; rule ids cited in code and tests (R124–R126).
- JSDoc, Prettier on changed files only, `npm run check` clean.
- Each new event has a log line, each new answer has decision words: nothing shows as raw data.

## Rulings made while planning

- **The tapestry and civilization decks gain A&A's cards in parts 2 and 3**, with their data, not in part 1 as §4 lists them: a card in a deck before its data exists would break every A&A game. Cost if wrong: none; it's order only.
- **Where a landmark on a tech card lives:** `seat.techLandmarks: Record<card, landmark>`, created at setup only with A&A. A discarded tech card's landmark goes to `supply.landmarkDiscard` (also A&A only), out of the game, so the invariants still find every landmark. Tech cards are discarded today only as a bonus's payment (`payment.tech`).
- **Prerequisite shapes:** `{ landmark: true }` (met while the card holds one), `{ none: true }` (Suburbs), and Oil Paint's `{ track: 'arts', tier: 2, selfInOriginal: true }` (R125).
- **Duct Tape:** two upgrades in a row, each ignoring prerequisites, written as one effect, `upgrade: { ignorePrerequisite: true, count: 2 }` (built so: two separate effects read "Upgrade a tech card twice" on the face, not as printed). That allows one card twice or two cards once each. Mandatory where possible, as every upgrade.
- **Ceramics (built):** a landmark tech card Ceramics locked this turn isn't offered for a landmark, which would upgrade it again.

## Tasks

### Task 1: the tech deck (R124)

Files: `src/lib/engine/decks.js`, `src/lib/engine/setup.js`, `tests/helpers/invariants.mjs`, `tests/engine-variants.test.mjs`, `tests/engine-setup.test.mjs`.

- [ ] Test: `techDeck([], [])` equals BASE_TECH; `techDeck(['aa'], [])` is BASE_TECH then the 11 `AA_TECH` in catalog order; with A&A and the arts track off (the variant that leaves it out), the 7 without Microphone, Oil Paint, Opera, Public Art; `no-radio-battery` still drops its 2 from both.
- [ ] Implement `export const AA_TECH` and `techDeck(expansions, variants)`; update its 2 callers.

### Task 2: the 11 cards as data

Files: `src/lib/engine/data/tech-cards.js`, `tests/engine-aa-tech.test.mjs`, `tests/engine-tech-data.test.mjs`.

- [ ] Test: TECH_CARDS is BASE_TECH then AA_TECH; each A&A card's circle, square and prerequisite exactly as the design's §5 table (Duct Tape's square is two upgrades ignoring prerequisites; Suburbs' square `anyBuilding`; Opera's circle an arts advance with no benefit, its square 1 VP per arts space).
- [ ] Implement the 11 entries with `expansion: 'aa'` on each card's data.

### Task 3: prerequisites and Duct Tape

Files: `src/lib/engine/tech.js`, `src/lib/engine/effects/tech.js`, `src/lib/engine/decisions/choose-upgrade.js`, `src/lib/engine/data/effects.js`.

- [ ] Tests: Suburbs in the middle row is upgradable with nothing; a landmark card in the middle row isn't, until it holds a landmark; Oil Paint with only a neighbour in arts tier II is upgradable in the current version, not in the original (R125); Duct Tape's square upgrades a middle-row Astrolabe with no landmark to the top row, and with one bottom-row card upgrades it twice.
- [ ] Implement `seatMeets` for the new shapes, `upgradable(state, player, ignorePrerequisite = false)`, and the upgrade effect's `ignorePrerequisite`, carried by `chooseUpgrade`.

### Task 4: a landmark on a tech card (R126)

Files: `src/lib/engine/placing.js`, `src/lib/engine/decisions/choose-placement.js`, `src/lib/engine/setup.js`, `src/lib/engine/state.js`, `src/lib/engine/effects/vp.js`, `src/lib/engine/payment.js`, `tests/helpers/invariants.mjs`.

- [ ] Tests: a gained landmark offers `{ tech: 'astrolabe' }` for a bottom- or middle-row Astrolabe with no landmark, not a top-row one (R126) nor one holding a landmark; placing it there stores it, emits `landmarkPlacedOnTech`, and upgrades the card before the track space's benefit (03 §2: Astrolabe in the middle row advances on exploration first); the landmark counts in `landmarksOwned` but not in the city for ties; a bonus that discards the card discards its landmark (`landmarkDiscarded`); without A&A a seat has no `techLandmarks`.
- [ ] Implement `techLandmarkPlaces`, the `tech` answer in `choosePlacement`, `placeOnTech(ctx, player, landmark, card)`, the setup fields, `landmarksOwned`, the payment's discard, and the invariants.

### Task 5: words and the simulation

Files: `src/lib/decision-words.js`, `src/lib/log.js`, `src/lib/describe.js`, `src/lib/cards/game-cards.js`, client tests.

- [ ] Tests: `choosePlacement` `{ tech: 'astrolabe' }` reads "On Astrolabe"; the log lines for `landmarkPlacedOnTech` and `landmarkDiscarded`; Duct Tape's square reads as upgrading ignoring prerequisites; every A&A tech card's face builds (`techCardData`) without a track for the new shapes.
- [ ] Implement; then `npm run check`, `npm run test:unit`, and a 200-game simulation that includes A&A tables.
- [ ] Commit "Refs #37: A&A's tech cards and the landmark on a card"; status.md notes part 1.
