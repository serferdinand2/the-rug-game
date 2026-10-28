# Tabs owns its ids, panel and focus (#91) Implementation Plan

**Goal:** `Tabs` prefixes its ids, draws its panel and takes the focus, so its callers stop building ids and querying its markup.

**Spec:** `docs/superpowers/specs/2026-10-28-tabs-ids-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- The look stays pixel-identical; only LogPanel's tab order changes (the panel joins it).
- Commits reference the issue; the duplicate-ids commit body says `Refs #84`.

### Task 1: Tests first

- [ ] `tests/tabs.test.mjs` with a fixture `tests/helpers/TwoTabRows.svelte`: the prefix, the default prefix, two rows on one page, the panel's attributes, `aria-controls` on the selected tab only, no panel without `children`, and the source guard (no other file draws a `tabpanel`, builds `-tab`/`-panel` ids or queries `[role="tab"]`).
- [ ] `tests/browser/rules-panel.test.mjs`: no repeated id with How to play open; the selected tab has the focus.
- [ ] Run the Vitest file: FAIL.

### Task 2: Tabs

- [ ] `idPrefix` (default `$props.id()`), `panelClass`, `autofocus`, `children`; the panel after the row; `aria-controls` on the selected tab with a panel. Doc comment and example.

### Task 3: The callers

- [ ] `PlayerTabs`, `RulesPanel` (drop the query; `autofocus`), `LogPanel` (grid in place of the head) pass their content as `children` and `panelClass`, with `:global()` panel styles.
- [ ] `PlayerCard` `autofocus`; `PlayersOverview` drops its query.
- [ ] The Tabs and PlayerCard library sections; the README rows.

### Task 4: Verify

- [ ] `npx vitest run tests/tabs.test.mjs tests/library.test.mjs tests/styles.test.mjs`, `npm run check`.
- [ ] Browser: `rules-panel`, `player-area`, `hotkeys`, `results`, `first-income`, `library`.
- [ ] Commit `Fix #91: …` with `Refs #84` in the body.
