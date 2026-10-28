# Capital points, tiebreaks and income spaces from the engine (#128) Implementation Plan

**Goal:** The client reads the capital score, the tiebreak values and the exposed income spaces from the engine, and the era from `selfSummary`.

**Spec:** `docs/superpowers/specs/2026-10-28-engine-facts-design.md`

## Global Constraints

- docs/conventions.md throughout; the engine stays pure; engine exports go through `game.js`.
- Don't touch the #85 zone (`board.js`, `glyphs.js`, `track-shape.js`, the track components) or `Game.svelte`; the tier part waits for #85 and #86.
- `results.js`: only `scoreboard()`'s tiebreak code and the import line. `PlayerTabs.svelte`: only the era line and its import.
- Commits are `Refs #128: …`.

### Task 1: capitalScore

**Files:** `src/lib/engine/city.js`, `effects/score-capital.js`, `game.js`; tests in `engine-civs-setup` and `engine-capital`.

- [ ] Failing tests: `capitalScore` gives the Architects' uniform lines, 0 for anyone else, and zeros with no mat.
- [ ] Add it; `scoreCapital` uses it; export it. PASS.

### Task 2: tiebreakValues

**Files:** `src/lib/engine/ranking.js`, `game.js`; test in `engine-ranking`.

- [ ] Failing test: `tiebreakValues` gives the values `rankPlayers` records.
- [ ] Add it over two helpers that `tiebreakValue` shares; export it. PASS.

### Task 3: exposedSpaces through game.js, and the client

**Files:** `game.js`, `area/players.js`, `area/income.js`, `overview.js`, `results.js`, `PlayerTabs.svelte`; tests in `client-results`, `client-area-income`.

- [ ] Failing tests: the scoreboard's values are the engine's; `exposedSpaces` is exported and `incomeRows` agrees with it.
- [ ] Switch each client module. PASS; `npm run check`.
- [ ] `npm run test:unit` (the simulation included); browser `player-area`, `results`.
- [ ] Commit `Refs #128: …` (the tier part waits for #85 and #86).
