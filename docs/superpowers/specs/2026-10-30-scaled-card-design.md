# Scale cards one way (#92): design

Written 2026-10-30. #92 is in M13 · Refactor (Cards), found by the client scan (#80). It waited for #79, which made the shelf and the panel one centred stack. Every decision here is **(my call)**; the issue gave the shape. #94, #95 and #118 build on it.

## 1. What and why

Cards are shown smaller in five places, three ways:

- `ScaledTapestryCard` scales a tapestry card and measures its height (the shelf at 0.7, the current era at 0.6, the hand at 0.42).
- Tech cards are scaled by hand, with 425×298 typed in each time: the Tech tab's rows and its display (`PlayerTabs.svelte`, `.rg-player-tabs--scale` and `--scaled`, at 0.42), the players overview (`PlayersOverview.svelte`, at 0.4) and the shelf (`CardShelf.svelte`, `SCALED.tech`, at 0.65).
- The shelf measures civilization cards itself and scales them to fit its room (`civHeights`, `CIV_WIDTH`, its own `--fit` and `--scaled` spans).

The Civ tab also reuses `.rg-player-tabs--scale` at scale 1 with `height: auto`, where `calc(auto * 1)` is invalid and the height falls back to `auto`.

And the shelf fans more than four tapestry cards with its own copy of `CardFan`'s overlap (`margin-left: -72px`) and raise, because `CardFan` could not disable a card or choose several.

**Done when** no caller types a card's size, every scaled card goes through one `ScaledCard`, and the shelf lays its cards out with `CardFan`. Nothing on screen changes: every card on every screen and in the library keeps its size, place and look.

## 2. The changes

- **`src/lib/cards/card-sizes.js`** holds `CARD_SIZES`, each frame's size before scaling, as the card styles draw it: a tech card 425×298 (`.rg-tech-layout`: 40 + 174 + 50 + 30 px rows and a 2 px border), a tapestry card 319 wide and a civilization card 425 wide. Tapestry and civilization cards are as tall as their content, so they have no height. A test checks the numbers against `card-layouts.css` and `card-patterns.css`.
- **`src/lib/components/player/ScaledCard.svelte`** draws any card smaller. It takes `scale`, the card's unscaled `width`, an optional `height` and a `children` snippet. Its box is the scaled size, and the card inside keeps its layout at full size and is scaled as a whole from the top left, as `ScaledTapestryCard` did. Without a `height` it measures the card; the measured height is the bindable `measuredHeight`, so the shelf can fit civilization cards to its room. With a `height` the card's own box takes that size, so something without a size of its own, such as the shelf's tech deck, fills it. Callers spread a size from `CARD_SIZES`: `<ScaledCard scale={0.42} {...CARD_SIZES.tech}>`.
- **`ScaledTapestryCard` goes.** Its three callers use `ScaledCard` with `CARD_SIZES.tapestry`; its library section becomes `ScaledCard`'s, with the tapestry, tech and civilization scales the game uses.
- **The Tech tab, the overview and the shelf** draw their tech cards in `ScaledCard` with `CARD_SIZES.tech`, at the same scales. `.rg-player-tabs--scale`, `--scaled`, `.rg-players-overview--scale`, `--scaled` and the shelf's `SCALED`, `--scaled` and `--fit` go.
- **The Civ tab** has no scale: its civilization card sits in a plain `.rg-player-tabs--civ` box, `position: relative` and `width: fit-content`, which is the 425 px the old box had, without a typed size.
- **`CardFan`** gains:
  - `selected`: one index or several (`number | number[] | null`). An array, even an empty one, means a choice is open, so every card says whether it is pressed;
  - `disabled`: the indexes of cards that can't be pressed now;
  - `labels`: each card's name for assistive technology, as the shelf's buttons had (the owner's 2026-10-28 ruling keeps the labels already built);
  - `look`: `'hand'` (the default: the hovered card rises, the chosen one has the focus outline) or `'shelf'` (the hovered card and the chosen one are outlined in gold, the chosen one glows and lifts, a disabled card is faded), the shelf's look moved over unchanged;
  - `lift` (default true): in the shelf look, whether the chosen card lifts. Civilization cards and capital mats stay where they stand, so the outline fits them (#58);
  - `key`: each card's identity, so a card keeps its button when the items change (left out, its index, as before). The shelf keys by answer index, as its own loop did, so a new decision's cards are new buttons and each civilization card is measured afresh.

  The hand keeps its look: its rules move under `.rg-card-fan--hand`, with the same values.
- **`CardShelf`** fans with `CardFan`. Its root stays the scrolling, centred row that measures its height; inside it, one `CardFan` with the shelf look holds the buttons, with an overlap of 72 when more than four tapestry cards fan out and the shelf's gaps (10 px, 18 px for civilizations and mats) otherwise. The shelf maps its answers' indexes to the fan's positions and back, so its props and events are as they were. The row's name moves to the fan's group, so there is still one group of that name.

## 3. Pixel identity

What keeps each place unchanged:

- `ScaledCard`'s box is `width × scale` by `height × scale` (or the measured height), `position: relative`, `display: block`, `flex: none`, as `ScaledTapestryCard`, `.rg-player-tabs--scale` and the shelf's spans were. Its card is absolutely placed at the top left with `transform: scale()` from the top left, as before. The card's box is given its unscaled width (and height, when known); each card already was that wide, since its frame has a fixed width.
- In the overview the old box had no `flex: none`; it never shrank, since the row wraps and the detail column is wider than 170 px.
- The shelf's buttons keep the browser's button font and colour that civilization cards inherit, and the shelf's shadow, outlines, glow, lift and fading, with the same precedence (a chosen card's outline wins over the hover's). The fan's root takes the shelf's bottom alignment and gaps and no padding; the shelf's own root keeps its padding, scrolling and `justify-content: safe center`, now around one row, which scrolls and centres the same.
- The shelf's buttons are now `.rg-card-fan--card`; `setup-prompts`, `decision-prompt`, `card-layouts` and `player-area` browser tests change their selectors only.

## 4. Tests

Vitest, `tests/scaled-card.test.mjs`:
- `CARD_SIZES` matches the card styles.
- `ScaledCard` drawn on the server: its box and its card's box at a given size; without a height, the card's box has none.
- `CardFan`: several selected, disabled cards, labels, the shelf look and `lift`, and the hand's markup as before.
- `CardShelf` draws one `CardFan`: its buttons, pressed and disabled by answer index, the 72 px overlap when fanned, the tech deck in a `ScaledCard`.
- A source guard: `PlayerTabs`, `PlayersOverview` and `CardShelf` type no card size, and nothing imports `ScaledTapestryCard`.

Playwright (run after merging): setup-prompts, pick-prompts, decision-prompt, card-layouts, player-area, explore-prompt, library and civ-card pass with their selectors updated.

## 5. Hand-offs

#118, #94 and #95 build on `ScaledCard` and the fan's `selected` and `disabled`. The gallery (`src/gallery/`) shows cards at full size and is unchanged. `src/styles/card-layouts.css` still holds `.rg-card-scale`, the static mockups' scaler, which nothing in `src/` uses; the mockups keep their own copy in `docs/ui/assets/`, so removing it is left for a later clean-up.
