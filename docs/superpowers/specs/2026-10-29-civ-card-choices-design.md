# Civilization choices made on the card (#78): design

Written 2026-10-29. #78 is in M12 · Cosmetic enhancements. The owner asked for it to be built and pushed while away ("work on 78 next and push to main"), so there was no question round: every decision here is **(my call)** unless marked, for the owner to revisit in the component library. The issue stays open until the owner has approved the CivilizationCard section there, as its checklist asks.

## 1. What and why

The **Civ** tab draws the viewer's civilization card as a static picture, and a civilization's own choice (the Entertainers' next space, the Merrymakers' column, the Leaders' track, the Militants' row, the Historians' square, the Mystics' predictions) is a list of panel buttons worded by the card's layout, such as "Column 1, row 2". The engine already has each seat's `civData`, which `view()` shows to everyone.

**Done when** the six civilizations' cards draw their live state in the Civ tab and the players overview, their choices are made on the card with the spots on offer outlined and **Confirm choice** in the panel, and the panel says what the picked spot gives.

**Approved (owner, 2026-10-29):** the owner approved the live and choosing states in the library's CivilizationCard section ("78 looks good"), and #78 closed. The calls marked (my call) below stand until the owner revisits them after playing.

## 2. The changes

- **The card's state.** `src/lib/civ-card.js` turns a seat's `civData` into marks on named spots (`civCardMarks`): the Entertainers' `c{column}r{row}` and `start`, the Merrymakers' `m{column}l{level}` cells and `m{column}` columns, the Leaders' tracks, the Militants' `top0`–`bottom3` spaces, the Historians' `square0`–`square3`, and the Mystics' `{category}:{n}` numbers. A mark is a piece on the spot (`token`), a used track, an exposed space or square, a moved column, a prediction made, or a prediction reached.
  - `cardSpot(decision, answer, game)` says which spot an answer picks: the space, the cell a token climbs to, the track, the space a row's outpost leaves or covers, the square, or the number. A decline, the Historians' tile to discard and every other decision stay off the card.
  - `spotWords` words a spot by what it gives: "Gain a Farm", "Gain 1 food and 1 worker", "Advance on Science without its bonus", "Uncover the 2 VP space", "Cover the 1 coin space", "Give Bo a token, uncovering the 1 food square". A Mystics number keeps its prompt's words.
  - `civCardView(game, seat, civ, decision)` gives a card its marks and, when the viewer's open decision is on it, the spots on offer with their answers.
  - `SAMPLE_CIV_DATA` is the data behind the library's reviewed "play" illustration, which is now drawn the same way as the live card.
  - The engine now exports the Historians' squares and the Mystics' prophecies for it.
- **The prompt.** An answer `cardSpot` places on the card gets `place: 'card'` and its `spot` in `prompts.js`, and its label is the spot's words; a decision of such answers has the `card` layout, whose instruction is "Choose a lit spot on your civilization card, then confirm it here." `PromptState` keeps the chosen `spot`, as it keeps a hex. `selectSpot()` picks a spot's one answer, or, when several answers share it (the Historians' opponents for one square), lists them in the panel as a hex's are. `civPick` gives the Civ tab the card's spots and the one chosen. The panel lists no card answers, so the column-and-row buttons go, and a picked answer's words are the panel's status line.
- **The panel's place.** #78 asked for the panel not to cover the shared board while the choice is on the card. The owner's later ruling (#79, 2026-10-28) puts every decision prompt at the centre of the tracks, with only a choice on the map docking at the right, so the card's panel opens at the tracks' centre like the others **(my call: the ruling wins; the card is in the player area, so the panel does not cover it)**.
- **The card.** `CivilizationCard` takes `live` (a `CivCardView`), `seat`, `selected` and `onCivilizationCardPick`. With `live`, the six cards draw their marks with the reviewed play styles, every spot on offer is a button the keyboard reaches, outlined in `--ok` as an available track space is, and the chosen spot is drawn as chosen. The other twelve civilizations take no `live` and draw as before.
- **The screens.** The Civ tab draws the viewer's card live and reports a pressed spot to `promptState.selectSpot`; the players overview draws each player's card live, to look at only.
- **Left out.** Spots get no new accessible names, after the owner's ruling against screen-reader work (2026-10-28); each spot carries `data-id="civ-spot-{spot}"` for the tests.

## 3. Tests

- Vitest, `tests/client-civ-card.test.mjs`: each civilization's marks, each card decision's spot, what stays off the card, each spot's words, the sample data, and an Entertainers income turn's spots from a real view.
- Vitest, `tests/client-prompt-state.test.mjs`: a card choice lists no buttons, a spot picked there is the answer and its words are the status, a spot two answers share lists them, an optional choice keeps its decline in the panel, and a decision answered elsewhere offers nothing on the card.
- Vitest, `tests/client-prompts.test.mjs`: every card option over random games has its spot.
- Playwright, `tests/browser/civ-card.test.mjs`: at a hot-seat table offering the Entertainers, the Civ tab opens by itself on their income turn with four spots on the card and no column buttons in the panel; a spot picked there is worded in the panel, and Confirm choice moves the token there.
- The library's existing CivilizationCard examples render byte for byte as before.

## 4. Hand-offs

#107 draws the card from data; `civ-card.js`'s spot ids and marks are the data its live state needs. #60 can add where an effect comes from to the card's panel. #33, #37 and #40 add expansion civilizations: each whose decision is a spot on its card adds a case to `civCardMarks` and `cardSpot`.
