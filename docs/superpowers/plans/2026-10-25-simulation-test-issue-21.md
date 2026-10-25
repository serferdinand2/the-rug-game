# Full-game simulation test (#21) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `node --test tests/simulation.test.mjs` plays 200 random legal games from setup to the end and checks the engine's invariants and every view after every action.

**Architecture:** Three test helpers (state invariants, view invariants, one simulated game) and one test file that spreads the games over worker threads and reports one test per game. No engine code changes unless the simulation finds a bug; each bug found gets its own regression test in the matching `engine-*.test.mjs` first.

**Tech Stack:** Node 22 `node:test`, `node:assert/strict`, `node:worker_threads`; the engine through `src/lib/engine/game.js`, `stack.js` and `kinds.js`.

**Spec:** `docs/superpowers/specs/2026-10-25-simulation-test-design.md`

## Global Constraints

- Game `i` (0–199): seed `i + 1`, `1 + i % 5` players, version `original` when `⌊i / 5⌋` is even else `current`, policy `random` when `⌊i / 10⌋` is even else `busy`.
- Two `seededRandom()` generators per game: the engine's from the seed, the answer picker's from `seed * 7919`.
- The busy policy takes an offered advance turn 85% of the time. A game fails after 5,000 actions.
- Workers: `Math.max(1, Math.min(8, availableParallelism() - 1))`.
- `SIM_SEED=n` plays only seed `n` on the main thread; `SIM_GAMES=n` plays games 0 to n − 1.
- Every failure message starts with `seed <s>, <n> players, <version>, <policy> play, action <k> (<decision kind>):` and ends with `Replay: SIM_SEED=<s> node --test tests/simulation.test.mjs`.
- Test files follow CONVENTIONS.md: a one-line comment first, JSDoc on exported helpers, tabs and single quotes (`npm run format`).

## Review Focus

- A planted leak or a planted lost card must make the checkers throw, or a passing simulation proves nothing: Tasks 1 and 2 test the checkers against broken states.
- A worker that crashes (not a game failure) must fail the test, not hang it: Task 3 rejects on the worker's `error` and on a non-zero `exit`.
- An id shared by a tech card and a landmark (`id` public elsewhere) must not be reported as a leak: Task 1 keeps the "bare state" exclusion from `engine-view.test.mjs`.
- During setup the civilizations and the small map's mats sit in open decisions and picks: Task 2 counts them there, so setup actions don't fail the conservation check.
- A face-down tapestry card is hidden from its own owner too: Task 1 checks every viewer, the owner included.

---

### Task 1: The shared view checker

**Files:**
- Create: `tests/helpers/views.mjs`
- Modify: `tests/engine-view.test.mjs` (delete its `allOps` and `checkViews`, import them)
- Test: `tests/engine-view.test.mjs`

**Interfaces:**
- Produces: `allOps(state) → Operation[]` (every operation on the main stack and in every lane); `setupFacts(state) → { capitals: number[] }` (taken from a new game, before any pick); `checkViews(state, facts, viewOf = view)` throws an `AssertionError` naming the leak.

- [ ] **Step 1: Write the failing tests** in `tests/engine-view.test.mjs`:
  - `'the view checker catches a hand shown to another player'`: a started 2-player game with a tapestry card in seat 2's hand; `checkViews(state, facts, (s, seat) => ({ ...view(s, seat), leak: s.seats[1].hand }))` throws `/card .* shown to/`.
  - `'the view checker catches a face-down card shown to its owner'`: put seat 1's hand card face down on era slot 1 (`incomeMat.tapestry[0]` and `incomeMat.faceDown`); a `viewOf` that restores the card in seat 1's own view throws `/face-down card/`.
  - `'the view checker catches an open decision without answers'`: a `viewOf` that deletes `answers` from the viewer's own decisions throws `/no answers/`.
  - The existing random-setup test calls the imported `checkViews` and still passes.
- [ ] **Step 2: Run** `node --test tests/engine-view.test.mjs`. Expected: the three new tests FAIL (helpers missing).
- [ ] **Step 3: Implement `tests/helpers/views.mjs`.** Move `allOps` and `checkViews` from `engine-view.test.mjs` unchanged in meaning, then add: every string in the view's JSON goes into a `Set` once (`/"(?:[^"\\]|\\.)*"/g`), and every secret id is looked up there; the face-down ids of every seat must be absent from every view; each of the viewer's own open decisions has a non-empty `answers` array. Keep the "bare state" exclusion for ids public elsewhere.
- [ ] **Step 4: Run** `node --test tests/engine-view.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #21: share the view checker and catch face-down and answer leaks`.

### Task 2: The state invariants

**Files:**
- Create: `tests/helpers/invariants.mjs`
- Test: `tests/simulation-checks.test.mjs`

**Interfaces:**
- Consumes: `allOps` from Task 1.
- Produces: `checkState(state, previousSeq = 0)`, which throws an `AssertionError` naming the broken invariant (design §5). It reads the deck lists from `src/lib/engine/decks.js` and the data from `src/lib/engine/data/`.

- [ ] **Step 1: Write the failing tests** in `tests/simulation-checks.test.mjs`. `checkState` passes on `newGame(n).state` for n = 1–5, and on `startedGame(4).state`. Each of these planted breaks on a copy of `startedGame(2).state` throws a message matching the pattern:
  - a tech card pushed twice into `supply.tech.discard` → `/tech cards/`;
  - a tapestry card dropped from the deck → `/tapestry cards/`;
  - a territory tile dropped from the stack → `/territory tiles/`;
  - a landmark dropped from `state.landmarks` → `/landmarks/`;
  - seat 1's `incomeMat.buildings.farm` set to 4 → `/seat 1.*farm/`;
  - seat 2's `outposts` set to 7 → `/seat 2.*outposts/`;
  - seat 1's `resources.coin` set to 9 → `/coin/`;
  - an event's `seq` bumped by 1 → `/seq/`;
  - seat 1's era `{ card: 'x', ability: 'x' }` with no card on its slots → `/era/`;
  - every open decision removed from `pending` while `phase` is `play` → `/no decision is open/`.
- [ ] **Step 2: Run** `node --test tests/simulation-checks.test.mjs`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement `checkState`.** One `exactlyOnce(label, found, expected)` helper reports the duplicated and the missing ids. The places and counts are the design's §5 tables: tech 33, tapestry 50, territory 1–48, space 15, civilizations 16 (in setup also open `chooseCiv` options and `picks.civ`), capital mats 1–6 (in small-map setup also open `chooseCapital` options and `picks.capital`), landmarks 18 (open `choosePlacement` with `landmark` included); 5 of each building and 10 outposts per player; 4 Traders and Isolationists tokens once their `civData` exists; resources 0–8 and track spaces 0–12 as whole numbers; events numbered consecutively up to `state.seq`, all new ones above `previousSeq`; the era rules; decision ids unique; while not over, at least one open decision, each with at least one answer from `DECISIONS[kind].answers`.
- [ ] **Step 4: Run** `node --test tests/simulation-checks.test.mjs`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #21: check that every card, tile and token stays in one place`.

### Task 3: The simulation

**Files:**
- Create: `tests/helpers/simulation.mjs`, `tests/helpers/simulation-worker.mjs`, `tests/simulation.test.mjs`
- Test: `tests/simulation.test.mjs`, `tests/simulation-checks.test.mjs`

**Interfaces:**
- Consumes: `checkState` (Task 2), `checkViews`, `setupFacts` (Task 1).
- Produces: `gameOf(index) → { seed, players, version, policy }`; `simulate(index) → { actions: number }`, which throws an `Error` whose message follows the Global Constraints format.

- [ ] **Step 1: Write the failing tests.** In `tests/simulation-checks.test.mjs`: `'the 200 games cover every player count, version and policy 10 times'` (count the 20 combinations over `gameOf(0..199)`); `'a simulated game ends with every player finished and ranked'` (`simulate(0)` and `simulate(15)` return without throwing and play more than 50 actions); `'a failing game names its seed and how to replay it'` (simulate with a `checkState` stand-in that throws on action 3: the message matches `/^seed 1, 1 players, original, random play, action 3 \(\w+\):/` and `/Replay: SIM_SEED=1 node --test tests\/simulation.test.mjs$/`). So `simulate(index, { check })` takes an optional check for this test.
- [ ] **Step 2: Run** `node --test tests/simulation-checks.test.mjs`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement `simulation.mjs`.** Per action: the open decisions from `openDecisions`, one picked at random; its answers from the acting player's `view()`; one picked by the policy; `play()`; then `checkState(state, seqBefore)` and `checkViews(state, facts)`. At the end: phase `over`, no open decision, every player seat `finished` with `incomeTurns` 5, `state.result` with one entry per seat.
- [ ] **Step 4: Implement the worker and `tests/simulation.test.mjs`.** The worker gets `{ indexes }` and posts `{ index, ok, actions, message }` per game. The test file: with `SIM_SEED`, one test running `simulate(seed - 1)` on the main thread; otherwise it deals the indexes round-robin to the workers and creates one `test()` per game, named `game <seed>: <n> players, <version>, <policy> play`, awaiting that game's result. A worker `error` or non-zero `exit` rejects every game it still owes.
- [ ] **Step 5: Run** `node --test tests/simulation.test.mjs` and `SIM_SEED=17 node --test tests/simulation.test.mjs`. Expected: 200 passing tests within about 30 seconds, then 1. If a game fails, follow superpowers:systematic-debugging: replay its seed, write a failing `engine-*` regression test, fix the engine, rerun.
- [ ] **Step 6: Run** `npm test` and `npm run check`. Expected: all pass, 0 errors and 0 warnings.
- [ ] **Step 7: Commit** `Refs #21: play 200 random games and check every action`.

### Task 4: Record #21

**Files:**
- Modify: `CLAUDE.md` (Commands: the simulation and `SIM_SEED`; Where the work stands: #21 done; Next), `CONVENTIONS.md` (Tests: the simulation helpers)

- [ ] **Step 1:** Update both files; run `npm run format`.
- [ ] **Step 2: Commit** `Fix #21: add the randomized full-game simulation test`.
