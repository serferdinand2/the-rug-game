# Places on Arts & Architecture's cards as lit targets (#184): design

## 1. What and why

#37 built the places a gained income building or landmark may go besides the capital city, and words for each, but the prompt lists them as text buttons in its panel ("On Commercial Center, row 1, column 2"). This issue lights them as the capital's plots are lit.

## 2. Decided

- **Look B** (owner, 2026-11-11), from the mockup [aa-card-targets.html](../../ui/aa-card-targets.html) (screenshots in `docs/ui/screens/issue-184/`): the cards' squares sit in the Capital tab under the capital, so every place a piece may go is in one tab. The prompt keeps no shelf. A landmark waiting to be placed shares its box with the cards it may go on.
- The Eras tab draws a card's pieces where they stand, on its squares beside the card, instead of listing them in words.
- National Parks' territories light on the map as an explore's hexes do. They already did: an answer with a `hex` is a map place, and the capital leads with the map's hexes lit beside it (#28).

## 3. My calls

- **The civilizations' mats** (the Urban Planners' keep, the Collectors' landmark or house space) show among the cards in the Capital tab, as a small target with the civilization's portrait and what it does ("On your Urban Planners mat, to place later", its answer's words), not as a lit spot on the card in the Civ tab, which the mockup showed. While a piece is being placed the Capital tab leads, so a spot in another tab would be out of sight; B's point is every place in one tab.
- **A landmark on a plot card** goes where a click puts it: the lit squares are every square some offered place covers; a click picks the offered place covering that square, at the tray's turn when one does, nearest to where the landmark is. The engine offers one place per set of squares covered (#37), so the picture shows that place's turn and overhang.
- **Space Race, Trade Routes and the landmark tech cards** show as small cards lit whole; hovering one shows it in full, as the Hand and Tech tabs do (`CardPreview`).
- **Commercial Center's squares** show their printed benefit faintly, in #37's reading order (coin, tapestry card, invent, science die).
- **Inside the tray** the cards drop their "Or on a card" title (a rule separates them from the landmark) and use 20 px squares, so the Capital tab still fits at 1080 px; on their own they keep the title and 30 px squares.
- **Browser tests start from a set-up game** through named scenarios (`api/scenarios.mjs`): the start request may name one, only when the server runs with `TEST_SCENARIOS=true`, which the Playwright config sets. A scenario is a fixed function of the started game; the client never sends a state. Without the switch the API refuses the name, so a public server can't be steered.

## 4. Parts

1. **Prompt places** (`prompts.js`): a plot card's square or landmark place is `'plot'` (its card, row, col and turn); Space Race, Trade Routes, a landmark tech card and a civilization's mat are `'held'` (what holds it). Either keeps the Capital tab's layout and its words. The Capital tab's model (`area/placement-targets.js`) gains the cards: each plot card's squares, pieces, lit squares and the chosen place, and the whole targets.
2. **The Capital tab**: a `PlotCardGrid` component (the squares on card paper, the pieces on them, lit squares, a chosen building's preview, a landmark drawn with its overhang) with its library section and a place in the dark cards rule; the "Or on a card" part of the tray box, with the whole targets; picks reported as the capital's are.
3. **The Eras tab**: the top card's pieces drawn on its `PlotCardGrid`, or a landmark's picture beside Space Race and Trade Routes.
4. **Browser test**: the scenario switch and a test that places a Farm on Monuments and the Forge on Astrolabe.
5. **README and screenshots** from the running game.

## 5. Tests (test-first)

- Client: the places and layout for each answer kind; the plot card model's lit squares, pieces, previews and the landmark click rule; the era slot's pieces.
- Server: a scenario only with the switch on, an unknown name refused, the scenario's game in the state it names.
- Browser: the Farm on Monuments, then the Forge on Astrolabe, from the scenario.
