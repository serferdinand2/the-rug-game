# Tech and tapestry cards in Svelte from the engine's data (#108): design

Written 2026-10-29. #108 is in M13 · Refactor (Cards). The owner made #32, #33, #37 and #40 wait for #109, which builds on this. Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`TechnologyCard` and `TapestryCard` render `{@html …}` strings built in `src/lib/cards/card-layouts.js`, with `rg-*-layout__…` classes instead of the conventions' `--`. Given only an id, they fall back to hand-written fixtures whose text differs from what the engine plays. For example, the library's Age of Discovery says "only you gain its benefit". The string cards can't take a `CardResource`, an edition chip or a button, and their tests assert on HTML strings.

**Done when** both cards are Svelte markup built from `game-cards.js`' data, and the library shows the engine's text.

## 2. The cards

- **The components:**
  - Each draws its own markup, with the DOM the strings had and the classes renamed: `rg-tech-layout__shape--square` becomes `rg-tech-layout--shape-square`, and so on.
  - `data` comes from `techCardData` or `tapestryCardData`. An `id` alone now draws the engine's card, not a fixture.
  - The card gallery's pending P&P tapestry cards still pass their own `data`.
- **`game-cards.js`:** takes the `TechnologyCardData` and `TapestryCardData` typedefs, and gains `tapestryTiming(card)`, the timing label's colour (trap, when-played, this-era, or none), exported and tested.
- **`card-layouts.js` is deleted.** The static main-screen mockup (`docs/ui/main-screen.html`, a hand-edited reference) gets its own copy of the old fixtures and builders in `docs/ui/assets/card-markup.js`. The copy takes an id as the mockup calls it, which the builders stopped taking. It also gets the old stylesheet in `docs/ui/assets/card-layouts.css`, so it keeps working.
- **The library sections:**
  - TechnologyCard shows one card per track and tier, and the income-mat innovations.
  - TapestryCard shows This Era, When Played, the longest ability and the trap.
  - Each example is drawn from the engine, without the fixture duplicates.

## 3. Checks

- **Screenshots before and after, of every tech and tapestry card:**
  - The card gallery's 148 are identical, pixel for pixel.
  - In the library, the cards that already showed engine data match to within 3 of 255 in one channel: sub-pixel texture shimmer from their new positions.
  - The fixture cards now read the engine's text, as intended.
- **Tests:**
  - `client-game-cards` renders the components server-side instead of asserting on strings, and tests `tapestryTiming`.
  - A guard: no `{@html}`, no `card-layouts.js` and no `__` class names.
  - The browser test `card-layouts.test.mjs` uses the new class names.

## 4. Hand-offs

#109 shares the band and the edition chip across the card families. The tech card's chip still always says "Base game", and the tapestry chip's colour is still arts-or-base, as before.
