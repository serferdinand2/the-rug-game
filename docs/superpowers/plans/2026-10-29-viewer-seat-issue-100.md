# One viewer-seat rule and tested browser fallbacks (#100) Implementation Plan

**Goal:** the viewer's seat is worked out once, and App's storage and random fallbacks are tested.

**Spec:** `docs/superpowers/specs/2026-10-29-viewer-seat-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [ ] `tests/client-storage.test.mjs`: the working storage, a throwing getter, a throwing `getItem`, the fallback's get, set and remove, `randomInt`'s range.
- [ ] `tests/client-api.test.mjs`: `viewerSeat` online, hot-seat and with no room; the source guard.
- [ ] Run both: FAIL.

### Task 2: The modules

- [ ] `src/lib/storage.js` with `safeStorage` and `randomInt`.
- [ ] `viewerSeat` in `src/lib/moves.js`; the store's `viewer` getter.

### Task 3: The callers

- [ ] `App.svelte` imports the fallbacks and reads `store.viewer` twice; `Results.svelte` reads `store.viewer`.
- [ ] `HandOver.svelte` types its store.

### Task 4: Verify

- [ ] `npx vitest run tests/client-storage.test.mjs tests/client-api.test.mjs tests/library.test.mjs`, `npm run check`.
- [ ] Browser: `results`, `hot-seat`, `landing`.
- [ ] Commit `Fix #100: …`.
