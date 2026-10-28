# The first turn takes income by itself (#77) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Income turn 1 runs for every seat when setup ends, without a click. A one-time notice tells each player what it did, and a later turn with no advance to pay for says that income is the only move.

**Architecture:** The engine's `startTurn()` starts income turn 1 itself for a seat with no income turns, so online, hot-seat, the timer and the simulation all behave the same. Plain, Vitest-tested words live in `src/lib/turn.js`. A new presentational `IncomeNotice` component and new TurnBar states are composed by `Game.svelte`.

**Tech Stack:** JavaScript with JSDoc, Svelte 5 runes, Vite, Vitest with `node:assert/strict`, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-28-first-income-turn-design.md`

## Global Constraints

- Follow docs/conventions.md, which no agent edits: JSDoc, no TypeScript; a one-line comment at the top of each file; braces on every `if`; Prettier (tabs, single quotes); `npm run check` reports 0 errors and 0 warnings.
- Game rules stay in `src/lib/engine/`. No `Math.random()`.
- Components:
  - a `<script module>` with `@typedef`, `@property` and `@example`;
  - `$props()` with `/** @type {Props} */`;
  - `{...attr}` on the root, with `class` merged;
  - callbacks named `on{Component}{Action}` that receive a `ComponentEvent`, and handlers named `{action}Handler`;
  - `rg-` BEM classes and colours from tokens;
  - a library section and a row in `src/lib/components/README.md`.
- Exact copy from the spec:
  - the notice title "Era I begins";
  - "Every player's first turn is an income turn, so the game took yours for you.";
  - "You start with";
  - "From now on, each turn you either advance on a track or take income.";
  - the button **Got it**;
  - "Every player's first turn is an income turn." (the detail in the gold income footer);
  - "Ana is taking their first income turn." and "Ana is taking income turn 3.";
  - "You can't pay for any advance, so take an income turn.";
  - "End era I, gain income and begin era II." through "End era III, gain income and begin era IV.", and "End era IV, score it and finish playing.".
- Commits reference the issue ("Refs #77: …") and end with the session's Co-Authored-By line. Work on branch `issue-77-first-income`; don't push or merge without the owner.

## Review Focus

1. **The notice must never sit over a question.** With the tapestry-draft variant, seat 1's keep is open while seat 2 still has 0 income turns. Once seat 1 has answered, seat 2's keep opens, and seat 1 must get their notice while seat 2's keep is open. Task 2 tests both moments.
2. **A refresh, or a seat at the same hot-seat screen, must not reopen a dismissed notice, and another seat's dismissal must not hide yours.** The key is per table code and seat. Task 4 tests a refresh, and the library checks the hot-seat case.
3. **The `turn` sound cue.** After setup, the batch of fresh events holds the viewer's own automatic `turnStarted`. `cueFor()` would then play the turn cue for seat 2 even though seat 1 is playing. Task 2 adds the test, and the cue comes only for the seat whose decision is open.
4. **Browser tests that click the board in era I** (`player-area`, `pick-prompts`, `pass-screen`, `dice-tray`, `explore-prompt`, `track-text`, `game`) will find the notice's scrim in the way. Task 4 adds one helper that closes it, and every such test calls it.
5. **A forced income turn after a track space is selected.** The selected-space branch of the footer comes before the plain one in `Game.svelte`, so the forced branch must come before both. Task 4's Playwright test can't reach a forced turn cheaply, so Task 3's library example and Task 2's `forcedIncome()` test cover it. The implementer also checks it by hand once in the dev server: give a seat 0 resources through the console of `npm run dev`, or skip this if it's too costly, and say so.

---

### Task 1: The engine takes income turn 1 itself

**Files:**
- Modify: `src/lib/engine/turn.js` (`startTurn`), `src/lib/engine/decisions/choose-turn.js` (`turnOptions`, `check`)
- Modify: `tests/helpers/engine.mjs` (`startedGame`)
- Test: `tests/engine-play.test.mjs`, `tests/engine-stack.test.mjs`, plus every Vitest file that fails afterwards (the spike on 2026-10-28 found 28, listed in Step 6)

**Interfaces:**
- Produces: after the last setup answer, every player seat has `incomeTurns === 1`, and `state.current === state.first` faces `chooseTurn`. A first income that asks something is still open instead. `startedGame(count, { keepIncome?: boolean, version?, seed?, variants?, civs? })` is the test helper.

- [ ] **Step 1: Write the failing engine tests.** In `tests/engine-play.test.mjs`, replace "the first player starts by choosing a turn, and only income is legal (01 §4.1)" and "advancing on a first turn is refused" with:
  - `test('when setup ends, every seat takes income turn 1 in turn order, and nobody is asked (01 §4.1, #77)')`. It uses `startedGame(3, { keepIncome: true })`. With `order` as the three seats from `state.first` on:
    - the `turnStarted`/`turnChosen`/`incomeTurnStarted` events, mapped to `[type, player]`, equal `order.flatMap(p => [['turnStarted', p], ['turnChosen', p], ['incomeTurnStarted', p]])` followed by `['turnStarted', state.first]`;
    - every seat's `incomeTurns` is 1;
    - `openDecisions(state).map(d => [d.kind, d.player, d.options])` equals `[['chooseTurn', state.first, ['income', 'advance']]]`.
  - `test('the automatic income turn 1 emits turnChosen with turn income, so the log still reads as before')`: each seat's `turnChosen` has `turn: 'income'`.

  In `tests/engine-stack.test.mjs`, rename "chooseTurn offers only income on a first turn (01 §4.1)" to "chooseTurn offers advance only when one can be paid for (01 §4.1)". It builds the state with `startedGame(2)`, so 0 resources:
  - `turnOptions(state, 1)` is `['income']`;
  - with `coin = 1`, it is `['income', 'advance']`;
  - `check` of `{ turn: 'advance' }` on an `['income']` decision throws `PlayerError` with `/can't pay for any advance/`.
- [ ] **Step 2: Run** `npx vitest run tests/engine-play.test.mjs tests/engine-stack.test.mjs`. Expected: the new tests FAIL, either because the first open decision is `chooseTurn ['income']` or because `keepIncome` is ignored.
- [ ] **Step 3: Implement `startTurn()`.** For a player seat (`kind === 'player'`) with `incomeTurns === 0`:
  - emit `turnStarted`, then `{ type: 'turnChosen', player, turn: 'income' }`;
  - push `[{ player, kind: 'endTurn' }]`, then call `startIncomeTurn(ctx, player)`, so the income steps sit on top (`push` unshifts);
  - return.

  Update its JSDoc. In `choose-turn.js`, drop `turnOptions()`'s `incomeTurns === 0` branch and `check()`'s "first turn" message, and fix the JSDoc of both.
- [ ] **Step 4: Change `startedGame()`.** It always plays setup with `answerSetup()`, which now runs the first incomes.
  - With `keepIncome: true` it returns that state as is.
  - Otherwise it gives the tests the empty-handed start they had before #77. That only works when every open decision is `chooseTurn`; if a first income is still asking something, it throws an `Error` telling the caller to pass `keepIncome`.
  - The put-back: walk the player seats in turn order from `state.first` in reverse, `unshift` each seat's `hand` onto `supply.tapestry.deck` and its `territoryTiles` onto `supply.territory`, then empty both and set every resource to 0. The decks are drawn from index 0 in turn order, so this restores them exactly.
  - Then set the open `chooseTurn`'s `options` to `turnOptions(state, state.first)`, without starting the turn again, so `state.turn` and the events stay the engine's.
  - Rewrite its JSDoc: "every seat has taken income turn 1; without `keepIncome`, their gains are put back, so a test starts from the holdings it sets".
  - Keep the inert-civilization clearing after the put-back. `readyTurn()` stays as it is; its `seat.incomeTurns = 1` is now a no-op, so remove it and fix its JSDoc.
- [ ] **Step 5: Run** `npx vitest run tests/engine-play.test.mjs tests/engine-stack.test.mjs`. Expected: PASS.
- [ ] **Step 6: Run** `npm run test:unit` **and fix every failure** by these rules. Never weaken an assertion to make it pass.
  - **Tests of income turn 1 itself** use `startedGame(n, { keepIncome: true })` and read the state that comes back instead of answering `chooseTurn`. That covers the income test "income turn 1 gains the income of every space 1…", the tapestry-draft tests and `takeIncome` in `engine-variants`, `civFirstTurnEnd`, and the Heralds, Futurists and Mystics tests in `engine-civs-*` and `engine-civ-framework`.
    - The draft test becomes `test('tapestry-draft: the automatic income turn 1 stops at each seat's keep in turn order')`. The first seat's `chooseKeep` is open and the second seat has `incomeTurns === 0`. After the answer, the second seat's `chooseKeep` is open.
  - **Tests that answered seat 1's and seat 2's first `chooseTurn` by hand** to reach a later turn drop those answers.
  - **Turn numbers** (`state.turn`, the room tests' "turn 2", the clocks) move by the seats' automatic turns; recompute each from the events.
  - **The room tests** (`rooms-clocks`, `rooms-undo`) and `client-api`: the first decision after setup is the first player's second turn. "Setup gives every player one clock…" and "both setup clocks run out together…" now see that decision's fresh clock.
  - **`engine-scripted-game`**: drop the scripted first incomes. Keep the final scores unless the script's own moves change. If they change, explain why in the commit.
  - Files the spike saw failing: `engine-track-spaces`, `rooms-clocks`, `rooms-undo`, `engine-tapestry-tracks`, `engine-variants`, `engine-income`, `engine-civs-setup`, `engine-tapestry-era`, `engine-advance`, `engine-civ-framework`, `engine-civs-cards`, `engine-effects`, `engine-game-end`, `engine-movement`, `engine-payment`, `engine-repeat`, `engine-conquer`, `engine-play`, `engine-research`, `engine-table`, `engine-tapestry-cards`, `engine-tapestry-map`, `engine-capital`, `engine-civ-hooks`, `engine-civs-income`, `engine-scripted-game`, `engine-stack`, `engine-view`. Most of them pass again after Step 4.
- [ ] **Step 7: Run** `npx vitest run tests/simulation.test.mjs`. Expected: 200 games PASS. Then run `npm run check`. Expected: 0 errors and 0 warnings.
- [ ] **Step 8: Commit** "Refs #77: the engine takes every seat's income turn 1 when setup ends".

### Task 2: The words in `src/lib/turn.js`, and the turn cue

**Files:**
- Modify: `src/lib/turn.js`, `src/lib/sound.js` (`earns`, `turn` case)
- Test: `tests/client-turn.test.mjs`, `tests/client-sound-motion.test.mjs`

**Interfaces:**
- Consumes: Task 1's engine, and `incomeView(game, seat)` from `src/lib/prompts.js` (a runtime import; `prompts.js` doesn't import `turn.js`).
- Produces:
  - `incomeWords(turn: number): string`, for income turns 2–5. It throws a `RangeError` otherwise, as `roman()` does.
  - `forcedIncome(view: any, seat: number | null): boolean`: the viewer's `myDecision` is `chooseTurn` and its `options` are exactly `['income']`.
  - `takingTurnWords(view: any, player: number, name: string): string`.
  - `firstIncomeNotice(view: any, seat: number | null): FirstIncomeNotice | null`, where the `@typedef FirstIncomeNotice` is `{ resources: { coin: number, worker: number, food: number, culture: number }, territoryTiles: number, tapestryCards: number, holdings: string }`.
  - `holdings` is the words after "You start with", such as "1 coin, 1 worker, 1 food, 1 culture, 1 territory tile and 1 tapestry card". It leaves out zeros, uses singular and plural, and joins with commas and a final "and". If everything is zero it says "nothing".

- [ ] **Step 1: Write the failing tests** in `tests/client-turn.test.mjs`:
  - `incomeWords`: turns 2, 3, 4 and 5 give the four exact sentences from Global Constraints, and `assert.throws(() => incomeWords(1), RangeError)`.
  - `forcedIncome`:
    - on `view(startedGame(2).state, first)` it is true (0 resources, so only income is offered);
    - on `view(startedGame(2, { keepIncome: true }).state, first)` it is false;
    - for the other seat and for `null` it is false.
  - `takingTurnWords`:
    - during a first income stopped at the tapestry-draft keep (`startedGame(2, { keepIncome: true, variants: ['tapestry-draft'] })`), the asking seat gives "Ana is taking their first income turn." (with name `'Ana'`);
    - a seat in income turn 3 gives "Ana is taking income turn 3." (build it by answering `chooseTurn` `income` twice on a `keepIncome` game);
    - a seat on an advance turn gives "Ana is taking their turn.".
  - `firstIncomeNotice`:
    - on the `keepIncome` 2-seat game, for each seat, it returns `resources` `{ coin: 1, worker: 1, food: 1, culture: 1 }`, `territoryTiles: 1`, `tapestryCards: 1` and `holdings` "1 coin, 1 worker, 1 food, 1 culture, 1 territory tile and 1 tapestry card";
    - null for `seat === null`;
    - null in setup (`newGame(2)`);
    - null in the draft game for the asking seat (an open `chooseKeep`) and for the seat with 0 income turns;
    - in that draft game, after the first seat's keep is answered, non-null for the first seat while the second seat's keep is open (Review Focus 1);
    - null once the seat's `incomeTurns` is 2;
    - with resources `{ coin: 2, worker: 0, food: 1, culture: 0 }`, no tiles and 3 cards, `holdings` is "2 coins, 1 food and 3 tapestry cards".
- [ ] **Step 2: Run** `npx vitest run tests/client-turn.test.mjs`. Expected: FAIL (not exported).
- [ ] **Step 3: Implement the four functions** with JSDoc.
  - `firstIncomeNotice` opens only when all of these hold:
    - `view.phase === 'play'`;
    - the seat is a player with `incomeTurns === 1`;
    - `incomeView(view, seat) === null`;
    - `myDecision(view, seat)` is null or a `chooseTurn`.
  - `tapestryCards` comes from `handCount ?? hand.length`, as `selfSummary()` reads it.
  - The resource words reuse the names the log uses (`resourceWords` in `src/lib/log.js`, if it fits; otherwise a local table).
- [ ] **Step 4: Run** `npx vitest run tests/client-turn.test.mjs`. Expected: PASS.
- [ ] **Step 5: The turn cue (Review Focus 3).**
  - **Test:** in `tests/client-sound-motion.test.mjs`, add `test("the turn cue is not played for a seat's own automatic first turn (#77)")`. In the fresh events of the move that ends a 2-seat setup:
    - `cueFor(events, second)` isn't `'turn'`;
    - `cueFor(events, first)` is `'turn'`;
    - `cueFor(events, null)` is `'turn'` (hot-seat).
  - **Run** it. Expected: FAIL.
  - **Fix:** in `cueFor(events, seat)` (`src/lib/sound.js`), the `turn` cue looks only at the batch's last `turnStarted`. That is the turn the batch leaves running; earlier ones in the same batch were turns that started and ended inside it. Keep `cueFor`'s signature and the other cues as they are.
  - **Run** again. Expected: PASS.
- [ ] **Step 6: Commit** "Refs #77: words for forced and first income turns, and no turn cue for an automatic turn".

### Task 3: `IncomeNotice` and the TurnBar states in the library

**Files:**
- Create: `src/lib/components/prompts/IncomeNotice.svelte`, `src/library/sections/prompts/IncomeNotice.svelte`
- Modify: `src/library/sections/prompts/TurnBar.svelte`, the library's section list (wherever `TurnBar` is registered; `grep -rn "sections/prompts/TurnBar" src/library`), `src/lib/components/README.md`
- Test: `tests/browser/library.test.mjs` (follow how it checks other sections)

**Interfaces:**
- Produces: `IncomeNotice` props:
  - `title: string`;
  - `lead: string`;
  - `resources: { coin, worker, food, culture }`;
  - `holdings: string`;
  - `next: string`;
  - `confirmLabel = 'Got it'`;
  - `onIncomeNoticeClose?: Function`, fired with a `ComponentEvent` on the button or on Escape.

- [ ] **Step 1: Write the failing library test.** The IncomeNotice section shows "Era I begins" and a **Got it** button. The TurnBar section shows "You can't pay for any advance, so take an income turn." with a **Take income** button inside `.rg-turn-bar--actions`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/library.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Build `IncomeNotice.svelte`.**
  - It wraps `DecisionPanel` with `tone="income"`, `centred`, `confirmLabel` and `onDecisionPanelConfirm` mapped to `onIncomeNoticeClose`.
  - The content is the `lead` paragraph; a "You start with" line with one `ResourceChip` per resource above 0 and then the `holdings` words; and the `next` paragraph.
  - A `<svelte:window onkeydown>` closes it on Escape.
  - It never takes the focus away from anything other than its own button.
- [ ] **Step 4: Add the library examples.**
  - The new section shows the 2-seat default notice and one with uneven holdings.
  - The TurnBar section gets four new examples:
    - `label="Your turn"` with the forced heading, the detail "End era II, gain income and begin era III." and a gold **Take income** in `actions`, with no `income`;
    - the same after a space is selected (identical, with an Example label saying so);
    - the gold income tone, "Income turn 1 · Income", with the detail "Every player's first turn is an income turn.";
    - waiting, "Ana is taking their first income turn.".
  - Change the existing `INCOME` description to `incomeWords(2)`.
  - Add a README row for `IncomeNotice`.
- [ ] **Step 5: Run** `npx playwright test tests/browser/library.test.mjs` and `npm run check`. Expected: PASS, with 0 errors and 0 warnings.
- [ ] **Step 6: Commit** "Refs #77: the income notice and the forced-income footer in the library".

### Task 4: Wire it into the game

**Files:**
- Modify: `src/screens/Game.svelte` (the footer branches at about lines 1338–1414, the panel area at about line 1180, and the notice's state)
- Create: `tests/browser/first-income.test.mjs`
- Modify: `tests/browser/` helpers and the era-I tests (Review Focus 4)

**Interfaces:**
- Consumes:
  - from Task 2: `incomeWords`, `forcedIncome`, `takingTurnWords` and `firstIncomeNotice`;
  - from Task 3: `IncomeNotice`.

- [ ] **Step 1: Write the failing Playwright test** `test('the first turn is taken for every player, and the notice says so once (#77)')`.
  - Create an online table of two through the API, as `pass-screen.test.mjs` does, and answer setup through the API.
  - Open the first player's page. Expect the heading "Era I begins" and the text "You start with". Expect no button named "Take income" in the left reveal before the notice closes.
  - Press **Got it**. The notice is gone, and the footer reads "Choose a space to advance to, or take income.".
  - Reload: the notice stays closed.
  - End and leave the table, as CLAUDE.md requires.
- [ ] **Step 2: Run** `npx playwright test tests/browser/first-income.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement in `Game.svelte`.**
  - `let notice = $derived(firstIncomeNotice(game, seat))`, plus a `noticeClosed` `$state` read from `sessionStorage` key `` `rg-first-income:${room.code}:${seat}` ``, with every access in try/catch. Closing sets the state and writes `'1'`. Draw `IncomeNotice` when `notice && !noticeClosed && !overviewOpen`.
  - A new footer branch **before** `{:else if turnDecision && selected}`: `{:else if turnDecision && forcedIncome(game, seat)}`.
    - The TurnBar has the forced heading and the detail `incomeWords(game.seats[seat - 1].incomeTurns + 1)`. It is never called with 1, because a seat facing `chooseTurn` has taken income turn 1, and never with 6, because a seat finishes after income turn 5.
    - It has no `income`, and a gold **Take income** in `actions` wired to `incomeHandler` and disabled while `sending`.
  - The reveal's `description` becomes the same `incomeWords(…)` in both remaining branches.
  - The gold income branch adds `detail="Every player's first turn is an income turn."` when `prompt.income.turn === 1`.
  - The waiting branch's own-turn heading uses `takingTurnWords(game, currentSeat.seat, currentSeat.name)`.
- [ ] **Step 4: Add the browser helper.** In whichever shared helper module the browser tests already import (`grep -rn "export async function" tests/browser`), or a new `tests/browser/helpers.mjs`, add `closeIncomeNotice(page)`: if the "Got it" button is visible within 2 s, click it. Call it in every era-I test after the page reaches play (Review Focus 4).
- [ ] **Step 5: Run** `npm test`. Expected: Vitest and Playwright PASS, the new test included. Then run `npm run check`. Expected: 0 errors and 0 warnings.
- [ ] **Step 6: Check by hand** in `npm run dev`, at 1920×1080:
  - a hot-seat game of two: each seat gets its notice after its pass screen;
  - the forced-income footer, if reachable (Review Focus 5).
- [ ] **Step 7: Commit** "Refs #77: the game takes the first income for you and says so; a forced income turn says why".

### Task 5: Documentation and the issue

**Files:**
- Modify:
  - `README.md` ("Current interface");
  - `docs/ui/README.md` and `docs/ui/screens/` (new screenshots from the running game, at 1920×1080: the notice, and the forced footer if reachable, otherwise the library example);
  - `docs/status.md` (#77's entry and its hand-offs to #31, #62 and #71);
  - `docs/architecture.md` (`startTurn` takes income turn 1).
- Never CLAUDE.md, which holds no progress (owner, 2026-10-28).
- GitHub: #77's body.

- [ ] **Step 1: Rewrite #77's body** to the owner's brief, with the github-issue-creator skill's layout. Keep the checklist matching what was built, and tick what's done.
- [ ] **Step 2: Take the screenshots** and update the docs above.
- [ ] **Step 3: Run** `npm test`. Expected: PASS.
- [ ] **Step 4: Commit** "Refs #77: the README and docs show the first-income notice".
