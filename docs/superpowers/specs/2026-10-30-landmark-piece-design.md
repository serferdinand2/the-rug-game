# LandmarkPiece owns its drag data, focus and keys (#111): design

Written 2026-10-30. #111 is in M13 · Refactor (Capital and map), found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape. #112, which lets the engine's options decide where a landmark moves, builds on this and changes the same `CapitalGrid` handlers.

## 1. What and why

`CapitalGrid` and `PlacementTray` both reach into `LandmarkPiece`'s markup:
- each keeps a `seen` set and focuses a new piece with `querySelector('[data-piece=…] [tabindex="0"]')` (the tray with `[data-item=…]`);
- each sets the drag data and the drag image itself, from `root.querySelector('svg')`, with two grab formulas: the grid scales the pointer's place in the piece's box by the shape's size, the tray divides it by `TRAY_PLOT_SIZE` and clamps it;
- the grid parses `GRAB_TYPE`'s `"x y"` itself on a drop.

The piece's own keys are an `ARROWS` map and a five-branch `if` chain in the component, its label a nested ternary, and its three control titles are typed (`Rotate (. or ,)`, `Confirm (Enter)`, `Return (Delete)`), apart from How to play's shortcut list. `tests/client-shortcuts.test.mjs` checks a typed list of keys, not the keys the piece answers to. `TurnControl` types the `,` and `.` keys that `hotkeys.js` answers to.

**Done when** no parent queries `LandmarkPiece`'s markup, the piece's keys and words are a tested module whose keys How to play lists, and nothing a player sees or does changes.

## 2. The changes

- **`TURN_KEYS`** in `src/lib/hotkeys.js`: `{ back: ',', forward: '.' }`, the keys that turn an explore's tile and a placed landmark (#83). `hotkeyAction` reads them, as it reads `TAB_KEYS`.
- **`src/lib/landmark-keys.js`**, the piece's keys and words:
  - `MOVE_KEYS` (the arrows as row and column steps, in How to play's order ← ↑ → ↓), `ROTATE_KEYS` (`.` then `,`, from `TURN_KEYS`), `CONFIRM_KEY` (`Enter`), `RETURN_KEYS` (`Backspace`, `Delete`) and `keyName(key)`, which shows an arrow as its symbol.
  - `landmarkKeyAction(key, state, modifiers)`: `{ type: 'move', row, col }`, `select`, `rotate`, `confirm`, `return` or null, with the component's rules: nothing with Ctrl, Alt or Cmd or on a locked piece; an arrow moves in the tray and on the grid; Space selects, and Enter too in the tray; on the grid Enter confirms, `.` and `,` rotate and Backspace and Delete return it.
  - `landmarkLabel(name, plots, state)`: the label as it is now, its keys named from the same constants ("full stop or comma").
  - `LANDMARK_TITLES`: the three control titles, built from the constants by `keyTitle(word, keys)`; the return control names Delete only, as now.
- **`shortcuts.js`** lists the Exploring and placing group from `TURN_KEYS` and `landmark-keys.js`, so the piece, its titles and How to play read one set of keys. The list's words and order stay the same.
- **`TurnControl`** builds its two titles and its hint from `TURN_KEYS`; they read as now.
- **The drag data** in `src/lib/placement.js`, next to `GRAB_TYPE`:
  - `grabAt(box, clientX, clientY, shape)`: the pointer's place in the shape's box, clamped to it, in pixels (for the drag image) and in plots (the grab). One formula for both: the shape's box is `cols × TRAY_PLOT_SIZE` wide in the tray, so plots are pixels ÷ 29 as before, and on the grid the box is the piece's, so it is the grid's old formula.
  - `writeGrab(transfer, grab)` and `readGrab(transfer)`: the `"x y"` under `GRAB_TYPE`, and null when it is missing or not two numbers.
- **`LandmarkPiece`**:
  - is draggable unless locked; its `dragstart` sets the id as `text/plain`, writes the grab, allows a move and drags its picture from where it was grabbed, then fires `onLandmarkPieceDragStart` with `{ id, grab }`; its `dragend` fires `onLandmarkPieceDragEnd` with the same. The parents no longer pass `draggable`, `ondragstart` or `ondragend`.
  - exports `focus()`, which focuses its pressable body.
  - reads `landmarkKeyAction`, `landmarkLabel` and `LANDMARK_TITLES`; `ARROWS`, the ternary and the `if` chain go. `controlsRight` stays: it is layout, and #110 extracts the drawing.
  - keeps the `dragging` prop: the parents still know which piece is dragged (the grid needs it for its drop check).
- **`CapitalGrid`** keeps the grab from `onLandmarkPieceDragStart` for its `dragover` check, reads a drop's with `readGrab`, and focuses a newly placed piece through its `bind:this` instance's `focus()`, after `tick()`, so the binding is set. **`PlacementTray`** does the same for an item that comes back, and only tracks which item is dragged.

**What stays.** `PlayerTabs` still relays the grid's drag to the tray (`dragging`), which the issue lists but does not propose to change; it is #95's screen. The `seen` sets stay in the parents, because only they know which piece is new. The library's interactive capital example said "R rotates", stale since #83; it now says "full stop or comma rotates".

Nothing in the game changes on screen or under the keyboard or the mouse.

## 3. Tests

Vitest:
- `tests/client-landmark-keys.test.mjs`: every key in each state, modifiers and the locked piece; the three labels word for word; the three titles word for word; every key the piece answers to (but Space, a button's own key) and every key a title names is in How to play's Exploring and placing group; `TurnControl`'s keys are `TURN_KEYS`. A source guard: `CapitalGrid` and `PlacementTray` query no markup (`querySelector`), set no drag image and read no `GRAB_TYPE`; `LandmarkPiece` and `TurnControl` type no key in a title.
- `tests/placement.test.mjs`: `grabAt` in the tray and on the grid, clamped outside the box; `writeGrab` and `readGrab` round trip, and `readGrab` returns null for missing or broken data.
- `tests/client-shortcuts.test.mjs`: the listed keys come from `TURN_KEYS` and `landmark-keys.js` rather than a typed list.
- `tests/client-hotkeys.test.mjs` passes unchanged.

Playwright: no browser test drags or arrows a landmark today. `library.test.mjs`' capital tests (#82, including the landmark over the edge, which finds `[data-piece]`), `player-area.test.mjs` and `hotkeys.test.mjs` cover the parts around it and must pass unchanged.

## 4. Hand-offs

#112 replaces `CapitalGrid`'s snapping in the drop, move and rotate handlers with the engine's options; the grab arrives in `onLandmarkPieceDragStart` and `readGrab`, so it needs no drag code. #110 extracts the piece's drawing; the drag image is still the piece's own `svg`. #84's stopgap title fix is now the titles' one source.
