# The decision prompt in one place, always centred (#79): design

Written 2026-10-28. What the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. The ruling

- **Every decision prompt opens at the centre (owner, 2026-10-28).** This replaces #75's "a payment in tapestry or tech cards keeps the shelf above a panel at the bottom".
- **The centre of the tracks, not of the screen (owner, 2026-10-28, reviewing the library).** The first build centred the stack on the screen (x = 960 at 1920 px), as #75's pick panels were; the owner asked for the middle of the tracks instead, about 240 px further left. #75's pick panels and #77's notice move with it.
- **The one exception:** while the Map view shows a choice on the map, the panel stays docked at the right, so the hexes under it stay clickable (#26, #74).

## 2. Where things open

| Prompt | Before | Now |
|---|---|---|
| Paying for an advance, a pick of several resources, cards or tiles, a trade (#75) | Screen's centre | Tracks' centre |
| An `options` prompt: a track, a token, a yes or no, a civilization ability | Bottom | Centre |
| Cards on the shelf: tapestry and tech cards, civilizations and capital mats | Bottom, shelf above | Centre: shelf and panel as one stack |
| A payment in tapestry or tech cards | Bottom, shelf above | Centre: shelf and panel as one stack |
| Placing a building or landmark on the Capital tab | Bottom | Centre |
| A choice on the map, Tracks view showing | Bottom | Centre |
| A choice on the map, Map view showing | Docked right | Docked right |
| The first-income notice (#77) | Screen's centre | Tracks' centre |

## 3. The centred stack

- **One stack (my call):** the shelf, when there is one, sits above the panel, 18 px apart, and the two are centred together on the screen. Without a shelf the panel alone is centred, where #75 put it.
- **The tracks' centre (owner):** the stack is centred in the shared area the scrim covers, vertically too; the shared area's middle is also the screen's vertical middle, as the header and footer are the same height. A shelf wider than the shared area scrolls sideways, as before.
  - The first build put the stack at the screen's centre with a spacer sized from `100cqw`, sliding a stack too wide for the room right of the centre back onto the board. The owner's ruling made that unnecessary, and it went.
- **The cards' height (#57):** `DecisionPanel` measures the room the shelf may take, the stack's height less the panel's and the gap, and hands it to the shelf snippet. `CardShelf` takes it as `room`: civilization cards fit it (never below 0.75, as before), and other cards scroll inside it. Measuring the shelf's own height, as before, would feed back now that the shelf is only as tall as its cards.
- **Width (my call):** every centred panel is as wide as its content, at least `--centred-panel-width` (440 px, #75's) and at most 900 px. The old bottom panel's 480 px minimum goes.
- **The `centred` prop goes:** centred is the default. `docked` stays.

## 4. The dice tray (#61)

The tray learns what is open from the game, not from `DecisionPanel`'s class (my call):

- `DiceTray` takes `panel`: `'none'` rolls at the screen's centre; `'panel'` (any open panel without a shelf, docked or not) rolls at the top of the board, as #61 approved; `'shelf'` (a stack with cards, which can fill the board's height) rolls over the player area.
- `Game` exposes `panel` as a bindable prop; `App` passes it to the tray. It falls back to `'none'` when the game screen goes, such as for the pass screen.

## 5. The pieces

- **`src/lib/prompts.js` · `panelControls(prompt, choice)`:** the panel's status line and its warning, the confirm and cancel labels, whether Confirm can be pressed, what cancel does (`back`, `decline`, `clear` or nothing), what Confirm sends (`pick` or `answer`), and whether the panel has a content area. Vitest covers every case that `Game.svelte`'s ternaries covered.
- **`src/lib/prompt-state.svelte.js` · `PromptState` (my call):** a rune module, like the store, that owns the prompt's selection: the answer picked, the hex, the explore's tile and turn, the picks so far, the trade's offer and the advance's payment. It derives what the rest of the screen needs (the map's lit hexes, scores and preview, the capital's placement, the Terrain tab's tiles, the overview's counts, the footer's income step, the tray's `panel`) and holds the actions (choose a hex, a tile, a plot, a card, a resource; turn the tile; confirm; decline; back). A new decision starts with nothing chosen because the selection is keyed to the decision's id, not reset by an effect.
  - A class, not the component, holds this because the board, the player area, the footer and the hotkeys all read it and feed it. A component would have to export functions and push its values up through effects.
- **`src/screens/game/DecisionPrompt.svelte`:** the screen part that renders the one `DecisionPanel` (the advance's payment or the open decision), its content snippets and its shelf. It reports the payment's Advance and Cancel, and a shelf card to show in full, to `Game`.
- **`Game.svelte`:** creates the `PromptState` from the view, the seat, the board, the selected advance and the store's move, and renders `DecisionPrompt`. It keeps the turn (the selected space, the income and track questions, the footer) and passes the prompt's derived values to the map, the Capital and Terrain tabs and the overview. Enter confirms through `PromptState`, not by clicking `.rg-decision-panel--confirm`.

## 6. Tests

- Vitest: `panelControls` for every status, label, Confirm and cancel case; `PromptState` for a new decision starting empty, an explore with one tile starting with it chosen, a hex choosing the tile's best turn, a trade's offer and Back, a pick's rows, and the advance's payment.
- Playwright: a card choice (the civilizations on the shelf) and an `options` prompt open at the tracks' centre; the pick tests measure against it too; the existing prompt, explore and hotkey tests keep passing.
- The library's DecisionPanel section shows the centred panel with a shelf (tapestry, tech, civilizations), and the owner approves it there before the game uses it.
