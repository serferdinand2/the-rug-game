# Capital points, tiebreaks and income spaces from the engine (#128): design

Written 2026-10-28. #128 is a refactor the client scan (#80) filed. Decisions not taken from the issue are marked **(my call)**.

## 1. What and why

The client recomputes things the engine already computes: the Architects' capital points (`area/players.js` copies `score-capital.js`), the tiebreak values (`results.js`'s `scoreboard` copies `ranking.js`'s private `tiebreakValue`), which income spaces are exposed (`area/income.js` copies `income.js`'s `exposedSpaces`), the era (`PlayerTabs.svelte` copies `overview.js`) and a space's tier, four ways. If a rule changes in the engine, the player card or the scoreboard would disagree with the score.

**Done when** no client module recomputes these, and `npm run test:unit`, the simulation included, passes.

## 2. Scope on this branch

- **In:** the capital score, the tiebreak values, the exposed spaces and the era.
- **Left for after #85 and #86:** the tier part (`tierOf` as the one tier helper, `board.js`'s `tierSymbols(track, tier)`, `picks.js`'s tier lines and `Game.svelte`'s `priceSymbols`). `board.js` and `track-shape.js` are off limits while #85 reworks the track spaces, and `Game.svelte` belongs to #79; #86 moves `priceSymbols` out. So the branch ends with `Refs #128`.

## 3. The engine's exports (through `game.js`)

- `capitalScore(seat)` in `city.js` **(my call: next to `completeLines` and `uniformLines`)**: `{ rows, columns, uniform, vp }`, where `uniform` is the Architects' uniform complete lines (0 for anyone else) and `vp` the sum. A seat without a capital mat yet scores all zeros **(my call)**, so the client needs no setup guard. `scoreCapital` uses it, so the effect and the player card can't disagree.
- `tiebreakValues(seat)` in `ranking.js` **(my call: the values only, typed, rather than exporting `tiebreakValue(by, seat)` with its score)**: `{ tallestLandmark, resources }`, the tallest landmark's id in the capital (or null) and the resources held. `tiebreakValue` reads the same two helpers, so the ranking and the scoreboard compare the same values.
- `exposedSpaces(seat, row)`, already in `income.js`, is exported through `game.js`.

## 4. The client

- `area/players.js`: `capitalPoints` is `capitalScore(seat).vp`.
- `overview.js`: `lines` is `capitalScore(player).rows + columns`, which drops its own no-mat guard.
- `results.js`: `scoreboard`'s tiebreak code reads `tiebreakValues(seat)`; only that code changes, plus the import line.
- `area/income.js`: a space is covered when its index is past `exposedSpaces(seat, building).length`.
- `PlayerTabs.svelte`: the era comes from `selfSummary(game, seat)`; only that line and its import change.

Nothing on screen changes.

## 5. Tests

Engine: `capitalScore` for the Architects and anyone else, and with no mat (`engine-civs-setup`, `engine-capital`); `tiebreakValues` against the steps `rankPlayers` records (`engine-ranking`). Client: the existing `client-area-*`, `client-overview` and `client-results` tests, plus one that the scoreboard's values are the engine's. Then `npm run test:unit` with the simulation.
