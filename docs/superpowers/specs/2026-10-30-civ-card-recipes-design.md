# CivilizationCard drawn from data (#107): design

Written 2026-10-30. #107 is in M13 · Refactor (area Cards), found by the client scan (#80), and builds on #106, which gave the card patterns their content as props. The issue gave the shape; the choices below marked **(my call)** are mine.

## 1. What and why

After #106, `CivilizationCard.svelte` still has one `{#if id === …}` branch per civilization (18 and a fallback), each repeating `CardFrame`, the title, portrait, editions and complexity, and typing again numbers the engine exports (`CRAFTSMEN_COLUMNS`, `MILITANTS_SPACES`, `MERRYMAKERS_COLUMNS`, `ENTERTAINERS_GRID`, the Isolationists' `LAND_MASS_VP`). Demo state sits in `state === 'play'` ternaries, the setup line always prints the current rules, and pictures are `/art/…` literals.

**Done when** the card is one layout over a recipe, every number the engine holds comes from the engine, the card takes the table's rules version, and every civilization card looks exactly as before.

## 2. The recipe

`src/lib/cards/civ-cards.js` exports `civCard(id, { version, view })`, which returns:

- `title`, `art` (the portrait URL from `artUrl`), `portraitAlt`, `editions` (from the asset catalog's expansion), `complexity`, and the frame's reviewed spacing (`bodyMinHeight`, `textLeading`);
- `effect`: the main effect as **text segments**;
- `sections`: the card's patterns in order, each `{ pattern, … }`. `pattern` is `placementRows`, `pathGrid`, `predictionTracks`, `rewardColumns`, `terrainRewards`, `scoreLadder`, `tokenReserve`, `technologyTransfer`, `effects`, `clarity` or `guide`. A primitive's section carries its `props`; `seated` says the seat's colour goes to it, `pickable` that it takes the decision's spots.

The issue listed `clarity` and `setup` beside `sections`; they are sections here, because the Collectors' clarity sits between two patterns. The setup line is the clarity's `setup`, chosen by version. **(my call)**

**Text segments** (`CardText`) are an array of strings and `{ b }`, `{ strong }` (itself segments), `{ resource, fine? }` and `{ br: true }`, so bold words and resource icons stay inline. `CivilizationCard` renders them with one recursive snippet.

**Effect boxes** are `{ title, gain?, label?, symbolText?, pictogram?, text }`. The pictograms CivilizationCard drew by hand (the Architects' district and line icons, the Traders' and Nomads' territory hex with or without an outpost, the Futurists' and the Chosen's track quad, the Futurists' resource quad, the Heralds' mini tapestry card and era numeral) become `CardEffectBox`'s `pictogram` prop, with their styles moved from `card-patterns.css` into the component, as #106 handed off. The Militants' guide moves into `CivilizationCard`'s own style. `card-patterns.css` keeps only the frame's palette and paper.

## 3. Numbers from the engine

- The Craftsmen's columns, the Entertainers' grid and links (`entertainersMoves`), the Merrymakers' columns, the Militants' spaces, the Historians' squares, the Mystics' prophecies and the Isolationists' land-mass VP are read from the engine and worded on the card.
- The engine exports what it held privately: `LAND_MASS_VP`, the Futurists' head start, the Architects' swaps, each token civilization's token count, the Mystics' VP per exact prediction, the Alchemists' VP past a track's end and the Chosen's final VP per achievement. **(my call: small named exports, no behaviour change)**
- The current rules' setup adjustment of seven civilizations is a single effects operation; the recipe records it by running `adjustment.setup` with a context that only collects what is pushed, and words it ("gain 2 [any] and 10 VP", "start with 15 VP per opponent"). The Architects', Futurists' and Heralds' adjustments are decisions or end-of-turn rules, so their words stay in the recipe.
- The Collectors and the Treasure Hunters have no engine module yet (their expansions aren't built); their numbers stay recipe data until they do.

The words stay the owner-approved card words, not `civ-rules.js`' `CIV_TEXTS`: those are full paraphrases for the rules panel and would change every card. **(my call)**

## 4. Version and state

- `CivilizationCard` takes `version` (`'current'` by default); the game's player tabs and overview pass the table's. In the original version the current-rules setup line is left out.
- The play illustrations move to `reviewed-civilizations.js` as **sample views** (`SAMPLE_VIEWS`), each a `CivCardView` as `civCardView` returns for a live card: the six card civilizations' from their sample civData, the others' as marks (`used`, `token`) on spots the recipe names (a collected item, a used terrain, a rolled track, a sent token). The Craftsmen's view adds `pieces`, the building on each filled space. `CivCardView` gains the optional `pieces`.
- `reviewed-civilizations.js` keeps each card's id and review status only; the title, portrait, edition and complexity come from the recipe.

## 5. Pixels

Every civilization card is screenshotted before and after: the review page in both states (36), every `CivilizationCard` in the library (41, with the live and choosing examples) and the card gallery (41). All must be byte-identical.

## 6. Tests

`tests/client-civ-cards.test.mjs`: every base civilization has a recipe and the two built expansion cards keep theirs; each number matches the engine; the Entertainers' links match `entertainersMoves`; the setup line follows the version; the sample views draw the play look; `CivilizationCard` has no `id ===` branch and no `/art/` literal; every card renders on the server in both versions.

## 7. For the owner

- The Inventors' "When their marked card reaches the top" box still describes both versions in one sentence; drawing only the table's version would change the card's look, so it is left as it is.
- Numbers that are not data in the engine stay words: "income turns 2–5", the Militants' "2 on your starting territory", the Architects' "+1 VP".
