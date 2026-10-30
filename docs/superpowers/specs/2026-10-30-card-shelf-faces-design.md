# Hand CardShelf resolved card faces (#118): design

Written 2026-10-30. #118 is in M13 · Refactor (Cards), found by the client scan (#80). Its blockers #79 and #92 are done: the prompt state already builds the shelf (#79) and the shelf already lays its cards out with `CardFan` and `ScaledCard` (#92). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`CardShelf` took ids and looked the engine data up itself: `tapestryCardData`, `techCardData`, `CAPITAL_MATS` and `matPlots`, with `matOf` and `biomeOf` to turn a mat's number into its face. The prompt state then looked the same ids up again to show a hovered card in full (`inspectShelf`, `inspectPick`). The tech deck's back was drawn twice by hand with the same card-band tokens, in `CardShelf` (`.rg-card-shelf--back`) and in `PromptArt` (`.rg-prompt-art--back`). And the shelf fitted civilization cards to its room with its own `civFit` sum.

**Done when** `CardShelf` imports no engine data, the deck back is one component, and the setup and card browser tests pass. Nothing on screen changes.

## 2. The changes

- **`shelfFace(kind, id, count)` and `shelfCards(prompt, decision)` in `src/lib/prompts.js`.** A shelf card is `{ index, label, face }`. Its `face` is what the shelf draws, resolved once:
  - a tapestry card: its `tapestryCardData`;
  - a tech card: its `techCardData`, or for the top of the deck `{ deck: 'tech', count }`, the count from the option's deck art;
  - a civilization: its id;
  - a capital mat: `{ mat, name, plots, biome }` (its number, its name, `matPlots`, and its biome, which is its id). A mat id that names no mat falls back to the first mat, as `matOf` did.

  `shelfCards` reads the prompt's shelf options and the decision's answers, as the prompt state's own `shelfCards` did; the prompt state now calls it. `shelfFace` also serves the cards to pay (#75): the prompt state's new `pickCards` builds them, with their names, instead of `DecisionPrompt.svelte`'s pick shelf.
- **The preview reuses `face`.** `inspectShelf` and `inspectPick` return the hovered card's own `face` as the full card's data: no second lookup. The deck, a civilization and a mat still show nothing more.
- **`player/TechDeckBack.svelte`** (`count`, `size: 'card' | 'chip'`): the tech deck's back, "Deck · N" in Cinzel gold on the card band's first colour inside a card-line border. `card` fills the 425×298 tech frame (the shelf's, scaled by `ScaledCard`); `chip` is the inline badge `PromptArt` draws beside an option. `PromptArt` keeps its 48 px minimum for the large size through the `class` it passes.
- **`player/CapitalMatFace.svelte`** (`name`, `plots`, `biome`, `terrainSeed`): a mat on offer, its name on a card band over its 9×9 `CapitalGrid`, 392 px wide, as the shelf drew it.
- **`fitScale(available, tallest, { min, room })` in `src/lib/cards/card-sizes.js`**, tested: the scale that fits cards `tallest` px high into `available` px less `room`, never above 1 nor below `min`, and 1 while either is unmeasured. It replaces `civFit`'s sum; `CIV_MIN_FIT` and `CIV_ROOM` stay the shelf's arguments.
- **`CardShelf`** draws each `face`: `ScaledCard` with `TapestryCard` or `TechnologyCard`, `ScaledCard` with `TechDeckBack size="card"`, `ScaledCard` with `CivilizationCard`, or `CapitalMatFace`. Its `--back`, `--whole`, `--mat-face` and `--mat-name` rules move into the two components.
- The library sections that build shelves (CardShelf, DecisionPanel, DiceTray) build their cards with `shelfFace`.

## 3. Pixel identity

- The deck back keeps its markup (a flex box filling the face, a `<b>` holding the words) and every declaration; the card size also sets 100% width and height, which the tech frame's 425×298 `ScaledCard` face gives it as before. The chip keeps the inline badge's declarations, and the 48 px minimum still applies only to `PromptArt`'s large size.
- The mat face keeps its 392 px box, padding, border, ink background and its name band's 65% gradient stop.
- `fitScale` computes exactly what `civFit` did: `min(1, max(0.75, (height − 16) / tallest))`, and 1 before either is measured.

## 4. For the owner

- The mat's name band fades at 65% where `CardBand` and the card styles use 57% (#118 noted it). It is left at 65% so nothing moves; should it take the card band's 57% (or `CardBand` itself)?

## 5. Tests

- `tests/card-shelf-faces.test.mjs`: `fitScale`; `shelfFace` for each kind and the deck; `shelfCards` from a dealt game's civilization and capital choices and an invention with the deck; `TechDeckBack` and `CapitalMatFace` rendered; `CardShelf` drawing faces; a source guard that `CardShelf.svelte` imports nothing from the engine or the card data, and that the deck back's words are drawn only by `TechDeckBack`.
- `tests/scaled-card.test.mjs` and `tests/client-prompt-state.test.mjs` take the new card shape.
- Browser: `setup-prompts`, `decision-prompt`, `card-layouts` and `library` (the shelf's `--card`, `--civ` and `--mat` selectors, and a mat on offer showing its relief).
