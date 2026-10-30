# The engine's options decide where a landmark moves on CapitalGrid (#112): design

Written 2026-10-30. #112 is in M13 · Refactor (Capital and map), after #111 gave LandmarkPiece its own drag data, focus and keys. Every decision here is **(my call)** unless marked; the issue gave the shape.

## 1. What and why

`placement-targets.js` says the engine's answers are the only legal places, yet `CapitalGrid` moved, turned and outlined an unlocked landmark by its own in-grid fit check, and `PlayerTabs` re-snapped every move to the nearest option afterwards. The grid's check refuses every position over the edge, which R14 allows, so an arrow key toward an edge where only an overhanging place is legal did nothing. Example: a Lighthouse at row 6, column 5 of the Mountain mat, pressed right; columns 6 and 7 cover the impassable plot at row 7, column 7, and column 8 hangs over the edge.

**Done when** moving, turning and dropping a landmark land only on the engine's places, overhanging ones included; the grid's geometry lives in `placement.js` and `capital.js` with Vitest tests; and the capital browser tests pass.

## 2. `positions`

`CapitalGrid` takes `positions`: the engine's legal top-left corners and turns, `{ row, col, rotation }[]`, or `null` (the default).

- **Given:** an unlocked piece moves, turns, snaps on a drop and lights the grid's legal-drop outline only among them. `PlayerTabs` passes `landmarkPositions(placement.options)` through `CapitalCity` (#94), which hands them to the grid.
- **Null:** the grid keeps today's in-grid fit check (`fitsAt`, `snapPiece`, `stepPiece`, `rotatePiece`). The component library uses it, as the issue asks.

The move and rotate events now carry a position from the list exactly, so `PlayerTabs` finds its option with `optionAt` instead of re-snapping with `legalNear` and `nextRotation`. `nextRotation` goes; `turnAmong` does its job on positions. A drop from the tray and a plot click still snap through `placeNear` and `legalNear`, which read the options and know the tray piece's turn.

The dragged corner is no longer clamped to the grid, so a drop near an edge can reach an overhanging place. `onCapitalGridDrop`'s row and column may now be off the grid; both callers snap them.

## 3. The geometry

`placement.js`:
- `fitsAt(plots, pieces, piece, row, col)`: the fallback's check, with the other pieces' plots filled; it replaces the grid's own copy of `othersFilled` and `fits`.
- `snapAmong(positions, rotation, row, col)`: the position of that turn nearest (row, col), by squared distance, a tie going to the earlier one.
- `stepAmong(positions, piece, dRow, dCol)`: the nearest position of the piece's turn straight along the arrow, hopping over gaps as `stepPiece` does; when there is none, the nearest one ahead of it, fewest plots along, then fewest across. Null when nothing is ahead.
- `turnAmong(positions, piece)`: the next legal turn (+1, +2, +3) nearest the same corner, as `nextRotation` did on options.
- `overhangReach(pieces)`: how many plots the pieces hang over each edge, at most.
- `overhangOffset(plots, span)`: the CSS length a piece reaches past its area (the grid's `overhang`).
- `plotFromPointer(pointer, first, next)`: the plot under a pointer, in fractions of a plot, from the boxes of plot 0 and plot 10.

`capital.js` gets `plotPosition(index)`, the inverse of `plotIndex`; the grid's click handler and target labels use it.

`placement-targets.js` gets `landmarkPositions(options)` and `optionAt(options, position)`.

## 4. Tidying in CapitalGrid

- The 9s go: the label and the margin use `GRID_SIZE`, and the CSS grid takes `repeat(var(--rg-capital-grid-size), …)` from a `style:` directive.
- The building `||` chain reads the engine's `BUILDING_IDS`.
- The four identical `background: var(--surface)` rules become one rule with four selectors.

Nothing on screen changes. LandmarkPiece is untouched (#110 extracts its shape in parallel).

## 5. Tests

- **Vitest, `tests/placement.test.mjs`:** `fitsAt`, `snapAmong`, `stepAmong` (straight, hopping, over the edge, the nearest-ahead fallback, null), `turnAmong`, `overhangReach`, `overhangOffset`, `plotFromPointer`.
- **Vitest, `tests/capital.test.mjs`:** `plotPosition` round-trips `plotIndex`.
- **Vitest, `tests/client-area-placement.test.mjs`:** `landmarkPositions` and `optionAt`; on a real game's options, every step and turn among the positions is an option, and an arrow toward the edge reaches an overhanging one.
- **Playwright, `tests/browser/library.test.mjs`:** a new library example, a Lighthouse at row 6, column 5 with positions that include row 6, column 8: the right arrow moves it over the edge.
