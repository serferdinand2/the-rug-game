# PlayerToken takes a seat (#103) Implementation Plan

**Goal:** `PlayerToken` takes a `seat`, and the pass screen, the standings, the scoreboard and (after #85) the progress lanes draw their tokens with it.

**Spec:** `docs/superpowers/specs/2026-10-28-player-token-seat-design.md`

## Global Constraints

- Pixel-identical: each token keeps its size, empty `alt` and pixelated rendering.
- `ProgressLanes.svelte` was off-limits until #85 landed; Task 3 finishes it.
- Only the two typedefs change in `results.js` (another stream edits `scoreboard()`).
- Conventions: JSDoc, Prettier on the changed files only, `npm run check` clean.
- Commits: `Refs #103: …` (ProgressLanes is left over).

### Task 1: The guard test

**Files:** `tests/library.test.mjs`.

- [ ] "every player token is a PlayerToken (#103)": no component but `PlayerToken` builds a token's URL or reads `PLAYER_ART_COLORS`; `ProgressLanes` is the named exception. Run: FAIL on `PassScreen`, `StandingRow` and `ScoreBoard`.

### Task 2: The seat prop and the three places

**Files:** `src/lib/components/player/PlayerToken.svelte` and its library section, `ui/PassScreen.svelte`, `results/StandingRow.svelte`, `log/ScoreBoard.svelte`, `src/lib/results.js`, `src/lib/components/README.md`.

- [ ] `PlayerToken` gains `seat`; the section shows seats 1–5.
- [ ] The three components draw `PlayerToken` with their seat; their `img` rules and `any` casts go.
- [ ] `StandingRow.seat` and `ScoreRow.seat` are `Seat`.
- [ ] The library test passes; `npm run check` clean; `pass-screen` and `results` browser tests pass.
- [ ] Commit `Refs #103: …`.

### Task 3: ProgressLanes, after #85 (2026-10-30)

**Files:** `tests/library.test.mjs`, `src/lib/components/board/ProgressLanes.svelte` (the token and its rule only; #120 works on the board in parallel).

- [x] Drop `TOKENS_LEFT` from the guard test. Run: FAIL on `ProgressLanes`.
- [x] The marker draws `<PlayerToken class="rg-progress-lanes--token" seat={lane.seat} decorative />`; its rule goes `:global` under the marker and loses `object-fit` and `image-rendering`, which `PlayerToken` sets; `playerPieceUrl` leaves the imports.
- [x] The guard passes; `npm run check` clean; `npm run test:unit` passes. Browser test covering it: `tests/browser/library.test.mjs` (#72's token-on-the-line test), run by the coordinator.
- [x] Commit `Fix #103: …`.
