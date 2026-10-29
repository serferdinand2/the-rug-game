# One clock choice and one ticking time (#89) Implementation Plan

**Goal:** both screens choose the clock with `shownClock`, one timer ticks, and `TurnClock` builds its own title.

**Spec:** `docs/superpowers/specs/2026-10-29-turn-clock-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [ ] `tests/client-clock.test.mjs`: `shownClock`, `isRunning`, `TurnClock`'s title and modifiers, `clockTime.now`, the source guard.
- [ ] Run it: FAIL.

### Task 2: The modules

- [ ] `shownClock` and `isRunning` in `src/lib/clock.js`; `src/lib/now.svelte.js` with `clockTime`.

### Task 3: The components

- [ ] `TurnClock` takes `name`, sets its title and uses `class:` directives; its library section passes names.
- [ ] `PassScreen` passes `name` and drops its title; `HandOver` and `Game` choose with `shownClock`, test with `isRunning` and read `clockTime.now`.

### Task 4: Verify

- [ ] `npx vitest run tests/client-clock.test.mjs tests/library.test.mjs tests/styles.test.mjs`, `npm run check`.
- [ ] Browser: `pass-screen`, `game`, `lobby`, `library`.
- [ ] Commit `Fix #89: …`.
