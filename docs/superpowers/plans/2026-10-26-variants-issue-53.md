# Optional variants (#53) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A table's creator can switch on five official variants, and the engine plays each one.

**Architecture:** `VARIANTS` lists `{ id, name }`; `checkOptions()` and `tableChoices()` read it. Each variant is a small check of `state.variants` at the one place its rule lives: setup (the tech deck, the start hexes), the income step and `gain` (the tapestry draft), `gainCiv` and `chooseCiv` (the civilization draft), and `offerBonus` (Nanotechnology).

**Tech Stack:** Node 22 ES modules with JSDoc, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-26-variants-design.md`

## Global Constraints

- The ids, verbatim: `tapestry-draft`, `civ-draft`, `neoprene-nanotechnology`, `no-radio-battery`, `closest-island`.
- Engine modules import only relative paths, never call `Math.random()`, and throw `PlayerError` for player mistakes.
- A game without variants deals and plays exactly as before: no new `random` call unless a variant is on.
- Prettier (tabs, single quotes), braces on every `if`, `npm run check` clean, `npm test` green.
- Commits say `Refs #53: …`; the last says `Fix #53: …`.

## Review Focus

- The tapestry draft when the deck and discards hold only 1 card: no question, the card is gained.
- The civilization draft when the deck holds 1 civilization and the discards 1: `drawCiv` keeps the last discard out, so 1 is drawn and gained without a question.
- The Mystics kept in a civilization draft: they discard themselves and a second draft follows.
- `closest-island` at 1 player: R40 still decides.
- A timeout on `chooseKeep` and on a mid-game `chooseCiv`: the first option is the default.

---

### Task 1: The variant list

**Files:** Modify `src/lib/engine/setup.js`, `rooms.mjs` (`tableChoices`). Test: `tests/engine-setup.test.mjs`, `tests/rooms.test.mjs`.

- [ ] Test: `VARIANTS` holds the five ids, in the spec's order, each with a non-empty `name`; `checkOptions({ version: 'current', variants: [all five] })` passes; `'draft'` is still refused with `Unknown variant: draft.`; `tableChoices().variants` deep-equals `VARIANTS.map(({ id, name }) => ({ id, name }))`.
- [ ] `VARIANTS` becomes the frozen `{ id, name }` list with the names from spec §3; `checkOptions` checks `VARIANTS.some((v) => v.id === variant)`; `tableChoices` maps it; its JSDoc return type says `{ id: string, name: string }[]`.
- [ ] Commit.

### Task 2: `tapestry-draft`

**Files:** Create `src/lib/engine/decisions/choose-keep.js`. Modify `effects/gain.js`, `income.js`, `kinds.js`. Test: `tests/engine-variants.test.mjs` (new).

- [ ] Tests: with the variant, income turn 1 draws 2 cards into the hand and opens `chooseKeep` with both as `options`; answering keeps one, discards the other to `supply.tapestry.discard` with a `cardsDiscarded` event; the answers are the two cards, first drawn first; another seat's view has no `options`; without the variant, income turn 1 draws 1 and asks nothing; income turn 2 draws 1 with the variant on; a deck and discards holding 1 card gain it without a question; a `tapestryGained` trigger fires with only the kept card.
- [ ] `gain` accepts `keep`: after drawing, if more than `keep` cards were drawn, it pushes `{ player, kind: 'chooseKeep', options: cards, keep }` instead of the triggers; otherwise the triggers as now.
- [ ] `chooseKeep` (hidden `options`; answers `options.map((card) => ({ card }))`; `check` refuses a card not in `options`; `resolve` discards the others from the hand and pushes `triggered(state, 'tapestryGained', { player, cards: [card] })`). Only `keep: 1` is needed; the decision checks `keep === 1`.
- [ ] `incomeStep` on income turn 1, with the variant: each `gain` with `tapestry: n` becomes `tapestry: n + 1, keep: n`.
- [ ] Commit.

### Task 3: `civ-draft`

**Files:** Modify `civ-turns.js` (`gainCiv`), `decisions/choose-civ.js`. Test: `tests/engine-variants.test.mjs`.

- [ ] Tests: with the variant, `gainCiv` draws 2 and opens `chooseCiv` with `midGame: true`; answering gains the kept one (`civGained`, then its mid-game `civSetup`) and puts the other on `supply.civDiscard` with `civDiscarded`; another seat's view has no `options`; 1 civilization left is gained without a question; none left gives `noCivLeft`; without the variant, nothing changes; keeping the Mystics discards them and opens a second draft.
- [ ] `gainCiv` with the variant draws up to 2 with `drawCiv`; 2 push `chooseCiv { options, midGame: true }` and emit `civsDrawn { player, count: 2, secret: { civs } }`; 1 is gained as now.
- [ ] `chooseCiv.resolve` with `midGame` gains the answer as `gainCiv` does (shared helper `gainDrawn(ctx, player, civ)` in `civ-turns.js`) and discards the other; its error message for a mid-game draft reads "Choose one of the two civilizations you drew."
- [ ] Commit.

### Task 4: `neoprene-nanotechnology` and `no-radio-battery`

**Files:** Modify `decisions/choose-bonus.js`, `data/tracks.js` (comment only), `decks.js`, `setup.js`, `tests/helpers/invariants.mjs`. Test: `tests/engine-variants.test.mjs`.

- [ ] Tests: with `neoprene-nanotechnology`, Nanotechnology's `chooseBonus` has `cost: { tech: 2 }` and paying 2 tech cards gives 10 VP; without it, `cost: { tech: 3 }`; `techDeck([])` equals `BASE_TECH`; `techDeck(['no-radio-battery'])` is `BASE_TECH` without `radio` and `lithium-ion-battery`; a game with the variant holds 31 tech cards in deck and display, neither of the two; `checkState` passes on it.
- [ ] `offerBonus` reads the bonus through `bonusOf(state, track, space)`, which swaps Nanotechnology's cost to `{ tech: 2 }` with the variant.
- [ ] `techDeck(variants)` in `decks.js`; `createGame` shuffles `techDeck(variants)`; invariants compare against `techDeck(state.variants)`.
- [ ] Commit.

### Task 5: `closest-island` (R110)

**Files:** Modify `setup.js` (`dealCapitals`). Test: `tests/engine-variants.test.mjs`.

- [ ] Tests: islands `ISLANDS.large` are capitals 1–6's large start hexes in number order and `ISLANDS.small` are `-2_-2`, `0_2`, `2_0`; for 2–5 players, with `random` fixed so r = 0, the outposts start on islands ⌊i·k/n⌋ (4 players: `-3_-3`, `-3_0`, `3_3`, `3_0`); with r = 1 they shift by one; the dealt capital mats are unchanged; 1 player starts on `0_2` (R40); without the variant, a fixed seed deals exactly the same game as before (deepEqual against a game created with no `variants` option).
- [ ] `ISLANDS` (exported from `setup.js`) and the assignment in `dealCapitals`, calling `random(k)` once, after the mats are shuffled, only with the variant and more than 1 player.
- [ ] Commit.

### Task 6: Simulation and documents

**Files:** Modify `tests/helpers/simulation.mjs`, `README.md` (R110, the rule count, the status line if it names variants), `CLAUDE.md`, `docs/superpowers/specs/2026-10-20-the-rug-game-design.md`, `docs/superpowers/specs/2026-10-24-base-game-data-design.md` (the effect table: `keep` on `gain`).

- [ ] `gameOf(index)` adds `variants`: all five when `Math.floor(index / 20) % 2 === 1`, else none; `playGame` passes them to `createGame`; the failure message names them.
- [ ] `node --test tests/simulation.test.mjs` passes; `npm run check` and `npm test` pass.
- [ ] R110 in the setup rules; the design document records the variants; CLAUDE.md gets the #53 entry and loses #53 from "Next".
- [ ] Commit `Fix #53: …`.
