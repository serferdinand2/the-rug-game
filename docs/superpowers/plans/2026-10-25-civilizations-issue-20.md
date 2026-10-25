# The 16 base civilizations (#20) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The 16 base civilizations work in both versions, `civAbilities` and `gainCiv` are real, and civilization tokens and pieces are items on the map.

**Architecture:**
- One module per civilization in `src/lib/engine/civs/`, registered in `CIVS`.
- `civ-turns.js` runs:
  - setup: the `civSetup` after-setup step, a group with one lane per player;
  - the end of income turn 1 (`civFirstTurnEnd`);
  - step 1 (`civAbilities`);
  - mid-game gains (`gainCiv`).
- Civilizations join #19's `triggered()` through `activeHooks()`. Their operations are passive.
- A generic `chooseSlot` decision serves most civilization choices.

**Tech Stack:** Plain Node ES modules with JSDoc, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-25-civilizations-design.md` (read it whole first; each task names its sections). It builds on `docs/superpowers/specs/2026-10-25-tapestry-abilities-design.md` §5–§6. Rules sources: 02 §1–§2 and R28–R35.

## Global Constraints

- Engine modules import only relative paths: no DOM, Svelte or Node. Never use `Math.random`; shuffle with `shuffle()` and `ctx.random`.
- Prettier formatting: tabs and single quotes. Braces on every `if`/`else`. A one-line comment at the top of every file, and JSDoc on every export. `npm run check` reports 0 errors and 0 warnings, and `npx prettier --check src tests` is clean.
- `play()` stays pure. Player mistakes throw `PlayerError` with the exact sentences below; anything else is a plain `Error`.
- Handlers never replace `state.pending` or a lane's stack; they use `ctx.push`. Data is `structuredClone`d before it goes into state or an operation.
- **Single options.** A pick with exactly one legal option is made without asking. An optional pick (one with a decline answer) always asks while there is something to pick.
- **Other players.** Anything that reaches another player goes through an `effects` operation for that player. Civilization hook operations are marked `passive: true` by `triggered()`, and a finished player's passive operation runs only its `vp` effects.
- **Civilization modules.** Each one exports `export const <camelCaseId>` (for example `theChosen` for `the-chosen`), a `Civ` as design §4 defines it. It keeps its own state in `seat.civData[id]`, with a JSDoc typedef for the shape.
- **Versions.** `state.version === 'current'` applies adjustments to `seat.civs[0]` only, never to a civilization gained mid-game (R34). Every civilization gets a test in both versions.
- **Rule ids.** Cite them in comments and test names: R28–R35, R9, R13, R71.
- **New decision kinds.** Each one gets a fixture in the shape test in `tests/engine-final-fixes.test.mjs` and is registered in `kinds.js`.
- **Engine tests.** Run `node --test tests/engine-*.test.mjs`; every task leaves it all passing. Run `npm test` (which builds) only in Task 8.
- **Branch and commits.** Work on the branch `issue-20`. Commits reference the issue: `Refs #20: …`. End every commit message with a blank line and the `Co-Authored-By:` line your own session instructions give for your model.

**PlayerError sentences (exact):**

| Decision | When | Sentence |
|---|---|---|
| `chooseSlot` | not offered (or `null` when not optional) | `Choose one of the options offered.` |
| `chooseCivAbility` | not offered | `Choose which civilization to use next.` |
| `chooseAlchemists` | `roll` not a boolean | `Roll again or stop.` |
| `chooseSwap` | not two income buildings of different types in the capital, nor `null` | `Swap two different income buildings in your capital, or stop.` |
| `chooseProphecy` | not offered | `Choose one of the numbers offered.` |
| `choosePlacement` | a new answer not offered | the existing sentences, plus `You can't place it there.` |

## Review Focus

- **Hidden information.** `chooseCiv` stays hidden, and `seat.civData` is public. R35's draw reveals the discarded cards but not, before it is played, the one kept. Test in Task 7.
- **A civilization gained mid-game.** Mystics are discarded and redrawn. Futurists jump. Every other mid-game clause runs. A civilization gained during step 1 fires that turn. Tests in Tasks 1, 4 and 7.
- **Finished players.** A finished Historians player gets only VP squares. A finished Traders player gets only a red-die VP face. Inventors' card transfer doesn't happen for a finished player. Tests in Tasks 6 and 7.
- **Items.** A hex with an outpost and a token can't be conquered, by anyone. A Nomads piece controls, topples like an outpost, and never counts toward "topple two". Tests in Tasks 2 and 5.
- **The other tests stay calm.** `startedGame()` deals inert civilizations and clears them. No existing test changes because of a civilization. Test in Task 1.

---

### Task 1: The civilization framework

Design §4, §5, §6 and §11 ("Keeping civilizations out of other tests").

**Files:**
- Create:
  - `src/lib/engine/civs/index.js`, and 16 stub modules `src/lib/engine/civs/<id>.js`, each `export const <camel> = { id: '<id>' };` with a header comment;
  - `src/lib/engine/civ-turns.js`;
  - `decisions/choose-civ-ability.js`, `decisions/choose-slot.js`.
- Modify: `abilities.js`, `effects/index.js`, `after-setup.js`, `income.js`, `setup.js`, `state.js`, `kinds.js`, `data/effects.js`, `tests/helpers/engine.mjs`, and every test that calls `stubHandoffs()`.
- Test: `tests/engine-civ-framework.test.mjs` (new).

**Interfaces:**
- Produces:
  - **The registry.** `CIVS: Record<string, Civ>` (all 16, keyed by catalog id) and `civsOf(state, player): Civ[]` (`[]` for a seat that isn't a player). `@typedef Civ` is design §4's, in `civs/index.js`.
  - **State.** `PlayerFields.civData: Record<string, any>` (`{}` in `newSeat`) and `Supply.civDiscard: string[]` (`[]`).
  - **`activeHooks()`** appends `CIVS[id].hooks` for each id in `seat.civs`. `triggered()` returns civilization handlers' operations with `passive: true` added.
  - **`runEffects`:** when the player is finished and the operation is `passive`, it keeps only effects whose kind is `vp`. With none left, it does nothing.
  - **`civ-turns.js`:**
    - AUTOMATIC `civAbilities { player, turn, done = [] }` (design §6) asks `chooseCivAbility { options }` when there are several.
    - AUTOMATIC `civIncome { player, civ, turn }` emits `civAbilityUsed`, then calls `CIVS[civ].income(ctx, player, turn)`.
    - AUTOMATIC `civSetup { player, civ, midGame }` calls `setup`. `civAbilities` pushes `civIncome` above a `civAbilities` with `done` extended.
  - **`AFTER_SETUP`** becomes `['reveal', 'civDeck', 'civSetup', 'start']`. `civSetup` pushes a group with one lane per player seat: a `civSetup` operation per held civilization, then an AUTOMATIC `civAdjust { player, phase: 'setup' }`, which in the current version calls `CIVS[civs[0]].adjustment?.setup`.
  - **`INCOME_STEPS`** gains `'civFirstTurnEnd'` after `'income'`, turns `[1]`. It runs each held civilization's `firstTurnEnd`, then `civAdjust { phase: 'firstTurnEnd' }`.
  - **The effect `gainCiv`** (design §5): draw from `supply.civs`, rebuilding from `supply.civDiscard` when empty. Then append to `seat.civs`, emit `civGained`, and push `civSetup { midGame: true }`. With nothing to draw, emit `noCivLeft`.
  - **The effect `lose: { culture?, any? }`** (design §5) emits `resourcesLost { player, lost }`.
  - **`offer(state, owner, effects): NewOperation`** (in `civs/index.js`, design §4) returns `chooseOption { options: [[], effects], purpose: 'civOffer' }` for a player still playing, and `{ kind: 'effects', effects, passive: true }` for a finished one. Civilization hooks use it for every optional gain. A finished owner's hook returns nothing but `effects` operations.
  - **`gainCiv` never draws the civilization it just discarded** (Mystics). When nothing else can be drawn, nothing is gained.
  - **`chooseSlot { options, optional, purpose, then }`** answers `{ slot }` or `{ slot: null }`, comparing by deep equality. It pushes `{ ...then, player, slot }`. A helper `askSlot(ctx, player, { options, optional, purpose, then })` takes a single option of a mandatory pick without asking, does nothing with none, and otherwise asks.
  - **`tests/helpers/engine.mjs`:**
    - `startedGame(count, options)` takes `options.civs?: string[]`. Without it, it deals `['leaders', 'nomads', 'inventors', 'historians', 'craftsmen']` in seat order, then clears `seat.civs` and `seat.civData` once play starts (they go back to `supply.civs`). With it, it deals those civilizations and keeps them.
    - Dealing swaps the wanted civilization into the seat's `chooseCiv` options from wherever it is (the deck or another seat's options), so every civilization stays in exactly one place.
    - `readyTurn` passes `options` through.
    - `stubHandoffs()` and `HANDOFF_*` are deleted, along with every call. Tests that asserted stand-in calls for `civAbilities` or `gainCiv` now assert the real thing: a `civGained` event, or nothing happening for a civilization with no ability.

- [ ] **Step 1: Write the failing tests** in `tests/engine-civ-framework.test.mjs`. Register a temporary test civilization by assigning `CIVS.test = { … }` and deleting it in `t.after`, and give a seat `civs: ['test']`.
  - `'civAbilities runs a civilization's income ability in step 1 of income turns 2 to 5'`.
  - `'with two civilizations the player chooses which ability comes next'`.
  - `'a civilization gained during step 1 still fires that turn'`.
  - `'gainCiv appends a civilization from the deck and runs its mid-game setup'`.
  - `'gainCiv rebuilds an empty deck from the discards, and gains nothing with neither'`.
  - `'a civilization's hook operations are passive, and a finished player keeps only their VP'`.
  - `'civSetup runs each civilization's setup in a group after the reveal, then the current version's adjustment for the setup civilization only (R34)'`.
  - `'the original version applies no adjustment (R34)'`.
  - `'civFirstTurnEnd runs at the end of income turn 1'`.
  - `'lose takes culture first, then asks for the rest, and takes nothing it can't'`.
  - `'startedGame deals inert civilizations and clears them, keeping every civilization in one place'`.
  - `'startedGame with civs deals and keeps those civilizations'`.
- [ ] **Step 2: Run** `node --test tests/engine-civ-framework.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, with fixtures for `chooseCivAbility` and `chooseSlot`.
- [ ] **Step 4: Migrate** every `stubHandoffs()` user, and run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #20: the civilization framework`.

---

### Task 2: Map items, outposts and the engine hooks civilizations need

Design §8 and §9.

**Files:**
- Create: `src/lib/engine/outposts.js` (`takeOutpost`)
- Modify:
  - `setup.js` (hex `tokens: []`), `state.js`, `map.js`, `achievements.js`;
  - `effects/cards.js` (`placeOutpost`, `revolution`/`revolt`), `effects/conquer.js`, `decisions/choose-die.js`, `decisions/choose-response.js`;
  - `placing.js`, `movement.js`, `effects/move.js`, `decisions/choose-move.js`;
  - `effects/tech.js` (`upgradeCard`), `eras.js` (Golden Age), `effects/vp.js` (`landmarksOwned`)
- Test: `tests/engine-civ-hooks.test.mjs` (new)

**Interfaces:**
- Produces:
  - **Hexes.**
    - `Hex.tokens: { seat: number, civ: string }[]`.
    - `Outpost` gains `piece?: { building: BuildingId } | { landmark: string }`.
  - **Conquering.**
    - `conquerTargets` allows at most one item (`outposts.length + tokens.length`).
    - `loneOpponent` needs exactly one item, an upright outpost or piece of another seat.
  - **Ignoring pieces.** `toppledBy` and Revolution's hexes and `revolt` ignore entries with `piece`.
  - **`landmarksOwned`** adds the seat's map pieces' landmarks.
  - **`takeOutpost(ctx, player): void`** subtracts 1 from `seat.outposts` and pushes `triggered('outpostTaken', { player })`. `conquerHex` and `placeOutpost` use it.
  - **New triggers**, pushed after the call site's own operations:
    - `countsChanged { player }` from:
      - `inventCard` and `upgradeCard`;
      - `placePiece`;
      - `conquerDice` (once, after the claims);
      - a sprung trap in `chooseResponse` (for the defender);
      - `revolt` and `placeOutpost`;
      - `moveToken` reaching 12.
    - `dieKept { player, hex, other }` from `chooseDie.resolve`. `other` is the face effect not kept.
    - `districtsCompleted { player, districts }` from `placePiece`, after its reward.
  - **Moves.**
    - `moveToken` gains `jump` (no landmarks, no benefit or bonus, no `advanced` trigger; the achievement at 12 still counts) and `noBonus` (benefit without the bonus operation).
    - The `advance` effect gains `noBonus` (carried by `chooseMove`) and `offTrackVp`: when every token on every listed track is on 12, the player gains that many VP instead.
  - **Upgrades.** `upgradeCard(ctx, player, card, inventors?: number)` adds `inventors` to the `upgraded` payload. `ERA_HOOKS['golden-age'].upgraded` ignores a payload with `inventors`.

- [ ] **Step 1: Write the failing tests:**
  - `'a hex with an outpost and a token cannot be conquered'`.
  - `'a hex with only a token can be conquered and nothing topples'`.
  - `'a Nomads piece gives control and topples like an outpost, but never counts toward topple two'`.
  - `'landmarks on the map count as owned (R71)'`.
  - `'takeOutpost fires outpostTaken'`.
  - `'countsChanged fires at each check point'`: invent, upgrade, placing, conquest, trap, Revolution, Militarism's outpost, reaching 12.
  - `'dieKept names the face not kept'`.
  - `'districtsCompleted fires after the district reward'`.
  - `'a jump gains no landmark and fires no advanced trigger but claims complete any track'`.
  - `'noBonus gives the benefit without the bonus'`.
  - `'offTrackVp scores when every token is on 12'`.
  - `'an Inventors upgrade names its Inventors seat and gives no Golden Age VP'`.
- [ ] **Step 2: Run** `node --test tests/engine-civ-hooks.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #20: map items, outposts and the hooks civilizations need`.

---

### Task 3: Leaders, Merrymakers, Entertainers, The Chosen and Alchemists

Design §7.

**Files:**
- Modify: `civs/leaders.js`, `civs/merrymakers.js`, `civs/entertainers.js`, `civs/the-chosen.js`, `civs/alchemists.js`, `kinds.js`
- Create: `decisions/choose-alchemists.js`
- Test: `tests/engine-civs-income.test.mjs` (new)

**Interfaces:**
- Consumes: `askSlot`, `chooseSlot`, `civIncome` (Task 1); `advance { noBonus, offTrackVp }` (Task 2); `advanceBlocked`, `opponents` (#19); the `trackLead` counter and `state.achievements`.
- Produces: each civilization's `setup`, `incomeTurns: [2, 3, 4, 5]`, `income` and `adjustment`, as design §5 and §7 give. The data:
  - **Entertainers' grid:** 16 spaces in 4 columns of 4 rows, with R28's links.
    - Column 1, rows 1–4: worker, culture, food, coin.
    - Column 2: farm, market, house, armory.
    - Column 3: `conquer`, `research { noBenefit }`, `invent`, `explore`.
    - Column 4: `advance { tracks: [technology] }`, then exploration, military, science.
  - **Links:**
    - the start links to all of column 1;
    - columns 1→2 and 3→4: row 1 → rows 1, 2; row 2 → rows 2, 3; row 3 → rows 2, 3; row 4 → rows 3, 4;
    - column 2→3: rows 1 and 2 → rows 1, 2; rows 3 and 4 → rows 3, 4.
  - **Merrymakers' columns**, bottom to top:
    - `[[{ gain: { coin: 1 } }], [{ gain: { worker: 1, food: 1 } }], [{ gain: { culture: 1 } }, { building: 'armory' }]]`;
    - `[[{ gain: { territory: 1 } }], [{ invent: {} }, { gain: { tapestry: 1 } }], [{ explore: {} }, { research: {} }]]`;
    - `[[{ vp: 5 }], [{ vp: 10 }], [{ vp: 15 }]]`.
    - Two-part spaces run unordered.
  - **AUTOMATIC `alchemistsRoll { player }`** and decision **`chooseAlchemists { marked }`**:
    - answers `{ roll: true }`, then `{ roll: false }`;
    - the first roll happens without asking;
    - stopping pushes, per marked track in roll order, `[{ advance: { tracks: [t], noBenefit: true, optional: true, offTrackVp: 5 } }]`.

- [ ] **Step 1: Write the failing tests**, each in both versions where an adjustment differs:
  - `'Leaders advance once per track with the benefit but no bonus, and may decline'`.
  - `'Leaders never offer a blocked or finished track'`.
  - `'Merrymakers move one token up and gain both icons'`.
  - `'Merrymakers gain 1 resource at setup only in the current version (R34)'`.
  - `'Entertainers move along R28's links and gain the space; column 4 advances may pay the bonus (R29)'`.
  - `'Entertainers gained mid-game put the token on any space and gain it'`.
  - `'Entertainers gain 1 resource and 10 VP at setup only in the current version'`.
  - `'The Chosen score 1 VP per opponent per track they lead, and resources per achievement, or 5 VP each on income turn 5'`.
  - `'The Chosen gain 15 VP per opponent at setup only in the current version'`.
  - `'Alchemists roll until they stop, then advance once on each marked track without benefit'`.
  - `'Alchemists bust on a repeated track and gain 1 resource'`.
  - `'Alchemists score 5 VP for a track whose tokens are all on 12'`.
  - `'Alchemists gain 1 resource and 10 VP at setup only in the current version'`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement**, with a fixture for `chooseAlchemists`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #20: Leaders, Merrymakers, Entertainers, The Chosen and Alchemists`.

---

### Task 4: Futurists, Mystics and Architects

Design §5 and §7.

**Files:**
- Modify: `civs/futurists.js`, `civs/mystics.js`, `civs/architects.js`, `city.js` (cubes), `effects/score-capital.js`, `kinds.js`
- Create: `decisions/choose-prophecy.js`, `decisions/choose-swap.js`
- Test: `tests/engine-civs-setup.test.mjs` (new)

**Interfaces:**
- Consumes: `moveToken { jump }`, `countsChanged`, `districtsCompleted` (Task 2); `lose`, `askSlot`, `gainCiv`'s mid-game `setup` (Task 1); `completeDistricts`, `cityPlots`, `controlledTerritories`, `spacesAdvanced`.
- Produces:
  - **Futurists:**
    - `setup` (setup and mid-game): a `jump` of 4, capped at 12, for the most advanced token on each track that has one, then `{ gain: { coin: 1, worker: 1, food: 1, culture: 1 } }`;
    - `adjustment.firstTurnEnd`: `[{ lose: { culture: 1, any: 1 } }]`.
  - **Mystics:**
    - `setup(…, false)` asks `chooseProphecy { category, options }` four times, for `techCards` 1–9, `districts` 1–9, `territories` 1–9 and `tracks` 1–4. Each answer is stored in `civData.mystics.predictions` and emits `prophecyMade`. After the last one, `mysticsCheck` runs once (BGA checks right after the predictions).
    - `setup(…, true)` moves Mystics from `seat.civs` to `supply.civDiscard`, emits `civDiscarded`, and pushes `[{ gainCiv: {} }]`.
    - The hook `countsChanged` returns `mysticsCheck { player: owner }`. That AUTOMATIC operation pays 1 any resource for each category newly equal to its prediction, and emits `prophecyReached`.
    - `incomeTurns: [5]`: `income` scores 10 VP per exact prediction.
    - `adjustment.setup`: `[{ gain: { any: 1 } }]`.
  - **Architects:**
    - `seat.capital.cubes: number[]` (`[]` by default); `cityPlots` shows each as `'blocked'`, so Terraforming may build over a cube like any impassable plot.
    - `adjustment.setup` asks one `chooseSlot` (purpose `architectsCube`) per opponent, among the open plots in districts with no cube.
    - The hook `districtsCompleted` returns `[{ gain: { any: n } }]` for the n uniform districts (design §7).
    - `scoreCapital` adds 1 VP per uniform complete line when the player holds Architects.
    - `setup(…, true)` asks `chooseSwap { left: 3 }` repeatedly.

- [ ] **Step 1: Write the failing tests:**
  - `'Futurists jump 4 on every track without landmarks and gain 1 of each resource'`.
  - `'Futurists gained mid-game jump too'`.
  - `'Futurists lose 1 culture and 1 resource at the end of income turn 1 only in the current version'`.
  - `'Mystics predict 4 numbers at setup, gain 1 resource when a count first reaches a prediction, and score 10 VP per exact prediction on income turn 5'`.
  - `'Mystics gained mid-game are discarded and another civilization is gained'`.
  - `'Mystics gain 1 resource at setup only in the current version'`.
  - `'Architects pay 1 more resource for a uniform district'`.
  - `'Architects score 2 VP per uniform complete line'`.
  - `'Architects gained mid-game may swap up to 3 pairs of buildings'`.
  - `'Architects place 1 impassable cube per opponent in different districts only in the current version'`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement**, with fixtures for `chooseProphecy` and `chooseSwap`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #20: Futurists, Mystics and Architects`.

---

### Task 5: Craftsmen and Nomads

Design §7 (Craftsmen, Nomads), §8 and §9 (placement).

**Files:**
- Modify: `civs/craftsmen.js`, `civs/nomads.js`, `placing.js`, `decisions/choose-placement.js`, `city.js` if needed
- Test: `tests/engine-civs-placement.test.mjs` (new)

**Interfaces:**
- Consumes: `piece` outposts, items and `countsChanged` (Task 2); `triggered('piecePlaced')` (#19).
- Produces:
  - **The placement answers** (design §9), in this order: capital plots, then `{ craftsmen: c }` for each Craftsmen column with room, then `{ hex }` for each Nomads hex. When there is no capital plot but an alternative exists, `{ besideMat: true }` comes first.
  - **Craftsmen.**
    - `civData.craftsmen = [[], [], []]`, the buildings in each column.
    - Placing in a column emits `buildingPlaced { …, craftsmen: c }`, gains the covered space's benefit (design §7), and fires `piecePlaced` (impassable 0) and `countsChanged`.
    - The grid:
      - A `[[{ gain: { worker: 1 } }], [{ gain: { territory: 1 } }], [{ vp: 5 }]]`;
      - B `[[{ gain: { coin: 1 } }], [{ invent: {} }], [{ upgrade: {} }], [{ vp: 10 }]]`;
      - C `[[{ gain: { food: 1 } }], [{ gain: { tapestry: 1 } }], [{ gain: { culture: 1 } }], [{ research: {} }], [{ vp: 15 }]]`.
  - **Nomads.**
    - The hexes are design §7's (a) and (b).
    - Placing pushes `{ seat, toppled: false, piece }` onto `hex.outposts` and emits `piecePlacedOnMap { player, hex, piece }`. It gains `{ gain: { any: 1 } }` for (a), and fires `countsChanged`.
    - Landmarks go there too, through `placeLandmark`'s answers.

- [ ] **Step 1: Write the failing tests:**
  - `'Craftsmen offer each column's lowest open space besides the capital and gain its benefit'`.
  - `'Craftsmen buildings count for building VP but never complete rows, columns or districts (R71)'`.
  - `'Craftsmen placement scores Monarchy'`.
  - `'with a full capital Craftsmen choose a column or beside the mat'`.
  - `'Nomads may put a building on a controlled territory with one item for 1 resource, making it unconquerable'`.
  - `'Nomads may put a building or landmark on an empty territory next to theirs and control it'`.
  - `'a Nomads piece can be conquered and toppled, and doesn't count for topple two'`.
  - `'a Nomads landmark on the map doesn't count for the tiebreak (R13)'`.
  - `'Craftsmen and Nomads behave the same in both versions'`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass. The capital tests stay unchanged for seats without these civilizations.
- [ ] **Step 5: Commit** `Refs #20: Craftsmen and Nomads`.

---

### Task 6: Traders, Isolationists and Militants

Design §7 and §8.

**Files:**
- Modify: `civs/traders.js`, `civs/isolationists.js`, `civs/militants.js`, `effects/conquer.js` (Isolationists' offer), `kinds.js`
- Test: `tests/engine-civs-map.test.mjs` (new)

**Interfaces:**
- Consumes: `Hex.tokens`, items, `outpostTaken`, `dieKept`, `countsChanged` (Task 2); `askSlot` (Task 1); `controlledTerritories`, `hexNeighbours`, `cornersOf`, `turned` and `HEX_SIDES` from `map.js` and `data/maps.js`.
- Produces:
  - **Traders.**
    - `civData.traders = { tokens: 4 }`.
    - The ability: `askSlot` (optional, purpose `traders`) over the explored hexes with no item, or with exactly one item that is an opponent's upright outpost.
    - Resolving pushes `{ seat, civ: 'traders' }` onto `hex.tokens` and emits `tokenPlaced`. With no item, it gains 1 VP per neighbouring hex an opponent controls; otherwise it pushes `[{ tileBenefit: {} }]` with `source: { hex }`.
    - The hook `dieKept`: when `player` isn't the owner and the hex holds the owner's token, it returns `chooseOption { options: [[], [other]] }`.
    - Adjustment: `[{ gain: { any: 2 } }, { vp: 10 }]`.
  - **Isolationists.**
    - `civData.isolationists = { tokens: 4 }`.
    - `conquerHex` asks, when the conquered hex held no item before and the attacker holds Isolationists with a token left: `chooseOption { options: [[], [{ placeToken: { hex, civ: 'isolationists' } }, { gain: { any: 1 } }]] }`. `placeToken` is a new effect that pushes the token and emits `tokenPlaced`.
    - `incomeTurns: [5]`: `income` scores R31's table for R32's largest land mass.
    - Adjustment: `[{ gain: { territory: 2 } }]`.
  - **Militants.**
    - `civData.militants = { top: [bool×4], bottom: [bool×4] }`, where true is covered. Setup covers 8 spaces.
    - The hook `outpostTaken` uncovers the leftmost covered space of the row chosen with `askSlot` (purpose `militantsRow`).
    - `income` (turns 2–5) gains every uncovered space's effect:
      - top: `{ gain: { coin: 1 } }`, `{ vp: 2 }`, `{ gain: { food: 1 } }`, `{ vp: 4 }`;
      - bottom: `{ vp: 1 }`, `{ gain: { worker: 1 } }`, `{ vp: 3 }`, `{ gain: { culture: 1 } }`.
    - `setup(…, true)` places `seat.outposts` outposts right to left, asking the row for each.

- [ ] **Step 1: Write the failing tests:**
  - `'Traders on an empty territory score 1 VP per neighbouring opponent territory'`.
  - `'Traders gain the unkept die when an opponent conquers their territory, VP only once finished'`.
  - `'Traders beside an opponent's lone outpost gain the tile's benefit and block conquest'`.
  - `'Traders gain 2 resources and 10 VP at setup only in the current version'`.
  - `'Isolationists may place a token on an empty territory they conquer for 1 resource'`.
  - `'Isolationists score their largest single-terrain land mass on income turn 5 (R31, R32)'`, with a multi-terrain tile linking on one shared corner and failing to link on the other.
  - `'Isolationists gain 2 territory tiles at setup only in the current version'`.
  - `'Militants take each outpost from the far left of a chosen row and gain every uncovered space each income turn'`.
  - `'Militants gained mid-game place their outposts right to left'`.
  - `'Militants behave the same in both versions'`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #20: Traders, Isolationists and Militants`.

---

### Task 7: Heralds, Historians and Inventors

Design §7.

**Files:**
- Modify: `civs/heralds.js`, `civs/historians.js`, `civs/inventors.js`, `tech.js` (`upgradable` honours Inventors' marks), `kinds.js`
- Test: `tests/engine-civs-cards.test.mjs` (new)

**Interfaces:**
- Consumes: `copyAbility`, `visibleCards`, `chooseTapestry` with `optional` and `era`, `tapestryCard` (#19); `upgradeCard(…, inventors)` and `countsChanged` (Task 2); `askSlot` (Task 1); the `landmarkGained` and `upgraded` triggers (#19).
- Produces:
  - **Heralds.**
    - `civData.heralds = { tokens: 4, cards: [] }`.
    - `income`: `askSlot` (optional, purpose `heralds`) over the visible cards with `timing: 'played'` that carry no Herald token. The answer records the card, takes a token, and calls `copyAbility(ctx, player, null, card)`.
    - `firstTurnEnd` (only when `seat.civs[0] === 'heralds'`):
      - original: `chooseTapestry { options: hand, era: 1, optional: true }`;
      - current: `firstTurnEnd` does nothing. Instead, `adjustment.firstTurnEnd` does R35's draw: draw until a card with `timing: 'played'` (traps included), emitting `cardsRevealed` for the discards. Then it asks `chooseTapestry { options: [found], era: 1, optional: true }`, unless the found card is `renaissance`.
  - **Historians.**
    - `civData.historians = { squares: [true, true, true, true], given: { [seat]: count } }`, the squares in the order 3 VP, food, worker, 3 VP.
    - `income`: with a territory tile in hand, `askSlot` (optional) over `{ to, square }` pairs. The answer discards the tile.
    - The hook `landmarkGained`: when `player` holds the owner's token, it returns `[{ player: owner, kind: 'effects', effects: <uncovered squares' effects> }]`.
    - `setup(…, true)` asks 4 times for an opponent.
  - **Inventors.**
    - `civData.inventors = { tokens: 4, cards: [] }`.
    - `income`: `askSlot` (optional) over `{ player, card }` for every card in any player's bottom or middle row. The answer marks the card, takes a token, and calls `upgradeCard(ctx, owner, card, player)`.
    - `upgradable` offers a marked middle-row card whatever its prerequisite.
    - The hook `upgraded` (design §7), for an opponent's card the owner marked:
      - on a square, by anyone: `offer` of the square, then AUTOMATIC `inventorsTake { player: owner, from, card }`, which moves the card into the owner's bottom row and fires `countsChanged`;
      - on a circle with `inventors === owner`: `offer` of the circle.
      - A finished owner takes no card.

- [ ] **Step 1: Write the failing tests:**
  - `'Heralds copy a visible WHEN PLAYED card, one token per card'`.
  - `'Heralds cannot copy a THIS ERA or covered card'`.
  - `'original Heralds may play any card on Maker of Fire at the end of income turn 1'`.
  - `'current Heralds draw until a WHEN PLAYED card and may play one but not Renaissance on Maker of Fire (R35)'`.
  - `'Historians give a token for a territory tile and gain every uncovered square when that opponent gains a landmark (R30)'`.
  - `'a finished Historians player gains only the VP squares'`.
  - `'Historians gained mid-game give all 4 tokens'`.
  - `'Inventors upgrade any card instantly, ignoring its prerequisite for good'`.
  - `'Inventors may copy an opponent's upgrade and take the card when it reaches the top row'`.
  - `'Golden Age gives no VP for an Inventors upgrade'`.
  - `'Heralds, Historians and Inventors behave the same in both versions apart from R35'`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #20: Heralds, Historians and Inventors`.

---

### Task 8: Every civilization end to end, and the documents

**Files:**
- Test: `tests/engine-civs-all.test.mjs` (new), `tests/engine-view.test.mjs`
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-24-base-game-data-design.md` (the `gainCiv`, `lose` and `placeToken` effects), `docs/superpowers/specs/2026-10-25-civilizations-design.md` (anything the build changed)

- [ ] **Step 1: Write the tests:**
  - `'every civilization plays its setup and four income turns to the end in both versions: <name> (<version>)'`. Use `startedGame(2, { civs: [id, …], version })`, play income turns with `answerDefaults`, and expect no error and no open decision.
  - `'civilization data is public and chooseCiv stays hidden'`.
- [ ] **Step 2: Run** them. Fix whatever they find; each engine fix gets its own focused test in the owning file.
- [ ] **Step 3: Update the documents:**
  - add the new effects to the base-game data design's table;
  - record #20 in CLAUDE.md's "Where the work stands", in #19's style, with the "(my call)" list, the hand-offs (#27, #28, #31, #47) and the test files;
  - update the "Done" line, "Next" (#21 is next) and the date.
- [ ] **Step 4: Run** `npm test`, `npm run check` and `npx prettier --check src tests`. Expected: all clean.
- [ ] **Step 5: Commit** `Refs #20: run every civilization end to end, and record #20 in CLAUDE.md`.
