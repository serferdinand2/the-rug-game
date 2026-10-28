# TilePicker draws the Terrain tab's pickable tiles (#93): design

Written 2026-10-28. #93 is in M12 · Cosmetic enhancements, found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

While a player explores (#74) or pays tiles (#75), the Terrain tab makes the offered tiles pressable with its own button and CSS (`PlayerTabs.svelte` 593–608 and 752–782), copied from `TilePicker`: the `aria-pressed` test, `disabled`, the gold border, the 17% gold fill, the thick outline, the dashed focus and the 0.35 opacity. A change to the picked look has to be made twice.

**Done when** the Terrain tab draws its territory tiles with `TilePicker`, the library shows the new states, and the explore and pick browser tests pass.

## 2. The changes

- **`pickable`** (a list of ids, all of them by default): the tiles that can be pressed. The others are drawn plain, as the bare `TerritoryTile`, so the Terrain tab can mix both in one row. The issue offered this or a `TileButton`; `pickable` keeps the pressed, disabled and focus look in the one component that already owns it **(my call)**.
- **`size`** (`'small'`, the default, or `'large'`): small is today's picker, a 34 px tile in an 88×80 frame on the raised fill, for the decision panel. Large is the Terrain tab's: the tile at its own 36 px in a frame that fits it, resting clear, so an offered tile reads as the plain tile beside it with a frame, and a faint gold wash (10%) on hover and focus. The picked, disabled and focus looks are the same in both sizes. The rest and hover fills are custom properties set by the size, so the picked rule stays the only one that sets the picked fill.
- **`dataIdPrefix`** (`'tile'` by default): starts each pressable tile's `data-id`. The Terrain tab passes `terrain-tile`, so the hook `tests/browser/pick-prompts.test.mjs` uses stays `terrain-tile-{id}`, apart from the decision panel's `tile-{id}`.
- **PlayerTabs** passes the tiles with their words (`tileWords`), `pickable` from `tilePick`, `selected` and `disabled`, and the row's gap and margin through its class, as before. The row becomes a labelled group, "Territory tiles in hand", as the decision panel's is "Your tiles".

## 3. Visible changes

None at rest, picked, disabled or focused. Two small ones, both fixes:

- Hovering a picked tile on the Terrain tab kept its gold border but swapped its 17% gold fill for the 10% hover wash, because the hover rule outweighed the picked one. Now a picked tile keeps its fill on hover, as it does in the decision panel.
- A tile that can't be pressed now shows the default cursor in the decision panel too, not only on the Terrain tab.

## 4. Tests

Vitest (`tests/tile-picker.test.mjs`, rendering with `svelte/server`): only `pickable` tiles are buttons, the rest plain tiles; every tile is a button by default; `size` sets the tile's size; `dataIdPrefix` names the hooks; and the Terrain tab draws no button or `aria-pressed` of its own. Playwright: `pick-prompts` (unchanged; it belongs to #79) and `explore-prompt` pass.

## 5. Hand-offs

#95 moves the Terrain tab into its own part. #116 turns the fills into tokens and adds the VP tag; the Terrain tab's copies are gone, so it changes one file.
