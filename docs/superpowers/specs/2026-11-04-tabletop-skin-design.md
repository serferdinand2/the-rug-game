# The critique's changes as the default look (#174): design

## Intent

On 2026-11-04 the owner asked what would make the game's interface more appealing and easier to use. Claude's critique found an authored look worth keeping, with two gaps. The board is hard to read: where each player stands on a track, what the track symbols mean, and what some small controls are. Turns also give little feedback.

The owner first asked for the changes as a second skin, and Claude drew it as the "Tabletop skin" in the clickable mockup `docs/ui/tabletop-skin.html`, over screenshots of a real three-player game in `docs/ui/screens/issue-174/`. The owner then approved the mockup and changed the plan: the changes become the game's own look.

## Owner's decisions (2026-11-04)

- "Everything except the words on the board is okay." Every screen of the mockup is approved, with Claude's calls listed at its end.
- "Don't do the skin. Just make this default." There is no skin setting, no menu switch and no second look: the changed screens replace today's.
- Words on the board is left out.
- The work goes on main.
- The tracks backdrop stays with #51.

## Goals

- Each player's position on every track reads at a glance.
- A new player can learn the track symbols inside the game.
- The turn's actions sit in one place, with their keys.
- Turns feel like something happened: movement, counts and placements show.
- The game's art shows before the first table and at the end.

## Non-goals

- A new palette or new fonts. The game keeps its colours, fonts, art and layout.
- Words on the board (owner).
- The tracks backdrop, income mat and table art: #51.
- Any rules or server change. This is the client only.
- A phone layout, or screen-reader work (CLAUDE.md rulings).

## Anti-goals

- Hiding information. Every number, name and action on today's screens stays on screen.
- Breaking a decision already made: the prompts at the tracks' centre (#79), the Hand tab (#158), the minimized prompt (#149) and the prompt words (#148) stay as they are.

## The changes

Each component changes its default look. Logic goes in pure helpers tested under Vitest; components stay presentational.

### Reading the board

1. **Tokens on the spaces.** `ProgressLanes` draws no lines and no dashes. Each player's `PlayerToken` stands on the bottom edge of the space reached, half on the space, 28 px. Tokens on the same space stand side by side, 22 px apart and centred on the space. Tokens at the start (position 0) line up from the left inside the first space instead of hanging off the track. The preview of a hovered, affordable space shows a faint token on that space instead of a dash. The token keeps today's slide (#72). A helper, `tokenOffsets(players)`, returns each seat's offset and is tested for shared spaces, the start and 5 players. The track gives the lanes room so a token never covers the next track's tier line.
2. **Calmer capital ground.** `CapitalGrid`'s ground tiles take `filter: saturate(0.7) brightness(0.78) contrast(0.82)` and the relief `saturate(0.7) brightness(0.85)`, from two new tokens. Buildings, landmarks, cubes, outposts, plot highlights and the placement preview are untouched.
3. **Named counters.** `CompletionCounters` shows Rows, Columns or Districts between each counter's mark and its count.
4. **Readable achievements.** `AchievementStrip` uses the base font size, a 20 px VP icon, the VP in gold and a gold-tinted chip. A claimed achievement keeps its claimants' colour squares.
5. **A symbol key.** A new component, `SymbolKey` (board area), lists every glyph the track spaces use with its meaning, in three groups: what you gain, buildings and resources, and how a space reads (or, and, VP for each, the red X, the bonus box, the landmark name). Each symbol is drawn by `SpaceGlyphs` itself from a list in `src/lib/glyphs.js` (`SYMBOL_KEY`), so the key always matches the board. A test checks that every word glyph the board can draw has a key row. How to play shows it as a **Symbols** tab after Advancing on a track.

### Acting on your turn

6. **The footer's actions on the right.** `TurnBar` keeps the heading and its words on the left. Take income, with its explanation, joins Advance, End turn and the other actions on the right.
7. **Keys on the buttons.** The footer's and the decision panel's action buttons show their key in a small key cap, as Show choice does today: Take income I, Advance Enter, End turn Enter, the panel's confirm Enter. The keys come from `src/lib/hotkeys.js`.
8. **Turn buttons for a landmark.** Each landmark in `PlacementTray` has a turn-back and a turn button, with the , and . keys shown as key caps. They call the same rotation the keys do.
9. **Your turn, more visible.** The header draws a 3 px green rule (`--action`) along its bottom edge while it is the viewer's turn, and the footer's label is one size larger. Online, the page title becomes "● Your turn · The Rug Game" and the favicon gets a green dot (`static/favicon-turn.svg`), both from a helper `turnSignal(yours)`. At a hot-seat table the title doesn't change, as the screen is shared. The turn sound already plays (#29).
10. **A folded log.** `TableLog` shows every turn but the last two as its heading and one line: the turn's main event and "+n more". Clicking it opens that turn. The main event is the first line that advances, plays a card, takes income, explores, conquers or invents, else the first line, chosen by `foldTurns(entries)` in `src/lib/log.js`.

### Feedback and art

11. **Motion.** Every motion follows `--duration-*`, `--ease-out` and reduced motion, which makes all of it instant.
    - Tokens slide to their new space.
    - Resource counts and the header's VP count up to a new value over 0.5 s, with a green +n that rises and fades, drawn by a new `CountUp` component.
    - A landmark placed in the capital lands: a 0.3 s drop with a shadow that closes.
12. **This era under the capital.** A new component, `EraNote` (player area), shows the viewer's current era card: its name in Cinzel gold and its text. The Capital tab shows it under the counters, where the tab is empty today. Before an era card is chosen it says so. A helper, `currentEraCard(seat)`, reads it from the seat.
13. **The winner on the results.** A new component, `WinnerShowcase` (results area): the winner's civilization portrait in a gold frame, the civilization's name, the winner's name and VP, and their capital as it ended, read-only. A tie shows each tied winner. The results show it under the standings, to everyone.
14. **Card fans before the game.** A new component, `ArtFan` (ui area), lays three pictures as cards in a fan, tilted −12°, 0° and 12°, with `--shadow-float`. The landing page and the lobby show two fans beside their panels: three civilization portraits on the left, a landmark and two tapestry pictures on the right. The screen picks them at random on each visit from the art catalog, with the store's injected random. On the lobby they sit outside its 1000 px panels.

## What doesn't change

- The World Map: it already fills its area's height. The critique said it floats small, which was wrong for this view.
- The card gallery page.
- The header menu.

## Tests

- New cases for `tokenOffsets`, `foldTurns` (`tests/client-log.test.mjs`), `SYMBOL_KEY` (`tests/client-glyphs.test.mjs`), `turnSignal` and `currentEraCard`.
- `tests/library.test.mjs` checks the new components' library sections.
- Browser tests that read the old lanes, footer or log are updated to the new look.
- A new browser test, `tests/browser/table-look.test.mjs`: a token stands on a track space, the counters are named, the Symbols tab opens, and Take income sits on the footer's right. It ends and leaves its table.

## The component library

Each changed component's section shows the new look. The new components each get a section and a row in `src/lib/components/README.md`.

## Documentation

- The README's "Current interface" and `docs/ui/README.md` get new screenshots from the running game.
- `docs/ui/README.md` notes that the mockup was approved as the default look.
- `docs/status.md` gains #174's entry and summary line.

## Claude's calls, approved with the mockup

1. Tokens stand on the bottom edge of their space, so they cover no symbol or landmark name.
2. The capital ground's filter values.
3. This era's card fills the Capital tab's empty space, rather than an income preview.
4. The log keeps the last two turns open and folds the rest.
5. Keys show on the footer and panel buttons only, not on the player tabs.
6. The card fans pick new art on each visit.
7. Online only: the tab title and favicon change on your turn; a hot-seat table keeps its title.
8. Everyone sees the winner's showcase on the results.

## Order of work

Test first for each step, then the component, its library section, and a look in the game:

1. Tokens on the spaces.
2. The capital: calm ground, named counters, this era, the landing landmark.
3. The footer and panel: actions on the right, keys, turn buttons, your turn.
4. The achievements and the folded log.
5. The symbol key.
6. Counting up.
7. The results, the landing page and the lobby.
8. The browser test, screenshots, the README, `docs/ui/README.md` and `docs/status.md`.
