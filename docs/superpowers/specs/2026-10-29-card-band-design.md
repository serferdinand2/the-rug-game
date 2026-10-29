# One card band and edition chip across the card families (#109): design

Written 2026-10-29. #109 is in M13 · Refactor (Cards), after #108. The owner made #32, #33, #37 and #40 wait for it (2026-10-29). What the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. What and why

The civilization, tech, tapestry, landmark and masterpiece cards each copied the band's paper, gradient, border and gold title CSS. Each also drew its edition chip its own way:
- the civilization chip in the base colours for every edition;
- the tapestry chip in Arts & Architecture purple for every expansion;
- the tech chip always "Base game";
- the landmark and masterpiece chips in the interface's tan for every edition.

The Plans & Ploys and Fantasies & Futures tokens were unused on cards. The landmark and masterpiece classes used `__`.

**Done when** every card family draws its band through `CardBand` and its chip through `CardEdition`, and each chip has its expansion's colour.

## 2. The owner's decisions (2026-10-29)

The mockup is `docs/ui/edition-chips.html`, with the screenshot `docs/ui/screens/edition-chips-options.png`.
- **One chip for every family**, the one the tech and tapestry cards already used: a border, a 16% tint and the text in the edition's colour **(owner)**. The civilization card's base chip changes from a light fill to that brown tint, and the landmark and masterpiece chips from tan to their expansion's colour.
- **The chip colours on card paper:** base brown (`--card-band-start`), Plans & Ploys green (the new `--card-plans-ploys`, #3f6b4b), Arts & Architecture the reviewed purple (`--card-expansion`), and Fantasies & Futures teal (the new `--card-fantasies-futures`, #276966). Fantasies & Futures is purple in the rest of the interface, which would look like Arts & Architecture on a card **(owner, choice 2 of 3)**.

## 3. The components

- **`CardBand`** (`title`, `size`, `trap`):
  - the gradient over the 256 px paper noise, the brown bottom line and the gold Cinzel title, with the trap's red band as a modifier;
  - `size` keeps the three approved title sizes: large 28 px (civilizations), medium 22 px (tech, masterpiece), small 21 px (tapestry, landmark);
  - each card's own class still sets the band's height and padding.
- **`CardEdition`** (`code`): the edition's name from `expansionName` (#101) and its card colour from `cardEditionColor` in `ui.js`. The base chip keeps the lighter card line as its border, as approved.
- **Codes, not names:** the cards now pass edition codes.
  - `CardFrame` takes `editions` (codes) instead of `badges` (names), and `CivilizationCard`'s 18 branches pass codes.
  - The tech and tapestry card data's `edition`, and `LandmarkCard`'s `edition`, are codes.
  - The gallery passes each asset's expansion code.
- **The stylesheets** keep only each frame's layout. The copied band, title and chip rules are gone from `card-patterns.css`, `card-layouts.css`, `landmark-card.css` and `masterpiece-card.css`, and the landmark and masterpiece classes use `--`.
- **Two small unifications:**
  - The civilization band's bottom line was a faint purple, left over from the older Option B colour rule. It is now the brown line every other card has, as the card rules' browns ask.
  - The landmark title takes the tapestry title's 21 px settings: letter spacing 0.025em and line height 1, where it had none and 1.05.
- **New token:** `--font-size-card-title-sm` (21 px) joins `tokens.css`, since components take every font size from tokens.

## 4. Checks

Every card in the card gallery was screenshotted alone, as the first result of a search for its name, on main and on this branch. Compared at a tolerance of 3 of 255:
- **Civilization (41):** only the band's bottom line and the chip.
- **Tech (33):** identical.
- **Tapestry:** the 64 base cards identical; the 51 expansion cards only the chip.
- **Landmark (10):** the title's spacing and the chip.
- **Masterpiece (19):** only the chip.

The README's `card-gallery.png`, `civilization-card-components.png` and `game-civ-card-choice.png` are retaken.

## 5. Hand-offs

- #106 and #107 build the civilization card's patterns on `CardFrame`, which now has `CardBand` and `CardEdition`.
- Each expansion card issue passes its edition code.
