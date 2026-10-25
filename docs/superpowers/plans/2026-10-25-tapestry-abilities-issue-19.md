# Tapestry cards and achievements (#19) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The 43 base tapestry cards and the trap have their abilities, `tapestryOnTop` works, and the 3 achievements are claimed and scored.

**Architecture:**
- `data/tapestry-cards.js` holds the cards as effect data.
- `tapestry.js` plays cards and runs their abilities.
- `abilities.js` answers what lasts: the active THIS ERA ability, advance blocks, allies, and `triggered()`, which collects the operations that abilities add when something happens. The THIS ERA cards' handlers live in `eras.js`.
- `achievements.js` claims achievements.
- New effect kinds and small decision kinds carry the rest.

**Tech Stack:** Plain Node ES modules with JSDoc, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-25-tapestry-abilities-design.md` (read it whole first; each task names its sections). The rules sources are 02 §3, 01 §9–10 and R9, R19, R22–R27.

## Global Constraints

- Engine modules import only relative paths: no DOM, Svelte or Node. Never use `Math.random`; shuffle with `shuffle()` and `ctx.random`.
- Prettier formatting: tabs and single quotes. Braces on every `if`/`else`. A one-line comment at the top of every file, and JSDoc on every export. `npm run check` reports 0 errors and 0 warnings.
- `play()` stays pure. Player mistakes throw `PlayerError` with the exact sentences below; anything else is a plain `Error`.
- Handlers never replace `state.pending` or a lane's stack; they use `ctx.push`. Data from `data/` is `structuredClone`d before it goes into state or an operation.
- **Single options.** A pick with exactly one legal option is made without asking. An optional pick (one with a decline answer) always asks while there is something to pick.
- **Other players.** Anything that reaches another player goes through an `effects` operation for that player, so `runEffects` skips finished players.
- **Rule ids.** Cite them in comments and test names: R9, R19, R22–R27, FAQ #4, #10, #24.
- **Stand-ins.** `tests/helpers/engine.mjs`'s `stubHandoffs()` throws once a stood-in kind is built.
  - Task 1 adds every new effect kind of design §4 to `HANDOFF_EFFECTS`.
  - Each later task removes the kinds it builds, in the same commit.
  - It also migrates every test that relied on them. Migrated tests assert real behaviour; they aren't deleted.
- **New decision kinds.**
  - Each one gets a fixture in the shape test in `tests/engine-final-fixes.test.mjs`, in the task that adds it.
  - Each is registered in `kinds.js`.
  - Its fields and default are as in design §11.
- **Engine tests.** Run `node --test tests/engine-*.test.mjs`; every task leaves it all passing. Run `npm test` (which builds) only in Task 12.
- **Branch and commits.** Work on the branch `issue-19`. Commits reference the issue: `Refs #19: …`. End every commit message with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**PlayerError sentences (exact):**

| Decision | When | Sentence |
|---|---|---|
| `chooseTapestry` | not a card offered (or `null` when not optional) | `Play one of the tapestry cards in your hand.` (unchanged) |
| `choosePartner` | not offered | `Choose one of the opponents offered.` |
| `chooseCopy` | not offered | `Choose one of the tapestry cards you can copy.` |
| `chooseTrack` | not offered | `Choose one of the tracks offered.` |
| `chooseRoll` | not offered | `Choose one of the two results.` |
| `chooseTrade` | offer not offered, or `null` when not optional | `Choose one of the trades offered.` (then `checkPayment`'s own sentences) |
| `chooseDiscard` | not a card in hand, nor `null` | `Discard a tapestry card from your hand, or stop.` |
| `chooseHex` | not offered (or `null` when not optional) | `Choose one of the territories offered.` |
| `chooseLandmark` | not offered | `Choose one of the landmarks offered.` |
| `chooseSpace` | not offered | `Choose one of the spaces offered.` |
| `chooseGift` | not offered, nor `{ tile: null }` | `Give a territory tile from your supply to an opponent, or decline.` |
| `chooseConversion` | not one of `answers()` | `Convert at most the food you earned and hold.` |
| any payment | paying VP you don't have | `You don't have enough VP.` |

## Review Focus

- **A THIS ERA ability outliving its card.** After Nuclear Bomb, Printing Press or Tyranny covers it in the same turn, and after Espionage is covered, none of its rules apply any more. Tests are in Tasks 2, 10 and 11.
- **Finished players.** A finished player gains nothing from Diplomacy, Olympic Host, Age of Discovery, Oil Magnate, Coal Baron or Steam Tycoon. They are never asked to decide for any of these, and they claim no achievement. Tests are in Tasks 4–7.
- **Empty supplies mid-card.** Each of these finishes without an error and without leaving a decision open:
  - Coal Baron with no territory tile left;
  - Democracy with an empty deck and discards;
  - Dystopia with every track landmark taken;
  - Olympic Host with no building left;
  - Steam Tycoon with an empty display;
  - Age of Sail with fewer than 3 tiles left.

  Tests are in Tasks 5, 6 and 8.
- **Hidden cards.** Tyranny's and `tapestryOnTop`'s options, and Democracy's hand, are never in another seat's `view()`. Test in Task 12.
- **Chains that must stop.**
  - Industrialism with Steam Tycoon pays the circle exactly twice.
  - A Marriage of State copy doesn't trigger another copy.
  - Tyranny plays at most once.
  - Alliance gives the holder no Golden Age VP.

  Tests are in Tasks 8–10.

---

### Task 1: Card data, effect vocabulary, counters and VP costs

**Files:**
- Create: `src/lib/engine/data/tapestry-cards.js`
- Modify: `src/lib/engine/data/effects.js`, `src/lib/engine/effects/vp.js`, `src/lib/engine/payment.js`, `tests/helpers/engine.mjs`
- Test: `tests/engine-tapestry-data.test.mjs` (new), `tests/engine-counters.test.mjs`, `tests/engine-payment.test.mjs`

**Interfaces:**
- Produces:
  - `@typedef {{ id: string, name: string, timing: 'played' | 'era', played: Effect[], ordered: boolean }} TapestryCard`
  - `TAPESTRY_CARDS: readonly TapestryCard[]` (deep-frozen; the 43 in `BASE_TAPESTRY` order, then `{ id: 'trap', … }`)
  - `tapestryCard(id: string): TapestryCard`, which maps `trap-1`…`trap-7` to `trap`, and throws `Error` for an unknown id.
  - `EFFECT_KINDS` gains these 20 kinds, and the `Effect` typedef gains their shapes from design §4: `eraPartner`, `copyTapestry`, `sharedAdvance`, `others`, `trade`, `discardTapestry`, `anyBuilding`, `trackLandmark`, `landmarkRank`, `placeOutpost`, `darkAges`, `socialism`, `dictatorship`, `revolution`, `colonialism`, `pleaForAid`, `technocracy`, `tradeEconomy`, `coalBaron`, `olympicHost`.
  - Typedef changes: `advance` gains `optional?`, `freeBonus?`; `explore` gains `tile?`; `invent` gains `faceUpOnly?`, `deckOnly?`, `thenUpgrade?`; `Cost` gains `vp?`.
  - `VP_COUNTERS` gains `trackLead`, `landmark` and `opponent`, and `countVp` counts them as in design §4.
  - `landmarksOwned(seat: PlayerSeat): string[]` in `effects/vp.js`: the ids in `capital.landmarks`, then those in `besideMat` that are landmark ids (`LANDMARKS`).
  - `Cost.vp` in `payment.js`:
    - `canPay` needs `seat.vp >= cost.vp`;
    - every answer of `payments()` carries `vp: cost.vp`;
    - `checkPayment` accepts the key `vp` only when it equals `cost.vp`, and throws `You don't have enough VP.` when the seat has fewer;
    - `pay` subtracts it and emits `vpPaid { player, vp, total }`.

**The cards** (`ordered: true` unless stated):

| id | timing | played |
|---|---|---|
| academia, age-of-sail, broker-of-peace, capitalism, empiricism, exploitation, golden-age, industrialism, mercantilism, militarism, monarchy, pillage-and-plunder, pirate-rule, revisionism, terraforming, theocracy, tyranny, wartime-economy | era | `[]` |
| alliance | era | `[{ eraPartner: {} }]` |
| marriage-of-state | era | `[{ eraPartner: { track: true } }]` |
| age-of-discovery | played | `[{ sharedAdvance: { track: 'roll', others: 'opponents' } }]` |
| age-of-wonders | played | `[{ landmarkRank: { fewest: [{ gain: { any: 2 } }], most: [{ vp: 12 }], otherwise: [{ gain: { any: 1 } }, { vp: 6 }] } }]` |
| boast-of-superiority | played | `[{ vp: { per: 'trackLead', each: 4 } }]` |
| coal-baron | played | `[{ coalBaron: {} }]` |
| colonialism | played | `[{ colonialism: {} }]` |
| dark-ages | played | `[{ darkAges: {} }]` |
| democracy | played | `[{ gain: { tapestry: 3 } }, { discardTapestry: { vpEach: 2 } }]` |
| dictatorship | played | `[{ dictatorship: {} }]` |
| diplomacy | played | `[{ anyBuilding: {} }, { others: { who: 'all', effects: [{ gain: { any: 1 } }] } }]` |
| dystopia | played | `[{ trackLandmark: {} }]` |
| espionage | played | `[{ copyTapestry: {} }]` |
| feudalism | played | `[{ choice: [[{ gain: { any: 1 } }], [{ vp: { per: 'landmark', each: 3 } }]] }]` |
| guilds | played | `[{ trade: { offers: [5→1, 10→2, 15→3 as { pay: { vp: N }, gain: [{ gain: { any: M } }] }, then 1→5, 2→10, 3→15 as { pay: { any: M }, gain: [{ vp: N }] }] } }]` (6 offers, in that order) |
| meritocracy | played | `[{ invent: {} }, { vp: { per: 'techCard', each: 2 } }]` |
| oil-magnate | played | `[{ sharedAdvance: { track: 'choose', others: 'neighbours', optional: true } }]` |
| olympic-host | played | `[{ olympicHost: {} }]` |
| plea-for-aid | played | `[{ pleaForAid: {} }]` |
| renaissance | played, `ordered: false` | `[{ advance: { tracks: [T], noBenefit: true, freeBonus: true } }]` once for each T in `TRACK_IDS` order |
| revolution | played | `[{ choice: [[{ gain: { any: 1 } }], [{ revolution: {} }]] }]` |
| socialism | played | `[{ socialism: {} }]` |
| steam-tycoon | played | `[{ invent: { faceUpOnly: true, thenUpgrade: true } }, { others: { who: 'neighbours', effects: [{ invent: { deckOnly: true } }] } }]` |
| technocracy | played | `[{ technocracy: {} }]` |
| trade-economy | played | `[{ tradeEconomy: {} }]` |
| trap | played | `[{ vp: 10 }]` (R22) |

- [ ] **Step 1: Write the failing tests.**
  - `tests/engine-tapestry-data.test.mjs`:
    - `'the 43 base tapestry cards are in catalog order, then the trap'`: ids equal `[...BASE_TAPESTRY.filter((id) => !id.startsWith('trap-')), 'trap']`;
    - `'tapestryCard maps every trap copy to the trap (R22)'`: `tapestryCard('trap-3').played` deep-equals `[{ vp: 10 }]`, and `tapestryCard('nope')` throws;
    - `'20 cards are THIS ERA and 24 are played'`;
    - `'every played effect has one known kind'`, recursing into `choice`, `others.effects`, `landmarkRank`'s lists and `trade` gains;
    - `'the card data is frozen'`;
    - spot checks: Renaissance has 4 unordered advances; Guilds' 6 offers; Diplomacy's two effects.
  - `tests/engine-counters.test.mjs`:
    - `'trackLead counts tracks where nobody is ahead, ties included'`: tracks exploration 3/3, science 5/2, technology 1/4, military 0/0 → 3;
    - `'trackLead counts a track AI Singularity restarted as 12 for everyone'`;
    - `'landmark counts landmarks in the capital and beside the mat, not buildings (R71)'`;
    - `'opponent counts the other seats'`: 3 players → 2.
  - `tests/engine-payment.test.mjs`:
    - `'a VP cost can be paid only with that many VP'`: `canPay` false at 4 VP for `{ vp: 5 }`; `payments` gives `[{ vp: 5 }]` at 6 VP; `pay` leaves 1 VP and emits `vpPaid`;
    - `'checkPayment refuses VP the player lacks'`, with the exact sentence.
- [ ] **Step 2: Run** `node --test tests/engine-tapestry-data.test.mjs tests/engine-counters.test.mjs tests/engine-payment.test.mjs`. Expected: FAIL (module missing, unknown counters).
- [ ] **Step 3: Implement** the data, the vocabulary, the counters, `landmarksOwned` and `Cost.vp`. Add the 20 new kinds to `HANDOFF_EFFECTS` in `tests/helpers/engine.mjs`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass, 0 errors. `engine-data`'s known-kinds test may need the new kinds listed.
- [ ] **Step 5: Commit** `Refs #19: add the base tapestry cards as data, with their effect vocabulary`.

---

### Task 2: Playing cards and THIS ERA abilities

Design §5 (THIS ERA) and §7.

**Files:**
- Create: `src/lib/engine/tapestry.js`, `src/lib/engine/abilities.js`, `src/lib/engine/effects/tapestry.js`
- Modify: `decisions/choose-tapestry.js`, `income.js`, `state.js`, `setup.js`, `kinds.js`, `effects/index.js`, `tests/helpers/engine.mjs`
- Test: `tests/engine-tapestry-play.test.mjs` (new). Migrate `tests/engine-tapestry-step.test.mjs`, `tests/engine-track-spaces.test.mjs` (Nuclear Bomb), `tests/engine-tech-cards.test.mjs` (Printing Press), `tests/engine-order.test.mjs`, `tests/engine-scripted-game.test.mjs` and `tests/engine-income.test.mjs`.

**Interfaces:**
- Consumes: `tapestryCard` (Task 1).
- Produces:
  - `@typedef {{ card: string | null, ability: string, opponent?: number, track?: TrackId }} Era`. `PlayerFields.era: Era | null`, `null` in `newSeat`.
  - `abilities.js`:
    - `eraOf(state, player): Era | null` (`null` for a seat that isn't a player);
    - `eraAbility(state, player): string | null`;
    - `hasEra(state, player, id): boolean`.
  - `tapestry.js`:
    - `playTapestry(ctx, player: number, card: string, era: number, faceDown = false): void`;
    - `currentEra(state, player): number | null` (design §7);
    - `visibleCards(state): { player: number, card: string, era: number }[]`: every player seat's top card of each slot, in seat and era order, leaving out face-down cards;
    - `startEra(ctx, player, card: string | null, ability: string): void`, which emits `eraStarted`;
    - `endEra(ctx, player): void`, which emits `eraEnded` only if an era was active;
    - AUTOMATIC `tapestryAbility { player, card: string | null, ability?: string, era: number }`.
  - The effect `tapestryOnTop`.
  - `chooseTapestry` gains `optional?: boolean` (a `{ card: null }` answer first) and `afterPlay?: Effect[]`, pushed after the ability only when a card was played.
  - `INCOME_STEPS` becomes `['eraEnd', 'civAbilities', 'tapestry', 'upgrade', 'score', 'income', 'finish']`. `eraEnd` runs on turns 2–5 and calls `endEra`; `finish` also calls `endEra`.
  - Test helpers in `tests/helpers/engine.mjs`:
    - `resolveTapestry(state, random, player, card, era = 2)` puts `card` on top of slot `era`, pushes `tapestryAbility`, runs, and returns the state;
    - `answerDefaults(state, random, limit = 200)` answers every open decision with its first answer (moved from `engine-tech-cards.test.mjs`).
  - Remove `tapestryOnTop` from `HANDOFF_EFFECTS` and `tapestryAbility` from `HANDOFF_OPERATIONS`.

- [ ] **Step 1: Write the failing tests** in `tests/engine-tapestry-play.test.mjs`:
  - `'a trap played as a tapestry card gains 10 VP (R22)'`: `resolveTapestry(…, 'trap-2')` → seat VP +10.
  - `'a THIS ERA card becomes the active ability when played'`: with `'monarchy'`, `seat.era` deep-equals `{ card: 'monarchy', ability: 'monarchy' }`, and there is an `eraStarted` event.
  - `'a THIS ERA card ends at the start of the next income turn'`: the next income turn emits `eraEnded` before `incomeTurnStarted`'s civilization step, and `seat.era` is `null`.
  - `'a THIS ERA card ends when a card covers it'`: `playTapestry` on the same slot ends it.
  - `'a THIS ERA card ends when its player finishes'`.
  - `'a face-down card has no ability'`: no `tapestryAbility` runs after `faceDownTapestry`.
  - `'tapestryOnTop plays nothing in era 1 (R25)'`: `noTapestryOnTop`.
  - `'tapestryOnTop plays onto the current era in eras 2 to 4'`: a `chooseTapestry` with `era` equal to `incomeTurns` and options equal to the hand.
  - `'a card played in step 1 goes into the empty new slot and the era card covers it (R25)'`.
  - `'in income turn 5 tapestryOnTop plays onto era 4 under current rules and nothing under the original (R25)'`.
  - `'tapestryOnTop with an empty hand plays nothing (FAQ #10)'`.
  - `'an optional chooseTapestry may be declined, and afterPlay runs only after a play'`.
  - `'chooseTapestry keeps its options hidden from other seats'`.
- [ ] **Step 2: Run** `node --test tests/engine-tapestry-play.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** as specified above. `chooseTapestry.resolve` and `playFaceDown` call `playTapestry`. `tapestryAbility` pushes `played` as `{ player, kind: 'effects', effects, ordered, source: { tapestry: card ?? ability } }`, and calls `startEra` first for an `era` card.
- [ ] **Step 4: Migrate** the listed tests to real behaviour:
  - Nuclear Bomb and Printing Press now open a `chooseTapestry` (or emit `noTapestryOnTop`).
  - The scripted game counts `tapestryPlayed` events instead of stand-in calls, and still keeps `stubHandoffs()` for the kinds not yet built.
- [ ] **Step 5: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 6: Commit** `Refs #19: play tapestry cards, run their abilities and keep THIS ERA cards active`.

---

### Task 3: Triggers, advance blocks and allies

Design §5 (blocks, allies) and §6.

**Files:**
- Create: `src/lib/engine/eras.js`
- Modify:
  - `abilities.js`, `turn.js`, `setup.js` (`state.blocks: []`), `state.js`;
  - `movement.js`, `effects/move.js`, `effects/research.js`, `decisions/choose-advance.js`;
  - `effects/tech.js`, `effects/gain.js`, `effects/building.js`, `placing.js`, `map.js`
- Test: `tests/engine-abilities.test.mjs` (new)

**Interfaces:**
- Consumes: `eraOf`, `hasEra` (Task 2).
- Produces:
  - `eras.js`: `ERA_HOOKS: Record<string, Record<string, Hook>>`, a plain mutable object, empty for now. It has `@typedef {(state: State, owner: number, payload: Record<string, any>) => NewOperation[]} Hook`.
  - `abilities.js`:
    - `triggered(state, hook: string, payload: { player: number } & Record<string, any>): NewOperation[]`. It asks every player seat in seat order starting at `payload.player`, through the seat's era ability in `ERA_HOOKS`, and concatenates what the handlers return.
    - `advanceBlocked(state, player, track): boolean`;
    - `allies(state, player): number[]`;
    - `opponents(state, player): number[]`: the other seats, clockwise from the player's left;
    - `liftBlocks(ctx, player): void` removes every block of `player` and emits `trackUnblocked` for each.
  - `State.blocks: { player: number, track: TrackId }[]`.
  - Trigger call sites, each pushing `triggered(...)` with the payload of design §6:
    - **`inventCard`**: after the card is taken. When cards remain, an `effects` operation `[{ invent: { count: left - 1 } }]` goes under the triggers instead of asking at once.
    - **the tapestry draw** in `effects/gain.js` (`tapestryGained`, only when at least one card was drawn).
    - **`upgradeCard`**: one push `[cardEffects, ...triggered]`, so the triggers resolve after the card's benefit.
    - **`moveToken`**:
      - fire `advanced` only when `to > from`;
      - `claimedPassed` counts the tier first spaces in `(from, to]` whose landmark wasn't in `state.landmarks`;
      - fire `landmarkGained` with `fromTrack: true` after each `placeLandmark`.
    - **the `landmark` effect** (`fromTrack: false`).
    - **`activationOps`**: `[benefit, ...triggered('benefitGained'), bonus]`.
    - **the `building` effect** (`buildingGained`).
    - **`placePiece`** (`piecePlaced`). `impassable` counts the plots the piece covers that are impassable on the mat; it is always 0 until Terraforming. A building beside the mat fires nothing.
  - Advance legality:
    - `advances()`, `moveOnOneOf` (advance direction) and `rollResearch`'s options leave out tracks where `advanceBlocked` is true;
    - `startTurn(ctx, player)` calls `liftBlocks(ctx, player)`;
    - `endTurn` calls `liftBlocks` for each finished seat it skips (R26);
    - `conquerTargets` leaves out hexes controlled by any of `allies(state, player)`.

- [ ] **Step 1: Write the failing tests** in `tests/engine-abilities.test.mjs`. Register a temporary `ERA_HOOKS.test = { … }` and set `seat.era = { card: null, ability: 'test' }` by hand; delete it in `t.after`.
  - `'a trigger handler runs for the seat whose era ability has it, with the payload'` (`invented`, via a real `invent`).
  - `'triggered asks seats in seat order from the acting player'`: 3 seats, all with the test ability → the owners in order 2, 3, 1 when seat 2 acts.
  - `'an upgrade trigger resolves after the card's own benefit'`.
  - `'advanced fires only for forward moves, with claimedPassed'`: seat 1 advances from 3 to 4 with Lighthouse taken → `claimedPassed: 1`; a regress fires nothing.
  - `'benefitGained fires between a space's benefit and its bonus'`.
  - `'Broker of Peace and Theocracy block their holder's own track'`: `advanceBlocked` true for military and science respectively; `advances()` offers no such move.
  - `'a Dictatorship block stops opponents but not its player, and lifts when turn order reaches its player (R26)'`.
  - `'a block of a finished player lifts when turn order skips them (R26)'`.
  - `'a blocked research roll offers no move'`.
  - `'allies cannot conquer each other's territories'`: either side holding an Alliance era naming the other removes the hex from `conquerTargets`.
- [ ] **Step 2: Run** `node --test tests/engine-abilities.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** as specified above.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass. Existing multi-card invent tests (Rubber) still pass.
- [ ] **Step 5: Commit** `Refs #19: add ability triggers, advance blocks and allies`.

---

### Task 4: Achievements

Design §9.

**Files:**
- Create: `src/lib/engine/achievements.js`
- Modify: `movement.js` (`moveToken`), `effects/conquer.js` (`conquerDice`)
- Test: `tests/engine-achievements.test.mjs` (new)

**Interfaces:**
- Produces:
  - `claimAchievement(ctx, player: number, id: 'complete-track' | 'topple-two' | 'middle-island'): void`. It gains the VP through `vp()` and emits `achievementClaimed { player, achievement, vp }`.
  - `toppledBy(state, player): number`.
  - `checkToppleTwo(ctx, player): void`, which claims when `toppledBy >= 2`.
  - Calls:
    - `moveToken` claims `complete-track` when `to === LAST_SPACE`;
    - `conquerDice`, before rolling, claims `middle-island` when `hex === MAPS[state.map].middle` and the conquest isn't trapped. It then runs `checkToppleTwo` for every seat with an outpost on the hex, attacker first, then in seat order.

- [ ] **Step 1: Write the failing tests:**
  - `'reaching space 12 claims "complete any track" with the first box (R23, R24)'`: small map → 10 VP, large → 15.
  - `'the second player to complete a track gets the next box, and a third on the small map gets nothing'`.
  - `'a player claims each achievement once'`: a second track completed gives nothing.
  - `'a token jumping to 12 claims the achievement'`.
  - `'toppling two opponent outposts claims "topple two" when the second conquest ends'`.
  - `'a topple undone by a trap does not count'`: the conquest is trapped → the attacker is not credited, and the defender's topple of the attacker counts for the defender.
  - `'conquering the middle island claims it, but not when trapped'`: middle island 10/5 on both sides.
  - `'a finished player claims nothing'`.
  - `'claiming order follows when each player met the condition'`: two seats complete the same track through Age of Discovery-style forced advances pushed as `effects` (`advance` with `noBenefit`) → boxes in that order.
- [ ] **Step 2: Run** `node --test tests/engine-achievements.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass; update any scripted-game VP totals the achievements change, with the new value worked out by hand in a comment.
- [ ] **Step 5: Commit** `Refs #19: claim the three achievements`.

---

### Task 5: The simpler WHEN PLAYED cards

Design §8: Meritocracy, Boast of Superiority, Feudalism, Technocracy, Steam Tycoon, Trap, Plea for Aid, Age of Wonders, Diplomacy, Dystopia, Democracy.

**Files:**
- Create: `src/lib/engine/effects/players.js` (`others`), `src/lib/engine/effects/cards.js` (`anyBuilding`, `trackLandmark`, `landmarkRank`, `pleaForAid`, `technocracy`), `decisions/choose-landmark.js`, `decisions/choose-discard.js`
- Modify: `effects/tapestry.js` (`discardTapestry`), `effects/tech.js` (invent options, AUTOMATIC `upgradeTech`), `decisions/choose-invent.js`, `effects/index.js`, `kinds.js`, `tests/helpers/engine.mjs`
- Test: `tests/engine-tapestry-cards.test.mjs` (new)

**Interfaces:**
- Consumes: `opponents` (Task 3), `neighbours` (`income.js`), `landmarksOwned` (Task 1), `resolveTapestry` and `answerDefaults` (Task 2).
- Produces:
  - **`others`** pushes one `effects` operation per target with a clone of `effects` and the caller's `source`:
    - `neighbours` = `neighbours(state, player)` (right, then left);
    - `all` = `[player, ...opponents(state, player)]`, player seats only.
  - **`anyBuilding`**: the building types with at least one left. None emits `noBuildingLeft { player, building: null }`; one is taken without asking; otherwise `chooseOption` with `[[{ building: type }], …]`.
  - **`trackLandmark`**: the track landmarks in `state.landmarks`, in `LANDMARKS` order.
    - None emits `noLandmarkLeft { player, landmark: null }`; one is taken without asking; otherwise `chooseLandmark { options }`.
    - Gaining it removes it from `state.landmarks`, emits `landmarkGained { player, landmark }`, pushes `placeLandmark`, and fires `landmarkGained` with `fromTrack: true`.
  - **`landmarkRank`** compares `landmarksOwned(seat).length` with every player opponent, as design §8, and pushes the matching list.
  - **`pleaForAid`**: n = the tracks where your `spacesAdvanced` is lower than every token of every other seat (a restarted track counts as 12). It pushes `[{ vp: 2 * n }, { gain: { any: n } }]` when n > 0.
  - **`technocracy`** pushes `[{ invent: { thenUpgrade: true } }]` when no other seat has `incomeTurns >= ` yours; otherwise `[{ vp: { per: 'opponent', each: 3 } }]`.
  - **`discardTapestry { vpEach }`** asks `chooseDiscard { vpEach }` while the hand isn't empty. Each card discarded goes to `supply.tapestry.discard`, emits `cardsDiscarded`, gains `vpEach` VP, and asks again. `{ card: null }` stops.
  - **The `invent` options:**
    - `faceUpOnly`: the face-up cards only, no deck, no refresh;
    - `deckOnly`: only `{ card: 'deck' }`;
    - `thenUpgrade`: after the card is taken, push AUTOMATIC `upgradeTech { player, card }`, which calls `upgradeCard`.
  - Remove `others`, `anyBuilding`, `trackLandmark`, `landmarkRank`, `pleaForAid`, `technocracy` and `discardTapestry` from `HANDOFF_EFFECTS`.

- [ ] **Step 1: Write the failing tests**, one or more per card, each through `resolveTapestry`:
  - `'Meritocracy invents a card, then scores 2 VP per tech card'`: 2 cards before → 6 VP.
  - `'Boast of Superiority scores 4 VP per track where nobody is ahead'`.
  - `'Feudalism offers 1 resource or 3 VP per landmark'`.
  - `'Technocracy invents and upgrades for the first player into the era'`: the card ends in the middle row and its circle ran.
  - `'Technocracy gives 3 VP per opponent when someone else is already in the era'`.
  - `'Steam Tycoon invents a face-up card and upgrades it, then the neighbours draw from the deck, right then left'`.
  - `'Steam Tycoon with an empty display invents nothing for its player'`.
  - `'Plea for Aid pays 2 VP and 1 resource per track where everyone is ahead'`.
  - `'Age of Wonders: fewest landmarks gain 2 resources, most gain 12 VP, ties gain 1 resource and 6 VP'` (three cases).
  - `'Diplomacy gives its player a building of their choice and every player a resource, skipping finished players'`.
  - `'Dystopia gains and places a track landmark nobody owns, and does nothing when none is left'`.
  - `'Democracy draws 3, then discards cards one at a time for 2 VP each'`: discard 2 and stop → +4 VP, hand −2.
  - `'Democracy with no cards to draw still lets the player discard'`.
- [ ] **Step 2: Run** `node --test tests/engine-tapestry-cards.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, with fixtures for `chooseLandmark` and `chooseDiscard`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #19: the simpler WHEN PLAYED tapestry cards`.

---

### Task 6: Guilds and Olympic Host

Design §8.

**Files:**
- Create: `decisions/choose-trade.js`
- Modify: `effects/players.js` (`trade`, `olympicHost`, AUTOMATIC `olympicHostEnd`), `effects/index.js`, `kinds.js`, `tests/helpers/engine.mjs`
- Test: `tests/engine-tapestry-cards.test.mjs`

**Interfaces:**
- Consumes: `Cost.vp`, `payments`, `checkPayment`, `pay` (Task 1); `anyBuilding` (Task 5).
- Produces:
  - **`trade { offers, optional?, host? }`.** The affordable offers are those `canPay` allows.
    - None emits `noTrade { player }`.
    - Otherwise `chooseTrade { offers, optional, host }`. Its answers are, for each affordable offer index i, `{ offer: i, pay }` for each payment, with `{ offer: null }` first when optional.
    - Paying emits `tradeMade { player, offer, host }` and pushes that offer's `gain` as an ordered `effects` operation.
  - **`olympicHost`** pushes, for the player and then each of `opponents()`:
    - an `effects` operation `[{ trade: { offers: [{ pay: { worker: 1 }, gain: [{ vp: 10 }] }], optional: true, host: player } }]`;
    - then `olympicHostEnd { player, since: state.seq }`.
  - **`olympicHostEnd`**:
    - if any `tradeMade` event after `since` has `host === player` and a `player` other than the host, it pushes `[{ anyBuilding: {} }]`;
    - if no building type is left, or no opponent paid, it pushes `[{ gain: { coin: 1 } }]`.
  - Remove `trade` and `olympicHost` from `HANDOFF_EFFECTS`.

- [ ] **Step 1: Write the failing tests:**
  - `'Guilds trades VP for resources or resources for VP, and offers only what the player can pay'`: at 7 VP and 0 resources only the first offer.
  - `'Guilds with nothing affordable does nothing'`.
  - `'Olympic Host asks each player with a worker in turn, the host first'`.
  - `'Olympic Host gives a building when an opponent paid, and a coin when none did'`.
  - `'Olympic Host gives a coin when an opponent paid but no building is left'`.
  - `'Olympic Host skips finished players'`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement**, with a fixture for `chooseTrade`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #19: Guilds and Olympic Host`.

---

### Task 7: The track cards

Design §8 and §10: Age of Discovery, Oil Magnate, Dark Ages, Socialism, Dictatorship, Renaissance, Trade Economy.

**Files:**
- Create: `decisions/choose-track.js`, `decisions/choose-roll.js`, `decisions/choose-space.js`
- Modify: `effects/research.js`, `effects/players.js` (`sharedAdvance`, AUTOMATIC `sharedAdvanceOn`), `effects/cards.js` (`darkAges`, AUTOMATIC `darkAgesOn`, `socialism`, `dictatorship`, AUTOMATIC `dictate`, `tradeEconomy`), `effects/move.js`, `movement.js`, `decisions/choose-move.js`, `decisions/choose-bonus.js`, `kinds.js`, `effects/index.js`, `tests/helpers/engine.mjs`
- Test: `tests/engine-tapestry-tracks.test.mjs` (new). Re-run `tests/engine-research.test.mjs` unchanged.

**Interfaces:**
- Consumes: `advanceBlocked`, `opponents`, `triggered`, `ERA_HOOKS` (Task 3).
- Produces:
  - **Science rolls.**
    - `rollScience(ctx, player, next: NewOperation): void` rolls once. With `hasEra(state, player, 'empiricism')` it rolls twice, and if the faces differ it pushes `chooseRoll { options: [a, b], then: next }`. Otherwise it pushes `{ ...next, player, track }`.
    - Each roll emits `scienceDieRolled`.
    - The AUTOMATIC `research` operation now calls `rollScience` with `next = { kind: 'researchRolled', noBenefit, offTrackVp }` (the remaining rolls wait below).
    - `researchRolled` holds the old post-roll logic. A blocked track gives nothing.
  - **`chooseTrack { options, purpose, then }`** answers `{ track }` and pushes `{ ...then, player, track }`.
  - **`sharedAdvance`.**
    - `'roll'`: `rollScience` with `next = { kind: 'sharedAdvanceOn', others, optional }`.
    - `'choose'`: the tracks where the player has a token. One is taken without asking; otherwise `chooseTrack { purpose: 'sharedAdvance' }`.
    - **`sharedAdvanceOn`** pushes the player's `[{ advance: { tracks: [track], optional } }]`, then, for each target in order, `[{ advance: { tracks: [track], noBenefit: true, optional } }]`. The targets are `opponents()` for `'opponents'` and `neighbours()` for `'neighbours'`.
  - **The `advance` effect.**
    - `optional`: always ask with `chooseMove { optional: true }` while a move exists.
    - `freeBonus`: pass `freeBonus: true` to `moveToken`.
  - **`moveToken`** with `freeBonus` (and no benefit): if the space reached has a bonus and isn't activated this turn, it records the activation in `state.activated` and pushes `bonus { player, track, space, free: true }`.
  - **`offerBonus`** with `free` offers `chooseBonus` with `cost: {}`.
  - **`chooseMove`** options may carry `to`. The answer must match the option's `track`, `from` and `to`, and the move goes to `to`.
  - **`darkAges`** offers the advanceable tracks, or else the tracks holding a token. One is taken without asking; otherwise `chooseTrack { purpose: 'darkAges', then: { kind: 'darkAgesOn' } }`. `darkAgesOn { track }` pushes one ordered `effects` operation: a `regress { tracks: [t], noBenefit: true }` for each other track in `TRACK_IDS` order, then three `advance { tracks: [track], noBenefit: true }`.
  - **`socialism`**: the options are `{ track, from, to }` for each of your distinct token spaces, `to` being the nearest opponent token ahead (unless blocked) and the nearest behind. None emits `noMove { player }`; one is made without asking; otherwise `chooseMove { direction: 'jump', options, benefit: false, optional: false }`.
  - **`dictatorship`**: the tracks where an advance is possible and not blocked. None emits `noMove { player }`. One goes straight to `dictate`; otherwise `chooseTrack { purpose: 'dictatorship', then: { kind: 'dictate' } }`. `dictate { track }` pushes `{ player, track }` onto `state.blocks`, emits `trackBlocked`, then pushes `[{ advance: { tracks: [track] } }]`.
  - **`benefitOps(state, player, track, space): NewOperation[]`** (`movement.js`) returns the space's benefit `effects` operation followed by `triggered('benefitGained')`. `activationOps` uses it.
  - **`tradeEconomy`**: options are `{ player, track, space }` for every other seat's token spaces 1–12, leaving out spaces the player activated this turn.
    - One is taken without asking; otherwise `chooseSpace { options }`.
    - Resolving records the player's activation, emits `spaceActivated`, and pushes `benefitOps(...)`.
    - If the space has a bonus, it also pushes `bonus { player: owner, track, space, free: true }`.
  - Remove `sharedAdvance`, `darkAges`, `socialism`, `dictatorship` and `tradeEconomy` from `HANDOFF_EFFECTS`.

- [ ] **Step 1: Write the failing tests:**
  - `'Age of Discovery: the player advances with the benefit, then every opponent clockwise advances without it'`.
  - `'Age of Discovery: opponents gain landmarks in turn order'`.
  - `'Age of Discovery skips finished and blocked players'`.
  - `'Oil Magnate lets the player and each neighbour decline'`.
  - `'Oil Magnate gives only its player the benefit and bonus'`.
  - `'Dark Ages regresses the other three tracks without benefit, then advances 3 on the chosen track, gaining landmarks'`.
  - `'Dark Ages offers no blocked track while another can advance'`.
  - `'Socialism jumps to the nearest opponent ahead or behind, gaining every landmark passed (R9)'`.
  - `'Socialism offers no forward jump on a blocked track'`.
  - `'Dictatorship advances with the benefit and blocks opponents on that track until turn order returns (R26)'`.
  - `'Renaissance lets the player order the four advances, gains landmarks and offers each bonus for free'`.
  - `'Renaissance offers no free bonus on a space activated this turn (R19)'`.
  - `'Trade Economy gains an opponent's space benefit and offers the owner its bonus for free'`.
  - `'Trade Economy leaves out spaces the player activated this turn (R19)'`.
- [ ] **Step 2: Run** `node --test tests/engine-tapestry-tracks.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, with fixtures for `chooseTrack`, `chooseRoll` and `chooseSpace`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass. The existing research and Alien Biology tests still pass.
- [ ] **Step 5: Commit** `Refs #19: the tapestry cards that move tokens`.

---

### Task 8: The map cards, and Alliance

Design §7 (`eraPartner`) and §8: Coal Baron, Colonialism, Revolution, Age of Sail, Exploitation, Militarism, Pillage and Plunder, Pirate Rule, Alliance.

**Files:**
- Create: `decisions/choose-hex.js`, `decisions/choose-gift.js`, `decisions/choose-partner.js`
- Modify:
  - `effects/cards.js`: `coalBaron`, `colonialism` (AUTOMATIC `colonize`), `revolution` (AUTOMATIC `revolt`), `placeOutpost`;
  - `effects/tapestry.js`: `eraPartner`;
  - `effects/explore.js`, `decisions/choose-explore.js`, `effects/conquer.js`;
  - `eras.js`: Alliance's `upgraded`;
  - `kinds.js`, `effects/index.js`, `tests/helpers/engine.mjs`
- Test: `tests/engine-tapestry-map.test.mjs` (new)

**Interfaces:**
- Consumes: `checkToppleTwo` (Task 4), `allies` (Task 3), `eraOf`, `hasEra`.
- Produces:
  - **`chooseHex { options, optional, purpose, then }`** answers `{ hex }` or `{ hex: null }`, and pushes `{ ...then, player, hex }`.
  - **`explore { tile? }`.** `exploreAnswers(state, player, anywhere, tile?)` keeps only that tile when it is given, and `chooseExplore` stores `tile`.
    - **Age of Sail.** When the explore effect runs without `sailed`, it draws 3 territory tiles. Then, if the player holds a tile and there is a player opponent, it pushes `chooseGift`, and under it `[{ explore: { ...value, sailed: true } }]`.
    - **`chooseGift`** answers `{ tile: null }`, then `{ tile, player }` for each held tile and opponent. A gift moves the tile, emits `tileGiven`, and gains 3 VP.
  - **`exploreTile`:**
    - **Militarism**, if the player has an outpost: it pushes `chooseOption { options: [[], [{ placeOutpost: { hex } }]], purpose: 'militarism' }` above the rest.
    - **Exploitation:** instead of the direct VP and the benefit, it pushes `chooseOption { options: [[{ vp: score }, ...benefit], [...benefit, ...benefit]], purpose: 'exploitation', source: { hex } }`.
  - **`placeOutpost { hex }`** takes 1 outpost from the supply onto the hex, upright, and emits `outpostPlaced { player, hex, militarism: true }`.
  - **`conquerHex`**: with Pillage and Plunder and an opponent present, `both = true` and no response is asked. **`conquerDice`**: with Pirate Rule, `[{ tileBenefit: {} }]` (`source: { hex }`) goes under the dice operations.
  - **`coalBaron`** takes `supply.territory[0]` (as the `gain` effect does). Then it pushes, in this order:
    - `[{ explore: { tile } }]`, or nothing if no tile was gained;
    - then `[{ others: { who: 'neighbours', effects: [{ gain: { territory: 1 } }] } }]`.
  - **`colonialism`**: the options are the hexes the player controls whose tile is 1–48. None emits `noColonialism { player }`. One is taken without asking; otherwise `chooseHex { purpose: 'colonialism', then: { kind: 'colonize' } }`. **`colonize`** gains 1 of each resource for the distinct land terrains in `corners` + `island` (mountain → worker, grassland → culture, forest → food, desert → coin).
  - **`revolution`** asks `chooseHex { options: <hexes with the player's toppled outpost>, optional: false, purpose: 'revolution', then: { kind: 'revolt', left: 2 } }`. **`revolt`**:
    - on that hex, raises the player's toppled outposts (`outpostRaised`) and topples every upright opponent outpost with `toppledBy: player` (`outpostToppled`);
    - calls `checkToppleTwo`;
    - while `left > 0` and options remain, asks again with `optional: true`.
  - **`eraPartner { track? }`**:
    - The options are each other player seat, and for `track` each pair with a track no other active Marriage of State names.
    - One is taken without asking; otherwise `choosePartner { options }`.
    - The answer sets `seat.era.opponent` (and `track`) and emits `partnerChosen`.
  - **`ERA_HOOKS.alliance.upgraded(state, owner, { player, card, icon })`** returns, when the owner's era opponent is `player` and the owner isn't the player: `[{ player: owner, kind: 'effects', effects: clone(techCard(card)[icon]), source: { tech: card, icon } }]`.
  - Remove `coalBaron`, `colonialism`, `revolution`, `placeOutpost` and `eraPartner` from `HANDOFF_EFFECTS`.

- [ ] **Step 1: Write the failing tests:**
  - `'Coal Baron gains a tile and explores with that tile only, then gives each neighbour one'`.
  - `'Coal Baron with no tile left still gives the neighbours what is left and explores nothing'`.
  - `'Colonialism gains a resource per land terrain on a controlled tile, and never for a printed territory (R27)'`.
  - `'Revolution raises up to three of your toppled outposts, topples the opponents there, and can claim topple two'`.
  - `'Age of Sail draws 3 tiles on every explore and may give one to an opponent for 3 VP'`.
  - `'Age of Sail draws even when the explore then has no hex'`.
  - `'Exploitation offers the benefit twice instead of the matching-side VP'`.
  - `'Exploitation never applies to space tiles'`.
  - `'Militarism may put an outpost on the explored hex, which the player then controls, without dice or an achievement'`.
  - `'Pillage and Plunder skips the response and gives both dice against an opponent'`.
  - `'Pirate Rule adds the tile's benefit after the dice, even after a trap'`.
  - `'Pirate Rule gives nothing for a printed territory'`.
  - `'Alliance asks for an opponent; that opponent's upgrades give the holder the same benefit after them, without Golden Age VP'`.
  - `'allies cannot conquer each other's territories'`: through the real card.
- [ ] **Step 2: Run** `node --test tests/engine-tapestry-map.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, with fixtures for `chooseHex`, `chooseGift` and `choosePartner`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #19: the tapestry cards for exploring and conquering, and Alliance`.

---

### Task 9: THIS ERA cards on tracks and tech cards

Design §8: Academia, Industrialism, Golden Age, Broker of Peace, Empiricism, Theocracy, Revisionism.

**Files:**
- Modify: `eras.js`, `tech.js` (`upgradable`), `effects/research.js` (Empiricism already rolls twice from Task 7; nothing new unless missing)
- Test: `tests/engine-tapestry-era.test.mjs` (new)

**Interfaces:**
- Consumes: `triggered` and its payloads (Task 3), `rollScience` (Task 7), `hasEra`.
- Produces `ERA_HOOKS` entries. Every handler returns `effects` operations for `owner`:
  - **`academia`:**
    - `invented` → `{ vp: 3 }` when `owner === player`;
    - `tapestryGained` → `{ vp: 3 * cards.length }`.
  - **`industrialism`:** `invented` → the card's circle, cloned, with `source: { tech: card, icon: 'circle' }`.
  - **`golden-age`:** `upgraded` → `{ vp: 3 }` when `owner === player`. `upgradable()` also offers middle-row cards whose prerequisite isn't met while `hasEra(…, 'golden-age')`.
  - **`broker-of-peace`:** `advanced` → `{ vp: 3 }` when `player !== owner` and the track is military.
  - **`empiricism`:** `advanced` → `{ vp: 2 }` when `player === owner` and the track is science.
  - **`theocracy`:** `advanced` → `{ vp: 4 * n }` when `player === owner`, where n counts the spaces 1, 4, 7 and 10 in `(from, to]`.
  - **`revisionism`:**
    - `landmarkGained` with `fromTrack` → `{ gain: { any: 1 } }`;
    - `advanced` → `{ building: 'armory' }` once for each of `claimedPassed`.

- [ ] **Step 1: Write the failing tests:**
  - `'Academia scores 3 VP per tech card invented and per tapestry card gained'` (Democracy's 3 cards → 9).
  - `'Industrialism gains each invented card's circle and leaves it in the bottom row'`.
  - `'Industrialism with Steam Tycoon pays the circle twice'`.
  - `'Golden Age ignores prerequisites and scores 3 VP for every upgrade'`.
  - `'Broker of Peace blocks its holder's military and scores 3 VP per opponent military advance'`.
  - `'Empiricism rolls twice and lets the player choose, for every science roll'`.
  - `'Empiricism scores 2 VP per science advance'`.
  - `'Theocracy blocks science and scores 4 VP per tier entered, a jump counting each tier'`.
  - `'Revisionism gains a resource per track landmark, Dystopia included'`.
  - `'Revisionism gains an armory per claimed landmark space reached or passed'`.
  - `'a THIS ERA card works in the same income turn it is played'`: Golden Age played in step 2, then step 3's upgrade scores 3 VP.
- [ ] **Step 2: Run** `node --test tests/engine-tapestry-era.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #19: THIS ERA cards for tracks and tech cards`.

---

### Task 10: The other THIS ERA cards

Design §8: Marriage of State, Capitalism, Mercantilism, Monarchy, Terraforming, Tyranny, Wartime Economy.

**Files:**
- Create: `decisions/choose-conversion.js`
- Modify:
  - `eras.js`, `income.js`, `decisions/choose-bonus.js`, `city.js`, `placing.js`, `decisions/choose-placement.js`;
  - `effects/explore.js` (`spaceTileOptions`), `kinds.js` (AUTOMATIC `copyBenefit`)
- Test: `tests/engine-tapestry-era.test.mjs`

**Interfaces:**
- Consumes: `eraPartner` (Task 8), `benefitOps` (Task 7), `chooseTapestry`'s `optional` and `afterPlay`, and `currentEra` (Task 2).
- Produces:
  - **`marriage-of-state`:** `benefitGained` returns `[{ player: owner, kind: 'copyBenefit', track, space, from: player }]` when the owner's era opponent and track match and `owner !== player`. **`copyBenefit`** emits `benefitCopied { player, track, space, from }` and pushes the space's benefit without the bonus and without firing `benefitGained`. `spaceTileOptions` accepts the latest `benefitCopied` for that track and space as the start marker too.
  - **`capitalism`:** `buildingGained` market → `{ gain: { coin: 1 } }`.
  - **Income.** The `income` step, after pushing the income effects, also pushes (below them) when the matching era is active:
    - Capitalism `[{ vp: 2 * coins }]`, coins being the sum of `gain.coin` in those effects;
    - Mercantilism `chooseConversion { max: food }`, food being the sum of `gain.food`.
  - **`chooseConversion { max }`.** Its answers are `{ resources: { coin?, worker?, culture? } }` with a total from 0 up to `min(max, seat.resources.food)`, the empty one first. Resolving takes that much food and gains those resources, scores 2 VP each, and emits `resourcesConverted`.
  - **`monarchy`:** `piecePlaced` with a `building` → `{ vp: 3 }`.
  - **`terraforming`:**
    - `piecePlaced` with `impassable > 0` → `{ vp: 5 }`.
    - The `city.js` functions `buildingProblem`, `landmarkProblem`, `buildingSpots` and `landmarkSpots` take `terraform = false`; true lets a piece cover `'blocked'` plots.
    - `placeBuilding`, `placeLandmark` and `choosePlacement` pass `hasEra(state, player, 'terraforming')`.
    - `placePiece` counts the blocked plots the piece covers, from the mat's impassable plots, for `impassable`.
  - **`tyranny`:** `tapestryGained` → when `currentEra` isn't null, `[{ player: owner, kind: 'chooseTapestry', options: cards, era: currentEra, optional: true, afterPlay: [{ vp: 5 }] }]`.
  - **Wartime Economy:** `offerBonus` treats a cost whose only key is `any` as `free` while `hasEra(…, 'wartime-economy')`.

- [ ] **Step 1: Write the failing tests:**
  - `'Marriage of State copies the partner's benefits on the chosen track, without the bonus'`.
  - `'Marriage of State ignores other tracks and other players'`.
  - `'a Marriage of State copy does not trigger another copy'`.
  - `'Marriage of State cannot name a track another active Marriage of State names'`.
  - `'a copied Interstellar Travel explores one of the space tiles it gave (R105)'`.
  - `'Capitalism scores 2 VP per coin icon earned and gains a coin per market'`.
  - `'Mercantilism converts food earned into other resources for 2 VP each, or none'`.
  - `'Monarchy scores 3 VP per income building placed in the capital, and nothing beside the mat'`.
  - `'Terraforming lets buildings and landmarks cover impassable plots, 5 VP per piece'`.
  - `'Tyranny may play a card just gained on top of itself for 5 VP, once'`: after the play, Tyranny is covered and `seat.era.ability` is the new card's or `null`.
  - `'Wartime Economy makes "any resource" bonuses free but still optional'`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement**, with a fixture for `chooseConversion`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass. The capital tests still pass with `terraform` defaulting to false.
- [ ] **Step 5: Commit** `Refs #19: the remaining THIS ERA tapestry cards`.

---

### Task 11: Espionage

Design §7.

**Files:**
- Create: `decisions/choose-copy.js`
- Modify: `effects/tapestry.js` (`copyTapestry`), `kinds.js`, `effects/index.js`, `tests/helpers/engine.mjs`
- Test: `tests/engine-tapestry-copy.test.mjs` (new)

**Interfaces:**
- Consumes: `visibleCards`, `tapestryAbility`, `startEra` (Task 2); `eraPartner` (Task 8).
- Produces:
  - **`copyTapestry`.**
    - The options are `visibleCards(state)` without any `espionage`, as `{ player, card }`.
    - None emits `noCopy { player }`. One is taken without asking; otherwise `chooseCopy { options }`.
    - The answer pushes `tapestryAbility { player, card: <the Espionage card, op.source.tapestry>, ability: tapestryCard(copied).id, era: currentEra(state, player) ?? 4 }`.
  - Remove `copyTapestry` from `HANDOFF_EFFECTS`; the list then holds only `gainCiv`.

- [ ] **Step 1: Write the failing tests:**
  - `'Espionage copies a WHEN PLAYED card on any income mat'`.
  - `'Espionage copying a THIS ERA card makes it active until Espionage is covered'`.
  - `'Espionage copying Alliance or Marriage of State asks for the partner'`.
  - `'Espionage can copy a trap played as a tapestry card (R22)'`.
  - `'Espionage cannot copy covered cards, face-down cards or itself, and does nothing without a target'`.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement**, with a fixture for `chooseCopy`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: all pass.
- [ ] **Step 5: Commit** `Refs #19: Espionage`.

---

### Task 12: Every card end to end, privacy, and the documents

**Files:**
- Test: `tests/engine-tapestry-all.test.mjs` (new), `tests/engine-view.test.mjs`
- Modify: `docs/superpowers/specs/2026-10-24-base-game-data-design.md` (effect table), `CLAUDE.md` ("Where the work stands"), `tests/engine-scripted-game.test.mjs` (if anything is still stood in)

- [ ] **Step 1: Write the tests:**
  - `'every base tapestry card's ability runs to the end: <name>'`, one per card in `TAPESTRY_CARDS`. Set up a 3-player started game where seat 1 has:
    - tokens on 4 or 5 on every track;
    - 2 of each resource;
    - 2 territory tiles and 2 cards in hand;
    - a card in each tech row;
    - one controlled tile hex;
    - opponents with tokens ahead and behind.

    Call `resolveTapestry`, then `answerDefaults`. Expect no error, no open decision, and that `seat.era?.ability` equals the card exactly when its timing is `era`.
  - `'other seats never see a hand in chooseTapestry, Tyranny or Democracy'`: for each, `view(state, 2)` of seat 1's open decision has no `options` and no `answers`.
- [ ] **Step 2: Run** `node --test tests/engine-tapestry-all.test.mjs tests/engine-view.test.mjs`. Fix whatever they find; each fix gets its own test in the owning file.
- [ ] **Step 3: Update the documents:**
  - add the 20 new effect kinds and changed options to the base-game data design's effect table;
  - record #19 in CLAUDE.md's "Where the work stands", in the style of #18's entry: what was built, the "(my call)" list, hand-offs to #20, #27, #28 and #31, and the test files.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: all pass, 0 errors and 0 warnings.
- [ ] **Step 5: Commit** `Refs #19: run every tapestry card end to end, and record #19 in CLAUDE.md`.
