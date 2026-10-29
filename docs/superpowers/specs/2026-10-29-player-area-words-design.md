# The player area's words from shared helpers, and its resources as ResourceChips (#125): design

Written 2026-10-29. #125 waited for #124, which put `amountWords` in `words.js`, `resourceName` in `game-names.js` and `priceWords` in `describe.js`. Decisions not taken from the issue are marked **(my call)**.

## 1. What and why

The issue (line numbers as of commit 047209f) found four components wording the player area themselves. Some of it was fixed on the way:

- `ResourceChip`'s label already reads `amountWords(resource, count)` ("4 coins"), since #124.
- `IncomeMat` already says "an armory", with `article()`, since #84.
- `SelfSummary` already calls `roman()`, since #123.

What is left:

- `SelfSummary` still draws its own resource chips: its `RESOURCE_ROWS` types each name with its plural, builds the label inline, and its CSS (`.rg-self-summary--resource`, `--changed`) restyles what `ResourceChip` draws.
- `IncomeMat` keeps the plural row names (`ROW_NAMES`: "Markets", "Armories") and builds each space's label inline.
- `EraSlots` builds each slot's text with a nested ternary, and its heading ("Era II · Active") inline.
- `describe.js`' `gainNouns` has its own plural for buildings (`name.slice(0, -1)}ies`), the same rule `ROW_NAMES` spells out by hand.

**Done when** `SelfSummary` draws four `ResourceChip`s, the income mat's and era slots' words come from `src/lib/area/income.js` with tests, no component words the player area itself, and nothing on screen changes.

## 2. ResourceChip

- `changed` (boolean, default `false`): the count is drawn gold, as `SelfSummary`'s `changed` resources are today (#75). A boolean on the chip, not a list **(my call)**: a chip shows one resource, and `SelfSummary` keeps its `changed` list and passes `changed.includes(id)`.
- `size` (`'small' | 'medium'`, default `'small'`), named like `ResourceIcon`'s sizes **(my call)**:
  - `small` is today's chip: the 16 px icon, 31 px tall, as on the player cards and the income notice.
  - `medium` is `SelfSummary`'s look: the native 24 px icon, 34 px tall, a narrower gap and a line height of 1, so the summary is pixel-identical.
- The chip gains `min-width: 0`, so it can shrink in a grid column as `SelfSummary`'s did; the player cards' chips never needed to shrink, so they are unchanged.
- It keeps its `title` (the resource's name), so the summary's chips show the styled tooltip on hover (#137), as the player cards' do. That is the one change a player can notice, and only on hover **(my call)**.

## 3. SelfSummary

- It draws `RESOURCES.map(r => <ResourceChip resource={r.id} count={resources[r.id]} changed={changed.includes(r.id)} size="medium" class="rg-self-summary--resource" />)`. `RESOURCES` (from `ui.js`, #127) is in the overview's order, coin, food, worker, culture, which is `RESOURCE_ROWS`' order, so nothing moves.
- `RESOURCE_ROWS`, the `ResourceIcon` import and the chip CSS go. The class `rg-self-summary--resource` stays on each chip, for the browser test that checks the counters stay inside the player area at every window size.

## 4. income.js

- `IncomeRowView` gains `name`: the row's plural building name, "Markets", "Houses", "Farms", "Armories", from `pluralOf(buildingName(building))`.
- `IncomeSpaceView` gains `label`: "Barter, covered by a market" or "Barter. Income: Gain 1 coin", as the mat's spaces read today.
- `EraSlotView` gains `heading` ("Era II", or "Era II · Active") and `text` (the card's name, "Face-down card" or "Not yet chosen"). `card` stays, because `EraSlots` uses it to style a card's name and to enable the button.
- The components only print these.

## 5. pluralOf

- `pluralOf(word)` in `words.js`: "Market" to "Markets", "Armory" to "Armories" (a consonant before the y), "Day" to "Days". It is the building plural rule `describe.js`' `gainNouns` already has, moved to the English helpers **(my call)**: buildings are not counted things in `NOUNS` (adding them would change `AMOUNT_ORDER` and so the order of every cost and gain), and their names are already title case from `buildingName`.
- `gainNouns` calls it, so "Gain 2 Armories" reads as before.

## 6. Left as it is

- `PlayerCard` and `IncomeNotice` keep their small chips.
- The art catalog's `['armories', 'Armories']` pairs (`src/lib/art/catalog.js`) are art ids with their gallery titles, not words the player area builds.
- `IncomeMat`'s "N left" stays inline: it is a number and one word, not a name.

## 7. Tests

- `client-words`: `pluralOf` for a plain noun, a consonant y and a vowel y.
- `client-area-income`: each row's `name`, a covered and an exposed space's `label` (including "an armory"), and each slot's `heading` and `text` (Maker of Fire, not yet chosen, face down, a card, the active era).
- `client-game-names`' source guard: no client module keeps `ROW_NAMES` or `RESOURCE_ROWS`, or builds the "ies" plural itself, and `pluralOf` is defined only in `words.js`.
- The existing `client-describe` test ("Gain 2 Armories") shows `gainNouns` is unchanged.
- In the browser: the SelfSummary, ResourceChip, IncomeMat, EraSlots, PlayerCard and IncomeNotice library sections are screenshotted before and after and compared pixel by pixel; `player-area` checks the summary's counters in the game.
