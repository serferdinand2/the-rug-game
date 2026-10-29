# Tabs owns its ids, panel and focus (#91): design

Written 2026-10-28. #91 is in M12 · Cosmetic enhancements, found by the client scan (#80). It also settles #84's duplicate-ids item. Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

Each of `Tabs`' three callers (`PlayerTabs`, `LogPanel`, `RulesPanel`) and its library section writes the tab panel by hand, with ids built from the tab ids (`{tab}-panel`, labelled by `{tab}-tab`). `LogPanel`'s panel lacks the `tabindex="0"` the others have. With How to play open over the game, its **Capital** and **Income** tabs and the player area's share `id="capital-tab"` and `id="income-tab"`, so `aria-labelledby` points at the wrong one. `RulesPanel` focuses its selected tab by querying `Tabs`' markup, and `PlayersOverview` does the same to `PlayerCard`.

**Done when** no two elements share an id with How to play open, no caller builds a tab or panel id, and no caller queries another component's markup to move the focus.

## 2. The changes

- **Ids.** `Tabs` takes `idPrefix`, by default `$props.id()`, so every row on a page has its own. A tab is `{prefix}-{id}-tab` and its panel `{prefix}-{id}-panel`.
- **The panel.** `Tabs` draws the panel from its `children`: `<div role="tabpanel" tabindex="0">` with the selected tab's id, labelled by that tab. It follows the tab row as a sibling, with no wrapper, so the callers' grids keep the same children and the same look. `panelClass` names it for the caller's layout, which reaches it with `:global()` as it reaches the row through `class` **(my call)**. A row without `children` draws no panel (the library's narrow rows).
- **`aria-controls`** is on the selected tab only, and only when there is a panel, so no tab names an element that isn't there **(my call)**; before, every unselected tab pointed at a missing panel.
- **Focus.** `Tabs` takes `autofocus`: the selected tab takes the focus once, as the row is drawn **(my call: a prop, not an exported `focus()`, since the one caller wants the focus on open)**. `PlayerCard` takes the same prop for its first row, so `PlayersOverview` stops querying for a button **(my call: the issue lists it with RulesPanel's query)**.
- **LogPanel.** Its head wrapper held the tab row and the close button; a panel drawn after the row can't stay outside that wrapper. The panel itself becomes a grid: the row and the close button share the first row, the panel spans the second, and the head's bottom border becomes the panel's top border, the same line in the same place. The panel joins the tab order with `tabindex="0"` (the fix the issue asks for), so Tab now goes from the tab to the log, then to Close, as the ARIA tabs pattern has it.
- **The library section** shows the panel from `children`, two rows with the same tab ids, a fixed `idPrefix`, and `autofocus` behind a button.

## 3. Tests

Vitest (`tests/tabs.test.mjs`, rendering with `svelte/server`): ids carry the prefix, the default prefix is the row's own, two rows with the same tab ids on one page share no id, the panel's id, role, `tabindex` and label match the selected tab, only that tab names it, and no panel without `children`; no other Svelte file in `src/` draws a `tabpanel`, builds a `-tab` or `-panel` id or queries a `[role="tab"]`. Playwright (`rules-panel.test.mjs`): with How to play open over the game no id repeats, and the selected tab has the focus.

## 4. Hand-offs

#87 builds How to play on a `Dialog`; it keeps `autofocus` on the rules' tabs. #95 moves the player tabs into parts, on this API.
