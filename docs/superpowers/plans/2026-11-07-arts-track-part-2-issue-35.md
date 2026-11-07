# The arts track, part 2 (#35): masterpieces and inspiration tiles. Implementation plan

> **For agentic workers:** Carry this plan out inline with superpowers:executing-plans. The owner's standing rule: no implementer or reviewer subagents and no per-task reviews. At most one review of the whole of #35 at the end, and only if the owner agrees. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** With the arts track in play, players create, refresh, broadcast and fire the 20 masterpieces and place inspiration tiles. The arts spaces 3, 5, 6, 7, 8, 11 and 12 play in full. A game without the arts track plays exactly as before.

**Architecture:**
- **The supply.** `supply.masterpieces` (a deck, 3 face up and a discard pile) exists only when the arts track is in play. So do each seat's `masterpieces` and `inspired`, as `tracks.arts` does since part 1.
- **The engine module.** A new `masterpieces.js` holds the supply rules (draw, refill, refresh, R119) and what firing one masterpiece pushes.
- **The effects.** `effects/arts.js` turns part 1's stubs into real effects.
- **Firing.** One automatic kind, `askMasterpiece`, serves three purposes: Broadcast, Streaming Implants and a new first income step. It asks or fires one card at a time, so a card gained mid-step still fires.
- **Inspiration tiles.** An inspired row reads an improved copy of its income-mat row. `exposedSpaces()` stays the single reader of the mat.

**Tech Stack:** Plain JavaScript ES modules with JSDoc, Vitest with `node:assert/strict`, `npm run check` (svelte-check, strict).

**Spec:** [docs/superpowers/specs/2026-11-06-arts-track-design.md](../specs/2026-11-06-arts-track-design.md), §3.4, §3.7 and §3.8 (part 2), and §5.

## Global Constraints

- **Conventions.** Follow docs/conventions.md:
  - a one-line comment opening each file;
  - JSDoc on exports;
  - braces on every `if`;
  - Prettier, run on the changed files only (`npx prettier --write <files>`, never `npm run format`);
  - `npm run check` with 0 errors and 0 warnings.
- **The engine.** Engine functions stay pure. Player mistakes throw `PlayerError` with a sentence a player understands. Randomness comes only through `ctx.random`.
- **Rule ids.** Cite R19, R53, R54, R71, R118 and R119 in comments and test names.
- **When the arts track is in play.** Masterpieces and inspiration tiles exist only when `artsInPlay(state)` is true. A base, P&P, or A&A-without-the-arts-track game has:
  - no `supply.masterpieces` and no seat `masterpieces` or `inspired`;
  - no `'masterpieces'` step in its `incomeSteps`;
  - the same random draws as today.
- **Existing tests.** Every existing test passes unchanged, apart from the lists this plan names.
- **Commits.** `Refs #35: …`, imperative, 72 characters at most, with the `Co-Authored-By` line.
- **The client.** No client visuals (part 4 needs approved mockups). The only client changes are the words and lists that the completeness tests require: decision kinds and words, effect words and log lines.

## Review Focus

1. **The masterpiece deck and discards both empty (R119).** Create offers only the face-up cards, a refresh deals nothing new, and nothing crashes. Task 2 pins it.
2. **A single-use card reached again through its own benefit.** For example, Mime repeats Carved Marble Sculpture, whose broadcast could pick Mime again. Single-use cards flip before their benefit, so the card is never offered twice. Task 4 pins it.
3. **Streaming Implants in a 2-player game.** The one opponent is both neighbours: their cards are offered once, never one already chosen, never their single-use or used ones. Task 3 pins it.
4. **Undo after a draw.** Undo must be refused after a create or a refill that took a card from the deck. Task 2 pins it with `revealed()`.
5. **A Ceramics-locked card later in the same turn.** It isn't offered by the income turn's upgrade step or by the Inventors. The lock is gone on the next turn. Task 4 pins it.

---

### Task 1: The masterpiece data and supply

**Files:**
- Create: `src/lib/engine/data/masterpieces.js`
- Modify: `src/lib/engine/state.js` (Supply and PlayerFields types)
- Modify: `src/lib/engine/setup.js` (`newSeat`, `createGame`)
- Modify: `src/lib/engine/view.js` (`HIDDEN_DECKS`, `View` type; skip an absent deck)
- Modify: `src/lib/engine/table.js` (`revealed()` reads an absent deck as undefined)
- Modify: `tests/helpers/invariants.mjs`, `tests/helpers/views.mjs`
- Test: `tests/engine-masterpieces.test.mjs` (new)

**Interfaces:**
- Produces:
  - `MasterpieceCard = { id: string, name: string, effects: Effect[], singleUse: boolean }`.
  - `MASTERPIECES: readonly MasterpieceCard[]`, in the reference order (03 §2.7). Its ids are the art catalog's slugs (`animation` … `topiary`).
  - `masterpiece(id): MasterpieceCard`, which throws Error for an unknown id.
  - `Supply.masterpieces?: { deck: string[], faceUp: string[], discard: string[] }`.
  - `PlayerFields.masterpieces?: { card: string, used: boolean }[]`, in the order gained.
  - `PlayerFields.inspired?: BuildingId[]`.
  - `HIDDEN_DECKS` gains `['masterpieces', 'deck']`.

The effects of the 20 cards (Task 4 builds the new pieces some of them name):

| id | effects (ordered) | singleUse |
|---|---|---|
| animation | vp per techCard; gain any 1 | |
| art-deco | flipMasterpiece; anyBuilding; gain any 1 | yes |
| ballet | vp per capitalRow; gain any 1 | |
| baroque | vp per armory; vp per farm; choice food 1 / culture 1 | |
| calligraphy | gain territory 1 and any 1 | |
| ceramics | upgrade `{ lock: true }` | |
| costuming | trade, optional: pay any 1 → advance `{ tracks: ['arts'] }` | |
| fresco | vp per territory; gain culture 1 | |
| graffiti | vp per market; vp per house; choice worker 1 / coin 1 | |
| haute-cuisine | vp per tapestryCard; gain any 1 | |
| krav-maga | vp per trackSpace military | |
| mapmaking | vp per trackSpace exploration | |
| mime | trade, optional: pay any 1 → flipMasterpiece, repeat | yes |
| modern-dance | vp per capitalColumn; gain any 1 | |
| motion-picture | vp per trackSpace science | |
| painting | vp 4; gain any 1 | |
| stained-glass | vp per trackSpace technology | |
| tapestry | gain tapestry 1 and any 1 | |
| theater | vp per trackSpace arts | |
| topiary | conquer `{ empty: true }` | |

- [ ] **Step 1: Write the failing tests** in `tests/engine-masterpieces.test.mjs`. The file opens with `// Masterpieces (#35 part 2): the supply, create, refresh, firing, broadcast, Streaming Implants and the 20 cards.`
  - `'the 20 masterpieces are the art's 20, two of them single-use'`: the ids deep-equal the catalog's `masterpiece` slugs, in order. The singleUse ids are exactly `['art-deco', 'mime']`. Every effect kind is in `EFFECT_KINDS`.
  - `'setup shuffles the masterpieces and turns 3 face up, with the arts track only'`: `newGame(3, { expansions: ['aa'] })` has a 17-card deck and 3 face up, and together they are the 20 ids. Every seat has `masterpieces: []` and `inspired: []`. With `newGame(3)` and with `['aa']` plus `no-arts-track`, there is no `supply.masterpieces` and no seat key.
  - `'a base game draws the same as before'`: `newGame(3)`'s supply deep-equals a game made with the same seed before this task. Compare the tech, tapestry and territory decks against `createGame` with `seededRandom(1)`, recorded in the test as literal first ids.
  - `'view() shows the masterpiece deck as a count'`: `view(state, 1).supply.masterpieces.deck === 17`, and `faceUp` stays an array of 3.
  - `'revealed() sees a masterpiece drawn from the deck'`: take a clone, shift the deck's top card into face up, and `revealed(before, after)` is true. Two base-game states compare without throwing.
- [ ] **Step 2: Run** `npx vitest run tests/engine-masterpieces.test.mjs`. Expected: FAIL, because `data/masterpieces.js` doesn't exist.
- [ ] **Step 3: Implement** the data file and the types:
  - **Setup.** Shuffle `MASTERPIECES` ids after the landmark cards, only when `arts` is true, so base games draw as before. Pass the arts flag to `newSeat` for `masterpieces: []` and `inspired: []`.
  - **The views.** `view()` and `revealed()` skip a hidden-deck path whose holder is absent.
  - **The invariants** (`checkState`). With `artsInPlay`, each of the 20 ids is found exactly once across the deck, face up, discards and every seat's `masterpieces`. Face up is at most 3, and below 3 only when the deck and discards are both empty. `inspired` holds unique `BUILDING_IDS`. Without the arts track, none of these keys exist.
  - **The views helper** (`checkViews`). `v.supply.masterpieces.deck` is a number whenever the supply has masterpieces. The ids are common words such as `tapestry`, so only the count is checked.
- [ ] **Step 4: Run** the new file, then `npx vitest run tests/engine-setup.test.mjs tests/engine-views.test.mjs tests/simulation-checks.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #35: add the masterpieces and their supply`.

### Task 2: Create and refresh (Dance, Rock Opera, the create bonuses, R119)

**Files:**
- Create: `src/lib/engine/masterpieces.js`
- Create: `src/lib/engine/decisions/choose-create.js`, `src/lib/engine/decisions/choose-refresh.js`
- Modify: `src/lib/engine/effects/arts.js` (real `create`, `refreshMasterpieces`), `src/lib/engine/kinds.js`
- Modify: the client words `src/lib/decision-kinds.js`, `src/lib/decision-words.js`, `src/lib/describe.js`, `src/lib/log.js` (as their completeness tests demand)
- Modify: `tests/engine-final-fixes.test.mjs` (fixtures for the new decisions)
- Test: `tests/engine-masterpieces.test.mjs`

**Interfaces:**
- Produces, in `masterpieces.js`:
  - `drawMasterpiece(ctx): string | null`. It takes the deck's top card. An empty deck is first rebuilt from the shuffled discards (R119), emitting `masterpieceDeckShuffled { count }`.
  - `refillMasterpieces(ctx)`, which turns cards up to 3 or until nothing is left.
  - `refreshMasterpieces(ctx, player)`, which discards the face-up cards and then refills. It emits `masterpiecesRefreshed { player, discarded, faceUp }`.
  - `createOptions(state): string[]`: the face-up ids, then `'deck'` when the deck or discards hold a card.
  - `takeMasterpiece(ctx, player, card)`, where `card` is a face-up id or `'deck'`. It adds `{ card: id, used: false }` to the seat, refills, and emits `masterpieceCreated { player, card: id, from: 'faceUp' | 'deck' }`.
- Produces, the decisions:
  - `chooseCreate { options }`: answers `{ card }` in options order. A wrong answer throws "Choose a face-up masterpiece or the deck."
  - `chooseRefresh`: answers `{ refresh: false }` then `{ refresh: true }`.
- Produces, the effects:
  - `create`: with no options it emits `noMasterpiece`; with one it takes it; otherwise it asks. Without the arts track it emits `noMasterpiece`.
  - `refreshMasterpieces { optional }`: optional asks `chooseRefresh`. It asks nothing when there is nothing to refresh: no card face up and no deck or discard.

- [ ] **Step 1: Write the failing tests** (using part 1's `ontoArts` pattern, moved into the new file):
  - `'Dance creates a face-up masterpiece and the row refills'`: arriving on arts 3 asks `chooseCreate` with the 3 face-up ids, then `'deck'`. Picking face-up card 2 gives the seat `[{ card, used: false }]`. Face up is 3 again, the new card was the deck's old top card, and the deck is 16.
  - `'create may take the deck's top card'`: answering `'deck'` gives the seat the old top card, and face up is unchanged.
  - `'R119: an empty masterpiece deck reshuffles its discards'`: the deck is emptied into the discards (all but the face-up 3), and a create from `'deck'` emits `masterpieceDeckShuffled`. Then the discard is empty and the deck holds the rest.
  - `'R119: with no deck and no discards, only the face-up cards can be created'`: the deck and discards are empty and 2 cards are face up. `chooseCreate` offers exactly those 2. After one is taken, 1 is face up and nothing crashes.
  - `'Infinite Spectrum Photography's bonus pays any 1 resource to create'`: on arts 11 with the bonus paid, the seat holds one masterpiece. Symphony's bonus is tested in Task 5, since its benefit inspires.
  - `'Rock Opera may refresh the face-up masterpieces before or after creating'`:
    - Order refresh first, answer `{ refresh: true }`: 3 new cards are face up and the old ones are discarded. Then create.
    - Order create first: the created card is one of the original 3.
    - Answering `{ refresh: false }`: face up is the row left after the create.
  - `'undo is refused after a create'`: `revealed(before, after)` is true for the action that answered `chooseCreate`.
- [ ] **Step 2: Run** the file. Expected: FAIL with `create is built in #35 part 2.`
- [ ] **Step 3: Implement** the module, the decisions and the two effects, and register them. Add the client words: titles "Create a masterpiece" and "Refresh the masterpieces?"; answer words for a card name, "The deck's top card", "Refresh them" and "Keep them"; the log lines for the new events; and describe words for create and refresh.
- [ ] **Step 4: Run** the file, then `npx vitest run tests/engine-final-fixes.test.mjs tests/client-decision-kinds.test.mjs tests/client-decision-words.test.mjs tests/client-describe.test.mjs tests/client-log.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #35: create and refresh masterpieces (R119)`.

### Task 3: Firing masterpieces (Broadcast, Streaming Implants, the income step)

**Files:**
- Modify: `src/lib/engine/masterpieces.js` (`fireOps`, `masterpieceOptions`), `src/lib/engine/effects/arts.js` (`broadcast`, `streamingImplants`, `askMasterpiece`, `flipMasterpiece`)
- Create: `src/lib/engine/decisions/choose-masterpiece.js`
- Modify: `src/lib/engine/income.js` (a `'masterpieces'` step with a `when` test), `src/lib/engine/data/effects.js` (`flipMasterpiece`), `src/lib/engine/effects/index.js`, `src/lib/engine/kinds.js`
- Modify: the client words as in Task 2
- Test: `tests/engine-masterpieces.test.mjs`

**Interfaces:**
- Produces:
  - `fireOps(state, player, card): NewOperation[]`: one ordered `effects` operation with the card's effects and `source: { masterpiece: card }`, after an emitted `masterpieceFired { player, card, owner }`.
  - `masterpieceOptions(state, player, purpose, chosen): { seat: number, card: string }[]`:
    - for `'income'` and `'broadcast'`: the player's unused cards, in the order gained, minus `chosen`;
    - for `'implants'`: those, then each neighbour's unused cards that aren't single-use, minus `chosen`.
  - The automatic kind `askMasterpiece { purpose, chosen, left? }`:
    - With no options it does nothing (Broadcast also emits `noBroadcast`).
    - For `'income'` and `'broadcast'`, a single option fires without asking.
    - Otherwise it pushes `chooseMasterpiece`.
    - After a fire, `'income'` and `'implants'` ask again with the card added to `chosen`. Implants first count `left` down from 3.
  - `chooseMasterpiece { purpose, options, chosen, left? }`: answers `{ seat, card }` per option, with `{ card: null }` first for `'implants'`. A wrong answer throws "Choose one of the masterpieces offered."
  - `flipMasterpiece {}`: it marks `op.source.masterpiece` used on the player's own seat and emits `masterpieceFlipped`. A card not held throws Error.
  - The income step `'masterpieces'`: `turns: [2, 3, 4, 5]`, after `'eraEnd'` and before `'civAbilities'`, with `when: artsInPlay`. `startIncomeTurn` leaves out a step whose `when` says no.

- [ ] **Step 1: Write the failing tests:**
  - `'a base game's income turn has no masterpiece step'`: the `incomeSteps` operation of a base game's income turn 2 has the same steps as before.
  - `'at the start of an income turn every masterpiece fires, in the order the player chooses'`: a seat holding painting and fresco gets `chooseMasterpiece` purpose `'income'` with both. Picking fresco fires fresco, then painting fires without asking. Both VP land before the civilization step.
  - `'a masterpiece gained during the income step fires in the same step'`: a seat holds costuming, pays it, and lands on Dance. The created card fires before the civilization step.
  - `'a used masterpiece fires no more'`: art-deco with `used: true` doesn't fire.
  - `'Carved Marble Sculpture broadcasts one of your masterpieces, or gains a building'`: with one masterpiece it fires at once; with two it asks; with none, choosing broadcast emits `noBroadcast`.
  - `'Streaming Implants: up to 3 different masterpieces, yours and your neighbours''`: 3 players, and seat 1 is on arts 11, moving to 12. Seat 1 holds painting, seat 2 holds fresco and mime, and seat 3 holds art-deco used plus ballet.
    - The options are painting, fresco and ballet (no mime, no used art-deco), with `{ card: null }` first.
    - After 3 picks, nothing more is asked.
    - Stopping after 1 ends it.
    - Seat 1 gains each card's VP, and the neighbours gain nothing.
  - `'Streaming Implants with 2 players offers the opponent's cards once'`.
  - `'Streaming Implants is the last arts space, so it completes a track'`: a Mystics-free check of `spacesAdvanced(seat, 'arts') === 12`, and the "complete any track" achievement is reached.
- [ ] **Step 2: Run** the file. Expected: FAIL (`broadcast is built in #35 part 2.`).
- [ ] **Step 3: Implement**, then register the kinds. Add the words:
  - titles "Choose a masterpiece to fire", "Broadcast: choose a masterpiece" and "Streaming Implants: choose a masterpiece";
  - the answer word "Stop";
  - the log lines;
  - the describe word for flipMasterpiece: "turn this card face down".
- [ ] **Step 4: Run** the file and the client word tests, plus `npx vitest run tests/engine-income.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #35: fire masterpieces: broadcast, implants, income`.

### Task 4: The 20 masterpieces' effects

**Files:**
- Modify: `src/lib/engine/data/effects.js` (VP counters `capitalRow`, `capitalColumn`; `upgrade.lock`; `conquer.empty`)
- Modify: `src/lib/engine/effects/vp.js`, `src/lib/engine/effects/tech.js`, `src/lib/engine/decisions/choose-upgrade.js`, `src/lib/engine/tech.js` (`upgradable` leaves out locked cards), `src/lib/engine/civs/inventors.js` (options leave out locked cards), `src/lib/engine/effects/conquer.js`, `src/lib/engine/state.js`, `src/lib/engine/setup.js`, `src/lib/engine/turn.js` (`lockedTech`, cleared with `usedThisTurn`)
- Modify: `src/lib/describe.js` (new counter and option words)
- Test: `tests/engine-masterpieces.test.mjs`

**Interfaces:**
- Produces:
  - `State.lockedTech: { player: number, card: string }[]`, started as `[]` and cleared when a turn starts.
  - `isLocked(state, player, card): boolean` in `tech.js`.
  - `upgrade { lock: true }`: the upgraded card is locked at once, before its benefit runs. `chooseUpgrade` carries `lock`.
  - `conquer { empty: true }` limits the targets to hexes with no item (R53: dice and responses as usual).
  - `countVp` `'capitalRow'` and `'capitalColumn'`: `completeLines(cityPlots(seat))`, and 0 with no mat. This is not a capital score, so no capital-scoring trigger fires.

- [ ] **Step 1: Write the failing tests**, one per card. Each fires the card through Broadcast from a staged seat (`fireCard(state, player, id)` in the test file) and asserts the VP, resources or pieces gained:
  - animation (tech cards plus any 1);
  - art-deco (a building plus any 1, then `used: true`);
  - ballet and modern-dance (staged complete rows and columns; `capitalScored` is not emitted);
  - baroque (armories plus farms, then the food or culture choice);
  - calligraphy;
  - ceramics: the card moves up a row, and the income turn's upgrade step and the Inventors don't offer it this turn; it is offered again on the next turn;
  - costuming: pay 1 to advance on arts with benefit; declining pays nothing;
  - fresco; graffiti; haute-cuisine (hand plus mat, covered cards included);
  - krav-maga, mapmaking, motion-picture, stained-glass and theater (spaces advanced; stained-glass on a completed track counts 12);
  - mime: pay 1 to repeat a space, then `used: true`; declining leaves it unused; it is flipped before its benefit, so a broadcast inside it can't offer mime;
  - painting; tapestry;
  - topiary: only empty adjacent territories are offered, and both dice roll (R53).
- [ ] **Step 2: Run** the file. Expected: FAIL on the unknown counters, `lock` and `empty`.
- [ ] **Step 3: Implement**, and add the describe words "1 VP per complete row in your capital city", "… column …", "an empty territory" and "that card can't be upgraded again this turn".
- [ ] **Step 4: Run** the file, `npx vitest run tests/engine-tech.test.mjs tests/engine-conquer.test.mjs tests/client-describe.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #35: play the 20 masterpieces' effects`.

### Task 5: Inspiration tiles (Symphony, CGI Animation)

**Files:**
- Modify: `src/lib/engine/data/income-mat.js` (`INSPIRED_MAT`; `IncomeSpace.inspired`)
- Modify: `src/lib/engine/income.js` (`exposedSpaces` reads `seat.inspired`)
- Create: `src/lib/engine/decisions/choose-inspire.js`
- Modify: `src/lib/engine/effects/arts.js` (`inspire`), `src/lib/engine/kinds.js`, client words
- Test: `tests/engine-inspiration.test.mjs` (new)

**Interfaces:**
- Produces:
  - `INSPIRED_MAT: Record<BuildingId, readonly IncomeSpace[]>`: `INCOME_MAT` with spaces 2, 4 and 6 replaced and `inspired: true` set on those three. Ids, names and `prerequisite` are kept, so R18 is unchanged.

    | row | 2 | 4 | 6 |
    |---|---|---|---|
    | market | coin; 2 VP | coin; vp per territory | 15 VP |
    | house | worker; 2 VP | worker; vp per territoryTile (R54) | 15 VP |
    | farm | food; 2 VP | food; vp per techCard | 15 VP |
    | armory | culture; 2 VP | culture; vp per house | 15 VP |

    Resources go in `income` and VP in `score`.
  - `inspire {}`: the unused rows in `BUILDING_IDS` order. With none it emits `noInspire`; with one it places it; otherwise it asks `chooseInspire { options }` (answers `{ row }`). Placing pushes onto `seat.inspired` and emits `inspired { player, row }`.

- [ ] **Step 1: Write the failing tests:**
  - `'an inspiration tile improves spaces 2, 4 and 6 of its row'`: a data check of all 12 spaces, with the rest equal to `INCOME_MAT`.
  - `'Symphony inspires a row of the player's choice'`: on arts 5, `chooseInspire` offers the 4 rows, and `seat.inspired` becomes `['market']`.
  - `'the last tile is placed without asking, and none left does nothing'`.
  - One test per row, `'an inspired <row> pays its improved spaces at the right steps'`: stage the buildings taken so that spaces 2 and 4 are exposed. Run income turn 3 and assert the VP in the score step and the resources in the income step. Then expose space 6 and assert 15 VP instead of 10.
  - `'R54: inspired Telephone scores 1 VP per territory tile in your supply'`.
  - `'R18: an inspired row keeps its prerequisites'`: `meetsRequirement` is unchanged for a landmark tech card that needs Currency.
  - `'Symphony inspires, and its bonus pays any 1 resource to create'`.
  - `'CGI Animation inspires, and its bonus gains a building'`.
- [ ] **Step 2: Run** `npx vitest run tests/engine-inspiration.test.mjs`. Expected: FAIL (`inspire is built in #35 part 2.`).
- [ ] **Step 3: Implement.** Add the client words: the title "Inspire: choose an income row", the answer words for a row's name, and the log line.
- [ ] **Step 4: Run** the file and `npx vitest run tests/engine-income.test.mjs tests/engine-tech.test.mjs tests/client-area-income.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #35: place inspiration tiles on the income mat`.

### Task 6: A&A in the simulation, the whole suite and the record

**Files:**
- Modify: `tests/helpers/simulation.mjs` (`gameOf`, the failure message), `tests/simulation.test.mjs` (the label), `tests/simulation-checks.test.mjs` (the composition test)
- Modify: `docs/status.md`, `docs/architecture.md`, the design (§3.7 calls made while building)

**Interfaces:**
- Produces, in `gameOf(index)`:
  - **Plans & Ploys** when `floor(index / 40) % 2 === 1`, as now.
  - **Arts & Architecture** when `floor(index / 80) % 2 === 1` and there are 2 or more players. So each combination's 5 games play: none, P&P, A&A, both, none.
  - **The variants.** A game with every variant on and A&A leaves out `either-science-die` without P&P (so the arts track is off) and `no-arts-track` with P&P (so the arts track is on, and either die can be picked).

- [ ] **Step 1: Update the composition test.** Each combination with 2 or more players has 2 A&A games out of 5. Among them, one game with every variant on plays without the arts track. Run it and see it fail.
- [ ] **Step 2: Implement** `gameOf`, and name "Arts & Architecture" in the failure message and the label.
- [ ] **Step 3: Run** `npx vitest run tests/simulation.test.mjs` (with the output to a file, reading the tail). Expected: 200 games pass. If a seed fails, replay it with `SIM_SEED`, find the cause, and fix it test-first.
- [ ] **Step 4: Run** `npm run check` and `npm run test:unit`, then `PORT=3021 npm run test:e2e`. Expected: 0 errors, and every test passes.
- [ ] **Step 5: Record it.**
  - `docs/status.md`: the M8 line and a "#35 part 2" entry with what was built, the tests, the calls made and the hand-offs to part 4.
  - `docs/architecture.md`: the new modules.
  - The design's §3.7: the calls made while building.
- [ ] **Step 6: Commit** `Refs #35: play A&A in the simulation; record part 2`.

## Calls made in this plan (my calls, to record in the design)

- **VP sources.** A masterpiece's VP counts toward the VP source of what fired it: the income turn at step 0, or the track space for Broadcast and Streaming Implants. There is no new VP source until part 4 shows one.
- **Single-use cards flip before their benefit**, so they can't come back through it. Mime flips only when paid; declining keeps it for later.
- **The income step.** The masterpieces fire after the last era's THIS ERA ability ends and before the civilizations, on income turns 2–5. Nobody can hold one at income turn 1.
- **Decisions store their options when pushed** (`chooseCreate`, `chooseMasterpiece`, `chooseInspire`), as `chooseSpace` does.
- **Public cards.** The masterpiece discard pile and every player's masterpieces are public. Only the deck's order is hidden.
