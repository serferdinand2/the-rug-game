# Prices and resource amounts in words (#124) Implementation Plan

**Goal:** One tested function puts a price into words, every amount has its plural, and "any" reads one way.

**Spec:** `docs/superpowers/specs/2026-10-28-price-words-design.md`

## Global Constraints

- docs/conventions.md throughout: JSDoc, Prettier on the changed files only, braces, `npm run check` clean.
- Tests first: watch each new test fail, then pass.
- Commits reference the issue; the plural commit's body also says `Refs #84`.

### Task 1: The three helpers

**Files:** `src/lib/describe.js`, `tests/client-describe.test.mjs`.

- [ ] Write the failing tests for `amountWords`, `resourceName` and `priceWords` (plurals, "any", an empty price, order of first appearance).
- [ ] Rename the private `amount(n, key)` to the exported `amountWords(id, n)`; add `resourceName` and `priceWords`. Run: PASS.

### Task 2: The components use them

**Files:** `CostBox.svelte`, `ResourceIcon.svelte`, `ResourceChip.svelte`, `ResourceRows.svelte`. `TierPrice.svelte` is in #85's zone: it switches to `priceWords` after #85.

- [ ] Replace CostBox's price algorithm with `priceWords`, and every `RESOURCES.find(…)?.name` with `resourceName`; `ResourceChip`'s label with `amountWords`.
- [ ] `npm run check`; `tests/library.test.mjs`.
- [ ] Commit `Refs #124: one function puts prices into words`.

### Task 3: The pick prompts' plurals

**Files:** `src/lib/picks.js`, `tests/client-picks.test.mjs`.

- [ ] Write the failing test: gaining two coins says "You gain 2 coins.", and the cap warning says "2 coins would be lost."
- [ ] `resourceWords`, `costWords`, `shortWords` and the lost amounts use `amountWords`. Run: PASS.
- [ ] Browser: `setup-prompts`, `pick-prompts`, `player-area`.
- [ ] Commit `Refs #124: every amount the pick prompts print has its plural` (body: `Refs #84`). `Refs`, not `Fix`: TierPrice's switch waits for #85.

### Task 4: TierPrice after #85 (2026-10-29)

**Files:** `src/lib/components/board/TierPrice.svelte`, `tests/client-game-names.test.mjs`, `tests/browser/setup-prompts.test.mjs`.

- [x] Write the failing test: `TierPrice` loses its exemption from the source guard, which also rejects `RESOURCES.find(` and "resource(s) of any type". Run: FAIL on `TierPrice`'s hand-joined list.
- [x] `TierPrice` labels itself `Tier ${numeral} costs ${priceWords(symbols)}` and drops its copy. Run: PASS.
- [x] Browser: `setup-prompts` checks the first tier's label, "Tier I costs 1 resource of your choice".
- [x] `npm run check`, `npm run test:unit`, `npm run test:e2e`.
- [x] Commit `Fix #124: TierPrice says its price with priceWords`.
