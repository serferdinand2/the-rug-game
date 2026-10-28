# Small bugs from the client scan (#84): design

Written 2026-10-28. #84 lists nine one- or two-line bugs that the client scan (#80) found. This branch fixes four of them. The others are fixed elsewhere: the pick prompts' plurals by #124's branch, the footer's "then" inside #79, the achievement label, the duplicate tab ids and the Tech row's height in other streams. So every commit here says `Refs #84`, never `Fix #84`. Decisions not taken from the issue are marked **(my call)**.

## The four fixes

- **TV Station's name.** `describe.js`'s `landmarkName` read the engine's `LANDMARKS`, which holds only the 18 base landmarks, and title-cased any other id, so it printed "Tv Station". It now reads the name from the art catalog (`src/lib/art/catalog.js`), which names all 33 landmarks. `hexmap.js`'s `pieceName` had the same lookup for a landmark on the map; it calls `landmarkName` now **(my call: same bug, one line)**. Tested in `client-describe` and `client-hexmap`.
- **"covered by an armory".** `IncomeMat`'s label for a covered space puts `describe.js`'s `article()` before the building. `article()` already gives "an" before a vowel; the component just never called it.
- **The landmark's Rotate title.** #83 moved rotation to **.** and **,**, so the placed piece's rotate button says "Rotate (. or ,)" **(owner, 2026-10-28: the keys in the order `TurnControl`'s hint names them)**. Neither `hotkeys.js` nor `shortcuts.js` exports these keys on their own, so they are typed here as a stopgap; #111 takes the titles from `SHORTCUTS`, with tests.
- **`CardRewardColumns` keeps its class.** In `kind="beside"`, `+` bound tighter than the ternary, so the caller's `class` was dropped. The class list is now the kind's class, then the caller's. No caller passes a class today, so nothing on screen changes.

## Tests

No test fits the label, the title or the class: all three live in component markup, no browser test reaches the placed landmark's controls, and `tests/browser/library.test.mjs` belongs to #79 right now. #125 moves the income label out of the component, #111 brings the landmark's keys and titles into a tested module, and #106 the card primitives. `npm run check` and the library's Vitest checks cover both components.
