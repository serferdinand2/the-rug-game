# The store's take-or-fetch rule in pass.js (#130) Implementation Plan

**Goal:** `#accept`'s rule becomes the pure, tested `acceptStep` in `src/lib/pass.js`; the store only applies it.

**Spec:** `docs/superpowers/specs/2026-10-28-accept-step-design.md`

## Global Constraints

- The store behaves exactly as before, apart from the timeout toast's words.
- Conventions: JSDoc, Prettier on the changed files only, braces, `npm run check` clean.
- Commits reference the issue: `Refs #130: …`, and `Fix #130: …` for the last.

### Task 1: acceptStep, test-first

**Files:** `tests/client-pass.test.mjs`, `src/lib/pass.js`.

- [ ] Tests for each case of the design's §4. Run `npx vitest run tests/client-pass.test.mjs`: FAIL (no export).
- [ ] `acceptStep` with an `AcceptStep` typedef, importing `freshEvents` from `event-feed.js`. Run: PASS.

### Task 2: The store applies it

**Files:** `src/lib/game.svelte.js`.

- [ ] `#accept` calls `acceptStep(this.room, room, this.#shownSeat, this.passing)` and applies `shown`, `passing`, `fetch`, `take` and `fresh` in the old order.
- [ ] `#askView(code, seat)` holds the one generation-and-table guard; `#fetchView` and `takeSeat` use it with their own failure handling.
- [ ] `#notices` toasts `eventText(timedOut, room.game)`.
- [ ] `npm run check` clean; the browser tests that play hot-seat pass through the local Playwright config.
- [ ] Commit `Fix #130: …`.
