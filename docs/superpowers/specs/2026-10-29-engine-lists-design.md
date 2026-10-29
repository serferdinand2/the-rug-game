# The track, resource and building lists from the engine (#127): design

Written 2026-10-29. #127 is in M13 · Refactor (Words and names), after #123. Every decision here is **(my call)** unless marked; the issue gave the shape.

## 1. What and why

The engine exports `TRACK_IDS`, `RESOURCE_IDS` and `BUILDING_IDS`. The client writes them out again:
- the four tracks in `ui.js`, `prompts.js`, `glyphs.js`, `area/players.js` and `hotkeys.js`;
- the resources in `prompts.js`, `glyphs.js`, `prompt-state.svelte.js`, `IncomeNotice`, `describe.js` and two library sections;
- the buildings in `prompts.js` and `glyphs.js`;
- the tiers as `[1, 2, 3, 4]` in `board.js`.

`shortcuts.js` types the track keys and the tab keys by hand from `hotkeys.js` and `area/tabs.js`, and its test types them a third time. When #35 adds the arts track to the engine, most of these would silently leave it out: no symbol, no tint, no name and no place on the player card.

**Done when** each list exists once, is read from the engine, and a test fails for an engine track that has no name, glyph or tint.

## 2. The lists

- **Tracks and buildings:** client modules import `TRACK_IDS` and `BUILDING_IDS` from `engine/data/ids.js`, as `describe.js` already imports the engine's data. `ui.js`'s `TRACKS` is `TRACK_IDS` with #123's names, and its `TrackId` is the engine's type. `hotkeys.js`'s `TRACK_KEYS` is `TRACK_IDS`.
- **Resources:** the screens list them as coin, food, worker, culture, but the engine's order is coin, worker, food, culture. Changing the screen order would change the interface, so it stays. `ui.js` exports it once as `RESOURCE_ORDER`, and a test checks that it holds exactly the engine's resources. `RESOURCES` is built from it. The client's other lists use `RESOURCE_ORDER`, or `[...RESOURCE_ORDER, 'any']` where a price symbol can be any. `describe.js` only asks whether something is a resource, so it uses the engine's `RESOURCE_IDS`.
- **Tiers:** `board.js` reads them from the engine's `TIER_COSTS`.
- **Shortcuts:** `hotkeys.js` exports `TAB_KEYS`.
  - `shortcuts.js` builds the track line from `TRACK_KEYS` and #123's `trackName`: **1–4** and "1 Exploration, 2 Science, 3 Technology or 4 Military".
  - It builds the player-area group from `TAB_KEYS` and `TABS`' labels.
  - The words come out as they read today.

Library fixtures that draw a mockup's tracks stay as they are, since they are samples, not lists.

## 3. Tests

- **New `tests/client-id-lists.test.mjs`:**
  - `TRACKS` and `TRACK_KEYS` are the engine's tracks in order, and `RESOURCE_ORDER` holds the engine's resources.
  - Every engine track has a name, a symbol in the art catalog (`track/<id>`, which its glyph draws), a tint token in `tokens.css`, a place in the board, and a place on the player card.
  - A source guard: no client module writes the track, resource or building list by hand.
- **`client-shortcuts`:** the expected keys come from `TRACK_KEYS` and `TAB_KEYS`.

## 4. Hand-offs

- #35 adds `arts` to the engine's `TRACK_IDS`. The new test then asks for its name, symbol and tint.
- #120 lays the board out for any number of tracks.
