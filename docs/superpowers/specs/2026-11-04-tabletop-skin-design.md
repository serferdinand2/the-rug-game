# The Tabletop skin (#174): design

## Intent

On 2026-11-04 the owner asked what would make the game's interface more appealing and easier to use. Claude's critique found an authored look worth keeping, with two gaps. The board is hard to read: where each player stands on a track, what the track symbols mean, and what some small controls are. Turns also give little feedback. The owner then asked for a new skin that holds every change from the critique, switched from the header menu, with the default left as it is.

So the game gets a second skin, **Tabletop**. A player switches it on in the header menu. The current look stays the default and must not change in any way.

## Owner's decisions (2026-11-04)

- A new skin, changed from the hamburger menu.
- The default skin stays exactly as it is.
- Every change from the critique goes into the new skin, including the ones that change behaviour rather than looks.
- Claude stated in chat that the tracks backdrop stays with #51 and that the work would take a design, a mockup for approval, then 8 to 12 hours of building with no subagents. The owner answered "go ahead".

The clickable mockup is `docs/ui/tabletop-skin.html`, over screenshots of a real three-player game in `docs/ui/screens/issue-174/`. The screenshots were made by injecting a mock of the skin into the running game, so the looks shown are reachable with the real components.

## Goals

- Each player's position on every track reads at a glance.
- A new player can learn the track symbols inside the game.
- The turn's actions sit in one place, with their keys.
- Turns feel like something happened: movement, counts and placements show.
- The game's art shows before the first table and at the end.

## Non-goals

- A new palette, new fonts or a light theme. The owner didn't describe a new mood, so the skin keeps the game's colours, fonts, art and layout and is defined by the changes below. This is Claude's call (see "Calls to check").
- The tracks backdrop, income mat and table art: #51.
- Any rules or server change. The skin is the client only.
- A phone layout, or screen-reader work (CLAUDE.md rulings).

## Anti-goals

- Anything visible in the default skin. With Tabletop off, every screen, the component library's existing examples and every existing test must stay as they are. The only addition to the default look is the one menu switch that turns Tabletop on.
- Two copies of a component. Each change is a prop or a state of the existing component, so the two skins can't drift apart.
- Hiding information. Every number, name and action of the default skin is still on screen in Tabletop.

## How the skin works

- **The setting.** `src/lib/skin.js`, shaped like `card-theme.js` (#167): `SKIN = 'rg-skin'`, `skinSaved(prefs)` returns `'classic'` or `'tabletop'`, `saveSkin(prefs, skin)`. A second key, `BOARD_WORDS = 'rg-board-words'`, with `boardWordsSaved` and `saveBoardWords`. Anything unknown in storage reads as the default. It is remembered in this browser only, like Dark cards, and changes only this player's screen.
- **The store.** `src/lib/game.svelte.js` gains `skin` and `boardWords` as `$state`, read from `prefs` in the constructor, with `setSkin` and `setBoardWords`, as `darkCards` has.
- **The page.** `App.svelte` sets `document.documentElement.dataset.skin` beside `dataset.cards`. Tokens that only Tabletop uses go under `:root[data-skin='tabletop']` in `tokens.css`. Nothing in the default block of `tokens.css` changes.
- **The menu.** `menuItems()` in `src/lib/menu.js` takes `skin` and `boardWords`. Every screen with a menu lists **Tabletop skin** as a switch right after Dark cards. While Tabletop is on, **Words on the board** follows it. `PageHeader.svelte` handles the two ids, as it does `cards`.
- **The components.** Screens pass the skin down as plain props named for what they do, never a `skin` prop, so each state is shown in the component library like any other. A component's default props draw today's look.

## The changes

Each item names its component, the prop it gains, and the pure helper that holds its logic, so the logic is tested under Vitest.

### Reading the board

1. **Tokens on the spaces.** `ProgressLanes` gains `look: 'lines' | 'tokens'`, default `'lines'`. In `'tokens'`, the lines and dashes are not drawn. Each player's `PlayerToken` stands on the bottom edge of the space reached, half on the space, 28 px. Tokens on the same space stand side by side, 22 px apart and centred on the space. Tokens at the start (position 0) line up from the left inside the first space instead of hanging off the track. The preview of a hovered, affordable space shows a 50% token on that space instead of a dash. The token keeps today's slide (#72). A helper, `tokenOffsets(players)`, returns each seat's offset and is tested for shared spaces, the start and 5 players. The track gives the lanes room so a token never covers the next track's tier line.
2. **Calmer capital ground.** `CapitalGrid` gains `calm: boolean`. When on, the ground tiles take `filter: saturate(0.7) brightness(0.78) contrast(0.82)` and the relief `saturate(0.7) brightness(0.85)`, from two new Tabletop tokens. Buildings, landmarks, cubes, outposts, plot highlights and the placement preview are untouched. The values are the mockup's and may be tuned once in the library.
3. **Named counters.** `CompletionCounters` gains `named: boolean`: each counter shows Rows, Columns or Districts between its mark and its count.
4. **Readable achievements.** `AchievementStrip` gains `size: 'compact' | 'large'`. Large uses the base font size, a 20 px VP icon, the VP in gold and a gold-tinted chip. A claimed achievement keeps its claimants' colour squares, at 12 px.
5. **A symbol key.** A new component, `SymbolKey` (board area), lists every glyph the track spaces use with its meaning, in three groups: what you gain, buildings and resources, and how a space reads (or, and, VP for each, the red X, the bonus box, the landmark name). Each symbol is drawn by `SpaceGlyphs` itself from a glyph list in `src/lib/glyphs.js` (`SYMBOL_KEY`), so the key always matches the board. A test checks that every word glyph `glyphs.js` can produce has a key row. `RulesPanel` shows it as a **Symbols** tab after Advancing on a track, only in Tabletop.
6. **Words on the board.** `SpaceGlyphs` gains `words: boolean`. When on, each word glyph is drawn as its short word (Tile ×2, Explore, Tapestry, Conquer, Invent, Science die, Upgrade, Advance) instead of its symbol, as the board was before #85. Resources, buildings and tracks keep their art. `TrackSpace` passes it through. The menu offers it only in Tabletop. The words must fit every space at 1920×1080. The browser test `track-text` gains a words-mode case.

### Acting on your turn

7. **The footer's actions on the right.** `TurnBar` gains `actions: 'split' | 'right'`. In `'right'`, the heading and its words stay on the left, and Take income with its explanation joins Advance, End turn and the other actions on the right, in that order. `TurnFooter` passes it.
8. **Keys on the buttons.** `TurnBar` and `DecisionPanel` gain `keys: boolean`. When on, each action button shows its key in a small key cap, as Show choice does today: Take income I, Advance Enter, End turn Enter, Confirm Enter, Place Enter. The keys come from `src/lib/hotkeys.js`, not typed again.
9. **Turn buttons for a landmark.** `PlacementTray` gains `onPlacementTrayTurn`. When given, each landmark in the tray has a turn-back and a turn button, with the , and . keys shown as key caps. They call the same rotation the keys do. Only Tabletop passes it.
10. **Your turn, more visible.** `TopBar` gains `yours: boolean`: a 3 px green rule (`--action`) along its bottom edge. The footer's label is one size larger. Online, while it is the viewer's turn, the page title becomes "● Your turn · The Rug Game" and the favicon gets a green dot (`static/favicon-turn.svg`), both from a helper `turnSignal(yours)`. At a hot-seat table the title doesn't change, as the screen is shared. The turn sound already plays (#29).
11. **A folded log.** `TableLog` gains `fold: boolean`. When on, every turn but the last two shows its heading and one line: the turn's main event and "+n more". Clicking it opens that turn. The main event is the first line that advances, plays a card, takes income, explores, conquers or invents, else the first line, chosen by `foldTurns(entries)` in `src/lib/log.js`.

### Feedback and art

12. **Motion.** Every motion follows `--duration-*`, `--ease-out` and reduced motion, which makes all of it instant.
    - Tokens slide to their new space, as the lines do today.
    - `ResourceChip` and the header's VP count up to a new value over 0.5 s, with a green +n that rises and fades. A new `CountUp` component draws the number, and `PlayerChip` and `ResourceChip` use it when given `counting`.
    - A landmark placed in the capital lands: a 0.3 s drop with a shadow that closes. `CapitalGrid` gains `land: boolean` for its fresh pieces.
13. **This era under the capital.** A new component, `EraNote` (player area), shows the viewer's current era card: its name in Cinzel gold and its text. The Capital tab shows it under the counters in Tabletop, where the tab is empty today. Before an era card is chosen it says "No tapestry card this era yet." It is read from the same seat data as the Eras tab, through a helper `currentEraCard(seat)`.
14. **The winner on the results.** A new component, `WinnerShowcase` (results area): the winner's civilization portrait in a gold frame, the civilization's name, the winner's name and VP, and their capital as it ended, drawn by `CapitalGrid` at 250 px, read-only, calm. A tie shows each tied winner. `Results.svelte` puts it under the standings in Tabletop.
15. **Card fans before the game.** A new component, `ArtFan` (ui area), lays three pieces of art as cards in a fan, tilted −12°, 0° and 12°, with `--shadow-float`. The landing page and the lobby show two fans beside their panels in Tabletop: three civilization portraits on the left, a landmark and two tapestry pictures on the right. The screen picks them at random on each visit from the art catalog (`src/lib/art/`), with the injected random, never `Math.random()`. On the lobby they sit outside its 1000 px panels.

## What doesn't change

- The World Map: it already fills its area's height. The critique said it floats small, which was wrong for this view.
- The card gallery page, which keeps its own look.
- The default skin, in every screen and test.

## Tests

- `tests/client-skin.test.mjs`: saving and reading both settings, and unknown values read as the default.
- `tests/client-menu.test.mjs`: the Tabletop skin switch on every screen, checked to match, and Words on the board only while Tabletop is on.
- New cases in `tests/client-glyphs.test.mjs` (`SYMBOL_KEY` covers every word glyph), `tests/client-log.test.mjs` (`foldTurns`), and new tests for `tokenOffsets`, `turnSignal` and `currentEraCard`.
- `tests/library.test.mjs` checks the new components' library sections, as for any component.
- A new browser test, `tests/browser/skin.test.mjs`: switch Tabletop on from the menu, see a token on a track space, the named counters and the Symbols tab; reload and find it still on; switch it off and find the lanes back. It ends and leaves its table.
- Every existing unit and browser test passes unchanged, which shows the default skin didn't move.

## The component library

Each changed component's section gains Tabletop examples, each labelled with the prop that draws it. The new components each get a section and a row in `src/lib/components/README.md`. The owner approves the built skin there and in a running game, as for every visual change.

## Documentation

- `README.md`'s "Current interface" gains a Tabletop section with screenshots from the running game.
- `docs/ui/README.md` gains the skin, its switch and its screenshots.
- `docs/status.md` gains #174's entry and summary line.

## Calls to check

These are Claude's calls, made without a question round. The owner can change any of them while reviewing the mockup.

1. The name **Tabletop**: tokens and cards on the table are what the skin adds.
2. No new colours or fonts: the skin is the critique's changes in the game's own look.
3. Tokens stand on the bottom edge of their space rather than inside it, so they cover no symbol or landmark name.
4. The capital ground's filter values.
5. This era's card fills the Capital tab's empty space. The critique also mentioned an income preview, which would need new engine sums.
6. **Words on the board** is a second switch offered only in Tabletop, and the **Symbols** tab shows only in Tabletop.
7. The log keeps the last two turns open and folds the rest.
8. Keys show on the footer and panel buttons only, not on the player tabs.
9. The card fans pick new art on each visit.
10. Online only: the tab title and favicon change on your turn; a hot-seat table keeps its title.
11. Everyone sees the winner's showcase on the results, not only the winner.

## Order of work

Test first for each step, then the component, its library examples, and a look in the game:

1. The setting, the store, the menu and `data-skin`.
2. Tokens on the spaces.
3. The capital: calm ground, named counters, this era, the landing landmark.
4. The footer and panel: actions on the right, keys, turn buttons, your turn.
5. The achievements and the folded log.
6. The symbol key and words on the board.
7. Counting up.
8. The results, the landing page and the lobby.
9. The browser test, screenshots, the README, `docs/ui/README.md` and `docs/status.md`.
