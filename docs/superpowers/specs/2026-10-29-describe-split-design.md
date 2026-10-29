# describe.js split into effect words, decision words and card text (#126): design

Written 2026-10-29. #126 is in M13 · Refactor (Words and names), after #123, which already took the English helpers and the game names out of `describe.js`. Every decision here is **(my call)** unless marked; the issue gave the shape.

## 1. What and why

`src/lib/describe.js` (1,391 lines after #123) still does three jobs:
- the effect, cost, bonus and payment words;
- the 33 tapestry card texts and `describeTapestryCard`;
- the decisions' titles and answers (`decisionTitle`, `describeAnswer` and `PROPHECIES`).

#60 and every expansion edit the effect phrases and the decision titles, which sit 600 lines apart. #31 (the Automa) and #32–#41 add decision kinds, and #108 builds the tapestry cards from their text. The owner made #31 and #32 wait for this issue (2026-10-29).

**Done when** each job has its own module and its tests move with it.

## 2. The modules

- **`src/lib/decision-words.js`** takes `decisionTitle`, `describeAnswer` and `PROPHECIES`, with the helpers only they use: `whose`, the capital plot names, the tech card lookup and the fallback answer.
- **`src/lib/cards/tapestry-text.js`** takes `TAPESTRY_RULES` and `describeTapestryCard`. `src/lib/civ-rules.js` moves beside it, to `src/lib/cards/civ-rules.js`, so the card texts live together.
- **`describe.js`** keeps the effect, cost, bonus and payment words. It now also exports the five pieces the other two build on: `effectsPhrase`, `effectPhrase`, `paymentVerbs`, `amounts` (a cost's or gain's amounts as words) and `describeTurn`.
- The importers follow:
  - `prompts.js` and `picks.js` take the decision words from `decision-words.js`;
  - `log.js` takes `PROPHECIES` from there;
  - `cards/game-cards.js` takes the card text from `tapestry-text.js`;
  - `area/players.js`, the PlayerChip library section and the tests take `civ-rules.js` from its new place.
- `isRecord` and `isCount` stay as small local helpers in each module, as `log.js`, `prompts.js` and `glyphs.js` already have them.

Nothing on screen changes.

## 3. Tests

- **`tests/client-describe.test.mjs`** keeps the effect, cost, bonus and payment tests. A new test checks what `describe.js` exports: only these words and the five shared pieces.
- **`tests/client-decision-words.test.mjs`** (new) takes:
  - the payment, place, seat and card answers;
  - the fallback answers;
  - every decision kind's title;
  - the 20 random games.
- **`tests/client-tapestry-text.test.mjs`** (new) takes the tapestry card faces.
- **Shared helper:** `assertReadable` moves to `tests/helpers/readable.mjs`, which all three use.
- **`tests/client-civ-rules.test.mjs`** imports the new path.
- The test that mixed decision and effect fallbacks splits in two, one in each file.

## 4. Hand-offs

- #60 edits the effect phrases in `describe.js` and the titles in `decision-words.js`.
- #129 keeps each decision kind's client facts in one table, beside `decision-words.js`.
- #108 builds the tapestry cards from `cards/tapestry-text.js`.
- #31 and #32–#41 add their decision kinds to `decision-words.js`.
