# The Traders' tokens: the Map opens, the card counts them, the map draws them (#180)

**Asked (issue #180):** the Map should open by itself for the Traders' token, the card should show one empty square for each token placed, and the map should draw a token with the card's token picture, not a dot. The owner asked for all of M5 to be built on 2026-11-04. Choices the issue left open are Claude's, marked **(my call)**.

## Opening the Map

- **Reproduced:** on main the Traders' placement already opens the Map. A browser test plays a five-seat hot-seat game through the API until the Traders place a token, then loads the screen: the Map is on show with the hexes lit, and the test passes against the code before this issue too. The Traders' pick moved onto the map in #172 (2026-11-03, 23:50); the owner's report on 2026-11-04 most likely came from a server still running a build from before it, where the pick was a list in the panel.
- **The gap found:** `PromptState.isMap` was true only when the map *led* the prompt (`layout === 'map'`). A Nomads placement offers the capital and the map, and the capital leads, so its lit hexes stayed out of sight on the Tracks. `isMap` is now true whenever any option is chosen on the map (`mapHexes` not empty), so the Map opens for it too, beside the Capital tab, and the panel docks as for any map choice.
- A unit test checks `isMap` for every decision placed on the map: an explore, a conquer, an outpost (`chooseHex`), a Nomads placement and the Traders' token.

## The card's reserve

- `civCardMarks()` marks `token0`, `token1`, … `used` for each token out (`TOKENS - data.tokens`), emptied from the left, for every civilization whose card has a reserve: the Traders, the Isolationists, the Heralds and the Inventors **(my call: the issue names the Traders; the other three had the same bug)**. They join `CARD_CIVS`, so their cards draw the seat's live state.
- Their library samples move into `SAMPLE_CIV_DATA` (2, 3, 3 and 3 tokens left, as the reviewed illustrations showed). The Inventors' illustration keeps its technology-transfer token, which a live card doesn't draw **(my call)**.
- `CardTokenReserve` takes a `seat`, and `CivilizationCard` passes its own, so the reserve's tokens are in the seat's colour, as on the map; they were always blue before **(my call)**.

## The map's tokens

- `WorldMap` draws a civilization's token (the Traders', the Isolationists') as an `<image>` of the card's token picture in the seat's colour, at 1.4 times its spot, as the outposts are drawn larger than theirs **(my call)**.
- The picture comes from `playerTokenUrl()`, exported by `PlayerToken`'s module script, so `PlayerToken` stays the one source of a player token (#103's rule); an `<img>` can't sit in the map's SVG.

## Not changed

No README screenshot shows a civilization token on the map or a reserve, so none is retaken.
