# Components

The interface components, built from the phase-one mockups in `docs/ui/`. Every one of them is shown in all its states on the component library page, `/components.html` (#48). Run `npm run dev` and open <http://127.0.0.1:5173/components.html>.

Add a row here, and a section in `src/library/sections/<area>/<Name>.svelte`, in the same change that adds a component. `tests/library.test.mjs` checks the section and the structure rules in [CONVENTIONS.md](../../../CONVENTIONS.md).

## Boundaries

- Components are presentational. They render the props they get and report what the player did through `on{Component}{Action}` callbacks, which receive a `ComponentEvent`. They never hold game state, call the server, decide a rule or roll anything random. The screen that owns the game state does that.
- Geometry worth testing lives in plain modules beside this folder: `../ui.js` (ids and token helpers), `../capital.js` (the capital grid), `../placement.js` (placing landmarks) and `../track-shape.js` (track spaces and progress lanes).
- Styles live in the component, use only the tokens in `src/styles/tokens.css`, and style only the component's own `rg-{name}` classes.

## Placeholders until the art lands

These components are updated as the art issues deliver their assets. Each will show its asset by its stable catalog id (`artUrl(id)` in `../ui.js`), and its library section shows the result.

| Placeholder now | Component(s) | Asset ids | Art issue |
|---|---|---|---|
| Coloured squares and the gold diamond | `ResourceIcon`, so also `ResourceChip`, `CostBox`, `TierPrice` | `resource/coin`, `resource/worker`, `resource/food`, `resource/culture`, `resource/any` | #5 |
| Plot colours for buildings | `CapitalGrid` | `building/market`, `building/house`, `building/farm`, `building/armory` | #5 |
| Flat terrain colours | `WorldMap`, the World Map icon in `BoardSwitcher` | `hex/*`, `territory-tile/*`, `terrain/*` | #5, #6 |
| The four bands of the Advancement Tracks icon | `BoardSwitcher` | `track/*` | #5 |
| Square end marks | `ProgressLanes` | `piece/token` | #5 |
| Civilization names only | `PlayerChip`, `PlayerCard`, `SeatCard`, `CivChooser` | `civ/*` | #8 |
| The plain 9×9 grid | `CapitalGrid` | `capital-mat/*` | #6 |

`LandmarkPiece` already shows the drawn landmarks (`landmark/*`, #7).

## ui/

| Component | Purpose |
|---|---|
| `Badge` | Expansion tags tinted with their colour, and the YOU, HOST and READY capitals. |
| `Button` | Every button: `primary`, `secondary`, `gold`, `success` or `danger`, in three sizes, with a `selected` toggle state. |
| `Divider` | A thin rule, optionally paused by a short italic label such as "or join friends". |
| `IconButton` | The 36px header controls (sound, history, menu, close), with the red mute slash. |
| `Menu` | The header popover: entries as links or buttons, arrow keys and Escape. |
| `Panel` | A chrome panel with a thin border and an optional heading. |
| `ResourceIcon` | Placeholder price symbols: a coloured square per resource, a gold diamond for any resource. |
| `Segmented` | A row of pressed/unpressed choices, single or multiple, tinted or filled. |
| `Tabs` | The right panel's tabs, with a count, roving focus and arrow keys. |
| `TextInput` | Labelled text fields with a hint and a validation message, and the small gold read-only code. |
| `Toast` | A short status message at the bottom of the screen. |
| `TopBar` | The 58px header: brand, centre content and controls. |

## board/

| Component | Purpose |
|---|---|
| `BoardSwitcher` | Advancement Tracks / World Map selector with its icons. |
| `ProgressLanes` | One progress line per player under a track, with the dashed preview to the next space. |
| `TierPrice` | A tier's numeral and price over its three spaces; gold while one of them is hovered. |
| `Track` | One track: name, four tier prices, twelve spaces and the lanes. |
| `TrackBoard` | The four tracks stacked, with one selected space across them. |
| `TrackSpace` | One pointed space: name, landmark, number, first/last shapes, selected and focus outlines. |
| `WorldMap` | The schematic hex map coloured by terrain. Static until targeting is designed. |

## player/

| Component | Purpose |
|---|---|
| `CapitalGrid` | The 9×9 capital: plots, impassable Xs, districts, completion overlays, placed landmarks and their drag, keyboard and drop handling. |
| `CompletionCounters` | Completed rows, columns and districts; hover or focus previews, a press keeps them shown. |
| `LandmarkPiece` | A landmark's picture in its footprint's shape, in the tray or on the grid, with rotate, confirm and return. |
| `PlacementTray` | The To be placed tray: select, drag or arrow a landmark onto the grid, or drop one back. |
| `PlayerCard` | A player's overview card, with the selectable Civilization, Capital and Tech rows. |
| `PlayerChip` | A header chip: colour, name, civilization, VP, the current player's glow and the overview's filled state. |
| `ResourceChip` | A resource symbol and its count. |

## prompts/

| Component | Purpose |
|---|---|
| `CostBox` | The footer's price: a Cost label and the symbols joined by plus signs, read out in words. |
| `OverviewCloseBar` | The footer while the players overview is open. |
| `TurnBar` | The footer: neutral, selected, optional-action and waiting states, with the income reveal. |

## lobby/

| Component | Purpose |
|---|---|
| `CivChooser` | Civilization tiles and Random, bordered in the edited player's colour. |
| `OpenTableRow` | One open table on the launch page: Join, code, seat boxes, rules and expansion. |
| `SeatCard` | A lobby seat: empty (Open seat), open (Take the seat!) or a joined player. Add bot is shelved. |
| `SettingRow` | A setting's title, a thin rule and its choices on one line. |
| `TableCode` | The read-only table code with COPY. |
