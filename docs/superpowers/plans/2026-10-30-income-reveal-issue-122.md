# The income reveal as its own component (#122) Implementation Plan

**Goal:** `TurnBar` has no income-specific rules; `IncomeReveal` draws the folding Take income, passed into `TurnBar` as a snippet.

**Spec:** `docs/superpowers/specs/2026-10-30-income-reveal-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes, reduced motion included; the optional tone and its props stay (§4 of the spec).

### Task 1: Tests first

- [ ] `tests/client-footer.test.mjs`: `income.folded` on the selected space and the turn choice.
- [ ] The source guard for `TurnBar.svelte` and `TurnFooter.svelte`.
- [ ] Run them: FAIL.

### Task 2: The component

- [ ] `src/lib/components/prompts/IncomeReveal.svelte`, with the CSS moved from `TurnBar`.
- [ ] `TurnBar`: a `reveal` snippet in the label's group; drop `income`, `onTurnBarIncome`, `showIncome` and the reveal's CSS.
- [ ] `footerView`: `folded` in `income`; `FooterView`'s typedef.
- [ ] `TurnFooter`: the `IncomeReveal` snippet.

### Task 3: The library

- [ ] `src/library/sections/prompts/IncomeReveal.svelte` and a row in `src/lib/components/README.md`.
- [ ] TurnBar's section passes the reveal; its README row.
- [ ] `tests/browser/library.test.mjs` looks for `.rg-income-reveal`.

### Task 4: Verify

- [ ] `npm run test:unit`, `npm run check`.
- [ ] Browser (after merging): library, first-income, hotkeys, game.
- [ ] Commit `Fix #122: …`.
