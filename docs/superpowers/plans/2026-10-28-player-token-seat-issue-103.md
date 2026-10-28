# PlayerToken takes a seat (#103) Implementation Plan

**Goal:** `PlayerToken` takes a `seat`, and the pass screen, the standings and the scoreboard draw their tokens with it.

**Spec:** `docs/superpowers/specs/2026-10-28-player-token-seat-design.md`

## Global Constraints

- Pixel-identical: each token keeps its size, empty `alt` and pixelated rendering.
- `ProgressLanes.svelte` is off-limits until #85 lands; it stays a raw `<img>`.
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
