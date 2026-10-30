# The track board for any number of tracks (#120): design

Written 2026-10-30. #120 is in M13 · Refactor (Track board), found by the client scan (#80). #35, Arts & Architecture's fifth track, waits for it. Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`TrackBoard` sized its spaces for exactly four tracks: `(100cqh - 3 * var(--space-4)) / 4 - 53px`, where 53px was `Track`'s rows added up by hand (two 18px rows, three 2px gaps, the lanes' 2px padding and one lane's 9px box), and `100cqw / 12` for twelve spaces. With a fifth track the board overflows. `BoardSwitcher`'s tracks icon hard-coded four bands, read from `TRACKS[index]`, and drew its two icons in two near-identical `<svg>` blocks. `TrackSpace` decided the last space with `space === SPACE_COUNT` (and `ExplorationFace` with `space === 12`) while `Track` lays out `spaces.length`.

**Done when** the board and the switcher follow the number of tracks they are given, the library shows five tracks fitting at 1920×1080, and the base game's four-track board and switcher look exactly as before.

## 2. The changes

- **Tokens.** `--track-heading` and `--track-prices` (both 18px) in `tokens.css` are `Track`'s first two rows. `Track` uses them in `grid-template-rows`.
- **`TrackBoard`** sets `--rg-track-board-count` (the tracks, at least 1) and `--rg-track-board-spaces` (the first track's spaces, `SPACE_COUNT` without one) beside `--rg-track-board-lanes`. Its CSS adds up a track's chrome from the tokens, `--rg-track-board-chrome: heading + prices + 4 × --space-1 + (lanes − 1) × --progress-lane + 3 × --progress-line`, and a space's height is `(100cqh − (count − 1) × --space-4) / count − chrome`, between 48px and `100cqw / spaces × 1.25`. With four tracks of twelve spaces each term is the old number, so the base board is unchanged.
- **`src/lib/board-icons.js`** holds the switcher's icons as data: `trackMarks(tracks)` (one right-pointing band per track, filling the same box from 2 to 31.5 with half a unit between bands, so four give the original four bands exactly), `MAP_MARKS` (the seven hexes, moved as they were), `ICON_VIEWBOX` and `boardChoices(tracks)`, each choice with its `value`, `title`, `viewBox` and `marks`.
- **`BoardSwitcher`** takes an optional `tracks` prop (track ids; the base game's four by default) and draws both icons in one `<svg>` loop over `boardChoices(tracks)`. The tracks icon keeps its narrower width and `preserveAspectRatio="none"`, and its marks their thinner stroke. `Game.svelte` passes nothing yet, so it still shows four bands; #35 passes the table's tracks.
- **`last`.** `Track` passes `last={index + 1 === spaces.length}` to `TrackSpace`, which passes it to `ExplorationFace`. Both take `last` (default false) and no longer compare with 12. The library's last-space examples pass `last`.
- **Library.** `TrackBoard` and `BoardSwitcher` each get a five-track example. The fifth is a stand-in under the arts track's id: on the board, a copy of Science named "Arts (stand-in)"; its colour, `--arts`, is set on the example's wrapper to `--arts-architecture`. No arts content, colour token or `TrackId` is added: that is #35's.

Nothing in the game changes.

## 3. Tests

Vitest, in the new `tests/track-layout.test.mjs`:
- four `trackMarks` are the four original point strings and track colours; five share one height, half a unit apart, from 2 to 31.5;
- `boardChoices` carries each choice's title, viewBox and marks;
- `BoardSwitcher` has one `<svg>` in its source and draws four bands by default, five for five tracks, and seven hexes;
- the two tokens are 18px, `Track`'s rows use them, `TrackBoard`'s CSS uses them and the lane tokens, and has no `53px`, `/ 4` or `/ 12`;
- `TrackBoard` sets the counts of tracks, spaces and lanes;
- `Track` marks only its final space as the last, for twelve spaces and for nine;
- `TrackSpace` and `ExplorationFace` take `last` from their parent and no longer read `SPACE_COUNT` or 12.

Pixels: in the library at 1920×1080, screenshots of the four-track board, both four-band switchers, the Exploration faces and every `TrackSpace` example but one are byte-identical before and after. The one that differs is the selected Ships tile, beside the Mechs example, whose label grew by the word `last`; it moved by a fraction of a pixel.

Playwright: no browser test reads the board's layout directly. `setup-prompts` and `track-text` draw the tracks in a game (both failed on main before this, since #85); `hotkeys` switches the board.

## 4. Hand-offs

#35 adds the arts track's colour, id, spaces and symbol, and passes the table's tracks to `BoardSwitcher`. At 1920×1080 five tracks leave a space about 95px tall with four players, against 140px for four tracks: the board fits, but a dense Exploration face, such as Ships' "controlled" or Airplanes' "anywhere", crowds its bonus band. #35 should look at the arts track's spaces at that height. #127's `TRACK_KEYS` already follows the engine's tracks.
