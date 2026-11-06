# The arts track, part 1 (#35) Implementation Plan

> **For agentic workers:** Carry this plan out inline with superpowers:executing-plans. The owner's standing rule: no implementer or reviewer subagents, no per-task reviews; at most one review of the whole of #35 at the end, if the owner agrees. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A game with Arts & Architecture on has a fifth advancement track, the arts track, with its own tier prices, its 3 landmarks, the d20 and the base effects that R118 extends to it; a game without it plays exactly as before.

**Architecture:** `TrackId` widens to the five tracks and a new `BoardTrackId` names the four of the main board, which `TRACK_IDS` keeps listing. `tracksOf(state)` gives the tracks in play, so each "any track" effect reads it, and each four-track effect keeps `TRACK_IDS`. The arts track is data in `TRACKS.arts`, priced by `ARTS_TIER_COSTS`, which needs two new cost parts, `different` and `same`. The spaces that need masterpieces or inspiration tiles get their effect names now, with handlers that throw until part 2.

**Tech Stack:** Plain JavaScript ES modules with JSDoc, Vitest with `node:assert/strict`, `npm run check` (svelte-check, strict).

**Spec:** [docs/superpowers/specs/2026-11-06-arts-track-design.md](../specs/2026-11-06-arts-track-design.md), §3.1–§3.6 (part 1).

## Global Constraints

- Follow docs/conventions.md: a one-line comment opening each file, JSDoc on exports, braces on every `if`, Prettier (`npm run format`), `npm run check` with 0 errors and 0 warnings.
- Engine functions stay pure; player mistakes throw `PlayerError` with a sentence a player understands; randomness only through `ctx.random`.
- Cite rule ids in comments and test names: R59, R71, R118.
- A base game and a Plans & Ploys game play exactly as before: every existing test passes unchanged, apart from the lists this plan names (`EXPANSIONS_BUILT`, `VARIANTS`).
- The arts track is in play when `'aa'` is in the expansions and `'no-arts-track'` is not in the variants. Nothing else decides it.
- Commits: `Refs #35: …`, imperative, 72 characters at most, with the `Co-Authored-By` line.
- No client visuals in part 1 (part 4 needs approved mockups). The only client changes are words and lists that existing completeness tests require.

## Review Focus

1. **A base game that never mentions arts:** `tracksOf` returns exactly `TRACK_IDS`, no seat has an `arts` key, and no landmark, die or variant changes. Task 1 asserts a base game's seats and `tracksOf`.
2. **A&A on with "Play without the arts track":** no arts token, no arts landmark, the d12, and "either science die" refused. Task 1 and Task 3 each test the switch off.
3. **Paying a tier II or IV arts price with too little variety:** a player holding 3 coin and nothing else can't pay "2 different", and the advance isn't offered. Task 2 pins it.
4. **A d20 roll landing on arts for a player whose arts token is on 12:** research gives nothing (or Alien Biology's VP), as on the other tracks. Task 5 pins it.
5. **A sharp edge of Dark Ages with five tracks:** a player with only one track they can regress on still has a choice of which track keeps its place, and nothing crashes. Task 6 pins it.

---

### Task 1: Five track ids and the arts track's switch

**Files:**
- Modify: `src/lib/engine/data/ids.js` (TrackId, new BoardTrackId, ARTS_TRACK)
- Modify: `src/lib/engine/data/tracks.js` (new `artsTrackOn`; `TRACK_RESOURCE`, `TRACK_BUILDING` typed by `BoardTrackId`)
- Create: `src/lib/engine/tracks-in-play.js`
- Modify: `src/lib/engine/setup.js` (`EXPANSIONS_BUILT`, `VARIANTS`, `checkOptions`, `createGame`, `newSeat`)
- Modify: `src/lib/engine/state.js:40` (the `tracks` doc line)
- Modify: `tests/helpers/simulation.mjs:45-52` (variants filtered by their expansion)
- Modify: `tests/engine-setup.test.mjs:453-455`, and whichever VARIANTS list test fails
- Modify: client sites `npm run check` flags for `TRACK_RESOURCE[track]` (expected: `src/lib/board.js:62-64`, `src/lib/prompts.js:614`, `src/lib/picks.js:116`, `src/lib/prompts.js:141`): narrow with a `/** @type {BoardTrackId} */` cast where the arts track can't reach them yet
- Test: `tests/engine-arts-track.test.mjs` (new)

**Interfaces:**
- Produces:
  - `TrackId` = `'exploration' | 'science' | 'technology' | 'military' | 'arts'`; `BoardTrackId` = the four; `TRACK_IDS: readonly BoardTrackId[]` (unchanged values); `ARTS_TRACK = 'arts'`.
  - `artsTrackOn(expansions: readonly string[], variants: readonly string[]): boolean` in `data/tracks.js`.
  - `artsInPlay(state): boolean` and `tracksOf(state): TrackId[]` (the four, then `'arts'` when in play, a new array each call) in `tracks-in-play.js`.
  - Variants `{ id: 'no-arts-track', name: 'Play without the arts track', expansion: 'aa' }` and `{ id: 'either-science-die', name: 'Roll either science die (d12 or d20)', expansion: 'aa' }`, appended to `VARIANTS` in that order.

- [ ] **Step 1: Write the failing tests** in `tests/engine-arts-track.test.mjs` (file comment: `// The arts track (#35 part 1): the switch, the fifth track, its prices, landmarks and spaces, the d20 and R118.`):
  - `'Arts & Architecture is built, and its two variants need it'`: `EXPANSIONS_BUILT` deep-equals `['pp', 'aa']`; `checkOptions({ version: 'current', expansions: ['aa'], variants: ['no-arts-track'] })` doesn't throw; `checkOptions({ version: 'current', variants: ['either-science-die'] })` throws `PlayerError` matching `/needs Arts & Architecture/`.
  - `'either science die is refused without the arts track'`: `checkOptions` with `expansions: ['aa'], variants: ['no-arts-track', 'either-science-die']` throws `PlayerError` matching `/arts track/`.
  - `'a game with the arts track puts every token on its start, and tracksOf lists five'`: `newGame(3, { expansions: ['aa'] })`: every seat's `tracks.arts` deep-equals `[0]`; `tracksOf(state)` deep-equals `[...TRACK_IDS, 'arts']`; `artsInPlay(state)` is true.
  - `'without the arts track no seat has an arts token'`: for `newGame(3)`, `newGame(3, { expansions: ['pp'] })` and `newGame(3, { expansions: ['aa'], variants: ['no-arts-track'] })`: no seat has an `arts` key; `tracksOf(state)` deep-equals `TRACK_IDS`.
  - `'R59: a one-player game with the arts track is refused'`: `createGame({ players: [{ name: 'Ana' }], version: 'current', expansions: ['aa'], random: seededRandom(1) })` throws `PlayerError` matching `/2 or more players/`; the same with `variants: ['no-arts-track']` doesn't throw.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/engine-arts-track.test.mjs`
Expected: FAIL (the imports `tracksOf`, `artsInPlay` don't exist; `EXPANSIONS_BUILT` is `['pp']`).

- [ ] **Step 3: Implement**
  - The ids, `artsTrackOn` and `tracks-in-play.js` as in Interfaces. `tracks-in-play.js` imports only `data/ids.js` and `data/tracks.js`.
  - `checkOptions`: after the existing expansion check of variants, refuse `either-science-die` with `no-arts-track`: `'The variant "Roll either science die (d12 or d20)" needs the arts track.'`.
  - `createGame`: after `checkOptions`, when `players.length === 1 && artsTrackOn(expansions, variants)`, throw `PlayerError('The arts track needs 2 or more players: there is no Automa with it (R59).')`.
  - `newSeat(seat, name, tracks)` takes the track list (`tracksOf` can't run before the state exists, so pass `artsTrackOn(expansions, variants) ? [...TRACK_IDS, ARTS_TRACK] : TRACK_IDS`).
  - `simulation.mjs`: the all-variants list keeps a variant only when it has no `expansion` or its expansion is in the game's (replacing the `civs-from-pp` special case).
  - Update `tests/engine-setup.test.mjs`'s `EXPANSIONS_BUILT` assertion to `['pp', 'aa']` and its test name to say A&A is built (owner, #35); update any test pinning the `VARIANTS` ids to add the two.

- [ ] **Step 4: Run the tests and the type check**

Run: `npx vitest run tests/engine-arts-track.test.mjs tests/engine-setup.test.mjs tests/engine-variants.test.mjs && npm run check`
Expected: PASS, and `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 5: Run the whole unit suite** (the lobby and API tests read `EXPANSIONS_BUILT` and `VARIANTS`)

Run: `npm run test:unit`
Expected: PASS. A lobby or API test that lists the expansions or variants exactly gets the new entries; nothing else changes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Refs #35: switch the arts track on with Arts & Architecture"
```

### Task 2: The arts track's spaces and tier prices

**Files:**
- Modify: `src/lib/engine/data/tracks.js` (`TRACKS.arts`, `ARTS_TIER_COSTS`, `advanceCost`)
- Modify: `src/lib/engine/data/effects.js` (Cost `different`, `same`; effect kinds; VP counter `incomeBuilding`)
- Modify: `src/lib/engine/payment.js` (`resourcePayments`, `canPay`, `checkPayment`)
- Modify: `src/lib/engine/effects/vp.js` (`incomeBuilding`)
- Create: `src/lib/engine/effects/arts.js` (the part-2 stubs)
- Modify: `src/lib/engine/effects/index.js` (register the stubs)
- Modify: `src/lib/describe.js` (words for the 5 new effect kinds and the counter, so `tests/client-describe.test.mjs` passes)
- Modify: `tests/client-describe.test.mjs:142-150` (`'every benefit and bonus of every track space describes to a sentence'` loops over `Object.keys(TRACKS)`, so the arts spaces are worded too)
- Test: `tests/engine-arts-track.test.mjs`, `tests/engine-payment.test.mjs`

**Interfaces:**
- Consumes: `TrackId` with `'arts'` (Task 1).
- Produces:
  - `Cost.different?: number` (that many resources of the player's choice, all different) and `Cost.same?: number` (that many of one type). Neither is ever combined with another resource part; `payments`/`canPay`/`checkPayment` throw a plain `Error` if one is.
  - `ARTS_TIER_COSTS: Readonly<Record<1|2|3|4, Cost>>` = `{ 1: { any: 1 }, 2: { different: 2 }, 3: { any: 3 }, 4: { same: 2 } }`; `advanceCost('arts', space)` returns a copy of its tier's.
  - Effect kinds `create: {}`, `inspire: {}`, `broadcast: {}`, `refreshMasterpieces: { optional?: boolean }`, `streamingImplants: {}`; each handler throws `Error('<kind> is built in #35 part 2.')`.
  - VP counter `incomeBuilding`: the sum over `BUILDING_IDS` of buildings off the income mat (R71).

- [ ] **Step 1: Write the failing tests**
  - `'the arts track has 12 spaces in four tiers, named as printed (03 §2.3)'`: `TRACKS.arts.map((s) => s.name).slice(1)` deep-equals `['Cave Paintings', 'Flutes', 'Dance', 'Epic Poetry', 'Symphony', 'Carved Marble Sculpture', 'Rock Opera', 'CGI Animation', 'Flash Mob', 'Virtual Reality Holocenter', 'Infinite Spectrum Photography', 'Streaming Implants']`; the landmarks on 4, 7, 10 are `'clock-tower'`, `'opera-house'`, `'holocenter'`; the other spaces have none.
  - `'each arts space has the benefit and bonus of 03 §2.3'`: deep-equal each space's `benefit`, `bonus`, `ordered`, with:
    1. `[{ gain: { tapestry: 1 } }]`
    2. `[{ vp: 5 }]`, bonus `{ pay: { any: 1 }, gain: [{ anyBuilding: {} }] }`
    3. `[{ create: {} }]`
    4. `[{ vp: { per: 'territoryTile' } }, { vp: { per: 'techCard' } }]`
    5. `[{ inspire: {} }]`, bonus `{ pay: { any: 1 }, gain: [{ create: {} }] }`
    6. `[{ choice: [[{ broadcast: {} }], [{ anyBuilding: {} }]] }]`
    7. `[{ refreshMasterpieces: { optional: true } }, { create: {} }]` (not ordered: either order)
    8. `[{ inspire: {} }]`, bonus `{ pay: { any: 1 }, gain: [{ anyBuilding: {} }] }`
    9. `[{ advance: { tracks: ['exploration', 'science', 'technology', 'military'] } }]`
    10. `[{ anyBuilding: {} }, { vp: { per: 'incomeBuilding' } }]`, ordered
    11. as 9, bonus `{ pay: { any: 1 }, gain: [{ create: {} }] }`
    12. `[{ streamingImplants: {} }]`
  - `'the arts tiers cost any 1, 2 different, any 3, then 2 of one type (03 §2.2)'`: `advanceCost('arts', 1|4|7|10)` are `{ any: 1 }`, `{ different: 2 }`, `{ any: 3 }`, `{ same: 2 }`; spaces 3, 6, 9, 12 the same as their tier's first.
  - In `tests/engine-payment.test.mjs`:
    - `'2 different resources are paid with two kinds, one each'`: a seat holding `{ coin: 2, worker: 1, food: 0, culture: 0 }`: `payments(state, p, { different: 2 })` deep-equals `[{ coin: 1, worker: 1 }]`; `checkPayment(…, { coin: 2 })` throws `PlayerError` `'Pay 2 different resources.'`.
    - `'2 of one type are paid from a single resource'`: holding `{ coin: 2, worker: 1, food: 2, culture: 0 }`: `payments` deep-equals `[{ coin: 2 }, { food: 2 }]`; `checkPayment(…, { coin: 1, worker: 1 })` throws `'Pay 2 resources of the same type.'`.
    - `'too little variety pays neither'` (Review Focus 3): holding only 3 coin, `canPay(…, { different: 2 })` is false and `canPay(…, { same: 2 })` true; holding one of each, `canPay(…, { same: 2 })` is false.
  - `'Holocenter counts every income building off the mat (R71)'`: `countVp` with `'incomeBuilding'` for a seat whose mat holds `{ market: 3, house: 5, farm: 4, armory: 5 }` is 3.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/engine-arts-track.test.mjs tests/engine-payment.test.mjs`
Expected: FAIL (`TRACKS.arts` undefined, the new costs unknown).

- [ ] **Step 3: Implement**
  - `TRACKS.arts = track([...])` with the `space()` helper and `payAny`; `ALL_BUT_SCIENCE`'s neighbour `BOARD_TRACKS = TRACK_IDS` copy for Flash Mob and Infinite Spectrum (R118: printed four).
  - `advanceCost`: `track === 'arts'` returns `{ ...ARTS_TIER_COSTS[tierOf(space)] }`; the others as now.
  - Payment: `resourcePayments` enumerates `different` as every set of n distinct ids with at least 1 each, in `RESOURCE_IDS` order, and `same` as every id with at least n; `canPay` counts ids with ≥ 1 (`different`) or any id with ≥ n (`same`); `checkPayment` adds them to `owed` and then checks the shape, with the two errors above.
  - Add the counter to `VP_COUNTERS` and `countVp`, the kinds to `EFFECT_KINDS`, and words to `describe.js` (`create`: "Gain a masterpiece", `inspire`: "Place an inspiration tile", `broadcast`: "Gain the benefit of one of your masterpieces", `refreshMasterpieces`: "Refresh the face-up masterpieces", `streamingImplants`: "Gain the benefits of up to 3 different masterpieces, yours or your neighbours'", `incomeBuilding`: "1 VP per income building").

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/engine-arts-track.test.mjs tests/engine-payment.test.mjs tests/engine-data.test.mjs tests/client-describe.test.mjs && npm run check`
Expected: PASS; 0 errors and 0 warnings.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Refs #35: add the arts track's spaces and its tier prices"
```

### Task 3: The arts-track landmarks and Dystopia

**Files:**
- Modify: `src/lib/engine/data/landmarks.js` (3 landmarks; `landmarksFor(expansions, variants = [])`)
- Modify: `src/lib/engine/setup.js:416` (pass the variants)
- Modify: `src/lib/engine/effects/cards.js:98-103` (`freeTrackLandmarks` reads `ALL_LANDMARKS`)
- Modify: `tests/helpers/invariants.mjs:213` (pass `state.variants`), and `:328` (`tracksOf(state)`; each seat's `Object.keys(p.tracks)` equals `tracksOf(state)`)
- Test: `tests/engine-arts-track.test.mjs`

**Interfaces:**
- Consumes: `artsTrackOn` (Task 1), `TRACKS.arts` (Task 2).
- Produces: landmarks `clock-tower` ("Clock Tower", `{ track: 'arts', tier: 2, space: 4 }`), `opera-house` ("Opera House", tier 3, space 7), `holocenter` ("Holocenter", tier 4, space 10), each `expansion: 'aa'` and `arts: true`; `landmarksFor` leaves out `arts` landmarks unless `artsTrackOn(expansions, variants)`.

- [ ] **Step 1: Write the failing tests**
  - `'the arts landmarks are in the supply only with the arts track'`: `newGame(2, { expansions: ['aa'] }).state.landmarks` includes all three; with `variants: ['no-arts-track']` none.
  - `'the first player into arts tier II takes the Clock Tower before the benefit'`: advance a 2-player A&A seat from arts 3 to 4 (as `onto` in `engine-track-spaces.test.mjs`, holding 2 of each resource, `seat.tracks.arts = [3]`): the first open decision is placing `clock-tower`; `state.landmarks` no longer has it; after placing (`placeAll`), Epic Poetry's VP are added.
  - `'Dystopia may take an arts-track landmark (03 §2.2)'`: in an A&A game with every base track landmark gone from `state.landmarks`, resolving Dystopia (`resolveTapestry(state, random, player, 'dystopia')`) offers exactly the three arts landmarks.
  - `checkState` passes on both setups.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/engine-arts-track.test.mjs`
Expected: FAIL (no arts landmarks).

- [ ] **Step 3: Implement** as in Interfaces. The Landmark typedef gains `@property {boolean} [arts]`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/engine-arts-track.test.mjs tests/engine-plans-ploys.test.mjs tests/engine-tapestry-cards.test.mjs && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Refs #35: add the arts track's three landmarks"
```

### Task 4: Advancing on the arts track, and the spaces part 1 builds

**Files:**
- Modify: `src/lib/engine/decisions/choose-advance.js:19-46` (`advances` and `chosenToken` read `tracksOf`)
- Test: `tests/engine-arts-track.test.mjs`

**Interfaces:**
- Consumes: `tracksOf` (Task 1), `TRACKS.arts`, `advanceCost('arts', n)` (Task 2).

- [ ] **Step 1: Write the failing tests** with a helper `ontoArts(space, fill)`: `readyTurn(2, fill', { expansions: ['aa'] })` where `fill'` puts `seat.tracks.arts = [space - 1]`, gives 2 of each resource, then calls `fill`; it chooses the advance turn and the arts option, paying the first answer `DECISIONS.chooseAdvance.answers` gives.
  - `'the advance turn offers the arts track at its tier price'`: with `seat.tracks.arts = [3]` and `{ coin: 1, worker: 1 }`, `advances(state, player)` includes `{ track: 'arts', from: 3, cost: { different: 2 } }`; with `{ coin: 2 }` only, it doesn't.
  - `'arts 1 Cave Paintings: a tapestry card'`: hand grows by 1.
  - `'arts 2 Flutes: 5 VP; the bonus pays 1 any for an income building of your choice'`.
  - `'arts 4 Epic Poetry: 1 VP per territory tile and 1 VP per tech card'`: with 2 territory tiles and 1 tech card, +3 VP after the Clock Tower is placed.
  - `'arts 9 Flash Mob: advance on one of the four board tracks, never the arts track (R118)'`: the open `chooseMove`'s options have no `'arts'`.
  - `'arts 10 Holocenter: the Holocenter, an income building, then 1 VP per income building (R71)'`.
  - `'arts 11 Infinite Spectrum Photography: as Flash Mob'` (benefit only; the bonus is part 2's).
  - `'a game without the arts track never offers it'`: `advances` in `readyTurn(2)` has no `arts` entry.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/engine-arts-track.test.mjs -t "arts \\d|advance turn|never offers"`
Expected: FAIL (`advances` doesn't offer the arts track).

- [ ] **Step 3: Implement**: `advances` filters `tracksOf(state)`; `chosenToken` checks `tracksOf(state).includes(track)`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/engine-arts-track.test.mjs tests/engine-advance.test.mjs tests/engine-track-spaces.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Refs #35: advance on the arts track and play its first spaces"
```

### Task 5: The d20 and "roll either science die"

**Files:**
- Modify: `src/lib/engine/data/dice.js` (`SCIENCE_D20`)
- Create: `src/lib/engine/science-die.js` (`defaultDie`, `withDie`; imports only `tracks-in-play.js`, so the Alchemists and Treasure Hunters can use it without a cycle)
- Create: `src/lib/engine/decisions/choose-die.js`; register in `src/lib/engine/kinds.js`
- Modify: `src/lib/engine/effects/research.js` (`rollScience` asks the die first when the variant applies; new automatic kind `scienceRoll`)
- Modify: `src/lib/engine/civs/alchemists.js` (an arts face marks nothing)
- Modify: `src/lib/engine/civs/treasure-hunters.js` (the science treasure uses the game's die, `scienceDie` on its event)
- Modify: `src/lib/decision-kinds.js`, `src/lib/decision-words.js` (`chooseDie`), `src/lib/log.js` (the Treasure Hunters line reads the event's die)
- Test: `tests/engine-arts-track.test.mjs`

**Interfaces:**
- Produces:
  - `SCIENCE_D20: readonly TrackId[]`: `['exploration', 'science', 'technology', 'military', 'arts']` four times.
  - `scienceFaces(die: 'd12' | 'd20'): readonly TrackId[]` in `data/dice.js`; `defaultDie(state): 'd12' | 'd20'` (`'d20'` when the arts track is in play) in `science-die.js`.
  - `withDie(state, player, op): NewOperation[]` in `science-die.js`: `[op with die: defaultDie(state)]`, or with the arts track in play and `either-science-die` on, `[{ player, kind: 'chooseDie', options: ['d20', 'd12'], then: op }]`.
  - Decision `chooseDie`: answers `{ die: 'd20' }`, `{ die: 'd12' }`; refuses anything else with `PlayerError('Choose the d12 or the d20.')`; resolves by pushing `{ ...then, player, die }`.
  - Events: `scienceDieRolled` and the science `treasureRolled` gain `scienceDie: 'd12' | 'd20'`.

- [ ] **Step 1: Write the failing tests**
  - `'the d20 has 4 faces for each of the five tracks'`.
  - `'with the arts track every research roll uses the d20'`: in an A&A game, resolving `[{ research: {} }]` with `resolveEffects` and `random = () => 4` lands on `'arts'`; the `scienceDieRolled` event says `scienceDie: 'd20'`. In a base game the same `random` gives `SCIENCE_DIE[4]`, `'exploration'`, with `scienceDie: 'd12'`.
  - `'a d20 roll on the arts track with the token on 12 gives nothing, as on any finished track'` (Review Focus 4): no `chooseMove` opens.
  - `'with either science die, the roller chooses the die before each roll'`: variant on: research opens `chooseDie` with options `['d20', 'd12']`; answering `d12` rolls `SCIENCE_DIE`.
  - `'Empiricism rolls the chosen die twice'`: one `chooseDie`, then two `scienceDieRolled` events with the same `scienceDie`.
  - `'Alchemists: an arts roll marks nothing and doesn't bust (03 §2.2)'`: marked `['science']`, rolling arts leaves `marked` as `['science']`, emits `alchemistsRolled` with `track: 'arts'`, and opens `chooseAlchemists`.
  - `'Treasure Hunters roll the d20 for a science treasure with the arts track'`: the event's `scienceDie` is `'d20'` and its faces index `SCIENCE_D20`.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/engine-arts-track.test.mjs -t "d20|die|Alchemists|Treasure"`
Expected: FAIL.

- [ ] **Step 3: Implement**
  - `rollScience(ctx, player, next)` pushes `withDie(state, player, { kind: 'scienceRoll', next })`; the automatic kind `scienceRoll` does today's roll (and Empiricism's) with `scienceFaces(op.die)`.
  - Alchemists: `alchemistsRoll` rolls `scienceFaces(op.die ?? defaultDie(state))` and is reached through `withDie`; an `'arts'` face emits `alchemistsRolled` and asks `chooseAlchemists` without marking.
  - Treasure Hunters: `ROLLED_TWICE.science` becomes the game's die (through `withDie` with the variant), and the event names it.
  - Client: `DECISION_KINDS.chooseDie = { art: 'track' }` (as `chooseRoll`), title `'Choose the science die to roll'`, answer words `'The d20'` / `'The d12'`; the Treasure Hunters log line picks `SCIENCE_D20` when `e.scienceDie === 'd20'`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/engine-arts-track.test.mjs tests/engine-research.test.mjs tests/engine-tech-research.test.mjs tests/engine-civs-income.test.mjs tests/engine-pp-civs.test.mjs tests/client-decision-kinds.test.mjs tests/client-decision-words.test.mjs tests/client-log.test.mjs && npm run check`
Expected: PASS (the base and P&P research tests unchanged: their games have no arts track, so no `chooseDie` and the d12).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Refs #35: roll the d20 with the arts track, or either die"
```

### Task 6: R118, the effects that include the arts track

**Files:**
- Modify: `src/lib/engine/effects/cards.js` (`pleaForAid`, `darkAges`, `darkAgesOn`, `socialism`, `dictatorship`, `tradeEconomy`; new automatic kind `darkAgesKept`)
- Modify: `src/lib/engine/effects/vp.js` (`trackLead`), `effects/tapestry.js` (`eraPartner`), `effects/restart-token.js`, `effects/pp-cards.js` (`statusQuo`), `effects/players.js` (`sharedAdvance`), `effects/repeat.js` (`repeatable`)
- Modify: `src/lib/engine/civs/tinkerers.js` (`targets`; `tinkerersPayBack` on the arts track), `civs/spies.js` (option 3), `civs/mystics.js` (completed tracks)
- Modify: `src/lib/engine/data/tapestry-cards.js:176-182` (Renaissance) and a new effect `advanceEach` in `effects/move.js`, `data/effects.js`, `effects/index.js`, `src/lib/describe.js`
- Modify: `src/lib/decision-words.js` (the `chooseTrack` purpose `darkAgesKeep`)
- Test: `tests/engine-arts-track.test.mjs`

**Interfaces:**
- Consumes: `tracksOf` (Task 1), `ARTS_TIER_COSTS` (Task 2).
- Produces:
  - Effect `advanceEach: { noBenefit?: boolean, freeBonus?: boolean }`: one `advance` on each track of `tracksOf(state)`, in that order. Renaissance's data becomes `[{ advanceEach: { noBenefit: true, freeBonus: true } }]`.
  - Dark Ages with the arts track: after `chooseTrack` purpose `'darkAges'`, `darkAgesOn` asks `askTrack(ctx, player, others, 'darkAgesKeep', { kind: 'darkAgesKept', advance: track })` when `artsInPlay`, and `darkAgesKept` pushes `darkAgesOn` with `{ track: op.advance, keep: op.track }`; `darkAgesOn` regresses on every other track but `keep`. Without the arts track it runs exactly as now.
  - `priceAsGain(cost: Cost): Effect` in `tinkerers.js`: `{ gain: cost }` for the board tracks; for `{ different: 2 }` a `choice` of the 6 pairs of different resources, for `{ same: 2 }` a `choice` of 2 of each resource, and `{ gain: { any: n } }` for `any`.

- [ ] **Step 1: Write the failing tests**, each in an A&A game (`readyTurn(2, fill, { expansions: ['aa'] })`), each asserting the arts track is among the options or counted:
  - `'R118: Renaissance advances once on each of the five tracks'`: five `tokenMoved` events, the last on `'arts'`.
  - `'R118: Plea for Aid counts the arts track'`, `'R118: Boast of Superiority counts the arts track'` (opponent ahead on everything but arts → 1 track).
  - `'R118: Dictatorship, Socialism and Trade Economy reach the arts track'`: each one's open decision has an arts option.
  - `'R118: Marriage of State may name the arts track'`.
  - `'R118: AI Singularity may start its new token on the arts track'`: `chooseRestart` options deep-equal `tracksOf(state)`.
  - `'R118: Academic Research may repeat the arts space'`: with `seat.tracks.arts = [2]`, `repeatable` includes `{ track: 'arts', space: 2 }`.
  - `'R118: Status Quo takes an arts bonus'`, `'R118: Spies option 3 takes a neighbour's arts space'`, `'R118: the Tinkerers reach the arts track, and option 1 pays back its price as printed'` (arts token on 5 → a `choice` of the 6 different pairs), `'R118: the Mystics count a completed arts track'`.
  - `'R118: Dark Ages with five tracks: the player chooses the track to advance and the one left alone'`: chosen advance `'military'`, kept `'arts'`: exploration, science and technology each regress once, arts stays, military advances 3.
  - `'R118: Dark Ages lets a player choose the kept track even when only one track can regress'` (Review Focus 5): tokens on 0 everywhere but science on 3; advance `'exploration'`; `chooseTrack` purpose `darkAgesKeep` still opens with the four others.
  - `'R118: Leaders, Futurists and Alchemists keep the four board tracks'`: Leaders' options and Futurists' jumps never include `'arts'`.
  - Each base-game test of these effects still passes unchanged (the existing suites run in Step 4).

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/engine-arts-track.test.mjs -t R118`
Expected: FAIL.

- [ ] **Step 3: Implement**: replace `TRACK_IDS` with `tracksOf(ctx.state)` (or `tracksOf(state)`) in each listed function; leave `leaders.js`, `futurists.js` and the Alchemists' marks on `TRACK_IDS`, each with a `// R118: printed for the four board tracks` comment. Client words: `chooseTrack` purpose `darkAgesKeep`, title `'Choose the track Dark Ages leaves alone'`; `advanceEach` in `describe.js`: `'Advance once on each track'` plus the existing no-benefit and free-bonus words.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/engine-arts-track.test.mjs tests/engine-tapestry-tracks.test.mjs tests/engine-tapestry-cards.test.mjs tests/engine-pp-cards.test.mjs tests/engine-pp-civs.test.mjs tests/engine-repeat.test.mjs tests/engine-civs-all.test.mjs tests/client-describe.test.mjs tests/client-decision-words.test.mjs && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Refs #35: R118, the any-track effects reach the arts track"
```

### Task 7: The whole suite, and the docs

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-arts-track-design.md` §3.2 (the type change: `TrackId` widens, `BoardTrackId` names the four)
- Modify: `docs/architecture.md` (the new `tracks-in-play.js`, `effects/arts.js`, `decisions/choose-die.js`)
- Modify: `docs/status.md` (a #35 part 1 entry: what it built, the calls to revisit after playing, what part 2 takes over)

- [ ] **Step 1: Format and run everything**

Run: `npm run format && npm run check && npm run test:unit`
Expected: 0 errors and 0 warnings; every unit test passes, the 200-game simulation included (no A&A games yet: part 2 adds them).

- [ ] **Step 2: Run the browser tests** on the spare port (the owner's server holds 3020)

Run: `PORT=3021 npm run test:e2e`
Expected: PASS. Nothing in the client shows the arts track yet; the lobby lists Arts & Architecture and its two variants.

- [ ] **Step 3: Update the three documents**, then commit

```bash
git add -A
git commit -m "Refs #35: record part 1 of the arts track"
```
