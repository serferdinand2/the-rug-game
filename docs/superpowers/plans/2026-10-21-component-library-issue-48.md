# Component library (#48): plan

Written 2026-10-21. The owner asked for a component library built from the phase-one mockups, ahead of #3 closing.

## Decisions (owner, 2026-10-21)

- **Layout.** The app lives in `src/` like the owner's other Svelte projects. Components are in `src/lib/components/<area>/`, one PascalCase file each. The server and the art drawing toolkit stay at the root. (Done in the previous commit.)
- **Library page.** One page that shows every component in all its states, each state labelled with the props that produce it. It has no live prop controls or events log. It is its own page, `components.html`, built next to the game page and served at `/components.html`.
- **Add bot is shelved**, so the lobby seat has no bot state.

## Ground rules for every component

- Follow CONVENTIONS.md exactly: a `<script module>` with `{Name}OwnProps`, `{Name}Props` and an `@example`; `$props()` with `/** @type {NameProps} */`; `{...attr}` on the root, with `class` merged; `{action}Handler` names; `on{Name}{Action}` callbacks that receive a `ComponentEvent`; BEM classes `rg-{kebab-name}`, `rg-{kebab-name}--{element|modifier}`.
- Only tokens from `src/styles/tokens.css`. Tints come from `color-mix()` on tokens. No hex, `rgb()` or `hsl()` in components; `tests/styles.test.mjs` fails on them.
- Square corners (`var(--radius)`), no shadows on ordinary panels, Cinzel only for names of game things, and Atkinson Hyperlegible for everything else (docs/ui/README.md role table).
- Components are presentational. They render props and report what the player did. They never hold game state, call the server or decide rules. Geometry that is worth testing goes in a plain module in `src/lib/`, written test-first.
- Every pointer interaction has a keyboard path and a visible focus. Hover-only reveals also open on focus. Motion uses the duration tokens, which are 0 under reduced motion.
- Sizes match the 1920×1080 reference. The mockups are the visual source: `docs/ui/launch.html`, `docs/ui/lobby.html`, `docs/ui/main-screen.html` and the manifest `docs/ui/README.md`.
- Each component gets a section file, `src/library/sections/<area>/<Name>.svelte`, in the same change. `tests/library.test.mjs` fails on a component without a section, and on a component that breaks the structure rules above.

## Shared modules

- `src/lib/ui.js`: shared typedefs (`TrackId`, `ResourceId`, `CostSymbol`, `Terrain`, `Seat`) and helpers that turn ids into token references: `trackColor`, `playerColor`, `resourceColor`, `terrainColor`, `artUrl`, `roman`.
- `src/lib/capital.js`: capital-grid geometry. It covers plot indices, footprint rotation and cells, `fits`, `nearestFit`, groups and completed groups (impassable plots count as filled, 01 §6), and group bounds.

## Components

| Area | Component | From the mockup |
|---|---|---|
| ui | `Button` | Every button: `primary` (green action), `secondary` (raised), `gold` (create/join, ready, take the seat, income), `success` (start game), `danger` (leave); `small`/`medium`/`large`; `selected` |
| ui | `IconButton` | 36×36 sound, history, menu and close controls; the red mute slash |
| ui | `TextInput` | Name and table-code inputs; read-only gold code field; error text |
| ui | `Segmented` | Mode buttons (filled) and setting options (tinted), single or multiple choice |
| ui | `Tabs` | Right-panel tabs with a count, reserved bold width and arrow-key navigation |
| ui | `Badge` | Expansion tags and the small YOU · HOST capitals |
| ui | `Panel` | Chrome panels with an optional heading |
| ui | `Menu` | The header menu popover |
| ui | `Toast` | The status toast |
| ui | `Divider` | Thin rule, optionally paused by a label ("or join friends") |
| ui | `TopBar` | The 58px header: brand, centre content, controls |
| ui | `ResourceIcon` | Placeholder resource and "any" symbols used in prices, chips and costs |
| board | `TrackSpace` | Pointed track tile: name, landmark, number, first/last shapes, hover and selected outline |
| board | `TierPrice` | Era numeral and prices over three tiles, gold when hovered |
| board | `ProgressLanes` | One progress line per player with a square end mark, and the dashed preview |
| board | `Track` | Heading, four tier prices, twelve spaces and the lanes |
| board | `TrackBoard` | The four tracks stacked |
| board | `BoardSwitcher` | Advancement Tracks / World Map selector with icons |
| board | `WorldMap` | Schematic hex map coloured by terrain |
| player | `PlayerChip` | Header chip: colour square, name, civilization, VP, current-player glow, filled state |
| player | `ResourceChip` | Resource symbol and count |
| player | `PlayerCard` | Player overview card with selectable rows |
| player | `CapitalGrid` | 9×9 capital: plots, impassable X, districts, completion overlay, placement outline, placed landmarks |
| player | `CompletionCounters` | Rows, columns and districts counters |
| player | `LandmarkPiece` | Landmark picture in its footprint, with rotate, confirm and return controls |
| player | `PlacementTray` | "To be placed" tray |
| prompts | `CostBox` | "Cost" with resource symbols |
| prompts | `TurnBar` | The footer: neutral, selected, optional-action and waiting states, with the income reveal |
| prompts | `OverviewCloseBar` | "Close the players overview" footer |
| lobby | `SeatCard` | Empty (Open seat), open (Take the seat!) and joined states, with badges, readiness and remove |
| lobby | `CivChooser` | Civilization tiles, Random, border in the edited player's colour |
| lobby | `OpenTableRow` | Join, code, five seat boxes, rules and expansion badge |
| lobby | `SettingRow` | Title, thin rule, choices |
| lobby | `TableCode` | Read-only code with COPY |

## Library page

- `components.html` mounts `src/library/main.js`, which mounts `src/library/Library.svelte`.
- `Library.svelte` collects `src/library/sections/*/*.svelte` with `import.meta.glob`. It shows a sidebar grouped by area (ui, board, player, prompts, lobby) and every section in that order.
- `Section.svelte` gives a component's name, area and one-line purpose. `Example.svelte` shows one state, labelled with its props, on the surface where the component lives (`chrome`, `surface` with the texture, or `ink`), optionally at its real width.
- Interactive examples keep their own `$state`, so tabs switch, options toggle and the Lighthouse can be placed.

## Steps

1. Tests first: `tests/ui.test.mjs`, `tests/capital.test.mjs` and `tests/library.test.mjs`, the library entry in `tests/vite-config.test.mjs`, and `/components.html` in `tests/static.test.mjs`.
2. Foundation: the two shared modules, the library page frame, a multi-page Vite build, and `Button`, `Badge`, `ResourceIcon` and `Segmented` with their sections as the pattern.
3. The remaining components by area, in parallel: ui, board, player, prompts with lobby.
4. Review every section in the browser at 1920 wide against the mockups, and fix any differences.
5. Docs: `src/lib/components/README.md` (an index with one row per component), CONVENTIONS.md (new components go on the page), CLAUDE.md, README.md (a screenshot of the library), and #48's checklist.
6. The art (owner, 2026-10-21: "combine the art into the components library"): the standalone asset gallery becomes the library's Art area. `art/gallery.js` holds the part samples, the review grouping and the drawing check, shared by `npm run art` and the page; the page draws every drawing live from the toolkit.
