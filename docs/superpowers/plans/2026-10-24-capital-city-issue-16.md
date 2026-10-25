# Capital city placement (#16) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gained income buildings and landmarks are placed in the capital city, filling a district pays 1 resource of the player's choice, `scoreCapital` scores complete rows and columns, and `capital.landmarks` feeds the tiebreak.

**Architecture:** `city.js` holds the pure geometry: the plots worked out from the mat and the pieces, the legal places, and the complete districts and lines. `placing.js` holds the two automatic operations #14 pushes, `placeBuilding` and `placeLandmark`. Each one places the piece beside the mat, places it automatically, or asks through the one decision kind `choosePlacement`. Placing pushes the district reward on top, so it resolves before the space's benefit.

**Tech Stack:** Plain Node ES modules with JSDoc, `node:test`, `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-24-capital-city-design.md`

## Global Constraints

- Engine modules import only relative paths: no DOM, Svelte or Node, and never `Math.random` (`tests/engine-data.test.mjs` checks). Geometry comes from `../capital.js` (`GRID_SIZE`, `plotIndex`, `rotateFootprint`, `groupsOf`) and footprints from `../art/footprints.js` (`FOOTPRINTS`). Mats come from `./data/capitals.js` (`CAPITAL_MATS`, numbered 1–6, index `mat - 1`).
- Prettier (tabs, single quotes), braces on every `if`/`else`, a one-line comment at the top of every file, JSDoc on every export. `npm run check` reports 0 errors and 0 warnings.
- `play()` stays pure. Player mistakes throw `PlayerError` with the exact sentences below; anything else is a plain `Error`.
- One event per thing that happened. Nothing about the capital is private: `choosePlacement.hidden` is `[]`.
- Handlers never replace `state.pending` or a lane's stack array; they use `ctx.push`.
- Positions: `row` and `col` are the top-left of the *turned* shape and may be off the grid for a landmark; `rotation` is quarter turns clockwise, 0–3, as `rotateFootprint()` takes it.
- Cite rule ids in comments and test names (R13, R14, R15, R71, FAQ #1, #21–23).
- `tests/helpers/engine.mjs`'s `stubHandoffs()` throws once a stood-in kind is built, so the task that registers a kind removes its stand-in and migrates every test that relied on it, in the same commit.
- Every new decision kind gets a fixture in `tests/engine-final-fixes.test.mjs`'s shape test in the task that adds it.
- Work on the branch `issue-16`. Commits reference the issue: `Refs #16: …`, and the last one `Fix #16: …`. End every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**PlayerError sentences (exact):**

| When | Sentence |
|---|---|
| `row` or `col` missing or not a whole number | `Choose a row and a column.` |
| a landmark's `rotation` is not 0, 1, 2 or 3 | `Choose a rotation from 0 to 3.` |
| a building answer has a `rotation` | `Only a landmark can be turned.` |
| a building off the grid | `A building must go on a plot of your city.` |
| a plot on the grid that isn't `'empty'` | `That plot isn't open.` |
| a landmark covering no grid plot | `A landmark must cover at least one plot of your city.` |
| a landmark over another landmark's off-grid plot | `Another landmark is already there.` |

## Review Focus

- **Answers that aren't whole numbers.** `'3'`, `2.5`, `NaN`, `null`, `1e9` or a missing field are refused with a `PlayerError`, never a crash and never a plot index that wraps into the next row. Test in Tasks 2 and 3.
- **A landmark gained on an opponent's turn** (FAQ #2) is placed by the player who gained it; the current player can't answer it. Test in Task 3.
- **A district reward when the player holds 8 of everything** is still offered, the resource is lost at the cap, and nothing crashes. Test in Task 2.
- **Two landmarks gained in one move.** The second's answers never include a plot the first took, on or off the grid. Test in Task 3.
- **A full city never leaves the game waiting** on a decision with no answers: buildings and landmarks go beside the mat instead. Test in Tasks 2 and 3.

---

### Task 1: City geometry and the new capital state

**Files:**
- Create: `src/lib/engine/city.js`
- Modify: `src/lib/engine/setup.js` (start every player with `capital: { mat: null, buildings: [], landmarks: [] }`), `src/lib/engine/state.js` (types: `capital`, and `besideMat` as "Landmark and income building ids that didn't fit, in order"), `src/lib/engine/ranking.js` (`landmarksInCity` returns ids from the pieces), `tests/engine-ranking.test.mjs` (set `capital.landmarks` as pieces)
- Test: `tests/engine-city.test.mjs`

**Interfaces:**
- Produces, in `city.js`:
  - `@typedef {{ building: BuildingId, row: number, col: number }} PlacedBuilding`
  - `@typedef {{ landmark: string, row: number, col: number, rotation: number }} PlacedLandmark`
  - `@typedef {{ row: number, col: number }} Cell` (may be off the grid)
  - `cityPlots(seat: PlayerSeat) → PlotKind[]`: 81 plots, row by row (§4). Throws `Error` when `seat.capital.mat` is `null`.
  - `landmarkCells(piece: PlacedLandmark) → Cell[]`: every plot the turned footprint covers, on and off the grid.
  - `buildingProblem(seat, { row, col }) → string | null` and `landmarkProblem(seat, { landmark, row, col, rotation }) → string | null`: the `PlayerError` sentence for an illegal place, or `null` when it's legal. Inputs are already whole numbers.
  - `buildingSpots(seat) → { row, col }[]`: the open plots in reading order.
  - `landmarkSpots(seat, landmark) → { row, col, rotation }[]`: every legal place, rotations 0–3, `row` from `1 − height` to 8 and `col` from `1 − width` to 8 of the turned shape. Sorted: fully on the grid first, then rotation, then row, then col.
  - `completeDistricts(plots) → number[]`: districts 0–8 (reading order) with no `'empty'` plot.
  - `completeLines(plots) → { rows: number, columns: number }`.
- Produces, in `ranking.js`: `landmarksInCity(seat) → string[]`, now `seat.capital.landmarks.map((p) => p.landmark)`.

- [ ] **Step 1: Write the failing tests** (seats from `startedGame(2)`, with `capital.mat`, `buildings` and `landmarks` set by hand):
  - `'cityPlots shows each basic mat's 22 impassable plots as blocked and the other 59 as empty'`: for mats 1–6, the counts and that every `'blocked'` index is in `impassablePlots(mat)`.
  - `'no district, row or column of a basic mat starts complete'`: `completeDistricts` is `[]` and `completeLines` is `{ rows: 0, columns: 0 }` on all 6.
  - `'cityPlots shows buildings by type and a landmark on its grid plots only'`: Mountain (mat 1), a farm at (0, 0) and a Lighthouse at `{ row: -1, col: 7, rotation: 0 }`. Plot (0, 0) is `'farm'`; (0, 7) and (0, 8) are `'landmark'`; every other plot is as the mat shows.
  - `'buildingSpots lists the open plots in reading order'`: Mountain gives 59, starting `{0,0}, {0,1}, {0,2}`; after a farm at (0, 0), 58 starting at `{0,1}`.
  - `'buildingProblem refuses an impassable plot, a taken plot and a plot off the grid'`: on Mountain, (1, 0) and the farm's (0, 0) give `That plot isn't open.`; (9, 0) and (0, -1) give `A building must go on a plot of your city.`
  - `'R14: a landmark may hang off the edge, but must cover at least one plot of the city'`: Mountain Lighthouse spots include `{ row: -1, col: -1, rotation: 0 }`. `landmarkProblem` for `{ row: -2, col: 0, rotation: 0 }` gives the "at least one plot" sentence.
  - `'R15: a landmark is offered in all four rotations, each covering its turned footprint'`: for Rubber Works on Mountain, every rotation 0–3 appears, and `landmarkCells` of each equals the `X`s of `rotateFootprint(FOOTPRINTS['rubber-works'], rotation)` at that corner.
  - `'R15: a chiral landmark is never offered mirrored'`: for Birdwatching Perch (`['.XXX', 'XXX.']`) on Mountain, no spot's cells equal the mirror `['XXX.', '.XXX']` at any corner.
  - `'landmark spots fully on the grid come first, and the default is unturned from the top left'`: Mountain Lighthouse spots begin with `{ row: 0, col: 2, rotation: 0 }`, and every fully-on-grid spot comes before every overhanging one.
  - `'two landmarks cannot overlap off the grid'`: Mountain with a Fusion Reactor at `{ row: -2, col: 0, rotation: 2 }` (shape `XXX / XXX / XX.`, so it covers grid plots (0, 0) and (0, 1) only). A Lighthouse at `{ row: -1, col: 2, rotation: 0 }` gives `Another landmark is already there.`; one at `{ row: -1, col: 3, rotation: 0 }` gives `null`.
  - `'completeDistricts and completeLines count impassable plots as filled'`: on Grassland (mat 5), district 0's only open plots are (0, 0), (0, 1) and (0, 2). With buildings on those three, `completeDistricts` is `[0]`, and `completeLines` is `{ rows: 0, columns: 0 }` (the rest of row 0 is still open).
  - In `tests/engine-ranking.test.mjs`: `'R13: landmarksInCity names the landmarks placed on the grid'`, and the existing tests set pieces such as `{ landmark: 'fusion-reactor', row: 0, col: 0, rotation: 0 }`.
- [ ] **Step 2: Run** `node --test tests/engine-city.test.mjs tests/engine-ranking.test.mjs`. Expected: FAIL, `city.js` not found.
- [ ] **Step 3: Implement** `city.js`, the setup and state changes, and `landmarksInCity`.
- [ ] **Step 4: Run** `node --test tests/engine-*.test.mjs`, then `npm run check`. Expected: PASS, 0 errors and 0 warnings.
- [ ] **Step 5: Commit** `Refs #16: work out the capital city's plots and legal places`.

### Task 2: Placing income buildings, and district rewards

**Files:**
- Create: `src/lib/engine/placing.js`, `src/lib/engine/decisions/choose-placement.js`
- Modify: `src/lib/engine/kinds.js` (decision `choosePlacement`, automatic `placeBuilding`), `tests/helpers/engine.mjs` (drop `'placeBuilding'` from `HANDOFF_OPERATIONS`; add `placeAll`), `tests/engine-final-fixes.test.mjs` (fixture `{ player: 1, kind: 'choosePlacement', building: 'farm' }`)
- Migrate: every test that relied on the `placeBuilding` stand-in. Known: `engine-counters` (its "until #16" test goes; the building test checks for an open `choosePlacement` instead of a stub call), `engine-order`, `engine-track-spaces`, `engine-scripted-game` (answer the placements at steps 6, 7 and 8 with `answers()[0]`). Run the whole suite to find the rest.
- Test: `tests/engine-capital.test.mjs`

**Interfaces:**
- Consumes: Task 1's `city.js`.
- Produces, in `placing.js`:
  - `placePiece(ctx, player, piece: PlacedBuilding | PlacedLandmark, automatic: boolean)`: notes the complete districts, adds the piece to `capital.buildings` or `capital.landmarks`, and emits `buildingPlaced { player, building, row, col, automatic }` or `landmarkPlaced { player, landmark, row, col, rotation, automatic }`. If it completes n ≥ 1 districts, it emits `districtsCompleted { player, districts }` and pushes `{ player, kind: 'effects', effects: [{ gain: { any: n } }] }`.
  - `placeBuilding` (automatic kind) `{ player, building }`. With no spot, it pushes the id onto `besideMat` and emits `placedBesideMat { player, building }`. With one spot, it places it with `automatic: true`. Otherwise it pushes `choosePlacement { player, building }`.
- Produces, in `choose-placement.js`: `choosePlacement` with `hidden: []`. For a building: `answers` = `buildingSpots(seat)`, `check` uses the shape sentences and then `buildingProblem`, and `resolve` = `placePiece(..., false)`. Task 3 adds the `landmark` branch.
- Produces, in `tests/helpers/engine.mjs`: `placeAll(state, random) → State` answers every open `choosePlacement` with its first answer until none is open. It doesn't answer `chooseResource`.

- [ ] **Step 1: Write the failing tests** (push ops with `push(state, state.pending, [...])` and `run(state, random)` from `stack.js` and `loop.js`, or through `resolveEffects` with `{ building: 'farm' }`):
  - `'a gained building waits for its player to choose a plot, and every open plot is offered'`: `choosePlacement { building: 'farm' }` is open, and its answers are `buildingSpots(seat)`.
  - `'every placement answer passes check, and impassable or taken plots are refused'`: answer (1, 0) on Mountain and expect the exact sentence.
  - `'a building answer must be two whole numbers on the grid, without a rotation'`: `'3'`, `2.5`, `NaN`, `null`, `1e9`, a missing `col`, and `{ row: 0, col: 0, rotation: 0 }` each throw a `PlayerError` with the table's sentence (Review Focus).
  - `'the last open plot is filled automatically (owner)'`: with 58 of 59 plots filled, no decision opens, and `buildingPlaced` has `automatic: true`. A chosen placement has `automatic: false`.
  - `'a building on a full city goes beside the mat, and still counts for 1 VP per farm (FAQ #21, R71)'`: `besideMat` is `['farm']`, `placedBesideMat` is emitted, no decision is left open (Review Focus), and `countVp(state, 1, 'farm')` is 1.
  - `'on all 6 basic mats, each district pays 1 resource exactly when its last open plot fills'`: for mats 1–6, place `placeBuilding` ops on every open plot in reading order (answer each `choosePlacement` with `answers()[0]`, each `chooseResource` with `answers()[0]`). Each `districtsCompleted` names exactly the districts whose last open plot that placement filled. There are 9 districts in all, none early, and `completeLines` is `{ rows: 9, columns: 9 }` at the end.
  - `'a district reward at 8 of everything is still offered, and lost at the cap'`: `chooseResource { count: 1 }` opens and `resourcesGained` reports the loss (Review Focus).
  - `'only the placing player sees the placement answers'`: `view(state, 1)` carries `answers` on the decision, and `view(state, 2)` doesn't.
- [ ] **Step 2: Run** `node --test tests/engine-capital.test.mjs`. Expected: FAIL, no operation kind `placeBuilding`.
- [ ] **Step 3: Implement** `placing.js`, `choose-placement.js` (building branch), the registrations, the helper changes and the fixture.
- [ ] **Step 4: Migrate** the existing tests, then run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS, 0 errors and 0 warnings.
- [ ] **Step 5: Commit** `Refs #16: place income buildings and pay district rewards`.

### Task 3: Placing landmarks

**Files:**
- Modify: `src/lib/engine/placing.js` (`placeLandmark`), `src/lib/engine/decisions/choose-placement.js` (landmark branch), `src/lib/engine/kinds.js` (automatic `placeLandmark`), `tests/helpers/engine.mjs` (drop `'placeLandmark'`)
- Migrate: every test that relied on the `placeLandmark` stand-in. Known: `engine-movement`, `engine-research`, `engine-track-spaces` (the tier spaces and both landmark-race tests now check `landmarkPlaced` events or an open `choosePlacement` by player) and `engine-scripted-game` (the Barracks at step 12).
- Test: `tests/engine-capital.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces:
  - `placeLandmark` (automatic kind) `{ player, landmark }`, called through `playerSeat()`, so a bot seat throws until #31. With no spot, it pushes the id onto `besideMat` and emits `placedBesideMat { player, landmark }`. If every spot's `landmarkCells` are the same set, it places `spots[0]` with `automatic: true`. Otherwise it pushes `choosePlacement { player, landmark }`.
  - `choosePlacement` for a landmark: `answers` = `landmarkSpots(seat, landmark)`. `check` uses the shape sentences (including rotation), then `landmarkProblem`.

- [ ] **Step 1: Write the failing tests:**
  - `'a gained landmark waits for a spot, offered in all four rotations (R15)'`: after `moveToken` from exploration 3 to 4 (as in `engine-movement`), `choosePlacement { landmark: 'lighthouse' }` is open and every rotation 0–3 is among its answers.
  - `'a landmark answer is refused off the city, on a taken plot, or over another landmark's overhang'`: one case for each sentence, plus `rotation: 4`, `rotation: '1'` and `row: 1.5` (Review Focus).
  - `'a landmark with one place goes there unturned, without a question (owner)'`: Mountain with every open plot filled except (6, 4), (6, 5), (7, 4) and (7, 5). The Lighthouse is placed at `{ row: 6, col: 4, rotation: 0 }` with `automatic: true`.
  - `'a landmark with two places is asked about'`: the same, but with (0, 0) also open, so `{ row: -1, col: -1 }` is a second place.
  - `'a landmark with no place goes beside the mat and does not count for the tiebreak (R13, R14)'`: on a full city, `besideMat` is `['lighthouse']`, `capital.landmarks` is `[]`, `landmarksInCity` is `[]`, and no decision is left open (Review Focus).
  - `'a landmark completing two districts gives one choice of 2 resources'`: Mountain with buildings on (0, 0), (0, 1), (2, 0), (2, 1), (2, 2), (0, 4), (0, 5) and (1, 4). Then a Lighthouse at `{ row: 0, col: 2, rotation: 0 }` gives `districtsCompleted { districts: [0, 1] }` and `chooseResource { count: 2 }`.
  - `'FAQ #1: the landmark and its district resource come before the space's benefit'`: Navigation (exploration 4) on Mountain, with district 0 filled except (2, 1) and (2, 2). The player answers `{ row: 2, col: 1, rotation: 0 }`. `chooseResource` is open, and `territoryTiles` has not grown yet. After the resource, the tile is gained.
  - `'two landmarks gained in one move are placed in turn, and the second is offered only what the first left'`: `moveToken` from exploration 3 to 7 gains the Lighthouse, then the Train Station. Only the Lighthouse's `choosePlacement` is open first. After it is placed, none of the Train Station's answers covers a Lighthouse plot (Review Focus).
  - `'a landmark gained on another player's turn is placed by that player (FAQ #2)'`: the `choosePlacement` belongs to the gainer, and `play()` with the current player's seat is refused (Review Focus).
  - `'R13: a landmark placed through the engine breaks a VP tie'`: two players are tied on VP, and one places the Lighthouse through `choosePlacement`. Under the current rules, `rankPlayers(state)` puts that player first.
- [ ] **Step 2: Run** `node --test tests/engine-capital.test.mjs`. Expected: FAIL, no operation kind `placeLandmark`.
- [ ] **Step 3: Implement** `placeLandmark`, the landmark branch of `choosePlacement`, and the registration.
- [ ] **Step 4: Migrate** the existing tests, then run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS, 0 errors and 0 warnings.
- [ ] **Step 5: Commit** `Refs #16: place landmarks, hanging off the edge or beside the mat`.

### Task 4: Scoring the capital

**Files:**
- Create: `src/lib/engine/effects/score-capital.js`
- Modify: `src/lib/engine/effects/index.js` (register `scoreCapital`), `tests/helpers/engine.mjs` (drop `'scoreCapital'` from `HANDOFF_EFFECTS`)
- Migrate: `engine-income` (the Symbology test now checks `capitalScored`), `engine-track-spaces` (Drone Assassins), and anything else the suite finds.
- Test: `tests/engine-capital.test.mjs`

**Interfaces:**
- Consumes: `cityPlots` and `completeLines` (Task 1), and `vp` from `effects/vp.js`.
- Produces: the `scoreCapital` effect handler. It emits `capitalScored { player, rows, columns }`, then calls `vp(ctx, player, rows + columns, op)`, which emits `vpGained`.

- [ ] **Step 1: Write the failing tests:**
  - `'scoreCapital scores 1 VP per complete row and column; impassable plots count as filled, plots off the grid do not'`: Grassland (mat 5) with buildings on (0, 0)–(0, 6) and a Lighthouse at `{ row: -1, col: 7, rotation: 0 }`, which covers (0, 7) and (0, 8), complete row 0. Buildings on (3, 0), (4, 0), (6, 0), (7, 0) and (8, 0) complete column 0, whose other plots are impassable. `capitalScored` is `{ rows: 1, columns: 1 }`, and the player gains 2 VP. Row −1 is not a row.
  - `'scoreCapital with nothing complete scores 0 VP and still says so'`: `capitalScored { rows: 0, columns: 0 }` is emitted, and `vp` is unchanged.
  - The 6-mat test from Task 2 ends with `scoreCapital` scoring 18 VP.
  - Migrated: `'income turn 2 scores the exposed VP icons: Barter counts tech cards, Symbology scores the capital'` and `'military 11 Drone Assassins: score the capital city …'`.
- [ ] **Step 2: Run** `node --test tests/engine-capital.test.mjs`. Expected: FAIL, `The scoreCapital effect isn't built yet.`
- [ ] **Step 3: Implement** the handler and its registration.
- [ ] **Step 4: Migrate**, then run `node --test tests/engine-*.test.mjs` and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `Refs #16: score complete rows and columns of the capital city`.

### Task 5: The scripted game's capitals, and the documents

**Files:**
- Modify: `tests/engine-scripted-game.test.mjs` (check each player's `capital.buildings` and `capital.landmarks` at the end, worked out by hand from the default answers; the VP stay F 0 and O 6 unless a row or column is completed, and if one is, explain why in a comment), `CLAUDE.md` ("Where the work stands": #16 done, with the design and plan paths, `city.js` and `placing.js` in the Architecture list, and "Next" updated)

- [ ] **Step 1: Write** the scripted game's end-of-game capital checks. Run `node --test tests/engine-scripted-game.test.mjs`. Expected: PASS.
- [ ] **Step 2: Update** `CLAUDE.md`.
- [ ] **Step 3: Run** `npm test` and `npm run check`. Expected: every test passes, and 0 errors and 0 warnings.
- [ ] **Step 4: Commit** `Refs #16: check the scripted game's capitals, and record #16 in CLAUDE.md`.

The GitHub checklists (the design's §11 lines on #18, #21, #24, #27, #28, #31 and #36, and ticking #16) and the final `Fix #16: …` commit happen after the whole-branch review, not in a task.
