# Income turns (#15) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Players take income turns 1–5 with each turn's steps, finish after the fifth, and the game ends with a ranking that records every tiebreak step used.

**Architecture:** `chooseTurn`'s income answer pushes an `incomeSteps` operation that runs `INCOME_STEPS` one at a time, like `AFTER_SETUP`. `ranking.js` ranks the players when `endTurn` finds every seat finished. Steps owned by later issues are handed off by name and stood in for in tests.

**Tech Stack:** Plain Node ES modules with JSDoc, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-24-income-turns-design.md`

## Global Constraints

- Engine modules import only relative paths: no DOM, Svelte or Node, and never `Math.random` (`tests/engine-data.test.mjs` checks).
- Prettier (tabs, single quotes), braces on every `if`/`else`, a one-line comment at the top of every file, JSDoc on every export. `npm run check` reports 0 errors and 0 warnings.
- `play()` stays pure. Player mistakes throw `PlayerError` with a sentence a player understands; anything else is a plain `Error`.
- Every change emits exactly one event per thing that happened; nothing private outside `secret` or a decision's hidden fields.
- Handlers never replace `state.pending` or a lane's stack array.
- A handed-off step throws an ordinary `Error` naming it until its issue lands. Tests stand in for it with `stubHandoffs()`.
- Cite rule ids in comments and test names (R10–R13).
- Every new decision kind gets a fixture in the #13 shape test (`tests/engine-final-fixes.test.mjs`) in the task that adds it.
- Commits reference the issue: `Refs #15: …`, and the last one `Fix #15: …`.

## Review Focus

- **A face-down tapestry card must not leak.** The card id must not appear in any seat's `view()`, its owner's included, nor in any event, `answers` list or the `chooseTapestry` options of a later turn. Test in Task 3.
- **The game end must survive odd tie shapes.** Four players all tied; ties at two different VP levels at once; a 2-player game where both finish on the same round. Each must give consistent places and one `ties` entry per VP group. Test in Task 1.
- **A finished player must stay finished.** An opponent's effect that names a finished player (say a `gain` pushed for them) does nothing, and their seat is never given a `chooseTurn`. Test in Task 4.
- **An empty deck and an empty hand.** With no tapestry cards anywhere, income turns 2–4 play nothing and don't crash. Test in Task 3.
- **The first-of-neighbours bonus in 3–5 player games.** It checks the seats on both sides, not just the next one. Test in Task 3.

---

### Task 1: The ranking and its tiebreaks

**Files:**
- Create: `src/lib/engine/ranking.js`
- Modify: `src/lib/engine/setup.js` (`capital: { mat, landmarks: [] }`, `result: null`), `src/lib/engine/state.js` (types)
- Test: `tests/engine-ranking.test.mjs`

**Interfaces:**
- Produces, in `ranking.js`:
  - `@typedef {{ seat: number, place: number, vp: number }} Placing`
  - `@typedef {{ by: 'tallestLandmark' | 'resources', values: { seat: number, value: string | number | null }[] }} TiebreakStep`
  - `@typedef {{ ranking: Placing[], ties: { vp: number, seats: number[], steps: TiebreakStep[] }[] }} Result`
  - `landmarksInCity(seat) → string[]`: `seat.capital.landmarks`, or `[]` for a seat without a capital.
  - `rankPlayers(state) → Result`: uses `VERSIONS[].tiebreak` after `'vp'` and `HEIGHT_RANKING`. Places count 1, 1, 3. Seats of the same place keep seat order.

- [ ] **Step 1: Write the failing tests** (hand-built states from `startedGame`, then `rankPlayers`):
  - `'players are ranked by VP, and no tie means no tiebreak lines'`.
  - `'R10: in the original rules a VP tie is broken by resources left'`: values are the sums.
  - `'R11: in the current rules the tallest landmark in the city breaks a tie first'`: the spec's §8 example deep-equals exactly.
  - `'R11: any landmark beats none, and two players with none go on to resources'`.
  - `'three tied players split over two steps, each step listing only the players it compared'`.
  - `'players still tied after every step share a place, and the next place skips (1, 1, 3)'`.
  - `'ties at two VP levels give one ties entry each'` (Review Focus).
  - `'four players all tied on everything share first place'` (Review Focus).
- [ ] **Step 2: Run** `node --test tests/engine-ranking.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `ranking.js` and the state fields.
- [ ] **Step 4: Run** the file, then `npm run check`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit** `Refs #15: rank the players and record each tiebreak step`.

### Task 2: The income turn's steps

**Files:**
- Create: `src/lib/engine/income.js`
- Modify: `src/lib/engine/decisions/choose-turn.js` (resolve `income`), `src/lib/engine/kinds.js` (automatic `incomeSteps`), `tests/helpers/engine.mjs` (stand-ins `civAbilities`, `tapestryAbility`; `incomeTurn(state, random, player)`), `tests/engine-stack.test.mjs` (the #13 test that income throws goes)
- Test: `tests/engine-income.test.mjs`

**Interfaces:**
- Produces, in `income.js`:
  - `INCOME_STEPS: string[]` = `['civAbilities', 'tapestry', 'upgrade', 'score', 'income', 'finish']`.
  - `INCOME_STEP_KINDS: Record<string, { turns: number[], run: (ctx, player, turn) => void }>`. Task 2 builds every step except `tapestry`, whose `run` arrives in Task 3 (until then it does nothing, and no test reaches it on turns 2–4 without the stand-in).
  - `exposedSpaces(seat, row) → IncomeSpace[]`: `INCOME_MAT[row].slice(0, 6 - left)`.
  - Automatic `incomeSteps { player, turn, steps }`: runs its first step, with the rest pushed under it.
  - `chooseTurn` income: emits `turnChosen`, raises `incomeTurns`, emits `incomeTurnStarted`, and pushes `incomeSteps` with the steps whose `turns` include N.
  - `upgrade` pushes `effects [{ upgrade: { optional: true } }]`. `score` and `income` push one ordered `effects` op of every exposed space's effects, row by row in `BUILDING_IDS` order, when there are any. `civAbilities` pushes `civAbilities { player, turn }`. `finish` sets `finished` and emits `playerFinished`.

- [ ] **Step 1: Write the failing tests**:
  - `'income turn 1 gains the income of every space 1: coin, worker, food and a territory tile, culture and a tapestry card'`.
  - `'income turns 2–5 hand civilization abilities to #20, and offer #18 an optional upgrade'` (stub calls).
  - `'income turns 2–5 score the exposed VP icons: Barter counts tech cards, Symbology goes to #16'`.
  - `'more buildings off a row show more spaces: two farms taken add Farming income and Breeding\'s 4 VP'`.
  - `'income turn 5 scores but gains no income, then the player is finished'`.
  - `'resources from income stop at 8'`.
- [ ] **Step 2: Run** `node --test tests/engine-income.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #15: run the income turn's steps`.

### Task 3: The tapestry card and the first-of-neighbours bonus

**Files:**
- Create: `src/lib/engine/decisions/choose-tapestry.js`
- Modify: `src/lib/engine/income.js` (the `tapestry` step, `neighbours`), `src/lib/engine/kinds.js`, `src/lib/engine/view.js` (face-down cards), `src/lib/engine/setup.js` (`incomeMat.faceDown: []`), `src/lib/engine/state.js`
- Test: `tests/engine-tapestry-step.test.mjs`

**Interfaces:**
- Produces:
  - `neighbours(state, player) → number[]`: the seats before and after in seat order, each once, never the player.
  - The `tapestry` step pushes, in order, the bonus `effects [{ gain: firstBonus }]` with `firstBonus` emitted (when every neighbour's `incomeTurns` < N), then `chooseTapestry { options: [...hand], era: N }`, or the face-down play when the hand is empty.
  - `chooseTapestry` (hidden: `options`) answers `{ card }`; it moves the card to `incomeMat.tapestry[N − 1]`, emits `tapestryPlayed { player, era, card, faceDown: false }`, and pushes `tapestryAbility { player, card, era }`.
  - The face-down play draws the top card (reshuffling the discards into an empty deck), pushes it on the slot, adds it to `incomeMat.faceDown`, and emits `tapestryPlayed { player, era, card: null, faceDown: true }`. No ability.
  - `view()` replaces face-down ids with `null` in every seat's slots and deletes `faceDown`.

- [ ] **Step 1: Write the failing tests**:
  - `'the first of their neighbours to start an era gains 1, 2 and 3 any in eras 2, 3 and 4'`.
  - `'no bonus once a neighbour has started the era; in 2 players the one opponent counts'`.
  - `'in 4 players both neighbours count, and the seat across does not'` (Review Focus).
  - `'a tapestry card must be played from the hand, and its ability goes to #19'`.
  - `'a chooseTapestry answer must be a card in the hand'` (`PlayerError`).
  - `'with an empty hand the top card goes on face down, hidden from every view, its owner\'s too'` (Review Focus: no id in any view, event or later options).
  - `'a face-down card still counts as a tapestry card on the mat'`.
  - `'with no tapestry cards anywhere, nothing is played'` (Review Focus).
  - `'another seat never sees a player\'s chooseTapestry options'`.
- [ ] **Step 2: Run** `node --test tests/engine-tapestry-step.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, and add the `chooseTapestry` fixture to the shape test.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #15: play the era's tapestry card and the first-of-neighbours bonus`.

### Task 4: Finishing and the game end

**Files:**
- Modify: `src/lib/engine/turn.js` (`endGame`), `src/lib/engine/effects/index.js` (skip a finished player's effects unless `passive`)
- Test: `tests/engine-game-end.test.mjs`

**Interfaces:**
- Consumes: Task 1 `rankPlayers`.
- Produces: `endTurn` with no unfinished seat sets `phase: 'over'`, `current: null`, `result: rankPlayers(state)`, and emits `gameEnded { result }`. `runEffects` returns at once for an `effects` op whose player's seat is `finished`, unless `op.passive`.

- [ ] **Step 1: Write the failing tests**:
  - `'a finished player is skipped while the others play on'`.
  - `'the game ends when the last player finishes, with the ranking stored and announced'`.
  - `'once the game is over, no action is accepted'`.
  - `'an effect for a finished player does nothing, and one marked passive still gains its VP'` (Review Focus).
- [ ] **Step 2: Run** `node --test tests/engine-game-end.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #15: finish players after income turn 5 and end the game`.

### Task 5: A scripted 2-player game, and the documents

**Files:**
- Create: `tests/engine-scripted-game.test.mjs`
- Modify: `CLAUDE.md` ("Where the work stands"), `docs/superpowers/specs/2026-10-24-engine-core-design.md` only if a name it gives changed

- [ ] **Step 1: Write the test** `'a scripted 2-player game reaches the end with the expected scores'`. Start from `startedGame(2, { seed })` with the handoffs stood in for. Play a fixed script of income and advance turns through to both players' income turn 5. The script must include at least:
  - an advance that gains VP;
  - a building taken off a row, so income shows more;
  - one player finishing a round before the other.

  Work out each player's final VP and resources by hand, in comments, before running. Assert them, `state.result`, and the event order at the end (`playerFinished`, `gameEnded`).
- [ ] **Step 2: Run** `npm test`. Expected: PASS. A wrong expectation means the comment's arithmetic or the engine is wrong. Find out which; never copy the engine's output into the test.
- [ ] **Step 3:** Update CLAUDE.md.
- [ ] **Step 4:** Run `npm run check` and `npm test`. Expected: 0 errors; all pass.
- [ ] **Step 5:** Final review (superpowers:requesting-code-review, a fresh reviewer), and fix what it finds.
- [ ] **Step 6: Commit** `Fix #15: income turns, eras and the game end`, push to main, and tick #15's checklist.
