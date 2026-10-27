# The player area and the players overview (#27): design

Written 2026-10-27. #27 fills the right quarter of the play screen with the player's own things, and builds the players overview that opens from the header chips. #26 built the frame, the shared board and the turn; #28 designs the prompts.

The owner asked for #26–#28 to be built without stopping for approval ("build all", 2026-10-27). What the owner said is marked **(owner)**, every other decision **(my call)**. The owner's rule for collisions holds: Lazar's mockup decides the look, the owner's design decides what works **(owner)**.

## 1. Scope

- **The player tabs**, as in `main-screen.html`: **Capital · Hand · Income · Eras · Civ · Tech · Terrain**. Your overview stays fixed below them (#26).
- **The players overview**, from the header chips, as in the mockup: one card per player in the left 3/4 and a drill-down on the right for the chosen row: the capital, civilization or tech of any player. Opponents' hands appear only as counts.
- **Tab switching:** a decision about a tab's things opens that tab by itself.
- **Real cards:** the tech and tapestry cards are drawn from the engine's data, not from Lazar's sample fixtures.

Not in #27: placing a piece on the capital, choosing a card and the other prompts (#28); the full card gallery (#47).

## 2. The tabs

### 2.1 Capital

- `CapitalGrid` with the seat's plots from the engine's `cityPlots()` and its landmarks as locked pieces, on the terrain of the seat's mat (Mountain, Wetland, Tropical, Desert, Grassland or Forest).
  - The terrain seed is the table's (the code), so every player sees the same tiles.
  - A landmark that hangs over the edge is drawn over the edge **(#27 issue)**.
- `CompletionCounters` under the grid: its complete rows, columns and districts, from the engine's groups. Hovering shows them.
- **Beside the mat:** pieces that didn't fit are listed under the counters, by name.
- The heading reads "Capital City · **Mountain**", the mat's name in Cinzel.

### 2.2 Hand

- The tapestry cards in hand, as full `TapestryCard`s overlapping, as in the mockup.
- Hovering or focusing a card raises it and shows it in full over the shared area.
- An empty hand reads "No tapestry cards in hand."

### 2.3 Income

- **The income mat:** four rows (markets, houses, farms, armories) of six spaces.
  - Each space shows its name and its printed reward in words.
  - Spaces still covered by a building show the building; exposed spaces show their reward.
  - The data is `INCOME_MAT`; the buildings left come from `incomeMat.buildings`.
- The heading names the era: "Income mat · Era II".

### 2.4 Eras

- The four era slots.
  - Era I is the printed "Maker of Fire".
  - Each later slot shows its top tapestry card's name, "Face-down card" for a card played face down, or "Not yet chosen".
- The active era's card is shown in full above the slots; any other slot's card can be chosen to look at.

### 2.5 Civ

- Each of the player's civilizations as Lazar's reviewed `CivilizationCard`, for the twelve base civilizations with a recipe.
- **For the four without one** (Futurists, Heralds, Nomads, The Chosen): a plain card with the portrait, the name and "Card text comes with #47." **(my call:** inventing card text is not allowed; #47 owns the cards.)

### 2.6 Tech

- **Three rows:** top (square benefit), middle (circle benefit) and bottom (newly invented), each of `TechnologyCard`s overlapping, with the row's shape heading as in the mockup.
- **Below, the tech display:** the 3 face-up cards and the deck count, so a player can see what they could invent **(#27 issue)**.

### 2.7 Terrain

- **Territory tiles in hand:** small hexes drawn like the map's territories (the same wedges), with their number.
- **Space tiles:** in hand and explored, as small tiles with their art (`space-tile/*`).

## 3. Real cards

The reviewed `TechnologyCard` and `TapestryCard` draw from fixture data. #27 adds data builders from the engine:
- **Tech card data:** its art, its circle and square benefits in words (`describe.js`), and its prerequisite (a track and space, or an income-mat innovation).
- **Tapestry card data:** its art, its timing (This Era, When Played, Trap · Response) and its ability in words.

The components take either a fixture `id` (the library and the card review keep working) or `data`. No card text is invented: every word comes from the engine's data through `describe.js` **(my call)**.

## 4. The players overview

As in the mockup:
- **Opening and closing:** pressing a header chip opens it; the footer becomes **CLOSE THE PLAYERS OVERVIEW**; the decision state underneath is kept.
- **The cards:** one `PlayerCard` per player:
  - name and VP; YOU and HOST;
  - the civilization and era;
  - the resources;
  - the four track positions;
  - hand size, capital points (complete lines), tech count, and the terrain row.
- **The drill-down:** choosing Civilization, Capital or Tech shows that player's capital grid, civilization cards or tech rows on the right; before a choice it reads "Waiting for overview".

## 5. Tab switching

When a decision opens for the viewer, the tab that shows its things opens **(my call on the mapping)**:
- **Capital:** `choosePlacement` (except a map hex), `chooseSwap`.
- **Hand:** `chooseTapestry`, `chooseKeep`, `chooseDiscard`.
- **Eras:** `chooseCopy`.
- **Tech:** `chooseInvent`, `chooseUpgrade`, `chooseTechBenefit`.
- **Civ:** `chooseCivAbility`, `chooseAlchemists`, `chooseProphecy`, `chooseSlot`.
- **Terrain:** `chooseSpaceTile`, `chooseGift`.

The player can still switch tabs by hand.

## 6. Structure and tests

- **Plain, tested modules:**
  - `src/lib/cards/game-cards.js`: the tech and tapestry card data from the engine;
  - `src/lib/player-area.js`: the capital view (plots, pieces, biome, counters, beside the mat), the income mat rows, the era slots, the tech rows and display, the terrain tiles, the player cards, and the tab for a decision.
- **New components, each with a library section:**
  - `IncomeMat`, `EraSlots`, `TerritoryTile`, `CardFan` (overlapping cards with raise-on-hover), and a plain `CivilizationCard` state.
  - `CapitalGrid` gains overhanging pieces.
- **Screens:** `src/screens/game/PlayerTabs.svelte` and `PlayersOverview.svelte`, used by `Game.svelte`.
- **Tests:** the modules over dealt and random mid-game views: every tech and tapestry card builds without "undefined"; the capital view equals the engine's plots; an opponent's view never carries a hand.

## 7. Handed off

- **#28:** placing on the capital (the tab is ready), choosing cards in the Hand and Tech tabs, and the other prompts.
- **#47:** the civilization cards without a recipe, and the card gallery.
- **#6:** the capital mats' expansion terrain.
