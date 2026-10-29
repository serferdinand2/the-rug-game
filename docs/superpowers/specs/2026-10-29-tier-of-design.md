# A space's tier from one helper (#128, the tier part): design

Written 2026-10-29. This finishes #128. Its first part (the capital score, the tiebreak values, the exposed income spaces and the era) landed on 2026-10-28; see [its design](2026-10-28-engine-facts-design.md). The tier part waited for #85 (the track spaces) and #86 (the footer). Decisions not taken from the issue are marked **(my call)**.

## 1. What and why

A space's tier (three spaces under each price, I–IV) is worked out in five places today:

- the engine, twice in `engine/data/tracks.js`: the track builder (`Math.ceil((index + 1) / 3)`) and `advanceCost` (`Math.ceil(space / 3)`);
- `track-shape.js`' `tierOf`, which `Track.svelte` uses to light the hovered space's tier price;
- `picks.js`' `advanceModel`, for the payment lead "Tier II costs …";
- `turn.js`' `footerView`, for the selected space's price in the footer (it took this over from `Game.svelte`'s `priceSymbols` in #86).

If the tiers ever changed, the board, the footer and the payment prompt could name a different price from the one the engine charges.

`board.js` already exports `tierSymbols(track, tier)` (#86), and `trackBoard()` and the footer both use it, so that part of the issue is done.

**Done when** no client module works out a tier itself, and `npm run test:unit`, the simulation included, passes.

## 2. The one helper

- `tierOf(space)` lives in `engine/data/tracks.js`, next to `TIER_COSTS` and `advanceCost` **(my call)**. The tier is a rule of the track data, and that data module imports only `ids.js`, so it is outside the import cycle CLAUDE.md warns about; `board.js`, `picks.js` and `turn.js` already import from it directly.
- `TIER_SPACES = 3`, the spaces under one price, moves there too, and `tierOf` is `Math.ceil(space / TIER_SPACES)`.
- `tierOf` takes a space from 1 to 12 and returns `1 | 2 | 3 | 4`. Any other space throws a `RangeError`, as `advanceCost` does **(my call)**; the start (space 0) has no tier to look up, and the track builder sets its `tier: 0` itself as before. `track-shape.js`' old version returned 0 or 5 without a word; no caller ever passed those.
- The engine's track builder and `advanceCost` use it, so each space's `tier` field, the price the engine charges and what the client shows come from one function.
- `track-shape.js` re-exports `TIER_SPACES` and `tierOf` from the engine **(my call)**, so `Track.svelte` keeps its import and components still import nothing from the engine.
- `tierOf` is not added to `game.js` **(my call)**: like `advanceCost` and `TIER_COSTS`, it is track data that the client already reads from `engine/data/tracks.js`.

## 3. The client

- `picks.js`: `advanceModel`'s `tier` is `tierOf(option.to)`; only that line and the import line change, so #124's rewrite of the price words in `picks.js` merges cleanly.
- `turn.js`: the footer's price is `tierSymbols(track, tierOf(space))`, which drops the cast.
- `board.js`: `tierSymbols`' JSDoc names `tierOf`.

Nothing on screen changes.

## 4. Left as it is

- `engine/tech.js` (`TIER_SPACES = { 2: 4, 3: 7, 4: 10 }`, a tech card's requirement) and `engine/eras.js` (the first spaces 1, 4, 7 and 10 an era's landmark VP counts, R9) map a tier to its first space, the opposite question, inside the engine. They are not client copies, so #128 leaves them, and no game outcome changes **(my call)**.

## 5. Tests

- `engine-data`: `tierOf` gives 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4 for spaces 1–12, throws `RangeError` for 0 and 13, and every space's `tier` field is `tierOf(space)`.
- `track-shape`: its `tierOf` and `TIER_SPACES` are the engine's.
- `client-id-lists`: no client source file outside the engine divides a space by 3 to find its tier (`Math.ceil(… / 3)` or `/ TIER_SPACES`).
- The existing `client-picks`, `client-footer` and `client-board` tests show nothing else changed. Then `npm run test:unit` with the simulation, and the browser tests.
