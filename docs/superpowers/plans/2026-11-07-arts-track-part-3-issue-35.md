# A&A's landmark cards (#35 part 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A table with Arts & Architecture on deals and drafts A&A's 5 landmark cards (Villa, Birdwatching Perch, Castle, Windmill, Bridge), with or without the arts track and with or without Plans & Ploys, and a player gains a card's landmark at the end of a turn on which its goal is met.

**Architecture:** The 5 cards join `LANDMARK_CARDS` with 5 new goal kinds; their landmarks join `EXPANSION_LANDMARKS`. The deck and the draft start for any expansion with landmark cards, and deal players + 1 with both expansions' cards. `landmarkGoal` takes the game as a third argument for the two goals the seat alone can't answer: the Bridge reads the map's control, the Castle reads `state.takenTiers`, which `movement.js` fills during the player's own turn and `startTurn` clears. The words stay in `src/lib/cards/landmark-text.js` and `src/lib/decision-words.js`.

**Tech Stack:** plain JavaScript ES modules with JSDoc, Svelte 5 (only `PlayerTabs.svelte` passes one more argument), Vitest with `node:assert/strict`.

**Spec:** [docs/superpowers/specs/2026-11-06-arts-track-design.md](../specs/2026-11-06-arts-track-design.md) §3.9 and §5.

## Global Constraints

- Never edit `docs/conventions.md` or record progress in `CLAUDE.md`; progress goes in `docs/status.md`.
- No `Math.random()`: randomness comes only through `ctx.random`. Engine functions stay pure and throw `PlayerError` for player mistakes.
- A base game and a Plans & Ploys-only game draw exactly as before: same deal, same random draws.
- The cards are dealt with A&A on, whether or not the arts track is in play (§3.9). Their landmarks are in the supply with A&A on, and the arts-track variant doesn't remove them (no `arts: true`).
- Both versions use the corrected footprints (R65); the Castle has 12 plots (R63). `FOOTPRINTS` already has them.
- "Advancement tracks" in the Windmill include the arts track (R118). "Invented" counts the tech cards the player holds, in any row (§3.9).
- No new visuals: the card faces, art and Civ tab card already exist (#32, #63). No screen-reader work.
- Prettier only on the files changed (`npx prettier --write <files>`), never `npm run format`.
- e2e runs with `PORT=3021`.
- Commits reference the issue: `Refs #35: …`, and end with the Co-Authored-By line.

## Review Focus

1. A game with A&A and no P&P drafts the 5 A&A cards; a base game and a P&P-only game keep their deal and draws (Task 1 tests both).
2. The Castle: a move on another player's turn, in setup, a jump, or a regress records nothing; the record clears when the next turn starts (Task 2).
3. The Windmill with the arts track off (4 tracks) and on a track AI Singularity restarted (Task 2).
4. The Bridge counts only the starting territory's neighbours that the player controls: not the start hex itself, not an opponent's hex, not an off-map neighbour (Task 2).
5. The draft prompt with players + 1 cards: the last card goes back under the deck, and the words say so (Task 3).

---

### Task 1: A&A's landmark cards and their deal

**Files:**
- Modify: `src/lib/engine/data/landmark-cards.js` (the 5 cards, `GoalKind`, the file comment)
- Modify: `src/lib/engine/data/landmarks.js` (the 5 landmarks in `EXPANSION_LANDMARKS`, `expansion: 'aa'`, no `arts`)
- Modify: `src/lib/engine/setup.js:459-464` (the deck for any expansion with cards)
- Modify: `src/lib/engine/after-setup.js:16-26` (the draft for any expansion with cards)
- Modify: `src/lib/engine/landmark-cards.js` (`draftLandmarkCards` deals players + 1 with both)
- Modify: `src/lib/rules-help.js:214` (the P&P section lists only P&P's cards)
- Test: `tests/engine-aa-landmark-cards.test.mjs` (new), `tests/engine-plans-ploys.test.mjs:88-105` (the data test filters to P&P), `tests/engine-arts-track.test.mjs:228-248` (the new counts)

**Interfaces:**
- Produces: `GoalKind` gains `'buildingTypes' | 'inventedTech' | 'takenTier' | 'tierTwoTracks' | 'startNeighbours'`. `LANDMARK_CARDS` lists P&P's 5, then `['villa', 'buildingTypes', 3]`, `['birdwatching-perch', 'inventedTech', 3]`, `['castle', 'takenTier', 1]`, `['windmill', 'tierTwoTracks', 2]`, `['bridge', 'startNeighbours', 3]` with `expansion: 'aa'`. `landmarkCardsFor(expansions)` unchanged.
- Produces: `landmarkCardDeal(expansions, players)` in `src/lib/engine/landmark-cards.js`: 2 alone; otherwise `players`, plus 1 when the game's cards come from two expansions.

- [ ] **Step 1: Write the failing tests** in `tests/engine-aa-landmark-cards.test.mjs` (file comment: "A&A's landmark cards (#35 part 3): the data, the deal and draft, and each goal."):
  - `A&A has 5 landmark cards, each naming its own landmark and goal (03 §2.10)`: `landmarkCardsFor(['aa']).map(c => [c.id, c.landmark, c.goal])` deep-equals the 5 rows above; every one has `expansion: 'aa'`.
  - `A&A adds its 5 card landmarks with the shared footprints, also without the arts track`: the 5 are in `EXPANSION_LANDMARKS` with `source: { card: id }`, `expansion: 'aa'`, no `arts`, `footprint === FOOTPRINTS[id]`; `landmarksFor(['aa'], ['no-arts-track'])` includes all 5; the Castle's footprint covers 12 plots (R63).
  - `with A&A alone the last player draws one card per player, and each keeps one` at 2 and 4 players: the deck holds `5 - count` after the draft, every seat keeps a different A&A card, `state.phase === 'play'`, `checkState` passes. The same with `['aa']` and `variants: ['no-arts-track']` at 3 players.
  - `with both expansions the draft deals players + 1, and the last drafter chooses from 2` at 2, 3 and 5 players: the first offer has `count + 1` options; the first player is asked with 2 options and `drafters: []`; after answering, the deck holds `10 - (count + 1) + 1` cards, the one not kept at its end.
  - `alone with both expansions, a player still draws 2`: `landmarkCardDeal(['pp', 'aa'], 1) === 2`, `landmarkCardDeal(['aa'], 1) === 2`, `landmarkCardDeal(['pp'], 3) === 3`, `landmarkCardDeal(['pp', 'aa'], 3) === 4`.
  - `a P&P game deals as before`: before changing setup, record `supply.landmarkCards` and `supply.tech.deck` of `createGame` with `['pp']` and `seededRandom(7)` into the test, as part 2 did for the base game; the test compares against them.
  Then update `tests/engine-plans-ploys.test.mjs:88` to read `landmarkCardsFor(['pp'])` (its rows unchanged), and `tests/engine-arts-track.test.mjs:245-247` to 26, 23 and 33 (`landmarksFor(['aa'])`, `['aa'], ['no-arts-track']`, `['pp', 'aa']`).

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/engine-aa-landmark-cards.test.mjs tests/engine-arts-track.test.mjs`
Expected: FAIL: no A&A cards (`landmarkCardsFor(['aa'])` is empty), `landmarkCardDeal` is not exported, the counts are 21/18/28.

- [ ] **Step 3: Implement** the data rows; the landmarks (`landmark('villa', 'Villa', { card: 'villa' })` and so on, mapped with `expansion: 'aa'`, placed between P&P's list and the arts track's); `setup.js` shuffles `landmarkCardsFor(expansions)` when it is not empty (a P&P game draws as before, an A&A game now shuffles here, before the masterpiece supply); `afterSetupSteps` adds `'landmarkCards'` when `landmarkCardsFor(expansions).length > 0`; `draftLandmarkCards` splices `landmarkCardDeal(state.expansions, count)` cards; `rules-help.js` lists `landmarkCardsFor(['pp'])`.

- [ ] **Step 4: Run the tests to see them pass**, then the P&P, arts track, rules-help, setup and simulation-check files

Run: `npx vitest run tests/engine-aa-landmark-cards.test.mjs tests/engine-plans-ploys.test.mjs tests/engine-arts-track.test.mjs tests/client-rules-help.test.mjs tests/engine-setup.test.mjs`
Expected: PASS. A seeded A&A test that relied on the masterpiece deal may fail because the landmark deck now shuffles first; fix such a test's expectation only if it pinned a seeded draw, and ledger it.

- [ ] **Step 5: Commit** `Refs #35: deal and draft A&A's landmark cards`

### Task 2: The five goals and the Castle's record

**Files:**
- Modify: `src/lib/engine/landmark-cards.js` (`landmarkGoal(seat, card, game)`, `goalCount`, `landmarkCardOps` passes the state)
- Modify: `src/lib/engine/state.js` (`State.takenTiers`)
- Modify: `src/lib/engine/setup.js` (`takenTiers: []` beside `lockedTech`)
- Modify: `src/lib/engine/movement.js:175-184` (record in `arrivalOps`)
- Modify: `src/lib/engine/turn.js` (`state.takenTiers.length = 0` in `startTurn`, and its comment)
- Test: `tests/engine-aa-landmark-cards.test.mjs`

**Interfaces:**
- Consumes: Task 1's goal kinds.
- Produces: `landmarkGoal(seat, card, game?)`: `game` is the state or a view, `Pick<State, 'hexes' | 'takenTiers'>`; it is needed for `takenTier` and `startNeighbours`, and a missing one throws `Error('The … goal needs the game.')`. `State.takenTiers: { player: number, track: TrackId, tier: 2 | 3 | 4 }[]`.
- The counts: `buildingTypes` = distinct `building` in `seat.capital.buildings` (not `besideMat`); `inventedTech` = `top + middle + bottom` lengths; `tierTwoTracks` = tracks in `seat.tracks` with `spacesAdvanced(seat, track) >= 4`; `startNeighbours` = `hexNeighbours(seat.start)` that are in `controlledTerritories(game, seat.seat)` (0 with no start); `takenTier` = `game.takenTiers` entries with `player === seat.seat`.
- The record: in `arrivalOps`, each tier first space a forward move reaches or passes whose landmark isn't in `state.landmarks` (the moves `claimedPassed` already counts, R9) is pushed when `state.phase === 'play' && player === state.current`. Jumps (no landmarks, R9) and regressions record nothing.

- [ ] **Step 1: Write the failing tests** (use `startedGame(2, AA)` from `tests/helpers/engine.mjs`, a `holding` helper like engine-plans-ploys'):
  - `Villa counts the types of income building in the capital, not beside the mat (R64)`: farm, farm, house → `{have: 2, need: 3, met: false}`; an armory beside the mat leaves 2; a market on the grid → met.
  - `Birdwatching Perch counts the tech cards held in every row`: one card in each row → `{have: 3, need: 3, met: true}`; two → not met.
  - `Windmill counts the tracks at tier II or higher, the arts track included (R118)`: arts 4 and exploration 3 → 1; exploration 4 → 2, met; space 3 on every track → 0. With the arts track off, `seat.tracks` has 4 tracks and arts can't count. A track in `restartedTracks` counts (AI Singularity, FAQ #9).
  - `Bridge counts the controlled territories next to the starting territory`: give seat 1 an outpost on 2 of `hexNeighbours(seat.start)` → 2, not met; a third → met; an opponent's outpost alone on a neighbour doesn't count; the start hex itself doesn't count; a seat with `start: null` has 0. `landmarkGoal(seat, 'bridge')` without the game throws.
  - `Castle: advancing on your turn into a tier whose landmark is taken records it`: from `readyTurn(2, …, AA)`, take exploration's tier II landmark out of `state.landmarks`, put the seat on exploration 3, resolve `{ advance: { tracks: ['exploration'] } }` → `state.takenTiers` deep-equals `[{ player, track: 'exploration', tier: 2 }]` and the goal is met.
  - `Castle: a move that passes two taken tiers records both (R9)`: from 3 to 7 on a track with tier II and III landmarks taken → 2 entries.
  - `Castle: a tier whose landmark is still there, a regress, a jump, or another player's move records nothing`: advance into a tier whose landmark is available (gained instead); regress from 7 to 6 with tier II taken; `moveToken` with `jump: true`; a move for the player who isn't `state.current`.
  - `Castle: the record clears when the next turn starts`: after the turn ends, `state.takenTiers` is `[]`.
  - `the Castle's landmark is gained at the end of the turn its goal is met`: `finishTurn` after the advance → the seat's card is gained and the Castle is placed or beside the mat; `checkState` passes.
  - `the other goals are gained at the end of the turn too`: one run each for Villa and Bridge, staged before the turn, gained by its end.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/engine-aa-landmark-cards.test.mjs`
Expected: FAIL: `goalCount` has no branch for the new kinds (it falls through to the lines count), and `state.takenTiers` is undefined.

- [ ] **Step 3: Implement** the counts, the record and its clearing, the state field and its JSDoc.

- [ ] **Step 4: Run the tests to see them pass**, then the engine files that move tokens

Run: `npx vitest run tests/engine-aa-landmark-cards.test.mjs tests/engine-plans-ploys.test.mjs tests/engine-tracks.test.mjs tests/engine-arts-track.test.mjs && npm run check`
Expected: PASS, and check reports 0 errors and 0 warnings.

- [ ] **Step 5: Commit** `Refs #35: the goals of A&A's landmark cards, and the Castle's moves`

### Task 3: The words

**Files:**
- Modify: `src/lib/cards/landmark-text.js` (each kind's verb and nouns)
- Modify: `src/lib/area/landmark-card.js` (`heldLandmarkCard(seat, own, game)`)
- Modify: `src/screens/game/PlayerTabs.svelte:149` (passes `game`)
- Modify: `src/lib/decision-words.js:743-765` (`draftRest` with a card left for the deck)
- Modify: `src/lib/rules-help.js:207` (the draft sentence names the extra card)
- Modify: `src/lib/components/README.md` and `src/lib/components/player/HeldLandmarkCard.svelte`'s `@example` if they name the call
- Test: `tests/client-landmark-cards.test.mjs`

**Interfaces:**
- Consumes: Task 2's `landmarkGoal(seat, card, game)`.
- Produces: `heldLandmarkCard(seat, own, game?)`; `goalNoun`, `landmarkCondition` and `landmarkGoalPhrase` keep their signatures.

The words (`card` for the card face after "Gain this landmark when you …", `short` for the goal line, the log and the prompts):

| Kind | Verb | Card nouns (one / many) | Short nouns (one / many) |
|---|---|---|---|
| buildingTypes | have | type of income building in your capital city / different types of income buildings in your capital city | type of income building in the capital / types of income building in the capital |
| inventedTech | have invented | tech card / tech cards | tech card invented / tech cards invented |
| takenTier | have moved this turn into | tier that no longer had its landmark / tiers that no longer had their landmarks | tier entered this turn after its landmark was taken / tiers entered this turn after their landmarks were taken |
| tierTwoTracks | have reached tier II or higher on | advancement track / advancement tracks | track at tier II or higher / tracks at tier II or higher |
| startNeighbours | control | territory adjacent to your starting territory / territories adjacent to your starting territory | territory controlled next to the starting territory / territories controlled next to the starting territory |

P&P's kinds keep the verb "have".

- [ ] **Step 1: Write the failing tests:**
  - `each A&A landmark card finishes the card's line "Gain this landmark when you …"`: `landmarkCardsFor(['aa']).map(c => landmarkCondition(c.id))` deep-equals `['have at least 3 different types of income buildings in your capital city.', 'have invented at least 3 tech cards.', 'have moved this turn into at least 1 tier that no longer had its landmark.', 'have reached tier II or higher on at least 2 advancement tracks.', 'control at least 3 territories adjacent to your starting territory.']`. The P&P test at line 28 reads `landmarkCardsFor(['pp'])`.
  - `the Civ tab's goal line counts each A&A goal`: Villa with 2 types → `'Not met yet: 2 of 3 types of income building in the capital'`; Birdwatching Perch with 1 → `'Not met yet: 1 of 3 tech cards invented'`; Windmill with 1 → `'Not met yet: 1 of 2 tracks at tier II or higher'`; Bridge with a game whose `hexes` give 1 → `'Not met yet: 1 of 3 territories controlled next to the starting territory'`; Castle with `takenTiers: []` → `'Not met yet: 0 of 1 tier entered this turn after its landmark was taken'`, and with one entry for the seat → `state: 'met'`.
  - `the draft says the last card goes back under the deck when there is one card more than drafters`: options of 4 and `drafters: [2, 3]` → sentence `'Choose the card to keep, then confirm it here. Bo and Cy keep one each of the other three, and the last goes back under the landmark deck.'`, answer `'Keep TV Station: Bo and Cy keep two of the other three'`; options of 3 and `drafters: [2]` → `'… Bo keeps one of the other two, and the last goes back under the landmark deck.'` and `'Keep TV Station: Bo keeps one of the other two'`. The existing 2-player and alone tests still pass.
  - The log line for an A&A card: `eventText({ type: 'landmarkCardGoalMet', player: 1, card: 'windmill' }, TABLE)` is `'Ana met the Windmill card\'s goal: at least 2 tracks at tier II or higher.'`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/client-landmark-cards.test.mjs`
Expected: FAIL: `NOUNS` has no entry for the new kinds (TypeError), and the draft words say "Bo keeps one of the other three, and Cy the last."

- [ ] **Step 3: Implement** the table above as `NOUNS[kind] = { verb?, card, short }` (`verb` defaults to `'have'`) and `landmarkCondition` as `` `${verb} at least ${need} ${noun}.` ``; `heldLandmarkCard` passes `game` on; `draftRest` compares the cards passed on (`options.length - 1`) with the drafters left, and with one more card ends with "the last goes back under the landmark deck"; the rules-help draft sentence becomes "…draws one landmark card per player, one more when Arts & Architecture's cards are in too, and keeps one; …".

- [ ] **Step 4: Run the tests to see them pass**, then the client files that use the words, and the type check

Run: `npx vitest run tests/client-landmark-cards.test.mjs tests/client-rules-help.test.mjs tests/client-log.test.mjs tests/client-prompts.test.mjs && npm run check`
Expected: PASS, 0 errors and 0 warnings.

- [ ] **Step 5: Commit** `Refs #35: words for A&A's landmark cards and the larger draft`

### Task 4: The simulation and the record

**Files:**
- Modify: `tests/simulation.test.mjs` or `tests/helpers/simulation.mjs` only if the A&A games' numbers need a line (the A&A games already draft, since Task 1 adds the step)
- Modify: `docs/status.md` (the M8 summary line and a "### #35 part 3 (A&A's landmark cards)" entry), `docs/superpowers/specs/2026-11-06-arts-track-design.md` §3.9 ("Calls made while building part 3"), `docs/architecture.md` (one paragraph)

- [ ] **Step 1: Run the simulation** and count, in its A&A games, the landmark cards drafted and the A&A goals met (a scratch script over the simulation's games, not a committed test).

Run: `npx vitest run tests/simulation.test.mjs`
Expected: PASS, 200 games.

- [ ] **Step 2: Write the record** in the three docs: what part 3 built, its calls (the Castle follows R9: forward moves that reach or pass a tier's first space, no jumps or regressions; the Castle counts a tier whose landmark the player took themselves; the Bridge counts control as `controlledTerritories` does; words), and what part 4 still needs (an A&A rules-help section with its cards, the card reference).

- [ ] **Step 3: Run the whole suite, the type check and the browser tests**

Run: `npm run check && npm run test:unit && PORT=3021 npm run test:e2e`
Expected: 0 errors; every unit test passes; every browser test passes (under heavy load, rerun a failed file once and report both runs).

- [ ] **Step 4: Commit** `Refs #35: record part 3, A&A's landmark cards`
