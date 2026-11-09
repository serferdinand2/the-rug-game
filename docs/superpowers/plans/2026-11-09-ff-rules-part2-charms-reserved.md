# F&F rules part 2: charms, reservations and the 11 cards (#39) Implementation Plan

> **For agentic workers:** the owner's standing rule: implement inline in the main session (superpowers:executing-plans), no subagents, no per-task reviews. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** F&F's charms trigger as the rulebook says, items reserved on the income-mat overlay are used on income turn 5, and the 11 tapestry cards that reserve play in a full game.

**Architecture:** `engine/charms.js` gathers what a placement triggers (left charm, right charms, the card's ability) into one unordered `effects` operation of `charm` and `ability` effects; `playTapestry()` calls it. `engine/reserved.js` holds the overlay: `reserve` effects place items in `seat.reserved`, a new `reserved` income step pushes one `useReserved` effect per item, and `useReserved` acts by the item's kind. Decisions: `chooseReserve` (keep 1 of the drawn, hidden options), `chooseReserveTech` (a face-up card or the deck), Zombie Army's outposts through `askHex`.

**Tech Stack:** plain JS engine with JSDoc, Vitest with `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-11-09-ff-rules-design.md` §5, §6, §8.

## Global Constraints

- As part 1's: engine-only rules, pure, JSDoc, rule ids cited, Prettier on changed files only, `Refs #39: …` commits with the Co-Authored-By line.
- A game without F&F is unchanged, seed for seed: no seat gains `reserved`, `charmsUsed`; no income step runs.
- Every new decision kind has words (client `decision words` test) and every new event a log line or a place in `SILENT` (client log test).

## Review Focus

- A card played face down onto a slot to the right of a charmed card triggers its right charm, but its own charms never (R131).
- A charm that is all plain gains never asks for an order; two non-gain parts do.
- An item reserved on or after income turn 5 is used at once; a reserved building's income space is uncovered at once.
- Zombie Army never takes an outpost from a hex with a token, a Nomads piece, a second outpost or a toppled one, and a hex vacated loses its control.
- Drawing 3 to keep 1 with fewer than 3 left keeps from what there is, and with none reserves nothing.

---

### Task 1: Charms

**Files:** create `src/lib/engine/charms.js`; modify `src/lib/engine/tapestry.js` (`playTapestry`), `src/lib/engine/data/tapestry-cards.js` (`charms` on `TapestryCard`), `src/lib/engine/effects/index.js` (`charm`, `ability`; `isGain` treats an all-gain charm as a gain), `src/lib/engine/data/effects.js` (JSDoc), `src/lib/engine/effects/choice.js` (drop options that move only on tracks out of play), `src/lib/engine/setup.js` (`charmsUsed: []` with F&F); test `tests/engine-ff-charms.test.mjs`.

**Interfaces:**
- Produces: `placementTriggers(state, player, card, era, faceDown): { charms: { card, side }[], ability: boolean }` in `charms.js`; effects `{ charm: { card, side: 'left' | 'right' } }` and `{ ability: { card, era } }`; event `charmGained { player, card, side }`; `seat.charmsUsed` (right charms triggered) and `seat.playedCharmed`.

- [ ] **Step 1: Failing tests** (with Microbial Magic, left `[{ gain: { food: 1 } }, { vp: 5 }]`, right `[{ vp: { per: 'territoryTile' } }]`, and Ghost Towns, both sides `[{ advance: { tracks: ANY, noBenefit: true } }]`, as test cards — their data lands in this task; their `played` effects stay `[]` until Task 3):
  - left charm gained when slot `e − 1` holds a card (face up or down), not on era 1, not on era 2 beside an empty era-1 slot (Maker of Fire);
  - right charm (R67): a card placed in slot `e` triggers each face-up card in slot `e − 1` not yet triggered, covered ones included, once; a second card on slot `e` triggers nothing; a face-down card placed triggers it too;
  - R131: a face-down charmed card gains no charm and sets no `playedCharmed`;
  - `playedCharmed` set by a face-up charmed card; never by a base card;
  - the order: Ghost Towns' left charm (an advance) and an ability with a non-gain asks `chooseOrder`; Microbial Magic's all-gain left charm runs without a question;
  - a copy (Espionage's `copyAbility` of a charmed card) gains no charm;
  - R72: a card placed on slot 4 after income turn 5 triggers only slot-3 right charms not yet triggered;
  - the choice effect drops an arts-only option without the arts track and runs the lone one left.
- [ ] **Step 2: Run** `npx vitest run tests/engine-ff-charms.test.mjs`: fails.
- [ ] **Step 3: Implement.** `playTapestry` keeps its covering logic, then asks `placementTriggers` and pushes: nothing, the lone item's effect, or one `{ kind: 'effects', effects, ordered: false, source: { tapestry: card, card } }` (the ability is an item only for a face-up card). `charm` runs the charm's effects as an ordered op with `source: { tapestry: card, card, charm: side }` and emits `charmGained`; `ability` pushes today's `tapestryAbility` op. Right charms are marked used in `placementTriggers`' caller as they are queued (so a later placement in the same turn sees them used).
- [ ] **Step 4: Run** the file, then `npx vitest run tests/engine-tapestry*.test.mjs tests/engine-effects.test.mjs tests/engine-order.test.mjs`: pass.
- [ ] **Step 5: Commit** `Refs #39: charms`.

### Task 2: The overlay and income turn 5

**Files:** create `src/lib/engine/reserved.js`, `src/lib/engine/decisions/choose-reserve.js`, `src/lib/engine/decisions/choose-reserve-tech.js`; modify `src/lib/engine/income.js` (`reserved` step after `tapestry`, turns `[5]`, `when` F&F), `src/lib/engine/kinds.js`, `src/lib/engine/effects/index.js` (`reserve`, `useReserved`), `src/lib/engine/effects/vp.js` (`territoryTile` counts reserved tiles; new counter `buildingLeft`), `src/lib/engine/setup.js` (`reserved: []`), `src/lib/engine/view.js` (nothing hidden: check), `tests/helpers/invariants.mjs` (reserved tiles, cards, masterpieces and outposts counted once); test `tests/engine-ff-reserved.test.mjs`.

**Interfaces:**
- Produces: `ReservedItem = { id: number, card: string | null, ability: string } & ({ building } | { tech } | { space } | { masterpiece } | { territory: number[] } | { outposts: number } | { token: true })`; effects `{ reserve: { building } | { tech: true } | { space: 3 } | { masterpiece: 3 } | { territory: 3 } | { outposts: 3 } | { token: true } }` and `{ useReserved: ReservedItem }`; events `itemReserved { player, item }`, `reservedUsed { player, item }`.
- `useReserved` by kind: building → `placeBuilding`; tech → into the bottom row (`techInvented`, from `'reserved'`, its triggers), then two `upgradeThis` ops; space → into `spaceTiles`, explored (`exploreSpaceTile`), or with the arts track and Generation Ships, a `choice` of that or discarding it for `inspire`; masterpiece → joins `seat.masterpieces` and fires once (R133); territory → into `territoryTiles`, then `explore: { anywhere: true, tile }` for each; outposts → back to the supply, then one `conquer: {}` each (R85); token → its card's `fifth` effects.

- [ ] **Step 1: Failing tests:** each reserve kind with what it counts (R71: a reserved farm counts for "per farm"; reserved territory tiles for "per territory tile"; a reserved tech card for nothing) and its income space uncovered; each `useReserved` kind; the `reserved` step runs only on income turn 5, only with F&F, after `tapestry` and before `upgrade`, ordering several items through `chooseOrder` (R132); an item reserved with `incomeTurns >= 5` is used at once; a covered card's item still used; `chooseReserve` keeps 1 and shuffles the rest back, its options hidden from the others in `view()`; with fewer than 3 left it draws what there is, with none nothing; Zombie Army's eligible hexes (Review Focus) and its vacated hexes.
- [ ] **Step 2: Run**: fails.
- [ ] **Step 3: Implement** as the Interfaces say. Item ids come from `state.nextId` (bumped). Drawing 3 space tiles takes them off `supply.space` into the decision; the rest go back by `shuffle([...supply.space, ...rest], random)`. Masterpieces draw with `drawMasterpiece` (R119 reshuffles) and go back to the deck the same way.
- [ ] **Step 4: Run** the file, then `npx vitest run tests/engine-income.test.mjs tests/engine-view.test.mjs tests/engine-counters.test.mjs tests/engine-masterpieces.test.mjs`: pass.
- [ ] **Step 5: Commit** `Refs #39: the overlay and its items on income turn 5`.

### Task 3: The 11 cards

**Files:** modify `src/lib/engine/data/tapestry-cards.js` (`ff()` maker, the 11 cards: `played`, `charms`, `fifth` for the two token cards), `src/lib/engine/decks.js` (`tapestryFor` deals F&F's built cards), `src/lib/engine/effects/ff-cards.js` (create: `ecstaticVisions` — the masterpiece-or-space choice, space only without the arts track); test `tests/engine-ff-tapestry.test.mjs`.

- [ ] **Step 1: Failing tests:** the deck (base, then each expansion's, F&F's 11 in catalog order); each card's data deep-equal to design §8 (numbers exact); one test per card played and its item used on income turn 5; every card run to the end with and without the arts track (`answerDefaults` on a copy holding the turn choice, `checkState`).
- [ ] **Step 2: Run**: fails.
- [ ] **Step 3: Implement** the data and `ecstaticVisions`.
- [ ] **Step 4: Run** the file, `npx vitest run tests/simulation.test.mjs` (200 games), then `npm run test:unit` and `npm run check`.
- [ ] **Step 5: Commit** `Refs #39: the 11 tapestry cards that reserve an item`.

### Task 4: Words and the record

**Files:** `src/lib/describe.js` (words for `charm`, `ability`, `reserve`, `useReserved`), the decision words for `chooseReserve`, `chooseReserveTech` and Zombie Army's `chooseHex` purpose, `src/lib/log.js` (`charmGained`, `itemReserved`, `reservedUsed`), `src/lib/cards/tapestry-text.js` (the 11 faces: ability, charms, income turn 5), `docs/status.md` (part 2 entry).

- [ ] **Step 1: Failing tests** in the client words, log and tapestry-text tests for each.
- [ ] **Step 2: Run**: fails.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run test:unit` and `npm run check`: pass, 0 and 0.
- [ ] **Step 5: Commit** `Refs #39: part 2, charms and reservations: words and record`.
