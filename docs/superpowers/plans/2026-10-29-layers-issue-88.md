# The game's keys and Escape through one tested layer state (#88) Implementation Plan

**Goal:** one Escape closes one thing, from a tested `layers.js`, and no document query decides what a key does.

**Spec:** `docs/superpowers/specs/2026-10-29-layers-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.

### Task 1: Tests first

- [ ] `tests/client-layers.test.mjs`: the opening rules, every reachable combination, #88's example.
- [ ] `client-hotkeys`: Escape is no hotkey; `hotkeyGate`.
- [ ] `client-storage`: `forgetfulStorage`.
- [ ] Playwright: I, L, Esc, Esc; the setup skips the Futurists.
- [ ] Run them: FAIL.

### Task 2: The modules

- [ ] `src/lib/layers.js`; `hotkeyGate` in `hotkeys.js`, and its Escape branch goes.
- [ ] `forgetfulStorage` in `storage.js`; the store's `session`, `noticeClosed` and `closeNotice`; App passes the session.

### Task 3: The screen

- [ ] `Game.svelte`: one `layers` state, the key handler through `hotkeyGate` and `escapeLayer`, every opener through `openLayer`.
- [ ] `LogPanel` without its window listener.

### Task 4: Verify

- [ ] `npm run test:unit`, `npm run check`, the browser tests on the branch's own servers.
- [ ] docs/architecture.md and docs/status.md.
- [ ] Commit `Fix #88: …`.
