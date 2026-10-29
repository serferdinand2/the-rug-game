# One reduced-motion check and one tumble timing (#119) Implementation Plan

**Goal:** one function asks for reduced motion, and the dice tumble's length is written once.

**Spec:** `docs/superpowers/specs/2026-10-29-motion-check-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [ ] `tests/client-sound-motion.test.mjs`: `prefersReducedMotion` (matches, doesn't, no `matchMedia`, no window), `msOf`, and the source guard.
- [ ] Run it: FAIL.

### Task 2: The modules

- [ ] `prefersReducedMotion` and `msOf` in `src/lib/motion.js`; `TUMBLE_MS` in `src/lib/dice.js`.

### Task 3: The components

- [ ] `Die` sets `--rg-die-tumble` from `TUMBLE_MS`; `DiceTray` uses `prefersReducedMotion`, `TUMBLE_MS` and the token's fade; `Game.svelte` uses `prefersReducedMotion`.

### Task 4: Verify

- [ ] `npx vitest run tests/client-sound-motion.test.mjs tests/library.test.mjs tests/styles.test.mjs`, `npm run check`.
- [ ] Browser: `dice-tray`, `game`, `library`.
- [ ] Commit `Fix #119: …`.
