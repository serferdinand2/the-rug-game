# Advance turns (#14) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A player can take an advance turn on any of the four tracks: pay, move, gain landmarks, resolve the space's benefit in a legal order, and optionally pay its bonus. Every effect that moves a token or reads the tracks is built, and the rest are handed off by name.

**Architecture:** New decision kinds, automatic operations and effect handlers registered in `kinds.js` and `effects/index.js`, on top of #13's operation stack. `payment.js`, `movement.js`, `control.js` and `turn.js` hold the shared rules. The run loop is not changed.

**Tech Stack:** Plain Node ES modules with JSDoc, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-24-advance-turns-design.md`

## Global Constraints

- Engine modules import only relative paths: no DOM, Svelte or Node, and never `Math.random` (`tests/engine-data.test.mjs` checks).
- Prettier (tabs, single quotes), braces on every `if`/`else`, a one-line comment at the top of every file, JSDoc on every export. `npm run check` reports 0 errors and 0 warnings.
- `play()` stays pure. Player mistakes throw `PlayerError` with a sentence a player understands; anything else is a plain `Error`.
- Every change emits exactly one event per thing that happened; nothing private outside `secret`.
- Handlers never replace `state.pending` or a lane's stack array.
- Cite rule ids in comments and test names (R9, R19, R71, R105).
- A handed-off effect throws an ordinary `Error` naming its kind until its issue lands. Tests replace it with a recording stand-in, only inside the test.
- Commits reference the issue: `Refs #14: …`, and the last one `Fix #14: …`.

## Review Focus

- **Two tokens on one track** (after AI Singularity restarts onto a track that already has one): the advance turn and `chooseMove` must offer each token, and an answer without `from` must be refused when the tokens are on different spaces. Test in Task 4.
- **Paying `any` with the track's own resource** (tier II exploration paid as `{ food: 2 }`), and resources at the cap of 8 when a benefit gains more. Tests in Tasks 1 and 4.
- **Empty supplies:** no income building of that type left, fewer territory or space tiles than gained, a bonus discard with too few cards. Nothing may crash; the bonus isn't offered. Tests in Tasks 2 and 3.
- **Malformed answers** (negative or fractional amounts, unknown resources, repeated or foreign tile and card ids, a `from` with no token) throw `PlayerError`, never a `TypeError`. Tests in Tasks 1, 4 and 6.
- **Off-turn activations** never block the current player, and every turn starts with nothing activated. Test in Task 7.

---

### Task 1: Paying costs

**Files:**
- Create: `src/lib/engine/payment.js`
- Modify: `src/lib/engine/setup.js` (`supply.territoryDiscard: []`), `src/lib/engine/state.js` (Supply typedef)
- Test: `tests/engine-payment.test.mjs`

**Interfaces:**
- Produces, in `payment.js`:
  - `@typedef {{ coin?: number, worker?: number, food?: number, culture?: number, territory?: number[], tapestry?: string[], tech?: string[] }} Payment`
  - `canPay(state, player, cost) → boolean`
  - `payments(state, player, cost) → Payment[]`: every distinct way, resources in `RESOURCE_IDS` order, discards as id combinations in supply/hand/row order.
  - `checkPayment(state, player, cost, payment)`: throws `PlayerError`.
  - `pay(ctx, player, payment)`: removes and discards; emits `resourcesPaid { player, paid }`, `tilesDiscarded { player, stack: 'territory', tiles }`, `cardsDiscarded { player, deck: 'tapestry' | 'tech', cards }`, each only when non-empty.

- [ ] **Step 1: Write the failing tests**
  - `'a tier II cost is the track resource plus 1 of any kind, the track resource included'`: with food 2, coin 1, `payments(state, 1, { food: 1, any: 1 })` deep-equals `[{ coin: 1, food: 1 }, { food: 2 }]`.
  - `'a cost the player cannot meet has no payments'`: `canPay` false, `payments` `[]`.
  - `'a payment must be exactly the cost'`: each of `{ food: 1 }`, `{ food: 1, coin: 2 }`, `{ coin: 2 }` (no food), `{ food: -1, coin: 3 }`, `{ food: 1.5 }`, `{ gold: 1 }` throws `PlayerError`.
  - `'discards name tiles and cards the player holds, each once'`: `{ territory: 2 }` with tiles `[5, 9, 12]` gives 3 payments; `{ territory: [5, 5] }` and `{ territory: [5, 40] }` throw `PlayerError`.
  - `'paying discards territory tiles out of the game and cards onto their public piles (FAQ #20)'`: after `pay`, the tiles are in `supply.territoryDiscard`, tapestry cards in `supply.tapestry.discard`, tech cards (from any row) in `supply.tech.discard`, and the events are emitted.

- [ ] **Step 2: Run** `node --test tests/engine-payment.test.mjs`. Expected: FAIL, `payment.js` not found.
- [ ] **Step 3: Implement `payment.js`** and `supply.territoryDiscard`.
- [ ] **Step 4: Run** the file, then `npm run check`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit** `Refs #14: pay costs in resources or discarded tiles and cards`.

### Task 2: VP counters, control and gaining buildings

**Files:**
- Create: `src/lib/engine/control.js`, `src/lib/engine/effects/building.js`
- Modify: `src/lib/engine/effects/vp.js`, `src/lib/engine/effects/index.js`
- Test: `tests/engine-counters.test.mjs`

**Interfaces:**
- Produces:
  - `controlledTerritories(state, player) → string[]` (hex keys) in `control.js`.
  - `spacesAdvanced(seat, track) → number` in `movement.js` (created here, grown in Task 3): the most advanced token, or 12 when `seat.restartedTracks` holds the track.
  - `countVp(state, player, per, track) → number` in `effects/vp.js`.
  - The `building` effect: decrements `incomeMat.buildings[id]`, emits `buildingGained`, pushes `{ player, kind: 'placeBuilding', building }`; with none left emits `noBuildingLeft`.
  - Every seat gains `restartedTracks: []` (setup.js, state.js).

- [ ] **Step 1: Write the failing tests**
  - `'a player controls a territory where every upright outpost is theirs'`: the start hex (2 own) counts; a hex with own upright plus opponent toppled counts; own toppled plus opponent upright does not.
  - one test per counter, with exact numbers: `territoryTile`, `techCard` (all three rows), `tapestryCard` (hand plus covered income-mat cards), `trackSpace` (two tokens count the furthest; a restarted track counts 12), and `'R71: building counts are the buildings off the income mat'` (2 farms taken counts 2).
  - `'vp each multiplies the count'`.
  - `'gaining a building takes it off the income mat and hands it to placement (#16)'`: the `placeBuilding` op is on the stack with `building: 'farm'`; `buildingGained` emitted.
  - `'a used-up building type gives nothing (FAQ #23)'`: with 0 farms left, nothing pushed, `noBuildingLeft` emitted.
- [ ] **Step 2: Run** `node --test tests/engine-counters.test.mjs`. Expected: FAIL (`VP counters arrive with #14`).
- [ ] **Step 3: Implement** the counters, `control.js`, `building`.
- [ ] **Step 4: Run** the file, `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #14: count VP and gain income buildings`.

### Task 3: Moving a token, landmarks and the bonus

**Files:**
- Create: `src/lib/engine/movement.js`, `src/lib/engine/decisions/choose-bonus.js`
- Modify: `src/lib/engine/kinds.js` (`chooseBonus`; automatic `bonus`), `src/lib/engine/setup.js` (`activated: []`), `src/lib/engine/state.js`, `src/lib/engine/effects/index.js` (handlers get `op` as a 4th argument)
- Test: `tests/engine-movement.test.mjs`, `tests/helpers/engine.mjs` (`stubHandoffs`)

**Interfaces:**
- Consumes: Task 1 `canPay`, `payments`, `checkPayment`, `pay`.
- Produces, in `movement.js`:
  - `movableFroms(seat, track, direction) → number[]`: distinct token spaces that can move (`'advance'`: below 12; `'regress'`: above 0).
  - `moveToken(ctx, player, { track, from, to, benefit })`: moves, emits `tokenMoved`, gains landmarks (R9: every available landmark whose first space 4, 7 or 10 lies in `(from, to]`, forward only, lowest first; `landmarkGained`, pushes `placeLandmark { landmark }`), and when `benefit` pushes `activationOps`.
  - `activationOps(ctx, player, track, space) → NewOperation[]`: `[]` when already activated by that player this turn; otherwise records `{ player, track, space }` in `state.activated`, emits `spaceActivated`, returns `[{ kind: 'effects', effects: benefit, ordered, source: { track, space } }, { kind: 'bonus', track, space }]`.
  - `isActivated(state, player, track, space) → boolean`.
  - Automatic `bonus`: pushes `chooseBonus { track, space, cost, gain }` only when the space has a bonus and `canPay`.
  - `chooseBonus` answers `[{ pay: null }, ...payments.map((pay) => ({ pay }))]`; paying emits `bonusPaid` and pushes the bonus effects, ordered.
- In `tests/helpers/engine.mjs`: `stubHandoffs() → { calls: { kind, player, value }[], restore() }`, installing recorders for the effects `explore`, `exploreSpace`, `conquer`, `tileBenefit`, `invent`, `upgrade`, `techBenefit`, `tapestryOnTop`, `scoreCapital`, `gainCiv`, and the automatic kinds `placeLandmark`, `placeBuilding`.

- [ ] **Step 1: Write the failing tests**
  - `'the first player into tier II gains its landmark, and it is placed before the benefit (FAQ #1)'`: move exploration 3→4; `calls` order is `placeLandmark lighthouse`, then `explore` after the tile is gained; `state.landmarks` lacks `lighthouse`.
  - `'a landmark someone already gained is not gained again'`.
  - `'R9: regressing never gains a landmark'`.
  - `'a move without the benefit still gains the landmark'`.
  - `'R19: a space activated this turn gives nothing the second time, but the token still moves'`.
  - `'the bonus is offered after the benefit, declined by default, and only when payable'`: Rafts with 0 resources pushes no `chooseBonus`; with 1 coin it does, and its first answer is `{ pay: null }`.
  - `'paying a bonus discards and gains its effects once'`: Cars with tiles `[1, 2, 3]`, pay `{ territory: [1, 3] }`, gain 5 VP.
- [ ] **Step 2: Run** `node --test tests/engine-movement.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `movement.js`, `choose-bonus.js`, the `bonus` kind, `stubHandoffs`.
- [ ] **Step 4: Run** the file, then `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #14: move tokens, gain landmarks and offer bonuses`.

### Task 4: The advance turn

**Files:**
- Create: `src/lib/engine/turn.js`, `src/lib/engine/decisions/choose-advance.js`
- Modify: `src/lib/engine/decisions/choose-turn.js`, `src/lib/engine/after-setup.js`, `src/lib/engine/kinds.js` (`chooseAdvance`, automatic `endTurn`)
- Modify tests: `tests/engine-stack.test.mjs` (`turnOptions` now takes `(state, player)`; income names #15)
- Test: `tests/engine-advance.test.mjs`

**Interfaces:**
- Consumes: Tasks 1 and 3.
- Produces:
  - `turnOptions(state, player) → ('income' | 'advance')[]` in `choose-turn.js`.
  - `advances(state, player) → { track, from, cost }[]` in `choose-advance.js`.
  - `startTurn(ctx, player)` in `turn.js`: sets `state.current`, clears `state.activated`, emits `turnStarted`, pushes `[chooseTurn, endTurn]`.
  - Automatic `endTurn`: `startTurn` for the next unfinished seat in seat order; no unfinished seat throws `Error` naming #15.
  - `chooseAdvance` answers `{ track, from, pay }`; `from` may be left out when all tokens on that track share a space.

- [ ] **Step 1: Write the failing tests**
  - `'advance is offered only after income turn 1 and when some advance is payable (01 §4.1)'`.
  - `'a tier I advance costs 1 of any resource'`, `'tier II costs the track resource and 1 any'`, `'tier III costs the track resource and 2 any'`, `'tier IV costs 2 of the track resource'` (the costs in `chooseAdvance`'s answers).
  - `'no track is offered past space 12'`.
  - `'two tokens on a track are offered separately, and an answer must say which'`.
  - `'an advance pays, moves one space, and the turn passes to the next seat'`: after the stub-free Scouting advance, the next seat faces `chooseTurn`, events include `turnChosen`, `resourcesPaid`, `tokenMoved`, `spaceActivated`, `tilesGained`, `turnStarted`.
  - `'a bad advance answer is refused with a PlayerError'`: unknown track, a `from` with no token, a short payment.
- [ ] **Step 2: Run** `node --test tests/engine-advance.test.mjs tests/engine-stack.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `turn.js`, `choose-advance.js`, the new `chooseTurn` resolve and `turnOptions`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #14: take an advance turn and pass to the next seat`.

### Task 5: The order of a benefit, and choices

**Files:**
- Create: `src/lib/engine/decisions/choose-order.js`, `src/lib/engine/decisions/choose-option.js`, `src/lib/engine/effects/choice.js`
- Modify: `src/lib/engine/effects/index.js`, `src/lib/engine/kinds.js`
- Test: `tests/engine-order.test.mjs`

**Interfaces:**
- Produces:
  - In `runEffects`, an `effects` op with `ordered: false` and 2+ effects runs its first `gain` or `vp` part (continuation keeps `ordered: false`). When none is left and 2+ parts remain, it pushes `chooseOrder { effects, source }`. `ordered` true or missing keeps #13's list order.
  - `chooseOrder` answers `{ effect: index }`; it pushes the chosen effect, then the others, unordered.
  - `choice` pushes `chooseOption { options, source }`; the answer `{ option: index }` runs that list, ordered.

- [ ] **Step 1: Write the failing tests**
  - `'independent parts of an unordered benefit run first, without a question'`: `[{ building: 'farm' }, { vp: 2 }]` unordered gains 2 VP before `placeBuilding`.
  - `'two parts that both ask the player become a choice of order'`: `[{ upgrade: {} }, { techBenefit: { icon: 'circle' } }]` opens `chooseOrder`; answering index 1 runs `techBenefit` before `upgrade`.
  - `'an ordered benefit never asks'`.
  - `'a choice asks for one option, and every option may be chosen'`: Glass's 3 options; answering 2 gains an armory.
- [ ] **Step 2: Run** `node --test tests/engine-order.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #14: choose the order of a benefit's parts, and between options`.

### Task 6: Research, advance and regress

**Files:**
- Create: `src/lib/engine/decisions/choose-move.js`, `src/lib/engine/effects/research.js`, `src/lib/engine/effects/move.js`
- Modify: `src/lib/engine/kinds.js` (`chooseMove`; automatic `research`), `src/lib/engine/effects/index.js`
- Test: `tests/engine-research.test.mjs`

**Interfaces:**
- Consumes: Task 3 `movableFroms`, `moveToken`.
- Produces:
  - `chooseMove { direction, options: { track, from }[], benefit, optional }`; answers each option, then `{ track: null }` when optional. Resolving moves 1 space (`from ± 1`).
  - `advance` and `regress` effects push `chooseMove` (mandatory) or, with exactly one option, move at once; with none, nothing.
  - `research` pushes automatic `research { rolls, noBenefit, offTrackVp }`, which rolls `SCIENCE_DIE[random(12)]`, emits `scienceDieRolled`, and pushes an optional `chooseMove` above the next roll. With no movable token on the rolled track, `offTrackVp` VP.

- [ ] **Step 1: Write the failing tests**
  - `'research rolls the science die and the player may advance on that track (01 §3.3)'` (seeded roll; the answers end with staying).
  - `'research with the X gives no benefit or bonus, but still the landmark'`.
  - `'Alien Biology rolls 4 times and scores 5 VP for each roll that would push past space 12'`.
  - `'Physics advances on exploration, technology or military, with benefit'`.
  - `'Quantum Physics advances twice, on the same or another track'`.
  - `'Neuroscience regresses on technology or military, then gains that space'`.
  - `'regressing to the start gains nothing'`.
  - `'an advance with only one possible move makes it without asking'`.
  - `'a move answer must be one of the offered moves'` (`PlayerError`).
- [ ] **Step 2: Run** `node --test tests/engine-research.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #14: research, advance and regress on the tracks`.

### Task 7: Repeat and AI Singularity

**Files:**
- Create: `src/lib/engine/decisions/choose-repeat.js`, `src/lib/engine/decisions/choose-restart.js`, `src/lib/engine/effects/repeat.js`, `src/lib/engine/effects/restart-token.js`
- Modify: `src/lib/engine/kinds.js`, `src/lib/engine/effects/index.js`
- Test: `tests/engine-repeat.test.mjs`

**Interfaces:**
- Consumes: Task 3 `activationOps`, `isActivated`.
- Produces:
  - `repeat` offers every `{ track, space }` with one of the player's tokens on a space 1–12 not activated by them this turn (`chooseRepeat`; one option runs at once; none, nothing).
  - `restartToken` uses `op.source`: `chooseRestart { options: TRACK_IDS, source }`; resolving removes the token on the source space, adds a token at 0 on the chosen track, adds the source track to `restartedTracks`, emits `tokenRestarted`.

- [ ] **Step 1: Write the failing tests**
  - `'R19: Academic Research repeats any current space except itself'`.
  - `'R19: a space activated this turn cannot be repeated, but one an opponent activated can'`.
  - `'every turn starts with nothing activated'`.
  - `'AI Singularity moves the token to the start of any track, and technology still counts 12 (FAQ #9)'`.
  - `'after AI Singularity, Academic Research cannot repeat it'`.
- [ ] **Step 2: Run** `node --test tests/engine-repeat.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #14: repeat a space and restart a token`.

### Task 8: All 48 spaces, the landmark race, and the core checks

**Files:**
- Create: `tests/engine-track-spaces.test.mjs`
- Modify: `tests/engine-final-fixes.test.mjs` (fixtures for the 7 new decision kinds), `tests/engine-view.test.mjs` (bonus answers private)

**Interfaces:**
- Consumes: everything above; `stubHandoffs` from Task 3.

- [ ] **Step 1: Write the tests**
  - One test per space, named `'<track> <n> <Name>: …'`, from a started 2-player game with the current seat on income turn 1, a token on the space before, and enough resources. Each asserts the resources, tiles, cards, VP or moves gained, the stub calls in order (for example Interstellar Travel: 3 space tiles gained, then `exploreSpace { fromGained: true }`, R105), and that the bonus is offered when the space has one.
  - `'the landmark race: the first player into a tier takes it, the second gets nothing'`.
  - `'an advance on another player\'s turn wins the landmark race (FAQ #2)'`: during seat 1's turn, `resolveEffects(state, 2, [{ advance: { tracks: ['military'] } }], random)` from military 3 gives seat 2 the Barracks.
  - Shape-test fixtures for `chooseAdvance`, `chooseMove`, `chooseOrder`, `chooseOption`, `chooseBonus`, `chooseRepeat`, `chooseRestart`.
  - `'a bonus that discards tapestry cards lists them only in its own player\'s view'`.
- [ ] **Step 2: Run** `npm test`. Expected: PASS. A space test that fails points at a gap in Tasks 2–7, fixed there.
- [ ] **Step 3: Commit** `Refs #14: test all 48 track spaces and the landmark race`.

### Task 9: Documents and closing

**Files:**
- Modify: `CLAUDE.md` ("Where the work stands": #14 done; the engine core paragraph names the new modules), `CONVENTIONS.md` ("Rules engine": an effect handler gets its operation as a 4th argument), `docs/superpowers/specs/2026-10-24-engine-core-design.md` only if a field it names changed.

- [ ] **Step 1:** Update the documents.
- [ ] **Step 2:** Run `npm run check` and `npm test`. Expected: 0 errors; all pass.
- [ ] **Step 3:** Request the final code review (superpowers:requesting-code-review) and fix what it finds.
- [ ] **Step 4: Commit** `Fix #14: advance turns on the four tracks`, push, and tick #14's checklist.
