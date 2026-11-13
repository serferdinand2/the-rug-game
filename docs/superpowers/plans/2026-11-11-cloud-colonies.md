# #49 Cloud Colonies: plan

The 38th Fantasies & Futures tapestry card (03 FF.4.1 #5, FF.4.3 #5). WHEN PLAYED: score 3 VP for each territory you control "that has a picture of clouds". Left charm: gain 1 territory tile, then explore with a territory tile. No right charm.

## What is already there

- The cloud flags (R77): `clouds` on every territory tile (`data/territory-tiles.js`, 26 of 48) and every printed hex (`data/maps.js`, 13 of 25 on the large map, 7 of 13 on the small), tested in `tests/engine-data.test.mjs`. `terrainsOf(state, hex)` in `terrain.js` returns either, so one call reads a hex's clouds whatever its tile.
- The card's art (`static/art/tapestry/cloud-colonies.svg`) and its catalog row; `tests/art-catalog.test.mjs` already counts 38 F&F cards.
- `tapestryFor` deals every F&F card that has data, so adding the data deals the card.

## Steps (test first)

1. **Tests** in `tests/engine-ff-cards.test.mjs`:
   - the card is data: WHEN PLAYED, `[{ vp: { per: 'cloudTerritory', each: 3 } }]`, left charm `[{ gain: { territory: 1 } }, { explore: {} }]`, dealt with F&F;
   - the count on the large map: territory tiles 7 and 13 (clouds) and 2 (none), the start hex `0_-3` and the middle island `0_0` (clouds), a printed hex without clouds, and an opponent's hex with clouds: 4 territories, 12 VP (the issue's example);
   - it plays to the end with and without the arts track (`checkState`).
2. **Engine:** the counter `cloudTerritory` in `VP_COUNTERS` and the `VpCounter` type (`data/effects.js`), counted in `countVp` (`effects/vp.js`) as the controlled territories whose `terrainsOf` shows clouds; the card in `data/tapestry-cards.js`.
3. **Client:** the counter's words in `describe.js` ("territory you control whose picture shows clouds"); `tests/client-describe.test.mjs` already words every counter, and a card text test pins the card's face.
4. **Docs:** status.md's entry and summary, README where F&F's card count shows, and #49's checkboxes.

Not here: adding the card to the Charmers Automa's charm deck, which is #41's (Lazar).
