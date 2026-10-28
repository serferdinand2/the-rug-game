# Prices and resource amounts in words (#124): design

Written 2026-10-28. #124 is a refactor the client scan (#80) filed; it also covers #84's "the pick prompts say 'You gain 2 coin.'" item. Decisions not taken from the issue are marked **(my call)**.

## 1. What and why

`TierPrice` and `CostBox` each turn a price into words with their own copy of the same algorithm, five components look a resource's name up in `ui.js`'s `RESOURCES` by hand, and `picks.js` prints amounts as `${n} ${id}` ("2 coin"), while `describe.js` already keeps every counted thing's singular and plural in a private `NOUNS`. "Any" is worded three ways.

**Done when** one tested function puts a price into words, every amount the client prints has its plural, and "any" reads one way.

## 2. The pieces

All three are exported from `src/lib/describe.js` (#123's `words.js` isn't started) and tested in `tests/client-describe.test.mjs`.

- `amountWords(id, n)`: "1 coin", "2 coins", "2 food", "2 resources of your choice", "5 VP", "2 territory tiles", from `NOUNS`. It replaces the private `amount(n, key)`, whose callers in `describe.js` move to it.
- `resourceName(id)`: a resource's name as a title shows it, "Coin", and "Resource of your choice" for `any`; any other id comes back as it is.
- `priceWords(symbols)`: a price as `ui.js`'s `CostSymbol[]` in words: "1 food and 1 resource of your choice", "2 coins", "nothing" when empty. Symbols are counted in the order they first appear, so the words follow the icons.

Callers:

- `CostBox`'s label stays "Cost: …" and calls `priceWords`.
- `TierPrice` is left as it is for now: #85 is reworking the track spaces and their files are off limits while it runs. After #85 it drops its copy and labels itself `Tier ${numeral} costs ${priceWords(symbols)}` ("Tier I costs nothing" for an empty price), so `priceWords` already covers its range and its "free" case. Until then this issue stays open (`Refs #124`).
- `ResourceIcon`, `ResourceChip`, `ResourceRows` and `CostBox` take names from `resourceName`. `ResourceChip`'s label "4 coin" becomes `amountWords`: "4 coins".
- `picks.js`'s `resourceWords`, `costWords`, `shortWords` and the cap warning's lost amounts use `amountWords`.

## 3. Decisions

- **One wording for "any": "resource of your choice"** (owner, 2026-10-28), the `any` icon's tooltip included, which used to say "Any resource". It is what `describe.js`, the rules help and the civilization text already say, and the pick prompts' lead lines say it too.
- **Digits, not number words** (owner, 2026-10-28). The labels said "one food" while the pick prompt for the same advance says "Tier III costs 1 culture and …". Digits make one wording everywhere; a screen reader reads both the same.
- **An empty price is "nothing"** (my call): "Cost: nothing", and after #85 "Tier I costs nothing". No tier is free, and the footer shows no cost box for a free move, so neither label changes in play.
- `shortWords` keeps its short "2 resources" on the trade buttons; it already has its plural.

## 4. What a player sees change

- `ResourceIcon`'s tooltip on the `any` icon reads "Resource of your choice" instead of "Any resource".
- Screen-reader labels: the cost boxes read digits and "resource of your choice"; a resource chip reads "4 coins". The tier prices keep their own words until #85 lands.
- The pick prompts: "You gain 2 coins.", "2 coins would be lost."

Nothing else on screen changes.
