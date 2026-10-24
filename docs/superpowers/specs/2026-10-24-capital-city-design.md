# Capital city placement and district rewards (#16): design

Written 2026-10-24. This is the fifth rules-engine issue. It plugs into the #13 core, #14's advance turns and #15's income turns. It builds the two placement operations #14 pushes, `placeBuilding` and `placeLandmark`, and the `scoreCapital` effect. It also fills `seat.capital.landmarks`, which #15's tiebreak reads.

Items marked **(my call)** are decisions I made that the owner has not confirmed. The owner confirmed the rest in the brainstorm on 2026-10-24:
- a piece with only **one legal place** is placed automatically, without asking;
- placement, district rewards and scoring work as played back in §5–§9.

As in #13–#15, Board Game Arena (`elaskavaia/bga-tapestry`) is the prior art, and the engine is designed on its merits.

## 1. What and why

Every income building and landmark a player gains goes into their capital city, a 9×9 grid of plots in nine 3×3 districts. Filling the last open plot of a district gives 1 resource of the player's choice. Some scoring counts complete rows and columns. The tallest landmark in the city breaks ties under the current rules.

Until now, a gained building or landmark stopped at its placement and threw an `Error` naming it. After #16, it is placed for real.

## 2. Goals

1. A gained income building goes on an open plot of the player's choosing (01 §6.1, FAQ #22).
2. A gained landmark goes on the grid in any of its four rotations (R15). It covers only open plots and at least one grid plot, and it may hang off the edge (R14).
3. A piece with no legal place goes beside the mat. It is still the player's (FAQ #21, R14).
4. A piece with only one legal place is placed automatically (owner).
5. Filling the last open plot of a district gives 1 resource of the player's choice, once per district (01 §6.1).
6. `scoreCapital` gives 1 VP per complete row and per complete column (01 §6.1).
7. `seat.capital.landmarks` lists exactly the landmarks covering at least one grid plot (R13), for the tiebreak (R11).

## 3. Non-goals and anti-goals

- **Non-goals.** These are handed off (§11):
  - the interface for placing, showing an overhanging landmark, and showing pieces beside the mat: #27 and #28;
  - undoing a placement: #24;
  - where the Automa's and the Shadow Empire's landmarks go (R42): #31;
  - the advanced capital mats and their special plots and scoring (R51, R52, R88): #36;
  - landmarks that go somewhere other than the city, such as City in a Bottle or Nomads (R13): their expansion issues.
- **Anti-goals.** Any of these counts as failure:
  - a piece on an impassable plot, on another piece, or covering no grid plot;
  - a mirrored landmark (R15);
  - a player allowed to set a piece aside while it still fits (FAQ #22);
  - a district reward paid twice, or not at all;
  - a plot off the grid counted in a row, column or district.

## 4. The state

`seat.capital` changes from `{ mat, landmarks: string[] }` to:

```js
capital: {
	mat: 3,                                          // as before
	buildings: [{ building: 'farm', row: 4, col: 2 }],  // in placement order
	landmarks: [{ landmark: 'lighthouse', row: -1, col: 7, rotation: 1 }],
}
```

- **`row` and `col`** are the top-left corner of the piece's turned shape, as in the interface's `PlacedPiece` (`src/lib/placement.js`). A landmark's `row` or `col` may be negative, or so large that its shape runs past row or column 8, when it hangs off the edge.
- **`rotation`** is quarter turns clockwise, 0–3, as `rotateFootprint()` and `LandmarkPiece` use it.
- **`capital.landmarks`** is now the list of placed landmark pieces, not of ids. Every landmark on it covers at least one grid plot (R14), so it is exactly R13's list. `landmarksInCity(seat)` in `ranking.js` returns their ids, so the tiebreak reads it as before. **(my call:** one list, rather than an id list beside a piece list that says the same thing.)
- **`seat.besideMat`** now holds the ids of landmarks *and* income buildings that didn't fit, in the order they went there, such as `['farm', 'tank-factory']`. "Per farm" counts already come from the income mat (R71), so this list is for the interface and #21's accounting. **(my call)**
- **The plots are worked out, not stored.** `cityPlots(seat)` returns all 81 plots, row by row, as the interface's `PlotKind`: `'blocked'` for impassable, `'farm'`, `'house'`, `'market'` or `'armory'` for a building, `'landmark'` for a plot under a landmark, and `'empty'`. It reads the mat's grid (`CAPITAL_MATS`), then the buildings, then the landmarks' on-grid plots. #27 can hand it straight to `CapitalGrid`. **(my call:** derived, so the plots can never disagree with the pieces.)
- **Off the grid**, the plots a landmark's overhang covers are worked out from `capital.landmarks` too. `cityPlots()` only holds the 81 grid plots, so the legality check (§6) reads both.
- `setup.js` starts every player with `capital: { mat: null, buildings: [], landmarks: [] }`.
- Nothing about the capital is private, so `view()` doesn't change.

The geometry comes from the shared modules: `GRID_SIZE`, `plotIndex`, `rotateFootprint` and `groupsOf` from `src/lib/capital.js`, and the footprints from `src/lib/art/footprints.js` (`FOOTPRINTS`, all 33, so expansion landmarks need nothing new). The engine imports them by relative path, as `data/capitals.js` already does. `capital.js`'s `fits()` refuses overhang, so the engine has its own legality check.

## 5. Placing an income building

`placeBuilding { player, building }` is an automatic operation. The `building` effect (#14) has already taken the building off the income mat.

1. The legal places are the plots `cityPlots()` shows as `'empty'`, in reading order (row by row, then column by column).
2. **None:** the building goes beside the mat. `besideMat` gets its id, and `placedBesideMat { player, building }` is emitted.
3. **Exactly one:** it goes there automatically (§8).
4. **More:** `choosePlacement { player, building }` asks where (§7).

## 6. Placing a landmark

`placeLandmark { player, landmark }` is an automatic operation. #14 pushes it when a player is first into a tier, before the space's benefit (FAQ #1). #18 pushes the same operation for the tech-card landmarks.

1. **A legal place** is a rotation (0–3) and a top-left corner `(row, col)` where the turned footprint:
   - covers at least one grid plot (R14);
   - covers only `'empty'` plots wherever it is on the grid;
   - covers no off-grid plot that another landmark's overhang already covers. Two miniatures can't stand in the same spot. **(my call:** R14's "sits only on open plots", read physically; the rules don't say.)

   So `row` runs from `1 − height` to 8 and `col` from `1 − width` to 8, where height and width are the turned shape's.
2. **Overhang is always allowed**, even when the landmark would fit inside (R14). Its plots off the grid belong to no row, column or district.
3. **Mirrors are never offered** (R15). Only the four rotations of the footprint as printed are offered.
4. **None:** the landmark goes beside the mat. `besideMat` gets its id, `placedBesideMat { player, landmark }` is emitted, and it stays off `capital.landmarks`, so it doesn't count for the tiebreak (R13). It stays beside the mat even if room opens later. **(my call)**
5. **One place:** if every legal answer covers the same plots, on and off the grid, the landmark goes there automatically (§8). This includes a square landmark with one open 2×2 spot: its four rotations cover the same plots, so it goes in unturned. Turning it only turns the picture. **(my call**, following the owner's "only one place")
6. **More:** `choosePlacement { player, landmark }` asks where (§7).

## 7. The placement decision

`choosePlacement` is one decision kind for both buildings and landmarks, so the interface has one placement flow. **(my call)**

| | Building | Landmark |
|---|---|---|
| Fields | `building` | `landmark` |
| Answer | `{ row, col }` | `{ row, col, rotation }` |
| Order of `answers()` | open plots in reading order | fully on the grid first, then rotation 0–3, then row, then col |
| Default (the first answer) | the first open plot from the top left | the first unturned spot fully on the grid from the top left |

- **The default** is what #24's timeout takes: the first open spot from the top left, unturned and fully on the grid (owner, playback). If no unturned spot is fully on the grid, the order above picks a turned one, then an overhanging one. **(my call)**
- **`hidden`** is empty. Placement is public.
- **`check()`** throws a `PlayerError` for:
  - a missing or non-integer `row` or `col`, or a `rotation` outside 0–3;
  - a building placed off the grid, or a building answer with a `rotation`;
  - a plot that isn't open: "That plot isn't open.";
  - an overhang onto another landmark's overhang: "Another landmark is already there.";
  - a landmark that covers no plot of the city: "A landmark must cover at least one plot of your city.".
- **`resolve()`** places the piece (§8).
- **There is no "skip" answer.** A piece that fits must be placed (FAQ #22).
- **One at a time.** Several pieces gained together are placed in the order they were pushed. Each operation works out its legal places only when it runs, after the pieces before it are placed. #14 pushes the landmarks lowest tier first (R9), then the benefit, so the landmark comes before any building from that benefit (FAQ #1).
- **On an opponent's turn.** The decision belongs to the player who gained the piece, whoever's turn it is (FAQ #2).

## 8. Placing a piece, and district rewards

Placing a piece, chosen or automatic:

1. Notes which districts are complete.
2. Adds the piece to `capital.buildings` or `capital.landmarks`.
3. Emits `buildingPlaced { player, building, row, col, automatic }` or `landmarkPlaced { player, landmark, row, col, rotation, automatic }`. `automatic` is true when nobody was asked, so the log can say why. **(my call)**
4. **District rewards.** A district is complete when none of its 9 plots is `'empty'`; impassable plots count as filled (01 §6.1). If the piece completes n districts (a landmark can complete several), it:
   - emits `districtsCompleted { player, districts }`, with the districts numbered 0–8 in reading order;
   - pushes one `effects` operation `[{ gain: { any: n } }]`, so the player picks all n resources in one `chooseResource`. Resources stop at 8, as for every gain.

   The reward sits on top of whatever waits under the placement. That means it comes before the space's benefit and bonus, so it can pay the bonus (FAQ #1).

No district, row or column of any basic mat is complete at the start: every one has at least 3 open plots.

## 9. Scoring the capital

`scoreCapital` is the effect `{ scoreCapital: {} }`. It is used by Symbology, Writing and Email on income turns 2–5, by Drone Assassins, and by one space tile.

- It counts the complete rows and complete columns of `cityPlots()`. A line is complete when none of its 9 plots is `'empty'`; impassable plots count as filled.
- It emits `capitalScored { player, rows, columns }`, then gains `rows + columns` VP through the `vp` handler, which emits `vpGained`.
- It scores 0 VP when nothing is complete, and still emits `capitalScored`.
- It is for basic mats. #36 makes it read the mat, for Cavern's row values (R51) and the like.

## 10. Decisions and events

| Decision | Fields | Answer | Default |
|---|---|---|---|
| `choosePlacement` | `building` or `landmark` | `{ row, col }`, plus `rotation` for a landmark | §7 |

| Event | Fields |
|---|---|
| `buildingPlaced` | `player`, `building`, `row`, `col`, `automatic` |
| `landmarkPlaced` | `player`, `landmark`, `row`, `col`, `rotation`, `automatic` |
| `placedBesideMat` | `player`, and `building` or `landmark` |
| `districtsCompleted` | `player`, `districts` |
| `capitalScored` | `player`, `rows`, `columns` |

`buildingGained`, `noBuildingLeft` (#14) and `landmarkGained` (#14) stay as they are.

## 11. What the other issues take over

Their checklists get these lines.

| Issue | Takes over |
|---|---|
| #18 | The tech-card landmarks (Bakery, Barn, Com Tower, Library, Stock Market, Treasury) push `placeLandmark { player, landmark }`, after taking the landmark from `state.landmarks`. |
| #21 | Account for every income building (on the income mat, in `capital.buildings` or in `besideMat`, 5 of each type per player) and every landmark (in `state.landmarks`, a capital or `besideMat`). |
| #24 | Undoing a placement within the turn. |
| #27 | The Capital tab draws `cityPlots()` and `capital.landmarks`, including a landmark that hangs off the edge, and the pieces in `besideMat`. `src/lib/capital.js` and `src/lib/placement.js` assume pieces inside the grid today. |
| #28 | The prompt for `choosePlacement`, driven by its `answers`. |
| #31 | What `placeLandmark` does for the Automa and the Shadow Empire (R42). Until then it throws, since it needs a player seat. |
| #36 | Advanced mats: their special plots in `cityPlots()`, mats that forbid overhang (R14), plots that can be built over (R52), and scoring per mat (R51). |

## 12. Tests

New tests, written first:

- **All 6 basic mats** (`tests/engine-capital.test.mjs`). On each mat, buildings are placed one by one on every open plot through real `placeBuilding` operations. Each district's reward arrives exactly when its last open plot fills: 9 rewards in all, none early. At the end, `scoreCapital` scores 18 VP.
- **Legality.** Impassable plots and occupied plots are never in `answers()`, and `check()` refuses them with a `PlayerError`. Every answer from `answers()` passes `check()`.
- **Overflow.**
  - A landmark hanging off the edge covers only its on-grid plots. Those count for districts, rows and columns; its other plots count for nothing.
  - An answer covering no grid plot is refused.
  - Two landmarks can't overlap off the grid: a Barracks at (−1, 1) is refused beside a Lighthouse at (−1, 0).
  - A landmark with no legal place goes beside the mat, stays off `capital.landmarks`, and doesn't count for the tiebreak.
  - An income building on a full grid goes beside the mat, and "1 VP per farm" still counts it (R71).
- **Rotation.**
  - All four rotations of an asymmetric landmark are offered and cover the expected plots.
  - A chiral footprint (Birdwatching Perch) is never offered mirrored.
- **Automatic placement.**
  - A building with one open plot is placed without a decision.
  - A square landmark with one 2×2 spot goes in unturned.
  - A landmark with two places is asked about.
  - All three emit `automatic` correctly.
- **District rewards.**
  - A landmark completing two districts gives one `chooseResource` for 2.
  - A district completed by the landmark pays that space's bonus (FAQ #1).
- **Several at once.** Two landmarks gained together are placed in order, and the second's answers reflect the first.
- **Scoring.** `scoreCapital` on a hand-built city counts rows and columns, with impassable plots filled and off-grid plots ignored.
- **The tiebreak.** Two players tied on VP are separated by a landmark placed through the engine, not set by hand.
- **View.** A player's own `choosePlacement` carries its answers in `view()`, and nobody else's does.

Existing tests that change:

- `tests/helpers/engine.mjs` stops standing in for `placeBuilding`, `placeLandmark` and `scoreCapital`. `stubHandoffs()` throws once they're built, so this must happen.
- Tests that expected those stand-ins now see the real thing: an open `choosePlacement`, a placed piece, or `capitalScored`. They are `engine-track-spaces`, `engine-counters` (its "until #16" test goes), `engine-order`, `engine-movement`, `engine-research`, `engine-income` (Symbology now scores) and `engine-ranking` (`capital.landmarks` holds pieces).
- `engine-scripted-game` answers the new placements (O's armory in step 8, the Barracks in step 12) and checks the capitals at the end.

## 13. Files

```
src/lib/engine/
  city.js                       cityPlots, the legal places, placing a piece, district rewards, complete lines; placeBuilding and placeLandmark
  decisions/choose-placement.js the placement decision
  effects/score-capital.js      the scoreCapital effect
  kinds.js                      registers choosePlacement, placeBuilding and placeLandmark
  effects/index.js              registers scoreCapital
  state.js                      the new capital and besideMat types
  setup.js                      the new starting capital
  ranking.js                    landmarksInCity returns ids from the pieces
```

The builder may split `city.js` if it grows too long.

## 14. Documentation

In the same pull request:
- CLAUDE.md's "Where the work stands";
- the #16 checklist, and the §11 lines on #18, #21, #24, #27, #28, #31 and #36;
- the state typedefs in `state.js`.

The interface doesn't change, so the README's "Current interface" stays as it is.
