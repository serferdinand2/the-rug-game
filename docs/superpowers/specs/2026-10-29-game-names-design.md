# Every game name and English list from one helper (#123): design

Written 2026-10-29. #123 is in M13 · Refactor (Words and names). The owner moved the refactors to M13 the same day and asked for this one first, ahead of M6. Every decision here is **(my call)** unless marked; the issue gave the shape.

## 1. What and why

The client works out the same English in many places. Lists are joined by six copies of one function (`describe.js`, `picks.js`, `hexmap.js`, `results.js`, `Library.svelte`, and `TierPrice`'s own). `article` and title case are written twice, and amounts with plurals three times (`describe.js`, `hexmap.js` and `log.js`). Landmark names come from six maps, building names from three, the trap copies from four regexes, track names from three lists, achievement short names from two, and Roman numerals from four. Seat names fall back four ways: "Player N", "Seat N", "A player" and "Another player". `hexName` exists twice, as "hex 2,−1" and "2,−1". #31 adds the Automa's seat names and #35 an arts track; each would mean editing every copy.

**Done when** each name and each English helper is one tested function, every module and component imports it, and the copies are gone.

## 2. The modules

**`src/lib/words.js`**: English, with no game data except the counted things' nouns.
- `capitalize`, `joinList(items, word = 'and')`, `article(name)` ('a' or 'an'), `signed(n)` (a true minus sign), `wordsOf(id)` ('the-chosen' to 'the chosen'), `titleOf(id)` ('age-of-sail' to 'Age of Sail'), from `describe.js`.
- `nounOf(id, n)`, `amountWords(id, n)` and `AMOUNT_ORDER`: the counted things' one and many, as #124 built them in `describe.js`. `countWords(n, one, many = one + 's')` covers nouns that are not ids, such as "2 toppled outposts" on the map and in the log.
- `ordinal(place)`, from `results.js`.

**`src/lib/game-names.js`**: the game's names, one function each.
- `trackName`, `spaceName` (from the engine's spaces, `the start` for space 0), `resourceName`, `buildingName`, `landmarkName` (from the art catalog, all 33), `techName`, `civilizationName` and `achievementName` (the strip's short names, then the engine's).
- `tapestryCardOf(id)` and `tapestryName(id)`: through the engine's `tapestryCard`, which maps the 7 trap copies, so no client module has its own trap regex.
- `civilizationOf(seat)`: a player's first civilization, or **Setting up** before they have one. The header chips, the player cards, the scoreboard and the standings all use it; the standings used to say nothing.
- `seatName(table, seat)`: one fallback. A seat without a name is **Player N**, and no seat at all is "a player". "Player" because the name stands for a person; the lobby's "Seat 2: open" labels name the seat itself and stay. Every seat in a real game has a name, so neither shows in play.
- `hexName(key)`: one form, **hex 2,−1**, as the log and the prompts say it; the map's label and the explore line capitalize it at the start of a sentence.
- `roman(n)`, from `ui.js`.

The track and resource names live in `game-names.js`. `ui.js`'s `TRACKS` and `RESOURCES` take their names from it and keep their ids, which #127 will read from the engine.

## 3. The callers

`describe.js` imports these and keeps its effect, cost, decision and card words (#126 splits those up). `log.js`, `hexmap.js`, `picks.js`, `results.js`, `turn.js`, `pass.js`, `dice.js`, `civ-card.js`, `board.js`, `ui.js`, `area/capital.js`, `area/placement-targets.js`, `area/income.js`, `area/players.js` and `area/explore.js`, the components that named things (`CivilizationCard`, `IncomeMat`, `ResourceChip`, `ResourceRows`, `ResourceIcon`, `EraSlots`, `PlayerCard`, `SelfSummary`, `TierPrice`'s numeral, `StandingRow`) and the screens (`DecisionPrompt`, `GameHeader`, `HandOver`, `Library`) import them. Nothing re-exports them.

Left for other issues:
- `TierPrice`'s own price words are #124's remainder, after #85.
- `SelfSummary`'s resource rows are #125.
- The rules versions and expansions are #101.
- The track and resource id lists are #127.
- The screen-reader labels (`AchievementStrip`'s "claimed by seat") stay, under the owner's ruling.

Nothing on screen changes, except in states a real game never reaches.

## 4. Tests

- **Vitest, `tests/client-words.test.mjs`:** each helper, with the amount tests moved from `client-describe` and `ordinal`'s from `client-results`.
- **Vitest, `tests/client-game-names.test.mjs`:** each name, with these moved from `client-describe` and `ui.test.mjs`: the resource names, TV Station and the catalog landmarks, the civilizations and the Roman numerals. It also checks:
  - every one of the 33 catalog landmarks has its catalog name;
  - each trap copy is the trap;
  - the seat fallbacks and the one hex form.
- **A source guard in the same file.** No client module outside the two new ones:
  - joins a list by hand;
  - matches trap ids;
  - keeps a landmark, building or achievement name map, or a numeral list;
  - falls back to `Seat ${…}` or `Player ${…}` for a name;
  - reads a space's name from the engine's `TRACKS`.

  `describe.js` exports none of the names.
- **`client-hexmap`:** expects the one hex form.

## 5. Hand-offs

- #126 splits what is left of `describe.js`.
- #127 reads the id lists from the engine.
- #124 and #125 finish the price and player-area words with `amountWords` and `nounOf`.
- #101 names the versions and expansions beside these.
- #31 gives the Automa a seat name through `seatName`.
