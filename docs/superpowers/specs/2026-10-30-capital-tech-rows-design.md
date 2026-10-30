# A player's capital and tech rows drawn once (#94): design

Written 2026-10-30. #94 is in M13 · Refactor (Players and scoring), found by the client scan (#80), and waited for #92. Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`PlayerTabs` (Your area) and `PlayersOverview` each drew a capital with their own copy of the title, `CapitalGrid` and `CompletionCounters`, each with a `highlight` state and the same hover and toggle handlers, and the same title CSS. Each drew the three tech rows too: `PlayerTabs` from its own `TECH_ROWS`, the overview from a nested ternary. A change to the capital, such as #82's, had to be made twice.

**Done when** both screens draw the capital with `CapitalCity` and the tech rows with `TechRows`, and neither keeps a copy.

## 2. The changes

- **`src/lib/area/tech-rows.js`**: `TECH_ROWS`, frozen: `{ id, label, shape }` for the top (square), middle (circle) and bottom (none) rows.
- **`src/lib/components/player/CapitalCity.svelte`**: `capital` (a `CapitalView`), `owner` (the title before the mat's name: "Capital City" in Your area, the player's name in the overview), `label` (the grid's), and the grid's placement props (`pieces`, `targets`, `preview`, `fresh`, `awaitingPlacement`) with its callbacks renamed `onCapitalCityPlotClick`, `…Drop`, `…Move`, `…Rotate`, `…Confirm`, `…Return`, `…DragStart` and `…DragEnd`. It owns `highlight`. `room` is always on, as both screens had it.
- **`src/lib/components/player/TechRows.svelte`**: `tech` (`{ top, middle, bottom }`), `layout` (`'fan'`, the Tech tab: each row under its shape, a `CardFan` of cards at 0.42, or a "No cards yet" box; `'wrap'`, the overview: plain headings, cards at 0.4 wrapping, "No cards"), and `onTechRowsInspect`, fired with the hovered card's id or null.
- **Both roots are `display: contents`.** The two screens lay the parts out differently: Your area's tab flows them as blocks (the title's margin below it, the counters flush under the grid, margins collapsing), the overview's detail is a centred grid with a gap between every item. A root box would change one of them, so the parts stay items of the parent's layout. The one thing that differed inside the component, the title's space below, comes from `--rg-capital-city-title-gap` (`--space-6` by default), which the overview's detail sets to 0.
- **The screens:** `PlayerTabs` keeps the placement logic, the `PlacementTray` and the Beside the mat note after `CapitalCity`, and the display row after `TechRows`; its `TECH_ROWS`, `highlight`, the name, shape and empty-row CSS go. `PlayersOverview` keys `CapitalCity` by seat, so another player's capital starts with nothing lit, as resetting `highlight` on a row choice did; its row, tech, empty and name CSS go.
- **Left as it is:** the civilization cards. The issue notes both screens draw them with `{#each civs}<CivilizationCard …>`, but proposes no component; #47 and #78 change them.
- **Library and README:** a section and a row for each component.

Nothing on screen changes. Screenshots at 1920×1080 of the Capital tab (own and another seat's, at rest and with a counter pressed), the Tech tab, and the overview's capital (at rest and pressed) and tech for both seats of a 110-move hot-seat game are byte-identical before and after, apart from one 3×10 px antialiasing edge inside a scaled tech card's square on the own Tech tab (positions and sizes unchanged). The overview no longer opens from the game since #145, so it was shot in a scratch page that mounts it with the same game.

## 3. Owner questions (look left as it is)

- Should the overview's tech rows take the Tech tab's look (the shape marks, the bold row titles, the "No cards yet" box), so `TechRows` has one look and `layout` only fans or wraps?
- Should the overview's capital take Your area's spacing (the counters flush under the grid) or Your area the overview's (a gap under the grid)?
- `PlayersOverview` is no longer opened by anything (#145 moved the chips to the player tabs): keep it for a later entry point, or remove it?

## 4. Tests

`tests/capital-tech-rows.test.mjs` (new, written first): `TECH_ROWS`; `CapitalCity` renders the title, one grid with its label and one set of counters, with nothing pressed; `TechRows` in each layout (shapes, fans, scales, the empty words); `PlayerTabs`' Capital and Tech tabs draw them; neither screen imports `CapitalGrid` or `CompletionCounters`, keeps a `highlight`, a `TECH_ROWS`, the row names or the moved CSS. `tests/library.test.mjs` checks the sections. Playwright: `player-area`, `opponent-tabs`, `hotkeys` and `library`.
