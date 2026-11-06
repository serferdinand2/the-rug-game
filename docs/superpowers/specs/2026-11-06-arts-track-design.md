# The arts track, the d20, masterpieces and inspiration tiles (#35): design

Written 2026-11-06. #35 is in M8 · Arts & Architecture. **It started before its blocker #34 (the Plans & Ploys Automa civilizations) closed, on the owner's ruling (2026-11-06): "go ahead".** #34 is solo-only, and R59 keeps the arts track out of Automa and Shadow Empire games, so #35 needs nothing from it. Its other blocker, #120, is closed. Decisions are marked **(owner)** or **(my call)**.

The rules source is 03 §2 (A&A), §7 (combinations) and the README's Rules conventions. The art is already drawn and approved: the 20 masterpieces, the 4 inspiration tiles, the 8 A&A landmarks and the arts track symbol (#11, #63).

## 1. What and why

A table with Arts & Architecture on plays the fifth advancement track, the arts track, with everything that comes with it: the d20 science die, the 20 masterpieces, the inspiration tiles and A&A's 5 landmark cards. #36 adds the advanced capital mats, #37 the civilizations, tapestry and tech cards, and #38 the Automa changes.

**Done when** a multiplayer table with A&A on plays the arts track's 12 spaces and 3 landmarks, rolls the d20, creates and broadcasts masterpieces, places inspiration tiles, and drafts A&A's landmark cards; a table without the arts track plays as before; and every arts space is tested, in games with the track both on and off.

## 2. Decided by the owner

- **Start before #34** (2026-11-06).
- **Four parts on the branch `issue-35-arts-track`** (2026-11-06), each planned and built test-first, with at most one review of the whole change at the end:
  1. the switch, the fifth track in the engine, the tier prices, the 3 arts landmarks, the d20 and the spaces that need nothing new;
  2. masterpieces and inspiration tiles, and the spaces that use them;
  3. A&A's landmark cards (handed on from #32);
  4. the client: mockups first, approved before they are built.
- **R118: with the arts track in play, "any track" includes it** (2026-11-06). It is an advancement track like the others (A&A calls it "a 5th advancement track"), so every effect that says *any track*, *each track*, *a track* or *advancement track* includes it. The exceptions are effects whose printed icons or text name the four tracks (§3.3).
- **R119: when the masterpiece deck runs out**, the discarded masterpieces are shuffled into a new deck, as the tapestry deck is (01 §9.1) (2026-11-06). With no discards either, fewer cards lie face up and the deck's top card can't be chosen.
- **The arts track's switch** (2026-11-06): with A&A on, the arts track is on, and a new variant, "Play without the arts track", switches it off, as "Leave out Radio and Lithium-Ion Battery" does for its cards.
- **The calls marked (my call) below** were shown to the owner with the design and accepted (2026-11-06).

## 3. The rules built

### 3.1 Switching it on (part 1)

- `EXPANSIONS_BUILT` becomes `['pp', 'aa']`. As with #32, the lobby offers A&A when #35 lands, in part: the arts track and landmark cards now, with #36 and #37 adding to the same switch (my call, following the owner's ruling for #32).
- The arts track is in play when `'aa'` is in `state.expansions` and `'no-arts-track'` is not in `state.variants` (§2). `artsInPlay(state)` in the engine answers it, and everything below reads that, never the expansion list.
- Two new variants in `VARIANTS`, both needing `'aa'`:
  - `no-arts-track`, "Play without the arts track";
  - `either-science-die`, "Roll either science die (d12 or d20)", handed on from #53. `checkOptions()` also refuses it with `no-arts-track`, since there is no d20 without the arts track.
- R59: a one-player game with the arts track is refused with a sentence saying the arts track needs 2 or more players (my call, enforced in `createGame` since `checkOptions` doesn't know the player count). #31's solo setup inherits the check.
- Without the arts track nothing changes: no new state is read, the d12 is rolled and every base and P&P test passes unchanged.

### 3.2 The fifth track in the engine (part 1)

- `TRACK_IDS` stays the four tracks of the main board, which many printed effects name. A new `ARTS_TRACK = 'arts'` and `tracksOf(state)` give the tracks in play: the four, then `'arts'` when it is in play. A wider JSDoc type, `AdvancementTrackId`, is `TrackId | 'arts'`; code that may meet the arts track takes it, and the rest keeps `TrackId` (my call: fewer type changes than widening `TrackId`).
- Setup puts each seat's token on the arts track's start: `seat.tracks.arts = [0]`. A seat without the arts track has no `arts` key.
- `TRACKS.arts` holds the 12 spaces in the same `TrackSpace` shape (§3.4), so the landmark race, the benefit and bonus, R19's once-per-turn rule, "complete any track" on space 12 and the `advanced` triggers all work unchanged.
- The advance turn offers the arts track (`advances()` reads `tracksOf`).
- The tests' invariants and the simulation read `tracksOf(state)`.

### 3.3 Which effects include the arts track (part 1; R118)

With the arts track in play, each use of `TRACK_IDS` in the engine is one of two kinds.

**The tracks in play (`tracksOf(state)`), the arts track included:**

| Effect | Why |
|---|---|
| The advance turn | It is an advancement track |
| Research and every roll of the science die (Age of Discovery, Treasure Hunters, Empiricism) | The d20 has arts faces (§3.6) |
| Dark Ages | A&A's ruling: regress on 3 different tracks, then advance 3 times on one of the 2 left (§3.6) |
| Renaissance, Plea for Aid, Boast of Superiority | "Each track" |
| Dictatorship, Socialism, Trade Economy, Marriage of State, the shared advances that choose a track | "Any track" / "a track" |
| AI Singularity's new token | "The start space of any track" |
| Academic Research, Lithium-Ion Battery (the repeat effect) | "Any advancement track" |
| Status Quo | "Advancement-track tokens" |
| Spies' option 3 | "Any advancement track" |
| Tinkerers' four options | "Any track". Option 1 on the arts track gains what its price shows: 1 resource, 2 different, 3, or 2 of one kind (my call) |
| Mystics' completed tracks, "complete any track" | Space 12 of the arts track counts (03 §2.3) |
| Dystopia | A&A: it may take any of the 3 arts-track landmarks |

**The four tracks of the main board (`TRACK_IDS`), as printed:**

| Effect | Why |
|---|---|
| Leaders | Its four squares (03 §2.2: no change) |
| Futurists | "Each of the 4 tracks" (02 §1.2) |
| Alchemists | Its four boxes; an arts roll marks nothing (§3.6) |
| Entertainers | Its printed track icons (03 §2.2: no change) |
| The base spaces that name their tracks (Physics and the like) | 03 §2.2: they keep their printed tracks |
| Flash Mob, Infinite Spectrum Photography | Printed: exploration, science, technology or military |

### 3.4 The arts track's spaces (parts 1 and 2)

From 03 §2.3. The first player into tiers II, III and IV gains the landmark, before the space's benefit, as on the other tracks (R9). Space 12 counts for "complete any track".

| # | Space | Benefit | Bonus | Landmark | Part |
|---|---|---|---|---|---|
| 1 | Cave Paintings | 1 tapestry card | | | 1 |
| 2 | Flutes | 5 VP | any 1 → any income building | | 1 |
| 3 | Dance | Create | | | 2 |
| 4 | Epic Poetry | 1 VP per territory tile in your supply, 1 VP per tech card | | Clock Tower | 1 |
| 5 | Symphony | Inspire | any 1 → create | | 2 |
| 6 | Carved Marble Sculpture | Broadcast, or any income building | | | 2 |
| 7 | Rock Opera | You may refresh the 3 face-up masterpieces; create (either order) | | Opera House | 2 |
| 8 | CGI Animation | Inspire | any 1 → any income building | | 2 |
| 9 | Flash Mob | Advance on exploration, science, technology or military, with its benefit (may pay its bonus) | | | 1 |
| 10 | Virtual Reality Holocenter | Any income building, then 1 VP per income building | | Holocenter | 1 |
| 11 | Infinite Spectrum Photography | As Flash Mob | any 1 → create | | 1 (the bonus in 2) |
| 12 | Streaming Implants | The benefits of up to 3 different masterpieces, yours or your neighbours' | | | 2 |

- Holocenter's "per income building" counts every income building that has left the income mat, as R71 rules for every building count. It is a new VP counter, `incomeBuilding`.
- Part 1 gives the spaces of part 2 their data with the new effects, which throw until part 2 builds them. No table offers A&A before part 2 lands, because the branch merges whole, and the simulation starts playing games with the arts track in part 2.

### 3.5 The tier prices (part 1)

The arts track has its own prices (03 §2.2):

| Tier | Price |
|---|---|
| I | any 1 resource |
| II | 2 different resources |
| III | any 3 resources |
| IV | 2 resources of the same type |

- `Cost` gains `different` and `same`: so many resources of the player's choice, all different, or all one type. `advanceCost('arts', space)` returns `{ any: 1 }`, `{ different: 2 }`, `{ any: 3 }` or `{ same: 2 }`.
- `payments()`, `canPay()` and `checkPayment()` understand both, with player errors such as "Pay 2 different resources." and "Pay 2 resources of the same type."
- `TRACK_RESOURCE` and `TRACK_BUILDING` stay four-track: the arts track has neither.

### 3.6 The landmarks and the d20 (part 1)

**The 3 arts-track landmarks** join `EXPANSION_LANDMARKS` with `expansion: 'aa'` and `source: { track: 'arts', … }`, so `state.landmarks` holds them only with the arts track in play (A&A on and the track off leaves them out), and Dystopia's `freeTrackLandmarks` finds them. Their footprints and heights are already in `src/lib/art/footprints.js` and `HEIGHT_RANKING`.

**The d20** has 20 faces, 4 per track: the four tracks and arts, repeated four times (03 §2.1). With the arts track in play every science-die roll uses it: research, Age of Discovery, Empiricism's second roll, the Treasure Hunters' treasure and the shared advances that roll. The `scienceDieRolled` event names the die, so the log and the dice tray show the right one.

- **Either science die** (the variant): before each roll, the roller chooses the d12 or the d20 (my call: the variant says "you may choose to roll either science die", so the choice is per roll). The d20 is the panel's default.
- **Alchemists** (03 §2.2): an arts face marks nothing and doesn't bust; the player may roll again or stop. Only the four tracks count.
- **Dark Ages** (03 §2.2) with the arts track: the player chooses the track to advance on, as now, then which one of the other four keeps its place; the other three regress once without benefit, then the chosen track advances 3 times without benefit (my call: asking both up front gives the same result as the ruling's order, since nothing random or hidden happens in between).

### 3.7 Masterpieces (part 2)

From 03 §2.2, §2.7 (the 20 cards) and §2.12.

- **Only with the arts track in play** (03 §2 "Modularity"), as with the inspiration tiles.
- **Supply.** `supply.masterpieces: { deck, faceUp, discard }`. Setup shuffles the 20 and turns 3 face up. The deck joins `HIDDEN_DECKS` in `view.js`, so `view()` hides its order and `revealed()` keeps undo from taking back a draw (#24 design §8).
- **Create.** Take one of the 3 face-up cards or the top card of the deck; the face-up row refills at once. Running out follows R119.
- **Refresh** (Rock Opera): discard the 3 face-up cards and turn 3 new ones.
- **A player's masterpieces** are `seat.masterpieces: { card, used }[]`, public, in the order gained.
- **At the start of each income turn**, before the civilizations (a new first income step): every masterpiece the player holds fires, in the order they choose. One left fires without asking (my call). A masterpiece gained during this step fires in the same step. Firing is mandatory, except that Costuming and Mime are declined by not paying.
- **Broadcast:** gain the benefit of one of your masterpieces that isn't used.
- **Single-use** (Art Deco, Mime): turned face down (`used: true`) after their benefit; a used card fires no more.
- **Streaming Implants:** up to 3 different masterpieces, chosen one at a time from yours and your neighbours'; not a used one, and never another player's single-use one.
- **The 20 effects**, from 03 §2.7's table. They need these new pieces:
  - VP counters for complete rows and complete columns in the capital city (Ballet, Modern Dance), which are not "scoring your capital city";
  - Ceramics' upgrade, after which that card can't be upgraded again this turn: not in the income step, not by a civilization;
  - Costuming: pay any 1 resource to advance on the arts track with benefit (may pay its bonus);
  - Mime: pay any 1 resource to gain the benefit of your current position on any track (may pay its bonus), using the repeat effect;
  - Topiary: conquer an adjacent territory with no outposts or other items, with both dice and responses as usual (R53).

### 3.8 Inspiration tiles (part 2)

From 03 §2.8.

- Each player has 4 tiles, one per income row. **Inspire:** choose an unused tile and place it on its row. The buildings stay where they are. `seat.inspired: BuildingId[]`.
- An inspired row improves spaces 2, 4 and 6:

| Row | Space 2 | Space 4 | Space 6 |
|---|---|---|---|
| Markets | coin + 2 VP | coin + 1 VP per territory you control | 15 VP |
| Houses | worker + 2 VP | worker + 1 VP per territory tile in your supply (R54) | 15 VP |
| Farms | food + 2 VP | food + 1 VP per tech card | 15 VP |
| Armories | culture + 2 VP | culture + 1 VP per house | 15 VP |

- The VP score in step 3 (income turns 2–5) and the resources come in step 4 (income turns 1–4), as on the base mat. R18's prerequisites read the same spaces, so nothing changes for them.
- With every tile placed, Inspire does nothing.

### 3.9 A&A's landmark cards (part 3)

Handed on from #32 (its design §7, and the comment on #35):

- A&A's 5 cards join `LANDMARK_CARDS` with `expansion: 'aa'`, and their landmarks join `EXPANSION_LANDMARKS`. They are dealt with A&A on, whether or not the arts track is in play (they are landmark cards, not arts content).

| Card | Goal at the end of your turn |
|---|---|
| Villa | at least 3 different types of income building in your capital city (R64) |
| Birdwatching Perch | at least 3 tech cards invented |
| Castle | this turn you moved into a tier that no longer had its landmark |
| Windmill | tier II or higher on at least 2 advancement tracks |
| Bridge | you control 3 territories adjacent to your starting territory |

- The draft runs with A&A alone too: `afterSetupSteps` and the landmark deck in `setup.js` ask for either expansion, not only `'pp'`.
- With both expansions' cards in, the draft deals players + 1, so the last drafter chooses from 2; the rest stay in the face-down deck (03 §7). One expansion alone deals the player count.
- Each goal goes in `landmarkGoal`, read by the engine's check and the Civ tab's goal line, and its words in `src/lib/cards/landmark-text.js`.
- **The Castle** needs the turn's moves: the engine records, during a player's own turn, each tier they moved into whose landmark was already gone (an Automa moving you doesn't count, 03 §2.10). "Advancement tracks" in the Windmill include the arts track (R118). "Invented" counts the tech cards the player holds, in any row (my call: a discarded card is no longer theirs).
- Castle has 12 plots (R63); both versions use the corrected footprints (R65).

### 3.10 Cards that mention the arts track

With the arts track off, a tapestry card, tech card or civilization that mentions it is discarded and replaced when drawn (03 §7). No such card is in the decks until #37 adds A&A's cards, so **#37 marks its arts cards and makes the decks leave them out** without the arts track (my call: a filter with nothing to filter can't be tested here). F&F's arts mentions always come with a core option and stay in (03 §7, R80, R81).

## 4. The client (part 4)

Built only after the owner approves clickable mockups with screenshots. What needs a look:

- **The Tracks board** with the arts track as a fifth row (#120 laid the board out for any number of tracks; at 1920×1080 a space is about 95px tall with five tracks and four players). The arts track's colour token, `--arts`, and its tier prices: "2 different" and "2 of the same" need their own symbols.
- **The masterpiece row:** the 3 face-up cards and the deck, near the arts track.
- **A player's masterpieces**, used ones face down, in the player tabs and in other players' views.
- **The inspiration tiles** on the income mat, and the unused ones beside it.
- **The d20** in the dice tray: a new die body, drawn by the art toolkit and approved in the library's Art area.
- **The new choices:** create (the face-up cards and the deck's back on the shelf), broadcast and Streaming Implants (masterpieces on the shelf), inspire (a row), the masterpieces' order at the start of an income turn, paying or declining Costuming and Mime, the die to roll with the variant, and Dark Ages' track left alone.
- **The lobby:** the A&A switch and the two variants.
- **The log and the card reference** for everything above, in our own words.
- `BoardSwitcher` takes the table's tracks, as #120 prepared.
- The README's "Current interface", `docs/ui/screens/` and `docs/ui/README.md` change with it.

## 5. Tests

Engine (`tests/engine-arts-track.test.mjs`, and `engine-masterpieces`, `engine-inspiration` as part 2 needs):
- the options: A&A and the two variants, accepted and refused; a one-player game with the arts track refused (R59);
- setup with and without the arts track: the tokens, the landmarks, the die, the masterpiece supply;
- **every arts space**, its benefit, its bonus and its landmark, one test each;
- the tier prices: every way to pay, and each wrong payment refused;
- the d20's faces; research landing on the arts track; Alchemists' arts roll; Dark Ages with five tracks; the either-die choice;
- each R118 effect on the arts track, and each four-track effect leaving it out;
- the masterpieces: create, refresh, the deck running out (R119), the income step's order and mandatory firing, broadcast, single-use, Streaming Implants with neighbours, each of the 20 effects;
- the inspiration tiles: each row's improved spaces at the right income steps;
- A&A's landmark cards: each goal, the players + 1 deal, the Castle's moves;
- a base game and a P&P game unchanged.

`tests/helpers/invariants.mjs` accounts for every masterpiece and inspiration tile exactly once and reads `tracksOf`; `views.mjs` checks the masterpiece deck never leaks. The simulation plays A&A games with the arts track on and off.

Client: the new words, symbols and prompts in Vitest; a browser test for an A&A table playing the arts track.

## 6. Left to the builder

- The names of the new effects, decisions and events, following the existing ones.
- The exact log and prompt words.
- Splitting each part into tasks in its plan.

## 7. Handed on

- **#36:** the advanced capital mats, and Swamp's penalty before or after the masterpieces.
- **#37:** A&A's civilizations, tapestry and tech cards (the building-plot cards, landmark-prerequisite tech cards, Oil Paint), and leaving out the arts cards without the arts track (§3.10).
- **#38 and #31:** R59 keeps Automa and Shadow Empire games without the arts track; the check in §3.1 stays when solo play is built.
- **#39 (F&F):** Psionics and Ecstatic Visions gain masterpieces (R74, R79); Generation Ships and Good Omens read the arts track (R80, R81).
