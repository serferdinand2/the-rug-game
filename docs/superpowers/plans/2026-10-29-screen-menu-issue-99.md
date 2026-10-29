# Every screen's menu from one module (#99) Implementation Plan

**Goal:** every screen's menu entries come from `menuItems`, and `PageHeader` handles sound and leaving.

**Spec:** `docs/superpowers/specs/2026-10-29-screen-menu-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [ ] `tests/client-menu.test.mjs`: the four screens' entries, Table settings for the host only, the gallery link, the source guard.
- [ ] `tests/browser/menu.test.mjs`: the landing menu and sound, the pass screen's menu and Leave table.
- [ ] Run them: FAIL.

### Task 2: The module

- [ ] `src/lib/menu.js` with `menuItems`.

### Task 3: The header and the screens

- [ ] `PageHeader` takes `store` and `menu`, handles sound and leaving.
- [ ] `App`, `Results` and `Game` pass them and drop their sound and leave wiring.

### Task 4: Verify

- [ ] `npx vitest run tests/client-menu.test.mjs tests/library.test.mjs`, `npm run check`.
- [ ] Browser: `menu`, `dialogs`, `rules-panel`, `lobby`, `results`, `hotkeys`.
- [ ] Commit `Fix #99: …`.
