# Choosing the tile to explore (#74): design

Written 2026-10-27. #74 is in M12 · Cosmetic enhancements, assigned to the owner. What the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. What and why

When a player explores, the rules let them place any territory tile from their supply on a legal hex, in any of its 6 turns (01 §7.2). The engine already offers every one of those answers (`exploreAnswers()` in `src/lib/engine/effects/explore.js`); the explore prompt hides the choice.

The owner's own game, in their words: "I clicked where I wanted to place a tile but was not given a choice of tiles." What happened: clicking a lit hex picked the best-scoring tile and turn (#28's call), and the docked panel listed every tile in every turn as one list, sorted by VP. With 3 tiles that is 18 entries; the panel showed the first three, all turns of one tile, and the rest sat below without a hint that the list scrolls. In 60 random games, 331 of 347 explores offered more than one tile, so this is the usual case.

**Done when** a player can see their tiles from the start of an explore, choose any of them before or after a hex, turn it on the hex while watching its VP, and confirm.

## 2. Goals, non-goals and anti-goals

- **Goals.** The prompt follows the rules' steps: a tile, a hex, a turn, then Confirm. Tiles are pictures, never numbers. Every legal answer stays reachable exactly once, and nothing illegal can be sent.
- **Non-goals.** The engine and its answers don't change; Confirm still sends one `chooseExplore` answer `{ tile, hex, orient }`. No drag and drop. No animated turning. Space tiles (`chooseSpaceTile`) keep their prompt.
- **Anti-goals.** The screen choosing a tile for the player and hiding the others; a list of tile-and-turn combinations; a tile named only by its number.

## 3. The layout (owner)

The owner compared two clickable mockups of a real game and chose **A, tiles in the panel** (owner): everything to decide sits in the docked panel beside the map. B (tiles in a tray under the map, turn arrows on the hex) was rejected; its tray would cover lit hexes at the bottom of the map.

The docked panel (`DecisionPanel docked`, 340px, as today) holds, top to bottom:

1. The title, "Choose where to explore", as today.
2. A lead line: "Pick one of your tiles and a lit hex, then turn the tile until you like it."
3. **Your tiles · n**: one picture per tile the decision offers, as toggle buttons in a wrapping row (about 88×80px each, the tile drawn by `TerritoryTile`). The picked one is outlined in gold.
4. A line saying what is chosen: "Pick a tile, or a lit hex on the map." before anything; "Now pick a lit hex: each shows the best this tile scores there." after a tile only; "Hex −1,−1, turned once" once both are chosen.
5. The turn control: ↺, the VP of the current turn in a gold tag ("+3 VP"), ↻, and "R turns it". Disabled, reading "No hex yet", until a tile and a hex are chosen.
6. **Explore**, enabled once a tile and a hex are chosen.

The mockup is kept at `.superpowers/brainstorm/` (ignored); the screenshots the owner chose from are described here, not committed.

## 4. Behaviour

- **Start.** Nothing is picked: no tile, no hex, no preview. The lit hexes are the decision's hexes, as today.
- **Tile first.** Picking a tile puts that tile's best VP on each lit hex, as a "+N VP" tag at the hex's top.
- **Hex first.** Picking a hex with no tile picked picks the first tile the decision offers (lowest tile number, the engine's hand order) at its best turn there, so the map shows a preview at once **(owner, from the issue)**. Each tile picture then carries its own best VP on that hex as a small tag in its corner.
- **The best turn.** The turn with the highest VP for that tile on that hex; on a tie, the lowest turn **(my call)**.
- **Switching.** Picking another tile keeps the hex and moves to the new tile's best turn there. Picking another hex keeps the tile and moves to its best turn there **(my call)**. Clicking the picked tile again does nothing; there is no way back to "no tile" except the turn being sent or the decision closing **(my call)**.
- **Turning.** ↻ and R go to the next turn, ↺ and Shift+R to the one before, wrapping through all 6. The preview on the hex, the chosen line, the VP tag in the panel and the chosen hex's tag follow the current turn; the other hexes keep the tile's best. R and Shift+R work from anywhere on the page while a tile and hex are chosen, except while typing in a text field.
- **The preview.** The picked tile on the picked hex, through `WorldMap`'s existing `preview` (85% opacity, gold outline).
- **Confirm** sends the matching answer. The chosen tile, hex and turn always match exactly one answer, because the engine offers all 6 turns of every held tile on every lit hex.
- **No cancel button.** Today's "Choose another territory" goes: another hex is one click away **(my call)**.
- **One tile, or Coal Baron.** When the decision offers a single tile, it is picked from the start and the row shows it alone, so the player sees what they are placing **(my call; the issue says the step is skipped)**.
- **The Terrain tab.** While the viewer's explore is open, the territory tiles in hand that the decision offers become toggle buttons there too, pressed when picked; picking one is the same as picking it in the panel **(owner, from the issue)**. Space tiles there stay plain.
- **Island tiles.** Tiles 5, 7, 16, 17, 26, 28, 40 and 41 are sea on every side with a one-terrain island, so their 6 turns look and score the same. ↻ still steps through all 6, because each is a legal answer and every answer stays reachable **(my call)**.
- **Many tiles.** Random games offered up to 11 tiles in one explore (4 to 6 is usual). The row wraps, and Explore stays visible however many rows there are **(my call)**.
- **Tile numbers.** The pictures are `TerritoryTile`'s, which print the tile's small number, as the Terrain tab does **(my call)**; the owner sees them in the library before #74 closes.
- **Words.** A tile's accessible name gives its terrains, not its number, and its best VP on the chosen hex when there is one, such as "Territory tile: sea, mountain and desert, up to 3 VP on this hex". The status line beside the actions reads like the chosen line.

## 5. The pieces

### 5.1 The plain module

`src/lib/area/explore.js` replaces `exploreChoices()` with functions over the viewer's view and open `chooseExplore`, each tested under Vitest:

- `exploreTiles(decision)`: the tiles the decision offers, lowest number first.
- `tileScores(game, decision, hex)`: for each offered tile, its best VP and best turn on that hex.
- `hexScores(game, decision, tile)`: for each lit hex, that tile's best VP and best turn there.
- `exploreIndex(decision, { tile, hex, orient })`: the matching answer's index in `decision.answers`, or −1.
- `tilePreview(tile, orient)`: what `WorldMap`'s `preview` and `TerritoryTile` draw (corners turned, island, clouds, volcano), as `exploreChoices()` built it.

Scores come from the engine's `matchingSides()` on the view, as today, never from the client's own rules.

### 5.2 Components

Each new or changed component gets its library section and its row in `src/lib/components/README.md`, in all its states.

- **`TilePicker`** (new, `src/lib/components/prompts/`): the row of tile toggle buttons. Props: `tiles` (each with the `TerritoryTile` data and an optional `vp`), `selected` (a tile number or null), `onTilePickerSelect` (a `ComponentEvent` with `{ tile }`).
- **`TurnControl`** (new, `src/lib/components/prompts/`): ↺, the VP tag, ↻ and the key hint. Props: `vp` (a number, or null for "No hex yet" and disabled buttons), `onTurnControlTurn` (a `ComponentEvent` with `{ step: 1 }` or `{ step: -1 }`).
- **`WorldMap`** gains `scores`: an object from hex key to a number, drawn as a "+N VP" tag at the top of each listed target hex.

### 5.3 The game screen

`src/screens/Game.svelte` keeps the explore's tile and turn beside `mapPick`, and derives `picked` from them through `exploreIndex()`, so `promptConfirmHandler` sends as today. For `chooseExplore` the panel's content is the lead line, `TilePicker`, the chosen line and `TurnControl`, instead of `panelOptions`. The window's key handler turns the tile on R and Shift+R. `PlayerTabs` takes the offered tiles, the picked one and a callback, for the Terrain tab.

`promptFor()` is unchanged: it still gives one option per answer, with `place: 'map'` and its hex, so the existing prompt test holds.

## 6. Tests

- **Unit (`tests/client-area-explore.test.mjs`, rewritten):** each new function, including ties and a hex no tile can score on; that `exploreIndex` is a one-to-one map from every (tile, hex, turn) the functions offer onto the answers.
- **Over random games:** for every open `chooseExplore` in the random games of `tests/client-prompts.test.mjs`, every answer is reached exactly once by `exploreTiles` × the decision's hexes × 6 turns through `exploreIndex`, and no combination outside them is offered.
- **Browser (`tests/browser/explore-prompt.test.mjs`, new):** a two-seat hot-seat game played through the API until a seat explores holding at least two tiles; the test clicks a hex first, picks a tile that doesn't score best, turns it with R, confirms, and checks through the API that that tile now lies on that hex in that turn. It also checks the tile row, the hex tags and the disabled Explore before a hex. It ends and leaves the table.
- `npm run check`, the library test and the full suites pass.

## 7. Documentation

The README's "Current interface" and `docs/ui/screens/` show the new explore panel (owner's standing rule); `docs/ui/README.md` describes it; CLAUDE.md records #74 under "Where the work stands" and the new browser test.

## 8. Owner approval

The issue asks for the owner to approve the new prompt in the library's DecisionPanel and WorldMap sections before the game uses it. The owner approved layout A in the mockup and asked for it to be built (owner, 2026-10-27), so it is built into the game in the same change; #74 closes once the owner has looked at the library sections, as #69 does.
