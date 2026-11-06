# A&A advanced capital mats, part 1 (the engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (the owner's standing rule: no subagent per task). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The engine deals, keeps and plays the six Arts & Architecture advanced capital mats with every rule of each mat.

**Architecture:** The mats become data (layout, districts, line values, rule flags) in `data/capitals.js`; the shared grid geometry in `src/lib/capital.js` takes a mat's shape instead of assuming 9×9 with 3×3 districts; `city.js` derives each mat's plots (lily pads, surrounded cacti) and checks its placement rules; setup deals an advanced mat and asks one joint mat-and-civilization decision; two income steps carry Cloud City's moves and Swamp's penalty.

**Tech Stack:** plain JavaScript with JSDoc, Vitest with `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-11-06-aa-capital-mats-design.md` (§3 is this part).

## Global Constraints

- Read `docs/conventions.md` first; never edit it. Engine functions stay pure, throw `PlayerError` for player mistakes, emit events, use the injected `random`.
- Cite rule ids in code comments and test names: R14, R49–R52, R106, R120–R123.
- Base and Plans & Ploys games must not change: no new `random` call without `'aa'`; every existing test passes unchanged except where a task says so.
- Commits on `m8-arts-and-architecture`, never main; each message starts `Refs #36:` and ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `npm run check` reports 0 errors and 0 warnings at the end of every task.

## Review Focus

1. A landmark on an 11-row mat near the bottom edge: it may hang off the bottom (R106) and its spots must reach row 10. Task 2 tests the Archipelago's last row.
2. A Cavern landmark that completes the district above while reaching into the one below is legal; one that reaches below an incomplete district is not. Task 3 tests both.
3. A Swamp lily pad is never offered to an Architects' cube, but a building may cover it, and covering it in a complete district pays nothing. Task 3 tests all three.
4. A cactus surrounded by a landmark's corner (diagonal neighbour) turns impassable and can complete its district on that placement. Task 3 tests it.
5. Setup's hidden information: another player's view of the joint decision shows the mats and never the civilizations. Task 5 tests it through `view()`.

---

### Task 1: The six mats as data

**Files:**
- Modify: `src/lib/engine/data/capitals.js`
- Test: `tests/engine-aa-mats.test.mjs` (new)

**Interfaces:**
- Produces, in `data/capitals.js`:
  - `CapitalMat` gains optional fields: `expansion?: 'aa'`, `districts?: readonly string[]` (one char per plot, a district letter or digit, `.` for none), `rowValues?: readonly number[]`, `columnValue?: number`, `landmarksInside?: boolean` (Mesa), `gated?: boolean` (Cavern), `cloudMoves?: number` (Cloud City: 2), `lilyPenalty?: number` (Swamp: 2). `start` stays only on the basic mats. Grid symbols: `0` open, `1` impassable, `C` cactus (open), `L` lily pad (open).
  - `ADVANCED_MATS: readonly CapitalMat[]`, numbers 7–12 in order: `archipelago`, `canyon`, `cavern`, `cloud-city`, `mesa`, `swamp`.
  - `capitalMat(number: number): CapitalMat`, throwing `Error` for an unknown number.
  - `advancedMatsFor(expansions: readonly string[]): number[]`: `[7…12]` with `'aa'`, else `[]`.
  - `matShape(mat: CapitalMat): import('../../capital.js').Shape` (Task 2 defines `Shape`; in this task return `{ rows, cols, districts }` with `districts` as plot-index lists).

- [ ] **Step 1: Write the failing tests** in `tests/engine-aa-mats.test.mjs`:
  - `the six A&A mats are numbered 7–12 (R49)`: ids and names in order, `expansion === 'aa'`, `capitalMat(n).number === n` for 1–12, `capitalMat(13)` throws.
  - `each mat's plots match 03 §2`: impassable counts Archipelago 44 (41 water + 3 volcanoes), Canyon 19, Cavern 20, Cloud City 22, Mesa 22, Swamp 18; Canyon has 6 `C` at [1,1],[1,7],[4,1],[4,7],[7,1],[7,7]; Swamp 6 `L` at [0,2],[1,4],[2,8],[6,1],[6,5],[7,7]; Archipelago is 11 rows × 9.
  - `the islands and clouds are districts`: Archipelago island sizes A–I = 6,10,4,4,12,5,3,6,8 and no water plot in any; Cloud City cloud sizes 1–9 = 8,8,7,9,9,12,9,9,10 covering all 81 plots; the other four mats have the nine 3×3 districts.
  - `Cavern's rows score 2 and 3, its columns 0 (R51)`: `rowValues` = six 2s then three 3s, `columnValue` = 0; every other mat scores 1 per row and column (fields absent).
  - `the engine's layouts agree with #132's art`: for each slug, the art module's `LAYOUT` (`tools/art/parts/capital-biomes/<slug>.js`, `X` impassable) equals the engine grid with `1`→`X`, `0`→`.`, and `C`/`L` kept; Cloud City's `CLOUDS` equals its `districts`; the Archipelago's `VOLCANOES` are impassable plots inside islands E and H.
  - `advancedMatsFor deals the A&A mats only with A&A`.

- [ ] **Step 2: Run** `npx vitest run tests/engine-aa-mats.test.mjs`. Expected: FAIL (`ADVANCED_MATS` not exported).

- [ ] **Step 3: Add the data and the three functions.** Grids and maps come from 03 §2 (the art modules hold the same layouts). Keep `CAPITAL_MATS` the six basic mats; `impassablePlots(mat)` reads the mat's own row and column counts.

- [ ] **Step 4: Run** the new file and `npx vitest run tests/engine-data.test.mjs`. Expected: PASS.

- [ ] **Step 5: Commit** `Refs #36: the six Arts & Architecture mats as engine data`.

### Task 2: The grid of any shape

**Files:**
- Modify: `src/lib/capital.js`, `src/lib/engine/city.js`, `src/lib/engine/placing.js`, `src/lib/engine/civs/riverfolk.js`, `src/lib/engine/civs/architects.js`, `src/lib/engine/civs/mystics.js`, `src/lib/engine/landmark-cards.js`, `src/lib/engine/effects/pp-cards.js`, `src/lib/engine/decisions/choose-cube.js`, `src/lib/engine/decisions/choose-swap.js`, `src/lib/engine/data/capitals.js` (`matShape` returns the real `Shape`)
- Test: `tests/capital.test.mjs`, `tests/engine-aa-mats.test.mjs`

**Interfaces:**
- Consumes: `capitalMat`, `matShape` (Task 1).
- Produces, in `src/lib/capital.js`:
  - `@typedef {{ rows: number, cols: number, districts: readonly (readonly number[])[] }} Shape`
  - `BASIC_SHAPE: Shape` (9 × 9, nine 3×3 districts); `GRID_SIZE` stays 9 for the client until part 2.
  - Every geometry function takes `shape = BASIC_SHAPE` as its **last** parameter: `plotIndex(row, col, shape)` = `row * shape.cols + col`, `plotPosition(index, shape)`, `footprintCells(rows, row, col, shape)`, `fits(plots, rows, row, col, shape)`, `nearestFit(plots, rows, row, col, shape)`, `groupsOf(kind, shape)` (rows, columns, or `shape.districts`), `completedGroups(plots, kind, shape)`, `groupBounds(group, shape)`.
- Produces, in `city.js`: `seatMat(seat): CapitalMat`, `seatShape(seat): Shape`, `onGrid(row, col, shape)`, `completeDistricts(plots, shape)`, `completeLines(plots, shape)`; `cityPlots(seat)` returns `shape.rows * shape.cols` plots. `seatImpassable(seat): number[]`: the mat's impassable plots and the cubes (Task 3 adds surrounded cacti).
- Every engine caller passes the seat's shape; `riverfolk.js` uses `seatImpassable` instead of its own `impassableOf`.

- [ ] **Step 1: Write the failing tests:**
  - in `capital.test.mjs`, `groupsOf takes a shape`: for `{ rows: 11, cols: 9, districts: [[0, 1], [9]] }`, 11 rows of 9, 9 columns of 11, the two districts as given; `plotIndex(10, 8, shape) === 98`; with no shape, the 9×9 results as today.
  - in `engine-aa-mats.test.mjs`, `an Archipelago capital has 99 plots and its islands as districts`: a started game (`startedGame(2)`), seat 1's `capital.mat = 7`; `cityPlots` has length 99 with 44 `blocked`; `landmarkSpots(seat, <a 1×2 landmark>)` includes a spot covering row 10 and one hanging off the bottom edge (R106); `buildingProblem(seat, { row: 10, col: 0 })` is null.

- [ ] **Step 2: Run** both files. Expected: FAIL.

- [ ] **Step 3: Generalize `capital.js`, then thread the seat's shape through `city.js` and every engine caller listed.** Names of existing exports don't change; only the trailing `shape` parameter is new.

- [ ] **Step 4: Run** `npx vitest run` (the whole unit suite: every base and P&P test must pass unchanged). Expected: PASS.

- [ ] **Step 5: Commit** `Refs #36: the capital grid takes its mat's shape`.

### Task 3: Each mat's placement and completion rules

**Files:**
- Modify: `src/lib/capital.js` (`PlotKind` gains `'lily'`), `src/lib/engine/city.js`, `src/lib/engine/placing.js`
- Test: `tests/engine-aa-mats.test.mjs`

**Interfaces:**
- Consumes: Task 2's `seatMat`, `seatShape`, `seatImpassable`.
- Produces: `cityPlots` shows a lily pad still showing as `'lily'` and a cactus whose 8 neighbours are all filled (not `'empty'`) as `'blocked'`; `seatImpassable` includes the surrounded cacti; `buildingSpots` filters by `buildingProblem`; placement covers `'empty'` and `'lily'` (and `'blocked'` when `buildsOverImpassable`). `impassableCovered` is computed from the plots before the piece lands.
- Problem sentences (PlayerError text): Mesa `'On the Mesa, a landmark must lie wholly inside your city.'`; Cavern `'In the Cavern, build in a district only once the district above it is complete.'`

- [ ] **Step 1: Write the failing tests** (each sets `capital.mat` on a started game, places pieces directly in `seat.capital`, then asks `city.js` / plays through `placePiece`):
  - `Mesa: a landmark may not hang off the edge`: no spot from `landmarkSpots` has a cell off the grid; `landmarkProblem` gives the Mesa sentence for one hanging off.
  - `Archipelago: no piece on water, landmarks may hang off the outer edge (R14, R106)`.
  - `Archipelago: the Riverfolk and Terraforming may build on water and volcanoes (R123)`: `buildingProblem(seat, waterPlot, true)` is null; filling a water plot completes no district.
  - `Cavern: a building below an incomplete district is refused`: with district 0 incomplete, a building in district 3 gets the Cavern sentence; with district 0 complete, it is legal; the top row of districts is always open.
  - `Cavern: a landmark may complete the district above and reach into the one below`: legal; the same landmark with the district above left incomplete is refused.
  - `Cavern: Architects' cubes ignore the gates` (cubes may go in district 3 with district 0 incomplete).
  - `Canyon: a cactus is an open plot until all 8 neighbours are filled (R122)`: buildable while one neighbour is empty; after the last neighbour, filled by a landmark's diagonal corner, it shows `blocked`, and if it was its district's last empty plot, `placePiece` emits `districtsCompleted` for it and pays 1 resource.
  - `Canyon: the Riverfolk count a surrounded cactus as impassable` (`seatImpassable` includes it).
  - `Swamp: lily pads count as filled and may be built on`: a district whose only empty-looking plots are lily pads is complete; `buildingSpots` includes the pads; a building on a pad of a complete district emits no `districtsCompleted`; the Architects' cube options never include a pad.

- [ ] **Step 2: Run** `npx vitest run tests/engine-aa-mats.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Implement in `city.js`:** the lily and cactus kinds in `cityPlots` (one pass over the `C` plots after the pieces); Mesa in `landmarkProblem` (every cell on the grid when `landmarksInside`); the Cavern gate in `buildingProblem` and `landmarkProblem` when `gated`: place the piece on a copy of the plots, then every covered plot in district row 2 or 3 needs the district directly above complete in that copy. `architects.js`'s cube options keep `plots[p] === 'empty'`.

- [ ] **Step 4: Run** the file, then `npx vitest run`. Expected: PASS.

- [ ] **Step 5: Commit** `Refs #36: each advanced mat's placement and completion rules (R122, R123)`.

### Task 4: Scoring the advanced mats

**Files:**
- Modify: `src/lib/engine/city.js` (`capitalScore`, `uniformLines`)
- Test: `tests/engine-aa-mats.test.mjs`

**Interfaces:**
- Produces: `capitalScore(seat)` returns `{ rows, columns, uniform, vp }` where `rows`/`columns` count complete lines and `vp` = Σ complete rows' values + columns × column value + uniform; `uniform` is 0 on a mat with `rowValues` (the Cavern ruling, 03 §2 Cavern).

- [ ] **Step 1: Write the failing tests:**
  - `Archipelago scores its 11 rows and 9 columns (R50)`: fill everything open; `capitalScore` = `{ rows: 11, columns: 9, uniform: 0, vp: 20 }`.
  - `Cavern scores 2 for rows 1–6, 3 for rows 7–9 and nothing for columns (R51)`: complete rows 0 and 8 and column 4 → `vp` 5.
  - `the Architects' bonus does nothing on the Cavern`: a complete row of markets on the Cavern gives `uniform: 0`.
  - `Swamp's lily pads count toward complete lines`.

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** the file and `npx vitest run` → PASS.

- [ ] **Step 5: Commit** `Refs #36: score the advanced mats' rows and columns (R50, R51)`.

### Task 5: Setup — the A&A switch, the deal and the joint choice

**Files:**
- Modify: `src/lib/engine/setup.js` (`EXPANSIONS_BUILT`, `SetupContext`, `dealCapitals`, `dealCivs`), `src/lib/engine/after-setup.js` (`reveal`), `src/lib/engine/state.js` (`picks` typedef), `src/lib/engine/kinds.js`, `src/lib/decision-kinds.js`, `src/lib/decision-words.js`, `tests/helpers/engine.mjs`, `tests/helpers/invariants.mjs`, `tests/engine-final-fixes.test.mjs` (fixture)
- Create: `src/lib/engine/decisions/choose-mat-and-civ.js`
- Test: `tests/engine-aa-setup.test.mjs` (new)

**Interfaces:**
- Produces:
  - `EXPANSIONS_BUILT = ['pp', 'aa']`.
  - `SetupContext.mats: (number[] | null)[]`, one per seat: with `'aa'`, the seat's basic mat(s) then its advanced mat; else `null`.
  - Decision `chooseMatAndCiv`: `{ player, kind, mats: number[], civs: string[] }`, `hidden: ['civs']`; answers `{ capital: number, civ: string }` for every pair, minus R120's pair in current-rules games; `check` throws `PlayerError` for a mat or civ not dealt, and `'Under the current rules, the Riverfolk may not keep Cloud City.'` for R120's pair; `resolve` sets `picks.capital`, `picks.civ`, `picks.dealt = mats`, sends the other civ to `supply.civs`, emits `capitalChosen` and `civChosen` with `secret`.
  - Event `capitalDealt` gains `advanced: number` with A&A.
  - `reveal` sets every seat's `capital.mat` from `picks.capital` on both maps; the dealt mats not kept join `supply.capitals`.
  - Client: `decision-kinds.js` `chooseMatAndCiv: { shelf: 'mat', confirm: 'Keep these' }`; `decision-words.js` a title (`'Choose your capital city and civilization'`) and answer words (`'<Mat> with the <Civ>'`). Part 2 builds its shelf.
  - Test helper: `startedGame(count, { expansions: ['aa'], mats: [7, 10] })` keeps those mats (seat order) and the `civs` as before; `dealCivs` handles `chooseMatAndCiv`.

- [ ] **Step 1: Write the failing tests** in `tests/engine-aa-setup.test.mjs`:
  - `a table may switch A&A on`; a base and a P&P game's setup decisions and first 50 events are unchanged (compare with a game made before the switch, same seed: no `chooseMatAndCiv`).
  - `A&A deals each player one advanced mat, face up`: for 1, 2, 3, 4 and 5 players, each seat's `chooseMatAndCiv.mats` is its basic mat(s) then one of 7–12, all different; the starts are the basic mats' (R40 for one player).
  - `the joint pick is hidden until the reveal`: `view(state, 2)` shows seat 1's decision `mats` but not `civs`; after all picks, `setupRevealed` lists each seat's mat and civ, and `capital.mat` is the kept one on both maps.
  - `R120: the Riverfolk may not keep Cloud City under the current rules`: with seat 1 dealt Cloud City and the Riverfolk, the pair is missing from `answers` and `play` throws the sentence; in an `original` game it is offered and accepted.
  - `every mat is in one place throughout` (the invariants run in the simulation; here assert after the reveal: `supply.capitals` holds the rest of 1–12).

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, with a fixture for `chooseMatAndCiv` in `engine-final-fixes.test.mjs` and the invariants counting 1–12 with A&A (kept mats' `picks.dealt` until the reveal, and `chooseMatAndCiv` options). **Step 4: Run** `npx vitest run` → PASS.

- [ ] **Step 5: Commit** `Refs #36: deal an advanced mat and keep it with a civilization (R120)`.

### Task 6: Swamp's lily-pad penalty

**Files:**
- Modify: `src/lib/engine/income.js`
- Test: `tests/engine-aa-mats.test.mjs`

**Interfaces:**
- Produces: income step `lilyPads` (turns `[5]`), in `INCOME_STEPS` right after `'eraEnd'` and before `'civAbilities'` (the slot #35's masterpieces step precedes, design §5). For a seat whose mat has `lilyPenalty`, it scores `-lilyPenalty` VP per `'lily'` plot via the `vp` effect, with event `lilyPadsCounted { player, pads }`; others: nothing.

- [ ] **Step 1: Failing tests:** `Swamp: lose 2 VP per lily pad still showing at the start of income turn 5 (R52)`: a Swamp seat with 2 pads covered loses 8 VP when its fifth income turn starts, and nothing on turns 2–4; a basic mat loses nothing.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `Refs #36: Swamp's lily pads cost 2 VP each on the final income turn (R52)`.

### Task 7: Cloud City's move

**Files:**
- Modify: `src/lib/engine/income.js`, `src/lib/engine/placing.js` (share the district reward), `src/lib/engine/kinds.js`, `src/lib/decision-kinds.js`, `src/lib/decision-words.js`, `tests/engine-final-fixes.test.mjs` (fixtures)
- Create: `src/lib/engine/decisions/choose-cloud-move.js`
- Test: `tests/engine-aa-mats.test.mjs`

**Interfaces:**
- Produces:
  - In `placing.js`: `payDistricts(ctx, player, before: number[]): NewOperation[]`: the reward and `districtsCompleted` triggers for districts complete now but not in `before`; `placePiece` uses it.
  - Income step `cloudMoves` (turns `[2, 3, 4, 5]`), first after `'eraEnd'` (R121: it joins #35's masterpiece order when that lands). For a seat whose mat has `cloudMoves`, it calls `askCloudMove(ctx, player, left)`.
  - Decision `chooseCloudMove`: `{ player, kind, left }`; answers `{ from: null }` (stop) and `{ from: plotIndex }` for each income building in an incomplete district with somewhere to go; asked only when one exists.
  - Decision `chooseCloudPlot`: `{ player, kind, from, left }`; answers `{ to: plotIndex }` for every plot `buildingSpots(seat, buildsOverImpassable(...))` gives in another district.
  - Resolving the plot moves the building, emits `buildingMoved { player, building, from, to }`, pushes `payDistricts(...)` and the `countsChanged` triggers, and no `piecePlaced`; then `askCloudMove(ctx, player, left - 1)`.
  - Client: `decision-kinds.js` entries `{ tab: 'capital' }` for both; titles `'Move a building between clouds?'` and `'Where does it go?'`.

- [ ] **Step 1: Failing tests:**
  - `Cloud City: up to 2 moves at the start of income turns 2–5`: a seat with buildings in an incomplete cloud is asked `chooseCloudMove` on turn 2, makes 2 moves, is not asked a third time; not asked on turn 1; stopping ends it.
  - `a building may only leave an incomplete cloud, for another cloud`: no answer moves from a complete cloud or within the same cloud.
  - `a move that fills a cloud pays its resource, and fires no piecePlaced`: `districtsCompleted` and a `gain any 1` follow; no Terraforming VP.
  - `no question when nothing can move`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `Refs #36: Cloud City's two moves at the start of income turns (R121)`.

### Task 8: Simulation, rules and records

**Files:**
- Modify: `tests/helpers/simulation.mjs` (A&A in the table mix), `README.md` (R120–R123 in "Rules conventions", Arts & Architecture), `CLAUDE.md` (rule-id range R1–R123), `docs/status.md` (the summary's M8 line and a #36 part 1 entry), `docs/architecture.md` (the mats' data and the shape)

- [ ] **Step 1:** Give the simulation A&A games (some seeds with `expansions` including `'aa'`, alone and with `'pp'`); answers come from `answers()`, so the new decisions need nothing else.
- [ ] **Step 2: Run** `npx vitest run tests/simulation.test.mjs`, then `SIM_GAMES=600 npx vitest run tests/simulation.test.mjs`. Expected: PASS, invariants and view checks included.
- [ ] **Step 3:** Write R120–R123 as in the design §2; the status entry says what part 1 built, the calls to revisit, and that part 2 (the screen) follows.
- [ ] **Step 4: Run** `npx vitest run` and `npm run check`. Expected: all pass, 0 errors, 0 warnings.
- [ ] **Step 5: Commit** `Refs #36: play A&A mats in the simulation, and record R120–R123`.
