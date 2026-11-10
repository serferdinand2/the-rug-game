# F&F rules part 1: the switch and the 12 tech cards (#39) Implementation Plan

> **For agentic workers:** the owner's standing rule: implement inline in the main session (superpowers:executing-plans), no subagents, no per-task reviews. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a table may turn Fantasies & Futures on, and its 12 tech cards play with their "charmed card or income turn 5" prerequisite and their single-use squares.

**Architecture:** data in `data/tech-cards.js` (`expansion: 'ff'`, `requires: { charmOrFive: true }`, `singleUse: true`), the deck in `decks.js`, the prerequisite in `tech.js`'s `meetsRequirement`, the flip in `effects/tech.js`'s `upgradeCard`. A flipped card is listed in the owner's `seat.flippedTech` (F&F only); every path that offers a tech card's benefit or upgrade skips it.

**Tech Stack:** plain JS engine with JSDoc, Vitest with `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-11-09-ff-rules-design.md` §3, §7, §9.

## Global Constraints

- Engine rules only in `src/lib/engine/`; pure, no `Math.random()`; JSDoc on exports; a one-line comment heading every new file; braces on every `if`.
- A game without `'ff'` is unchanged, seed for seed.
- Cite rule ids in comments and test names (R134 etc.).
- Prettier only the files changed (memory: `npm run format` rewrites unrelated docs).
- Each commit says `Refs #39: …` and ends with the Co-Authored-By line.

## Review Focus

- Without the arts track, Object Cloning and Perfect Memory offer only their other track, and an `advance` listing `arts` never crashes on a seat with no arts token.
- A flipped card the Inventors steal stays flipped in their bottom row and is never upgradable.
- A flipped card discarded (paid as a tech cost) is no longer flipped, so whoever draws it later can use it.
- The Spies never copy a flipped square; Information Age's "any row" never offers a flipped card.
- The prerequisite ignores neighbours: a neighbour's charmed card or income turn 5 does not count.

---

### Task 1: The switch, the seat field and tracks in play

**Files:**
- Modify: `src/lib/engine/setup.js` (`EXPANSIONS_BUILT`, `newSeat`)
- Modify: `src/lib/engine/state.js` (`PlayerFields`: `playedCharmed?`, `flippedTech?`)
- Modify: `src/lib/engine/effects/move.js` (`moveOnOneOf` filters `value.tracks` by `tracksOf`)
- Test: `tests/engine-ff-rules.test.mjs` (new)

**Interfaces:**
- Produces: `EXPANSIONS_BUILT` = `['pp', 'aa', 'ff']`; with `'ff'` each player seat has `playedCharmed: false` and `flippedTech: []`.

- [ ] **Step 1: Write the failing tests** in `tests/engine-ff-rules.test.mjs`:
  - `'F&F is offered, and its seats start with no charmed card played and no card flipped'`: `EXPANSIONS_BUILT.includes('ff')`; `newGame(3, { expansions: ['ff'] })` seats have `playedCharmed === false`, `flippedTech` deep-equal `[]`; `checkState`.
  - `'a game without F&F is unchanged, seed for seed'`: `newGame(3, { seed: 7 }).state` has no `playedCharmed`/`flippedTech` on any seat, and its tech deck equals `newGame(3, { seed: 7, expansions: ['pp'] })`'s.
  - `'an advance listing the arts track skips it when the arts track is out of play'`: base game, `resolveEffects` an `{ advance: { tracks: ['arts', 'technology'], noBenefit: true } }` for the current player: their technology token moves to 1, no throw.
  - §3's already-built rules, each a short test with `'ff'` on: R25 (a card played by `tapestryOnTop` on income turn 5 in the current version lands on the era-4 slot; none in the original), the corrected footprints (`FOOTPRINTS` villa `['X..','XXX','XXX']`, birdwatching-perch `['.XXX','XXX.']`, castle `['.XXX','XXXX','.XXX','.XX.']`, with the import path from `src/lib/art/footprints.js`), Oil Paint R125 (`techCard('oil-paint').requires` has `selfInOriginal: true`).
- [ ] **Step 2: Run** `npx vitest run tests/engine-ff-rules.test.mjs`: the switch and seat tests and the arts-filter test fail.
- [ ] **Step 3: Implement.** `EXPANSIONS_BUILT` adds `'ff'` (update its comment). `newSeat(seat, name, tracks, aa, ff)` adds `...(ff && { playedCharmed: false, flippedTech: [] })`; the caller passes `expansions.includes('ff')`. `moveOnOneOf` keeps only `value.tracks` that `tracksOf(ctx.state)` includes (R118: "any track" lists all five; a game without the arts track skips it).
- [ ] **Step 4: Run** the test file, then `npx vitest run tests/engine-setup.test.mjs tests/engine-advance.test.mjs tests/engine-view.test.mjs`: all pass.
- [ ] **Step 5: Commit** `Refs #39: offer F&F, its seats' fields, and advances only on tracks in play`.

### Task 2: The 12 tech cards and the prerequisite

**Files:**
- Modify: `src/lib/engine/data/tech-cards.js` (`TechRequirement` gains `{ charmOrFive: true }`; `TechCard` gains `singleUse?: true`, `expansion` `'ff'`; 12 cards)
- Modify: `src/lib/engine/decks.js` (`FF_TECH`, `techDeck`)
- Modify: `src/lib/engine/tech.js` (`meetsRequirement`)
- Modify: `src/lib/cards/game-cards.js` (`techCardData`: `prerequisite: 'charmOrFive'`, `singleUse`)
- Test: `tests/engine-ff-tech.test.mjs` (new)

**Interfaces:**
- Produces: `FF_TECH` (catalog order: golem-minions … weather-control); `techDeck(['ff'], [])` = `[...BASE_TECH, ...FF_TECH]`, and with A&A `[...BASE_TECH, ...AA_TECH, ...FF_TECH]`.
- Produces: `meetsRequirement(state, player, card)` true for `charmOrFive` iff `seat.playedCharmed` or `seat.incomeTurns >= 5`; neighbours never asked.

- [ ] **Step 1: Write the failing tests** in `tests/engine-ff-tech.test.mjs`, as `engine-aa-tech.test.mjs` does:
  - the deck lists above; F&F alone deals 45 tech cards (`deck + faceUp`), F&F with A&A 56.
  - a `CARDS` table, each card's `[circle, square, singleUse]` deep-equal to the data, every `requires` `{ charmOrFive: true }` and `expansion: 'ff'`:
    - golem-minions: `[{ vp: { per: 'landmark' } }]`, `[{ advance: { tracks: ['military'], noBenefit: true } }, { vp: { per: 'trackSpace', track: 'military' } }]`, false
    - levitation: `[{ choice: [[{ explore: {} }], [{ gain: { space: 1 } }]] }]`, `[{ exploreSpace: {} }]`, true
    - mind-control: `[{ advance: { tracks: ['science', 'military'], noBenefit: true } }]`, `[{ advance: { tracks: ['science', 'military'] } }]`, true
    - object-cloning: tracks `['arts', 'technology']`, same shape, true
    - perfect-memory: tracks `['science', 'arts']`, same shape, true
    - pyrokinesis: `[{ building: 'armory' }]`, `[{ vp: { per: 'territory' } }, { vp: { per: 'armory' } }]`, false
    - remote-viewing: `[{ gain: { territory: 1 } }, { explore: { anywhere: true } }]`, `[{ research: {} }]`, true
    - superhuman-strength: tracks `['exploration', 'military']`, same shape, true
    - super-speed: `[{ vp: { per: 'territoryTile' } }]`, `[{ explore: {} }, { explore: {} }]`, false
    - teleportation: tracks `['exploration', 'technology']`, same shape, true
    - transmogrification: `[{ invent: {} }]`, `[{ anyBuilding: {} }]`, false
    - weather-control: `[{ explore: {} }]`, `[{ repeat: {} }]`, true
  - `'the charm-or-5 prerequisite: a charmed card played, or income turn 5, never a neighbour's'`: a middle-row `levitation` is not in `upgradable()` at income turn 2; is with `playedCharmed = true`; is at `incomeTurns = 5`; is not when only the neighbour has `playedCharmed` or `incomeTurns = 5`; Golden Age's era waives it.
  - `'every F&F card resolves in a full upgrade'`: for each card, a seat holding it in the bottom row upgrades it twice (with `playedCharmed`), `answerDefaults`, `checkState` after each.
- [ ] **Step 2: Run** `npx vitest run tests/engine-ff-tech.test.mjs`: fails (no `FF_TECH`).
- [ ] **Step 3: Implement** the data (03 FF.5; check the effect kinds above exist with those shapes in `data/effects.js`, and that `vp` per `'landmark'` counts every landmark owned, R71), `FF_TECH = slugsOf('tech', 'ff')`, `techDeck` appending it with `'ff'`, the `charmOrFive` branch in `meetsRequirement`, and `techCardData` setting `prerequisite = 'charmOrFive'` and `singleUse = true` (add both to `TechnologyCardData`'s JSDoc).
- [ ] **Step 4: Run** the test file, then `npx vitest run tests/engine-tech-data.test.mjs tests/engine-tech.test.mjs tests/client-game-cards.test.mjs tests/engine-aa-tech.test.mjs`: pass (fix any test that pins the deck length).
- [ ] **Step 5: Commit** `Refs #39: F&F's 12 tech cards and their charm-or-5 prerequisite`.

### Task 3: Single use

**Files:**
- Modify: `src/lib/engine/effects/tech.js` (`upgradeCard` flips; `techBenefitOptions` skips flipped)
- Modify: `src/lib/engine/tech.js` (`isFlipped(state, player, card)`; `upgradable` and `recyclable` skip flipped)
- Modify: `src/lib/engine/civs/spies.js` (targets skip flipped), `src/lib/engine/civs/inventors.js` (slot options skip an opponent's single-use middle-row card; `inventorsTake` moves the flip), `src/lib/engine/payment.js` (a discarded card is no longer flipped)
- Modify: `tests/helpers/invariants.mjs` (`flippedTech` ⊆ the seat's tech rows, each single use)
- Test: `tests/engine-ff-tech.test.mjs`

**Interfaces:**
- Produces: `isFlipped(state, player, card): boolean` in `tech.js`; event `techFlipped { player, card }` after the square's benefit is pushed.

- [ ] **Step 1: Write the failing tests** (names cite R134):
  - `'a single-use card flips when its square is gained, and still counts as a tech card'`: upgrade a middle-row `mind-control` (with `playedCharmed`): it is in `top` and `flippedTech`; a `techFlipped` event; `vp` per `techCard` counts it.
  - `'a repeatable F&F card never flips'` (pyrokinesis).
  - `'R134: a flipped card offers no benefit again'`: `techBenefitOptions(state, p, 'square')` and `(…, 'square', true)` leave it out; the Spies' options from a neighbour leave it out.
  - `'R134: the Recyclers may not recycle a flipped card'`: `recyclable()` leaves it out.
  - `'an opponent may not send a single-use card to the top row; the Inventors may still mark its bottom-row copy'`: the Inventors' slot answers leave out an opponent's middle-row `mind-control` but keep a bottom-row one.
  - `'a flipped card the Inventors take stays flipped and never upgrades'`: after `inventorsTake`, the card is in the Inventors' `bottom` and `flippedTech`, not in `upgradable()`.
  - `'a flipped card paid away is no longer flipped'`: pay `{ tech: 1 }` with the flipped card: it is in `supply.tech.discard`, not in `flippedTech`.
- [ ] **Step 2: Run**: fail.
- [ ] **Step 3: Implement** as the Files list says. A seat without `flippedTech` (no F&F) never flips, so nothing changes without F&F.
- [ ] **Step 4: Run** the file, then `npx vitest run tests/engine-tech*.test.mjs tests/engine-civs*.test.mjs tests/engine-pp-civs.test.mjs tests/engine-payment.test.mjs`: pass.
- [ ] **Step 5: Commit** `Refs #39: single-use tech cards flip, and R134`.

### Task 4: Words, the simulation and the record

**Files:**
- Modify: the client's log words for `techFlipped` (where `techUpgraded` is worded: find with `grep -rn "techUpgraded" src/lib`), and the requirement and single-use words on the tech card face (`TechnologyCard.svelte` reads `prerequisite`; the face shows "Prerequisite: a charmed card played, or income turn 5" and "Single use")
- Modify: `tests/helpers/simulation.mjs` and `tests/simulation.test.mjs` (F&F in the expansion mixes the simulation draws)
- Modify: `docs/status.md` (#39 part 1 entry), README "Rules conventions" (R134 only; R131–R133 land with part 2)

- [ ] **Step 1: Write the failing tests**: a log test that `techFlipped` reads "Ana flips Mind Control (single use)." (match the file's existing phrasing), and a `client-game-cards` test that `techCardData('levitation')` has `prerequisite: 'charmOrFive'` and `singleUse: true`.
- [ ] **Step 2: Run**: fail.
- [ ] **Step 3: Implement** the words and the face's two lines (marked awaiting review in the library section of `TechnologyCard`); add F&F to the simulation's mixes.
- [ ] **Step 4: Run** `npm run test:unit` and `npm run check`: all pass, 0 errors and 0 warnings; `npx vitest run tests/simulation.test.mjs` passes 200 games.
- [ ] **Step 5: Commit** `Refs #39: part 1, F&F's tech cards: words, simulation and record`.
