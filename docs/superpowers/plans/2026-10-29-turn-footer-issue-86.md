# The turn footer as a screen part (#86) Implementation Plan

**Goal:** a tested `footerView()` decides every footer, `Game.svelte` renders one `TurnFooter`, and a tested helper sends the advance's two moves.

**Spec:** `docs/superpowers/specs/2026-10-29-turn-footer-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes; the footer's browser tests pass unchanged.
- Keep clear of Lazar's #85 (the track spaces): `trackBoard()` changes only where its tiers are built.

### Task 1: Tests first

- [ ] `tests/client-footer.test.mjs`: the 11 footers and `none`, and their details.
- [ ] `tests/client-board.test.mjs`: `tierSymbols`.
- [ ] `tests/client-api.test.mjs`: `sendAdvance`.
- [ ] The source guard for `Game.svelte`.
- [ ] Run them: FAIL.

### Task 2: The modules

- [ ] `tierSymbols` in `board.js`, used by `trackBoard()`.
- [ ] `footerView` in `turn.js`.
- [ ] `sendAdvance` in `moves.js`.

### Task 3: The screen

- [ ] `src/screens/game/TurnFooter.svelte`.
- [ ] `Game.svelte`: one `TurnFooter`, `selectSpace()`, `sendAdvance`; drop `priceSymbols`, `onlyIncome`, `incomeDescription`, `currentSeat`, `asked`, the three snippets and unused imports.

### Task 4: Verify

- [ ] `npx vitest run tests/client-footer.test.mjs tests/client-board.test.mjs tests/client-api.test.mjs tests/library.test.mjs`, `npm run check`.
- [ ] Browser: hotkeys, first-income, game, decision-prompt, pick-prompts, setup-prompts, track-text, results, dice-tray.
- [ ] Commit `Fix #86: …`.
