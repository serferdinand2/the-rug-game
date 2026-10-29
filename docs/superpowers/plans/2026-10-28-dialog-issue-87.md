# One Dialog for How to play, Table settings and the help panel (#87) Implementation Plan

**Goal:** `HelpPanel`, `RulesPanel` and `TableSettings` keep only their content, inside one `Dialog` that owns the scrim, the box, Escape, the backdrop, Close and the focus.

**Spec:** `docs/superpowers/specs/2026-10-28-dialog-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Don't touch `Game.svelte` or `App.svelte` (#79, #88): the panels keep their props.
- TableSettings: only the shell; its rows' markup stays (#98).

### Task 1: Tests first

- [ ] `tests/dialog.test.mjs`: title, `aria-modal`, the default Close, `actions`, `size`; the three panels use `Dialog` and read no markup. Run: FAIL.
- [ ] `tests/browser/rules-panel.test.mjs`: Escape gives the focus back to Menu.
- [ ] `tests/browser/dialogs.test.mjs`: the launch page's How to play and the game's Table settings open, take the focus, close by Escape, the backdrop or Done, and give the focus back to Menu.

### Task 2: Dialog

- [ ] The component, its library section (modal and not, narrow and wide, custom actions) and its README row.

### Task 3: The panels

- [ ] HelpPanel, RulesPanel, TableSettings on `Dialog`.
- [ ] Measure How to play before and after at 1920×1080: the same boxes.

### Task 4: Verify

- [ ] Vitest: `dialog`, `tabs`, `library`, `styles`; `npm run check`.
- [ ] Browser: `rules-panel`, `dialogs`, `hotkeys`, `results`, `first-income`, `library`.
- [ ] Commit `Fix #87: …` (the owner question stays open in the report).
