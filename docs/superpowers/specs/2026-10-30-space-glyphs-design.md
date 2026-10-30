# A track space's glyphs as their own component (#115): design

Written 2026-10-30. #115 is in M13 · Refactor (Track board), found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`TrackSpace.svelte` had grown to about 1,400 lines. Besides the pointed shell, the name, the landmark, the number and the hover, it drew the whole vocabulary of a space's symbols: a 140-line `{#snippet symbol}` (resources, buildings, tracks, the arrows, Upgrade, the circle and square benefits, Score capital, Restart, Repeat, May refresh, the card and piece icons, words, VP and the joints), about 250 lines of glyph CSS, and the glyph parts of its three container-query steps. #63 adds the landmark's shape to the space's body and #60 may show an effect's source with the same symbols, so the glyphs move out. The shell and the fill also repeated the same clip-path polygon for each of the three shapes (a middle, the first and the last space).

**Done when** `SpaceGlyphs` draws every glyph, `TrackSpace` keeps the shell, name, landmark, number and hover, each space shape is written once for the shell and the fill, and the board is pixel-identical at every container size.

## 2. The changes

- **`src/lib/components/board/SpaceGlyphs.svelte`** draws a list of `Glyph`s (`glyphs`, from `src/lib/glyphs.js`) with the markup the snippet had. Its root is a `display: contents` span, so each glyph stays a flex or grid item of the place it is drawn in: the benefit's row, the Computers rows, the Mechs grid, the bonus rule, the progress columns. That is why it takes a list rather than one glyph: one root around a run of glyphs, and none of the parent's layouts change.
- **Its `variant`** says where it is drawn, because the space shrinks its glyphs in two places:
  - `benefit` (the default): the benefit's size;
  - `dense`: Glass, Steel and Plastic, whose benefit and bonus share a short space, draw their pictures at 18px (buildings and the VP cup keep their size) and their joints shorter;
  - `bonus`: the bonus rule draws its pictures at 18px (20px at the largest step), its words, joints and VP gold and without a box.

  These were `TrackSpace` selectors (`.rg-track-space--dense .rg-track-space--benefit …`, `.rg-track-space--bonus-rule …`); as classes on `SpaceGlyphs`' root they keep their order and, but for `dense`, which loses one class, their specificity. No rule the dense space meets changes its winner.
- **Sizes come from inherited custom properties.** `--rg-space-glyphs-text` sets the counts' and words' text size (by default the smallest, `--font-size-3xs`); `TrackSpace`'s body sets it from its `--rg-track-space-text`, which its container steps raise. `--rg-vp-cup-size` stays the VP cup's size, as `ExplorationFace` reads it too.
- **Its `@container` rules** (the short step's tighter words and red X, the two large steps' larger pictures) still answer to `TrackSpace`'s container: the root button is the nearest size container, and the glyphs' root, being `display: contents`, is none. The three thresholds are therefore written in both files; a comment in each says so.
- **What `TrackSpace` keeps** of the glyphs is the layout of its special spaces, which places the glyphs rather than drawing them: the Mechs grid, the Computers `+` at 15px and AI Singularity's 17px resources. These rules reach into `SpaceGlyphs` with `:global()` on element and position selectors only (`> * > :nth-child(2)`, `img`), so no component styles another's classes, as `tests/library.test.mjs` requires. The bonus rule's `:` is `TrackSpace`'s own (`--then`), with its one rule.
- **Every `+`, `/` and VP that `TrackSpace` wrote by hand is a glyph now**: Computers' and AI Singularity's `+`, and Alien Biology's `/` and 5 VP. Electronics' and Nanotechnology's `+` joins the other inserted pluses (Metallurgy and Rubber's May refresh, the military spaces) in one `plusBefore()` helper, so their benefit draws through the plain branch.
- **One shape per variant.** `--rg-track-space-shape` is set on the root for the middle, first and last space, and the shell and the fill clip to it. The root's own clip-path is a different polygon (its box ends where the tip starts), so it keeps its three.
- **`Track` passes `{...entry}`** to each `TrackSpace` instead of the five entry fields one by one; a `TrackSpaceEntry` holds exactly those props.
- **A dead rule goes.** `.rg-track-space--card-icon { min-width: 24px; … }` never applied: the class sits on `CardSymbol`'s image, which a parent's scoped CSS doesn't reach, so the card symbols kept their own 24px at every step (as they still do). The scoped `.rg-space-glyphs--symbol-icon` rules don't reach them either; the class stays only for `:not(.rg-space-glyphs--card-icon)`.
- **Class names.** The glyph classes become `rg-space-glyphs--…` (`--resource`, `--word`, `--vp` and so on). `tests/browser/track-text.test.mjs` selected `.rg-track-space--resource img`; it selects `.rg-space-glyphs--resource img` now. `--benefit`, `--bonus`, `--body` and `--name` stay `TrackSpace`'s.

Nothing on screen changes.

## 3. Tests

Vitest:
- `tests/space-glyphs.test.mjs` renders `SpaceGlyphs` on the server: each kind of glyph draws its art or word, counts draw as ×N except where the picture repeats (tiles, space tiles, Invent), a crossed glyph carries the X class, and the variants set their class.
- It also renders every real space through `TrackSpace` and checks that all its glyphs come from `SpaceGlyphs` (no `rg-track-space--` glyph class left), and guards the source: no `{#snippet symbol}`, and the shell and the fill clip to `var(--rg-track-space-shape)`.
- `tests/track-space.test.mjs` (every space draws; the progress columns) and `tests/library.test.mjs` pass unchanged.

Pixels: a Playwright script captures the library's TrackBoard (at its own size and at five forced sizes covering the short, the reference and both large steps), TrackSpace, Track and ExplorationFace sections, before and after: every element's box and computed font, colour, background, padding, margin, transforms and clip-path, and the screenshots byte for byte.

## 4. Hand-offs

#63 adds the landmark's shape to `TrackSpace`'s body, which no longer holds the glyphs. #60 can draw an effect's source with `SpaceGlyphs`. #81 edits the hover, which stays in `Track` and `TrackSpace`. #120's tracks change neither file's glyphs.
