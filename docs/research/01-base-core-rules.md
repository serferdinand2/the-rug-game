# Tapestry (Stonemaier, 2019): Base Game Core Rules Reference

> **Decisions:** every **[UNVERIFIED]** item and open question in this file is decided in the README's [Rules conventions](../../README.md#rules-conventions) (R1–R105). Follow those decisions, not the working assumptions here.

Implementation-grade reference for a rules engine. It covers the **base game core rules only**: civilization texts, tapestry-card texts and tech-card texts are covered by other researchers (only the mechanics that touch them are described here).

## 0. Sources and confidence tags

Every non-trivial fact carries one or more tags:

| Tag | Meaning | Trust |
|---|---|---|
| **[RB]** | Official base rulebook `TapestryRules_r12` (May 2019), 4 pages | Official, but superseded where [FF] differs |
| **[FF]** | Official integrated rulebook `FF_Rulebook_r10` (Oct 2022), shipped with the Fantasies & Futures expansion; it holds the rules for the base game plus all 3 expansions, the **Track Reference**, the FAQ and the civ adjustments | **Most current official text. Preferred when sources disagree.** Base-game-only rules are separated from expansion rules (tagged PP/AA/FF in the book), and only the base-game parts are used here. |
| **[PP]** | Official Plans & Ploys rulebook r2 (2020), with the "new tiebreaker" and rule notes | Official |
| **[SM-FAQ]** | stonemaiergames.com Tapestry "Rules, Translations, FAQ" page | Official |
| **[ART]** | My own visual reading of the printed board, income mat, capital mats, landmark board, dice and tiles (art files from the BGA implementation repo, plus rulebook illustrations) | High (it is the printed component) |
| **[BGA]** | Board Game Arena implementation source, github.com/elaskavaia/bga-tapestry `material.inc.php` and game logic | Unofficial but a mature, rules-checked implementation. Used for exact data tables and cross-checked against [ART] where possible. |
| **[UNVERIFIED]** | I could not confirm this from an official source or from the component art | Treat as a working assumption |

Where sources disagree, I trust them in this order: [FF] > [PP]/[SM-FAQ] > [RB] > [ART] > [BGA]. Only two real disagreements were found: the **tiebreaker** (§11) and **playing a tapestry card in/after era 5** (§9.4).

---

## 1. Components (base game)

| Component | Count | Notes |
|---|---|---|
| Game board | 1 | Double-sided: **large map** for 4–5 players, **small map** for 1–3 players [RB][FF]. The 4 advancement tracks, the 3 achievements and the VP track (0–99 with 100+ rollover) are printed on both sides [ART]. |
| Landmark miniatures | **18** | 12 track landmarks (3 per track) + 6 tech-card landmarks [FF components table][BGA]. |
| Landmark board | 1 | Holds the 12 track landmarks with their footprints printed [ART]. The 6 tech-card landmarks go near the tech deck [RB]. |
| Income building miniatures | **25 of each of 4 types** (market, farm, house, armory) | 5 of each type per player, for 5 players [FF]. |
| Outpost miniatures | **10 per color × 5 colors** | 2 start on the map and 8 go to the player's supply [RB]. |
| Player tokens (cubes) | **13 per color × 5 colors** | 4 for tracks + 1 for VP; the extras serve as achievement markers, a 100-VP marker, extra track tokens (AI Singularity) and civ uses. If you run out, use spare cubes [RB][FF]. |
| Resource tokens | **5 of each of 4 types** (coin, food, worker, culture) | One per player per resource, used as markers on the income mat's resource tracker [FF]. |
| Dice | **3**: 1 green **science die (d12)**, 2 **conquer dice (d6)**: 1 red, 1 black | [RB][FF] |
| Civilization mats | **16** | [RB][FF] |
| Capital city mats ("basic") | **6**, numbered 1–6 | [RB][FF][ART] |
| Income mats | **5** | [RB][FF] |
| Tapestry cards | **50** | 43 unique cards + 7 copies of TRAP [BGA: `$traps = 7`; 43+7=50 matches the official count] |
| Tech cards | **33** (all unique) | [RB][FF][BGA] |
| Territory tiles | **48** | [RB][FF][BGA] |
| Space tiles | **15** | [RB][FF][ART] |
| Reference guides | 2 (identical) | [FF] |

### 1.1 Dice faces

| Die | Faces | Source |
|---|---|---|
| Science (green d12) | Each face shows 1 of the 4 track icons (exploration, science, technology, military). | Icons from [RB]/[ART]. **[UNVERIFIED]**: that each icon is on exactly 3 of the 12 faces (an equal ¼ chance). BGA models it as 4 equally likely outcomes. |
| Red conquer die (d6) | 4 VP, 5 VP, 6 VP, 7 VP, and "1 VP per territory you control" ×2 | Five face types confirmed from [ART]. The duplicated face (VP per territory) comes from [BGA] and is **[UNVERIFIED]** against a physical die. |
| Black conquer die (d6) | 1 coin, 1 worker, 1 food, 1 culture, and "?" ×2 (= the benefit printed on the conquered territory **tile**, if any) | Five face types from [ART]. The duplicated "?" comes from [BGA]: **[UNVERIFIED]**. |

### 1.2 Resources

There are four resources: **coin** (yellow), **worker** (grey), **food** (brown), **culture** (red). "Any resource" (a 4-colour wheel icon) means any 1 of the four. You may hold at most **8 of each** [RB][FF]. Each player tracks them on a 0–8 tracker at the bottom of the income mat [ART].

Each track has an associated resource. It is the "track resource" in tier costs (§3.1) and matches an income building [BGA `tech_track_types.resource`][ART]:

| Track | Track resource | Matching income building |
|---|---|---|
| Exploration | Food | Farm |
| Science | Worker | House |
| Technology | Coin | Market |
| Military | Culture | Armory |

---

## 2. Setup

### 2.1 Global setup [RB][FF]
1. **Board side:** use the large map for 4–5 players and the small map for 1–3 players.
2. **Tech deck:** shuffle the 33 tech cards face down and **reveal 3 face up** beside the deck.
3. **Tapestry deck:** shuffle the 50 tapestry cards face down.
4. **Territory and space tiles:** shuffle each set and place them face down. They are separate supplies.
5. **Landmarks:** put the 12 track landmarks on the landmark board and the 6 tech-card landmarks near the tech deck.
6. **Dice:** put the science die near the science track and the conquer dice near the military track.

### 2.2 Player setup [RB][FF]
1. **Capital city mat and starting territory:**
   - **4–5 players:** each player draws 1 random capital mat (of 6).
   - **1–3 players:** pair the capital mats by the numbers printed at the small map's 3 starting spots: **{1,6}, {2,4}, {3,5}**. Each player draws a random pair, keeps 1 mat and discards the other.
   - Place **2 of your outposts** on the map territory marked with your capital's number. Your other **8 outposts** form your supply.
   - The starting territory holds 2 of your upright outposts, so you control it and it can never be conquered (see §7.3).
2. **Income mat:** fill each of its 4 building rows with the matching 5 buildings (5 markets, 5 houses, 5 farms, 5 armories). The **leftmost space of each row stays exposed**. Set all 4 resource markers to **0**.
3. **Civilization:** draw 2 random civ mats, keep 1 and discard the other. Shuffle all unused and discarded civs into a civ deck, which is used when a civ is gained mid-game. In [FF] players draw 2 civs and the capital mat(s) together, then keep 1 of each.
4. **Player tokens:** place 1 token on the start space (the far-left circle) of each of the 4 tracks and 1 token on **0 VP**.
5. Do any **civilization-specific setup** and any **civilization adjustment** (balance changes such as extra resources/VP, or losing a resource at the end of income turn 1). These belong to the civ researcher [FF p.32].
6. **First player:** chosen at random.
7. **Starting hand and resources:** every player starts with **0 resources, 0 territory tiles, 0 tapestry cards and 0 tech cards** [RB: markers at 0]. These come from **income turn 1**, which is each player's **first turn** [RB][FF: "Your first turn must be an income turn"]. With only the leftmost spaces exposed, income turn 1 gives **1 coin, 1 worker, 1 food, 1 culture, 1 territory tile and 1 tapestry card** [ART income mat; §5].

Optional variants from [FF] that touch core rules:
- Players may agree to remove specific tapestry or tech cards.
- On income turn 1, draw 2 tapestry cards, keep 1 and discard 1.
- Whenever you draw a civ, draw 2 and keep 1.
- Instead of using capital numbers, place your starting outposts in the centre of the island closest to you. With 4 players, space the start positions evenly.

### 2.3 Map layouts (pre-printed territories)

Positions use the [BGA] axial coordinates `a_b`, centre = `0_0`. A hex `a_b` neighbours `a_(b±1)`, `(a±1)_b`, `(a+1)_(b+1)` and `(a-1)_(b-1)`.

- **Large map (4–5p):** a hexagon of radius 4, so **61 hexes** (all `a,b` in −4..4 with |a−b| ≤ 4) [BGA]. I confirmed visually that the columns hold 5,6,7,8,9,8,7,6,5 hexes [ART]. **25 hexes are pre-printed**: the middle island plus 6 starting regions of 4 hexes each. That leaves **36 unexplored** hexes.
- **Small map (1–3p):** a hexagon of radius 3 minus three corners (`0_-3`, `-3_0`, `3_3`), so **34 hexes** [BGA]. **13 are pre-printed** (middle island + 3 regions × 4), leaving **21 unexplored**. **[UNVERIFIED]**: I did not hand-count the small-map total against the art.

Starting territories [BGA, numbering cross-checked with ART]:

| Capital # / name | Large map start hex | Small map start hex |
|---|---|---|
| 1 Mountain | `-3_-3` | `-2_-2` (shared spot "1/6") |
| 2 Wetland | `-3_0` | `0_2` (spot "2/4") |
| 3 Tropical | `0_3` | `2_0` (spot "3/5") |
| 4 Desert | `3_3` | `0_2` (spot "2/4") |
| 5 Grassland | `3_0` | `2_0` (spot "3/5") |
| 6 Forest | `0_-3` | `-2_-2` (spot "1/6") |

The full pre-printed hex lists with corner terrains are in Appendix A [BGA].

---

## 3. The four advancement tracks (the key table)

### 3.1 General structure [RB][FF][ART]
- Each track has a **start space (position 0)** plus **12 spaces** in **4 tiers of 3**: tier I = spaces 1–3, II = 4–6, III = 7–9, IV = 10–12.
- **Cost:** pay the cost printed for the **tier you are advancing into**. Moving from space 3 to space 4 costs the tier II price. Each tier's cost is the same on all 4 tracks, with only the track resource changing [ART board, all four tracks checked][BGA]:

| Tier | Spaces | Cost | Exploration | Science | Technology | Military |
|---|---|---|---|---|---|---|
| I | 1–3 | **1 any** | any | any | any | any |
| II | 4–6 | **1 track resource + 1 any** | food + any | worker + any | coin + any | culture + any |
| III | 7–9 | **1 track resource + 2 any** | food + 2 any | worker + 2 any | coin + 2 any | culture + 2 any |
| IV | 10–12 | **2 track resource** | 2 food | 2 workers | 2 coins | 2 culture |

- **Landmarks:** the **first player to advance into tier II, III or IV of a track, by any means**, gains that tier's landmark and places it in their capital city [RB][FF]. The landmark sits on the **first space of the tier** (spaces 4, 7, 10) [ART]. Tier I has no landmark. Each landmark exists only once, cannot be gained again and cannot be substituted [FF FAQ].
- **Advance turn order of resolution** [FF FAQ]:
  1. Pay the cost.
  2. Move 1 space.
  3. If you earned a landmark, **place the landmark first**. A district it completes gives a resource you can already spend on the bonus.
  4. Gain the **benefit**. It is **mandatory**. If it has several parts, take them in any order unless the reference guide says otherwise.
  5. Optionally pay for the **bonus** **once**. Bonuses are always **optional**.

  If placing the landmark changes nothing else, you may place it at the end of your turn.
- **"X" under a research or advance icon** means you advance without gaining that space's benefit or bonus. Landmarks are still gained [FF].
- **You cannot advance beyond space 12.** A research or advance that would push you past space 12 does nothing: no move, no benefit, no bonus [RB][FF]. The exception is Alien Biology, which grants VP when this happens.
- **Re-activation limit** (an amendment from Arts & Architecture that applies to all games): **you may not activate the same track space more than once in a single turn** [FF][SM-FAQ].
- **Several tokens on one track** (AI Singularity): either token may be used for advance turns. When comparing positions, only your most advanced token counts [RB][FF].

### 3.2 EXPLORATION (resource: food; landmarks Lighthouse / Train Station / Launch Pad)
Names and benefits come from the [FF] Track Reference and were checked against the board art [ART]. "Bonus" is the optional extra you may pay for.

| # | Tier | Name | Benefit (mandatory) | Bonus (optional, once) | Landmark (first to enter tier) |
|---|---|---|---|---|---|
| 1 | I | Scouting | Gain 2 territory tiles. Your territory tiles are always kept **face up** in your supply. | — | — |
| 2 | I | Rafts | **Explore** (§7.2) | Pay 1 any → gain 1 tapestry card | — |
| 3 | I | Wagons | Explore **OR** gain 1 farm | — | — |
| 4 | II | Navigation | Gain 1 territory tile, then explore | — | **Lighthouse** (2×2) |
| 5 | II | Ships | Gain 1 VP per territory you control | Pay 1 any → gain 1 farm | — |
| 6 | II | Tunnels | Gain 1 territory tile and 1 farm | Pay 1 any → explore | — |
| 7 | III | Trains | Gain 2 territory tiles, then explore | — | **Train Station** (3×3) |
| 8 | III | Cars | Gain 1 farm, then 1 VP per farm in your capital city | Discard 2 territory tiles → 5 VP | — |
| 9 | III | Airplanes | Gain 2 territory tiles, then explore **anywhere** on the map (adjacency not required) | Pay 1 any → gain 1 tapestry card | — |
| 10 | IV | Space Shuttle | Gain 1 VP per **technology-track** space you have advanced | Discard 3 territory tiles → 10 VP | **Launch Pad** (2×3) |
| 11 | IV | Interstellar Travel | Gain 3 space tiles, then explore 1 of them. Explored space tiles go next to your income mat. | — | — |
| 12 | IV | Warpgates | Explore a space tile from your supply | Pay 1 any → explore another space tile | — |

### 3.3 SCIENCE (resource: worker; landmarks Apothecary / Academy / Laboratory)

| # | Tier | Name | Benefit (mandatory) | Bonus (optional, once) | Landmark |
|---|---|---|---|---|---|
| 1 | I | Astronomy | **Research with X**: roll the science die and advance on the rolled track for free, gaining **no** benefit or bonus | — | — |
| 2 | I | Mathematics | Gain 1 tapestry card | Pay 1 any → gain 1 house | — |
| 3 | I | Herbalism | Research with X **OR** gain 1 house | — | — |
| 4 | II | Medicine | Gain 1 VP per tech card you own, and gain 1 tapestry card | — | **Apothecary** (2×2) |
| 5 | II | Chemistry | **Research**: roll, advance, gain the benefit, and you may pay that space's bonus | Discard 2 tapestry cards from hand → 5 VP | — |
| 6 | II | Biology | Research (with benefit/bonus) **OR** gain 1 house | — | — |
| 7 | III | Academic Research | Gain the benefit of your **current position on any advancement track** (you may pay its bonus) | — | **Academy** (4×2) |
| 8 | III | Nutrition | Gain 1 house, then 1 VP per house in your capital city | — | — |
| 9 | III | Physics | Advance on **exploration, technology or military** (choose 1), gaining the benefit and optionally paying the bonus | — | — |
| 10 | IV | Neuroscience | **Regress** 1 space on **technology or military** (choose 1), then gain that space's benefit and optionally pay its bonus | — | **Laboratory** (3×2) |
| 11 | IV | Quantum Physics | Advance on exploration, technology or military with benefit/bonus, **then do it again** (same or a different track) | — | — |
| 12 | IV | Alien Biology | Roll the science die **4 times** and advance each time with **no** benefit or bonus. Gain **5 VP for each roll that would push you off a track.** | — | — |

Science notes:
- **Research procedure** [RB][FF]:
  1. Roll the science die.
  2. You **may** advance 1 space on the rolled track for free. You may decline after seeing the roll.
  3. If you enter a new tier first, gain its landmark.
  4. If the research icon on the space you came from has an **X**, gain nothing more. Without an X, gain the new space's benefit and you may pay its bonus.
- Landmarks are gained even when the research has an X [FF FAQ].
- The icons for Physics, Neuroscience and Quantum Physics were read from the board [ART]. Neuroscience shows only technology and military (**not** exploration), and [BGA] codes it the same way.
- Academic Research cannot repeat its own space in the same turn (re-activation limit). It also cannot repeat AI Singularity once your token has left that space [FF FAQ].

### 3.4 TECHNOLOGY (resource: coin; landmarks Forge / Rubber Works / Tech Hub)

| # | Tier | Name | Benefit (mandatory) | Bonus (optional, once) | Landmark |
|---|---|---|---|---|---|
| 1 | I | Pottery | **Invent**: gain 1 tech card (§8) | — | — |
| 2 | I | Carpentry | Gain 1 tapestry card | Pay 1 any → gain 1 market | — |
| 3 | I | Stone Tools | Invent **OR** gain 1 market | — | — |
| 4 | II | Metallurgy | You **may** discard all 3 face-up tech cards and replace them; then invent 1 | — | **Forge** (2×2) |
| 5 | II | Glass | Gain 1 farm, house **or** armory (your choice) | Pay 1 any → upgrade 1 tech card | — |
| 6 | II | Steel | Gain 1 VP per armory in your capital city, and gain 1 market | Pay 1 any → invent 1 tech card | — |
| 7 | III | Rubber | You may discard and replace the 3 face-up cards; then invent **2** tech cards, one at a time | — | **Rubber Works** (12-plot L shape) |
| 8 | III | Plastic | Gain 1 market, then 1 VP per market in your capital city | Pay 1 any → upgrade 1 tech card | — |
| 9 | III | Electronics | In any order: upgrade 1 tech card, **and** gain the **circle** benefit of 1 tech card in your middle row | — | — |
| 10 | IV | Computers | Gain 1 VP per **military** space advanced **plus** 1 VP per **science** space advanced | — | **Tech Hub** (3×2) |
| 11 | IV | Nanotechnology | In any order: upgrade 1 tech card **and** gain the **square** benefit of 1 tech card in your top row | Discard **3** tech cards → 10 VP (**2** on the neoprene board / playmat; [FF] lets players adopt this anywhere) | — |
| 12 | IV | AI Singularity | Gain **1 of each resource**. Take your token off the technology track and put it on the **start space of any track**. The technology track **still counts as complete** (achievement, and "spaces advanced" = 12). | — | — |

Technology notes [FF FAQ]:
- **Electronics:** you may upgrade a card from the bottom to the middle row and then use the circle benefit of that same card ("double-dip").
- **AI Singularity:** for "per technology space advanced" scoring, treat the removed token as still sitting on space 12.

### 3.5 MILITARY (resource: culture; landmarks Barracks / Tank Factory / Fusion Reactor)

| # | Tier | Name | Benefit (mandatory) | Bonus (optional, once) | Landmark |
|---|---|---|---|---|---|
| 1 | I | Archery | **Conquer** (§7.3) | — | — |
| 2 | I | Bladed Weapons | Gain 1 tapestry card | Pay 1 any → gain 1 armory | — |
| 3 | I | Walls | Conquer **OR** gain 1 armory | — | — |
| 4 | II | Standing Army | Gain 1 worker, and 1 VP per territory tile in your supply | — | **Barracks** (2×2) |
| 5 | II | Cavalry | Conquer **and** gain 1 armory | — | — |
| 6 | II | Gunpowder | Conquer **and** gain 1 tapestry card | Pay 1 any → gain 1 armory | — |
| 7 | III | Tanks | Conquer. If the territory **was controlled by an opponent**, gain the results of **both** conquer dice. | — | **Tank Factory** (3×3) |
| 8 | III | Warplanes | Conquer a territory **anywhere** on the map (adjacency not required) | Pay 1 any → gain 1 tapestry card | — |
| 9 | III | Anti-Aircraft Defense | Gain 1 armory, and 1 VP per tapestry card you have **in hand and on your income mat, including covered cards** | — | — |
| 10 | IV | Nuclear Bomb | Gain 1 VP per **exploration** space advanced. **Also** play a tapestry card from hand **on top of your current tapestry**; only the new card is active. | — | **Fusion Reactor** (3×3 minus 1 corner) |
| 11 | IV | Drone Assassins | **Score your capital city**: 1 VP per complete row and per complete column | Discard 3 tapestry cards from hand → 10 VP | — |
| 12 | IV | Mechs | Conquer and gain the results of **both** conquer dice. Also gain a **random additional civilization**. | — | — |

Military notes [FF FAQ]:
- **Nuclear Bomb with no tapestry card in hand:** score the VP but play nothing. Do not play the top deck card face down.
- **Mechs:** the extra civ is placed to the left of your current civ mat [RB][FF].

### 3.6 Bonus summary (quick index)
- **Pay 1 any:** Rafts (tapestry), Ships (farm), Tunnels (explore), Airplanes (tapestry), Warpgates (explore a space tile), Mathematics (house), Carpentry (market), Glass (upgrade), Steel (invent), Plastic (upgrade), Bladed Weapons (armory), Gunpowder (armory), Warplanes (tapestry).
- **Discard for VP:** Cars (2 territory tiles → 5), Space Shuttle (3 territory tiles → 10), Chemistry (2 tapestry cards from hand → 5), Drone Assassins (3 tapestry cards from hand → 10), Nanotechnology (3 tech cards → 10; 2 on neoprene).
- No other spaces have a bonus [ART].

### 3.7 End of track
- Space 12 is the end of every track; the board shows a striped end bar after it [ART].
- Reaching space 12 by any means (even without its benefit) earns the **"Complete any advancement track"** achievement (§10) [FF].
- No further advance on that track is possible. Rolls that would go past it do nothing, except under Alien Biology.

---

## 4. Turn structure

### 4.1 The two turn types [RB][FF]
On your turn, choose **exactly one**:
- **INCOME turn:** begin a new era (§4.2).
- **ADVANCE turn:** pay the cost and move **one** of your tokens **one** space on **one** advancement track, then resolve it (§3.1).

Play passes clockwise.
- There is **no pass action**. The rules offer only these two options, so if you cannot (or choose not to) pay for any advance you must take an income turn. This is my reading of [RB]; [BGA]'s help says the same.
- You may take an income turn **voluntarily** even when you could afford to advance [RB: "you may either…"].
- There is **no limit on advance turns per era**. Every player takes exactly **5 income turns**, but advance-turn counts differ [RB][FF].
- Each player's **first turn is income turn 1** [RB][FF]. In seat order, everyone first takes income turn 1, then the first player takes their next turn.

### 4.2 Income turn steps (by income turn number) [RB][FF][ART income-mat chart]

| Step | Applies on income turns | What happens |
|---|---|---|
| 1. Activate civilization ability(ies) | **2, 3, 4, 5** | With several civs, use them in any order. |
| 2. Play a tapestry card | **2, 3, 4** | See below. |
| 3. Upgrade tech card + score VP | **2, 3, 4, 5** | You may upgrade **1** tech card (optional), **then** score every exposed VP icon on your income mat (§5). |
| 4. Gain income | **1, 2, 3, 4** | Gain every exposed resource, territory-tile and tapestry-card icon (§5). Resources are capped at 8 each. Tiles and cards come from the general supply. |

Step 2 in detail:
- **"First of your neighbours" bonus:** before covering the slot, if neither neighbour has yet started this era, gain the resources printed in the slot: **era 2 slot: 1 any, era 3 slot: 2 any, era 4 slot: 3 any** [RB][ART].
- **Play the card:** put **1** tapestry card from your hand on the leftmost empty tapestry slot of your income mat. This is **mandatory if you hold one**. With an empty hand, put the **top card of the tapestry deck face down** there instead; it has no ability.
- **Resolve the card:** use its **WHEN PLAYED** ability now, or its **THIS ERA** ability from now until the **start of your next income turn** (§9).

Other income-turn rules:
- **Income turn 1** has no tapestry card. The era-1 slot is pre-printed with **"Maker of Fire"** [ART][FF FAQ].
- **Income turn 5 is your last turn:** you do steps 1 and 3 only. No tapestry card, no income [RB][FF].
- **Neighbours** are the players directly to your left and right. In a 2-player game your single opponent counts once [FF]. Solo play uses the separate Automa rules, out of scope here.
- **Overlapping turns:** a table convenience with no digital equivalent [RB].

### 4.3 Players finishing at different times; game end [RB][FF][SM-FAQ]
- **Your game ends when you finish income turn 5.** You take no more turns, and turn order skips you.
- After finishing you can still gain **VP from passive civilization abilities**, but **nothing else**. You **cannot play trap or response cards** after your final income turn. This is an Arts & Architecture amendment that applies to all games; a civ that explicitly allows it is the exception.
- **The game ends when all players have finished income turn 5.** There is no separate end-of-game scoring phase in the core rules; all VP were scored as they were earned.

---

## 5. Income mat

Layout [ART income mat, matches BGA `income_tracks`]:
- **Top-left:** a Markets row and a Houses row.
- **Top-right:** a Farms row and an Armories row.
- **Centre:** the tapestry strip with era slots 1–4 (era 1 is pre-printed "Maker of Fire"; slots 2–4 show 1 / 2 / 3 "any resource" icons plus the neighbours icon).
- **Bottom:** the 0–8 resource tracker.

Each building row has **6 spaces**. Space 1 is always exposed. Spaces 2–6 start covered by the 5 buildings.

**Gaining an income building:** take the **leftmost** remaining building of that type from the mat and place it in your capital city [RB]. This uncovers the next space to the right. After gaining k buildings of one type, spaces 1..k+1 of that row are exposed. Moving a building **does not** give income immediately; exposed spaces pay on income turns [FF FAQ].

**Income vs. VP icons:**
- Resource, territory-tile and tapestry-card icons pay in **step 4 (gain income)**, on income turns 1–4.
- Laurel (VP) icons pay in **step 3 (score)**, on income turns 2–5.

| Row (building) | Space 1 (always exposed) | Space 2 | Space 3 | Space 4 | Space 5 | Space 6 |
|---|---|---|---|---|---|---|
| **Markets** | *Barter*: +1 coin; **1 VP per tech card** | *Currency*: +1 coin | *Banking*: **1 VP per tech card** | *Credit Cards*: +1 coin | *E-Commerce*: +1 coin; **1 VP per tech card** | *Biometrics*: **10 VP** |
| **Houses** | *Symbology*: +1 worker; **1 VP per complete capital row and column** | *Language*: +1 worker | *Writing*: **1 VP per complete row/column** | *Telephone*: +1 worker | *Email*: +1 worker; **1 VP per complete row/column** | *Neural Implants*: **10 VP** |
| **Farms** | *Hunting*: +1 food; **+1 territory tile** | *Farming*: +1 food | *Breeding*: **4 VP** | *Preservation*: +1 food | *Fertilization*: +1 food; **7 VP** | *Food Printing*: **10 VP** |
| **Armories** | *Ceremony*: +1 culture; **+1 tapestry card** | *Racing*: +1 culture | *Team Sports*: **1 VP per territory you control** | *Tabletop Games*: +1 culture | *Video Games*: +1 culture; **1 VP per territory you control** | *Virtual Reality*: **10 VP** |

Scoring-icon definitions [RB][FF]:
- **Tech-card icon:** 1 VP for each tech card next to your capital mat, in **all rows**.
- **House/capital icon:** 1 VP for each **completed row** and each **completed column** of your capital city.
- **Red hex (territory) icon:** 1 VP for each territory on the map that you **currently control**.
- **Number icon:** VP equal to the number.
- **Repeats stack:** each exposed copy of an icon scores separately [FF].

Totals: a fully uncovered mat gives at most 4 coins, 4 workers, 4 food + 1 territory tile, and 4 culture + 1 tapestry card per income turn. The fixed VP per scoring add up to 4 + 7 + 4×10 = 51.

---

## 6. Capital city

### 6.1 Grid, districts, scoring [RB][FF][ART]
- **Grid:** 9×9 plots, split into **nine 3×3 districts**. Some plots are **impassable**, shown as orange dots on the mat [ART]. You can't build on them, but they **count as filled** for districts, rows and columns.
- **Placement:** place a building on any open plot. **Income buildings** fill 1 plot. **Landmarks** are miniatures with fixed footprints, aligned to the grid. Buildings never overlap other buildings or impassable plots (implied by "open plot") [RB][FF].
- **District completion:** filling the last plot of a district gives **any 1 resource immediately** [RB][FF].
- **Scoring the capital** (house icons on income turns, Drone Assassins, some tiles and cards): **1 VP per complete row + 1 VP per complete column** [RB][FF].
- **Overflow:** buildings may extend **outside** the grid, since a crowded city may not fit them. If there is no room at all, place the building next to the mat. It is **still yours and counts** for "per building/landmark" effects [RB][FF FAQ].
  - **[UNVERIFIED]:** BGA requires an overhanging landmark to cover at least 1 plot of the grid. Official text is silent.
  - Plots outside the grid belong to no row, column or district [BGA formal rules].
- **Placement is mandatory:** if you gain a building and can place it, you must; you may not hold it aside [FF FAQ]. If all 5 buildings of a type are already placed, you cannot take a different type instead [FF FAQ].
- **"Per farm/house/market/armory in your capital city" counts** every building of that type you own, including ones beside the mat. It equals 5 minus the number still on your income mat [BGA formal rules, citing designer rulings].
- **Landmark rotation:** landmarks may be **rotated** (90°) when placed, which changes their footprint orientation. **[UNVERIFIED]**: physically natural and implemented by BGA, but not stated in the official text.

### 6.2 The 6 basic capital mats: impassable plots [BGA grids, verified pixel-by-pixel against the mat art]
Rows run top to bottom and columns left to right. `1` = impassable, `0` = open. **Every mat has 22 impassable plots (59 buildable).** The number is the capital number, which sets the starting territory (§2.3).

```
1 MOUNTAIN   2 WETLAND    3 TROPICAL   4 DESERT     5 GRASSLAND  6 FOREST
000000000    000000001    000010011    000110000    000000000    000000000
110001110    110000111    000100011    101000000    111000010    001100100
000111000    000000000    001000001    100000110    111100000    000100010
000111110    011100110    000000000    000000000    000111100    011000001
000001100    001100000    010001000    010010011    000000111    000100000
011100001    111000010    000000000    011000001    111000001    001111100
001000000    000001100    101101010    011111000    001000000    010000100
000000010    011000000    011110000    001100000    000000100    001000111
001000000    000001000    001110000    000001000    000001000    000000011
```

(The Arts & Architecture and Fantasies & Futures expansions add "advanced" capital mats with special rules. They are out of scope.)

### 6.3 Landmarks: list, sources, footprints [ART landmark board][BGA]
Footprints are W×H in plots; `#` = occupied plot, `.` = empty corner.

| Landmark | Source | Footprint | Plots |
|---|---|---|---|
| Lighthouse | Exploration tier II (space 4) | 2×2 | 4 |
| Train Station | Exploration tier III (space 7) | 3×3 | 9 |
| Launch Pad | Exploration tier IV (space 10) | 2×3 | 6 |
| Apothecary | Science tier II (space 4) | 2×2 | 4 |
| Academy | Science tier III (space 7) | 4×2 | 8 |
| Laboratory | Science tier IV (space 10) | 3×2 | 6 |
| Forge | Technology tier II (space 4) | 2×2 | 4 |
| Rubber Works | Technology tier III (space 7) | 4×4 L shape: `..##` / `..##` / `####` / `####` | 12 |
| Tech Hub | Technology tier IV (space 10) | 3×2 | 6 |
| Barracks | Military tier II (space 4) | 2×2 | 4 |
| Tank Factory | Military tier III (space 7) | 3×3 | 9 |
| Fusion Reactor | Military tier IV (space 10) | 3×3 minus 1 corner: `.##` / `###` / `###` | 8 |
| Bakery | Tech card "Bakery" (square benefit) | 2×2 | 4 |
| Barn | Tech card "Barn" (square benefit) | 3×3 | 9 |
| Com Tower | Tech card "Com Tower" (square benefit) | 3×2 | 6 |
| Library | Tech card "Library" (square benefit) | 2×4 | 8 |
| Stock Market | Tech card "Stock Market" (square benefit) | 2×2 | 4 |
| Treasury | Tech card "Treasury" (square benefit) | 2×2 | 4 |

The 6 tech-card landmarks are placed through the **square (top-row) benefit** of the tech card with the same name [BGA tech data]. The card details belong to the tech-card researcher.

---

## 7. Map: exploring, conquering, control

### 7.1 Territories and terrain
- The map is a hex grid (§2.3). A hex is **explored** when it holds a territory tile or pre-printed terrain. Unexplored hexes show blank parchment.
- **Terrain types:** water (sea), desert, forest, grassland, mountain [BGA][RB].
- **Territory tiles:** 48 [BGA tile data, benefit counts spot-checked against tile art]. They come in 4 land-terrain pairings of 12 tiles each: desert/mountain, forest/grass, grass/desert, forest/mountain. Each tile shows **one benefit**:

| Tile benefit | Count |
|---|---|
| 1 coin | 8 |
| 1 worker | 8 |
| 1 food | 8 |
| 1 culture | 8 |
| 1 tapestry card | 4 |
| Invent (tech card) | 3 |
| Research **with X** (roll, advance, no benefit) | 2 |
| Gain 2 territory tiles | 2 |
| Gain 1 farm / 1 house / 1 market / 1 armory / upgrade 1 tech card | 1 each (5 total) |
| **Total** | **48** |

Per-tile corner terrains are in Appendix B [BGA].

### 7.2 Explore [RB][FF]
1. Choose 1 territory tile from **your supply**. You need at least 1.
2. Place it on an **unexplored hex adjacent to a territory you control**. "Explore anywhere" (Airplanes) drops the adjacency requirement. You may rotate it to any orientation.
3. **Score 1 VP for each of the tile's 6 sides with at least 1 aligned terrain** (0–6 VP). A side counts if the terrain along it partly or fully matches the neighbour's terrain at the shared edge. Water counts as terrain. The decorative "rivers" between land and the tile edge are ignored.
   - Sides facing unexplored hexes or the map edge never score.
   - Sides facing pre-printed territories and the middle island **can** score.
4. **Gain the tile's benefit.**

Edge cases:
- No valid hex, or no tile in supply: the explore does nothing and gives no benefits [FF FAQ].
- **Exploring does not place an outpost and does not give control.** Control comes only from conquering [RB][FF: control = your outpost].
- **Scoring model** [BGA]: each tile stores the terrain at its 6 corners. Side *i* runs from corner *i* to corner *i+1*. A side "aligns" if the terrain at **either** shared corner matches the neighbour's terrain at that same corner. This is a workable digital reading of "at least 1 aligned terrain".
- **Running out:** discarded tiles are **not** returned to the supply. When a supply (territory or space) runs out, nobody can gain that tile type any more [FF FAQ].

**Space tiles** (exploration tier IV) [RB][FF][ART]:
- To explore a space tile, place it **next to your income mat**. It does not touch the map and nothing aligns. Then gain its benefits.
- There are only 15, so they can run out.
- The 15 base tiles [ART, matching BGA `space_tiles`]:

| # | Benefits |
|---|---|
| 1 | Advance on science (with benefit/bonus) + 1 VP per science space advanced |
| 2 | Gain 1 armory + 1 VP per armory |
| 3 | Gain 1 house + 1 VP per house |
| 4 | Gain 1 tapestry card + play a tapestry card on top of your current one + 1 VP per tapestry card |
| 5 | 1 coin + 1 worker + 8 VP |
| 6 | Research (with benefit) + 6 VP |
| 7 | 1 food + 1 culture + 8 VP |
| 8 | 1 culture + score capital (1 VP per complete row/column) |
| 9 | Advance on technology (with benefit) + 1 VP per technology space advanced |
| 10 | Invent + upgrade + 1 VP per tech card |
| 11 | **Conquer** + 1 VP per territory you control. This is a **misprint**: the printed tile lacks the outpost (conquer) icon. Official erratum on [SM-FAQ]. |
| 12 | Advance on military (with benefit) + 1 VP per military space advanced |
| 13 | 13 VP |
| 14 | Gain 1 farm + 1 VP per farm |
| 15 | Gain 1 market + 1 VP per market |

### 7.3 Conquer [RB][FF]
1. You need at least 1 outpost in your supply. Once all 10 are on the map you can't conquer again [RB][FF].
2. Place an outpost on a territory that:
   - holds **no more than 1 item**. Items are outposts or tokens; a territory with **2 or more** items can't be conquered by anyone [FF].
   - is **adjacent to a territory you control**, unless the conquer says "anywhere" (Warplanes).
   - is **not one you already control**.
   - Must the target be explored? **[UNVERIFIED]**: the rules always say "territory", and [BGA] only allows explored hexes (tile or pre-printed). This appears intended.
3. **If it holds a lone upright opponent outpost:** that opponent may first respond with a **trap card** (§9.3).
   - **No trap:** **topple** their outpost (lay it on its side). You now control the territory. With 2 items on it, it can't be conquered again.
   - **Trap:** the opponent keeps control and **your** outpost is toppled.
4. **Roll both conquer dice** and gain the result of **one die** of your choice. You **always roll, even when trapped** [RB][FF FAQ]. Tanks (against an opponent-held territory) and Mechs give **both** dice.
   - **Red die:** 4 / 5 / 6 / 7 VP, or **1 VP per territory you control**. By [BGA] resolution order, control changes before the dice are rolled, so a successful conquest already counts its new territory.
   - **Black die:** 1 coin / worker / food / culture, or **"?"**. "?" gives the **benefit printed on that territory tile**, and only from a black "?" [FF FAQ]. Pre-printed map territories are not tiles and give nothing [FF FAQ, Colonialism ruling].
5. Deals between players are allowed but are never binding, and nothing tangible may change hands [RB][FF].

**Control** [RB][FF]: you control a territory when **your outpost is the only upright outpost** on it.
- Your starting territory holds 2 of your upright outposts, so you control it and it can't be conquered.
- A territory with 1 upright and 1 toppled outpost belongs to the upright outpost's owner and is permanently safe.

**Territory VP:** there is no automatic end-of-era scoring for territories. They score only through:
- exposed Armory-row icons (Team Sports, Video Games) on income turns 2–5,
- Ships, the red die face, space tile 11,
- other cards and civs.

---

## 8. Tech cards (mechanics only) [RB][FF]

- **Display:** 3 face-up cards beside the deck.
- **Invent:** take a face-up card or the top card of the deck. Refill the face-up row **immediately**. If the deck is empty, shuffle the discards into a new deck; if there are none, nobody can draw.
  - The new card goes to the right of your capital mat in the **bottom row**, which carries an **X** on the mat side strip (no benefit) [ART].
  - Rows have no size limit. A newly invented card gives **no immediate benefit**.
- **Upgrade:** move 1 card up one row.
  - **Bottom → middle:** gain the card's **circle** benefit.
  - **Middle → top:** requires the card's **prerequisite**, then gain its **square** benefit.
  - Cards in the top row can't be upgraded (some civs change this).
- **Prerequisite (top row only):** **you or either neighbour** must currently meet the condition printed on the card [RB][FF]. Two kinds exist [FF][BGA]:
  - **Track position:** being in or beyond a given tier (space 4, 7 or 10) of a given track. In [BGA], 27 of the 33 cards use this kind; the other 6 use the income-mat kind below.
  - **Income-mat innovation:** having uncovered a specific income-mat space. Used by the 6 landmark techs, e.g. Barn [FF].
- **Where upgrades come from:**
  - **Income turns 2–5** (step 3): 1 optional upgrade.
  - Track spaces: Glass and Plastic bonuses, Electronics, Nanotechnology.
  - Territory tiles, space tiles, other cards and civs.
  - Outside the income turn, an upgrade is mandatory if possible [BGA formal rules].
- **Circle/square "gain the benefit" effects** (Electronics, Nanotech) reuse a card's printed benefit without moving it.
- **VP:** income-mat tech icons and Medicine count **all** your tech cards, in every row. Flipped single-use (FF) cards also count.
- **Card list:** 33 base cards; details belong to the tech-card researcher.

---

## 9. Tapestry cards (mechanics only)

### 9.1 Hand and gaining
- Cards are drawn from the deck into your hand. They are the only **hidden information** in the game [BGA help].
- If the deck runs out, shuffle the discards; if there are none, nobody can draw [PP][FF FAQ].
- **Hand limit:** none is stated in any rulebook. **[UNVERIFIED]** that there is truly no limit.
- **Sources:** Ceremony income (1 per income turn 1–4), tracks (Mathematics, Carpentry, Bladed Weapons, Medicine, Gunpowder, the bonuses), territory tiles, and space tile 4.

### 9.2 Playing on income turns [RB][FF]
- Only on income turns 2, 3 and 4: one card onto the next era slot, which is **mandatory** if your hand isn't empty (§4.2).
- **WHEN PLAYED:** resolve once, immediately.
- **THIS ERA:** active from when it is played **until the start of your next income turn**, before that turn's card is played. If it gets covered by an "on top" play (Nuclear Bomb, space tile 4, some tech cards), it stops at once and **only the visible top card is active** [FF].
- **"Play on top of your current tapestry"** needs an existing card in the current era's slot. If the slot is still empty, the effect does nothing.
  - **After era 4** (during or after income turn 5), you may play onto the era-4 stack. This is a 2022 rule change: older printings forbade playing any tapestry card in era 5 [FF FAQ; designer clarification in BGG thread 3193257].
- A card played during **step 1** of an income turn (from a civ or ability) goes onto the **new** era's slot [FF FAQ].
- The base game has only WHEN PLAYED and THIS ERA cards. CONTINUOUS cards come from the expansions.

### 9.3 Trap cards [RB][FF]
- The base deck has **7 TRAP cards** [BGA].
- **Response use:** when an opponent tries to conquer a territory **you control**, you may **discard a trap from your hand** (this does not play it to your mat).
  - You **keep control** and **their outpost is toppled** (the [FF] wording).
  - They still roll and gain one conquer-die result.
  - Per the [BGA] card text, the trapper also gains 1 any resource. **[UNVERIFIED]** wording; the tapestry-card researcher should confirm.
- **Normal use:** a trap may be played as a normal tapestry card on an income turn. Per [BGA] it then gives 10 VP **[UNVERIFIED]**.
- **Achievement interactions:**
  - Outposts you topple **by trapping** count toward the "Topple two opponent outposts" achievement [RB].
  - If your conquest of the **middle island** is trapped, you **don't** get that achievement [RB][FF][PP].
- **No responses after you finish:** you can't use traps after your final income turn [SM-FAQ][FF].

---

## 10. Achievements [RB][FF][ART]

The achievements are printed on the board, bottom-left of the map.
- **Claiming:** the first time you meet a condition, put one of your tokens on the **highest free VP box** under it and gain that VP. [BGA] awards the VP immediately; the rulebook says only "place a token on the highest available VP space" **[inferred]**.
- **No repeats:** you can't earn the same achievement twice, and you can't lose one.
- **Off-turn triggers:** a condition met on an opponent's turn scores immediately [FF FAQ].
- **Running out:** once every box under an achievement is taken, later players get nothing.

| Achievement | Condition | VP, 4–5p (large map) | VP, 1–3p (small map) |
|---|---|---|---|
| **Complete any advancement track** | Have a token on space 12 of any track. You need not have gained that space's benefit. A token removed by AI Singularity still counts. | 15 / 10 / 5 | 10 / 5 |
| **Topple two opponent outposts** | Have caused 2 opponent outposts to be toppled, by conquering and/or trapping. They may belong to the same or different opponents, and **both must currently be toppled** [FF]. | 15 / 10 / 5 | 10 / 5 |
| **Conquer middle island** | Gain the conquer benefit **on the middle island**. A successful trap denies it. Placing a token there by any means other than a conquer doesn't count [FF]. | 10 / 5 | 10 / 5 |

---

## 11. VP sources, end of game and tiebreaker

**VP sources (core):**
- **Exploring:** 1 VP per aligned side (0–6).
- **Track benefits:** Ships, Cars, Space Shuttle, Medicine, Nutrition, Alien Biology, Steel, Plastic, Computers, Standing Army, Anti-Aircraft, Nuclear Bomb, Drone Assassins.
- **Bonuses:** 5 or 10 VP (§3.6).
- **Red conquer die:** 4–7 VP, or 1 VP per controlled territory.
- **Income-mat scoring on income turns 2–5:** tech cards, capital rows and columns, controlled territories, fixed 4 / 7 / 10 VP.
- **Achievements:** see §10.
- **Space tiles, tech-card circle and square benefits, tapestry cards, civilization abilities and civ adjustments.** Some civs start with bonus VP, or with negative VP (e.g. Heralds −15 in the [PP] adjustment list).

**VP track:** past 100, leave your token on the 100 space and start a second token at 0. Past 200, shift the 100 token, and so on [RB][FF].

**End:** after every player has finished income turn 5, the most VP wins [RB][FF].

**Tiebreaker:**
- **Current official rule** ([PP] "new tiebreaker", A&A amendment, [FF], [SM-FAQ]): the tied player with the **tallest landmark miniature in their capital city** wins. Designer Mike Young confirms that a player with no landmark in the city (e.g. City in a Bottle) loses every tie [BGG thread 3053734].
- **Original [RB] rule, now replaced:** most total resources left, otherwise a shared victory. BGA still uses this.
- **[UNVERIFIED]:** the miniatures' physical heights are not published, so a digital version must define its own height ranking (or keep the original resource tiebreaker), plus a rule for ties that remain after that. **I recommend writing this down as a deliberate house rule.**

"A great final score is 300 VP" [RB].

---

## 12. Official FAQ clarifications and errata (base core)

**Advancing**

| # | Ruling | Source |
|---|---|---|
| 1 | Order on an advance: (1) place the landmark if one is gained, (2) take benefits in any order unless the reference says otherwise, (3) optionally pay the bonus. A resource from a district completed by the landmark may pay that bonus. | [FF FAQ][SM-FAQ] |
| 2 | Reaching a new tier first, or finishing a track, **on an opponent's turn** still gains the landmark or achievement immediately. | [FF FAQ] |
| 3 | A second completed track does **not** score the achievement again. | [FF FAQ] |
| 4 | Benefits are mandatory and bonuses optional. | [RB][FF] |
| 5 | **Amendment (A&A, all games):** you may not activate the same track space more than once per turn. | [FF][SM-FAQ] |
| 6 | Each "repeat" icon (Academic Research, Lithium-Ion Battery) can be used once per turn. Different repeat icons may be combined in one turn, subject to #5. | [FF FAQ] |
| 7 | Research that enters a new tier gains the landmark if you are first. | [FF FAQ] |
| 8 | Electronics may "double-dip" the circle benefit of the card it just upgraded. | [FF FAQ] |
| 9 | After AI Singularity, "spaces advanced on tech" = 12. Its space can't be repeated (no token remains on it). | [FF FAQ] |
| 10 | Nuclear Bomb with an empty hand: score the VP, play nothing. | [FF FAQ] |
| 11 | Nanotechnology bonus: 3 tech cards on the cardboard board, 2 on the neoprene mat. Either may be used. | [FF][SM-FAQ] |

**Income and tapestry cards**

| # | Ruling | Source |
|---|---|---|
| 12 | No tapestry card is played on Maker of Fire in income turn 1, unless a civ says so. | [FF FAQ] |
| 13 | Uncovered income spaces pay on income turns, not when the building is taken. | [FF FAQ] |
| 14 | Era-5 tapestry plays: the old rule forbade them; the current rule allows them on top of the era-4 stack. Income turn 5 still has no tapestry step. | [FF FAQ] |
| 15 | A tapestry card played during step 1 of an income turn goes onto the new era's slot. | [FF FAQ] |

**Conquering and traps**

| # | Ruling | Source |
|---|---|---|
| 16 | Conquer dice are rolled even when an opponent traps you. | [FF FAQ] |
| 17 | A territory tile's benefit comes from conquering only through the black "?" face. | [FF FAQ] |
| 18 | **Amendment (A&A, all games):** no trap or response cards after your final income turn, unless your civ allows it. | [FF][SM-FAQ] |

**Exploring**

| # | Ruling | Source |
|---|---|---|
| 19 | No vacant hex adjacent to your territories: you can't explore and gain nothing. | [FF FAQ] |
| 20 | Discarded tiles never return to the supply. An empty supply means nobody gains that tile type. | [FF FAQ] |

**Buildings and landmarks**

| # | Ruling | Source |
|---|---|---|
| 21 | A full city doesn't stop you gaining a building: place it next to the mat. | [FF FAQ][SM-FAQ] |
| 22 | If you have room for a gained building, you must place it. | [FF FAQ] |
| 23 | A landmark already taken can't be swapped for another, and a used-up income building type can't be swapped either. | [FF FAQ] |

**Running out of cards; deals**

| # | Ruling | Source |
|---|---|---|
| 24 | Running out of tech or tapestry cards: reshuffle the discards; with none, no more draws. | [FF FAQ][PP] |
| 25 | Deals are allowed but non-binding; nothing tangible may be traded. | [RB][FF] |

**Errata and tiebreaker**

| # | Ruling | Source |
|---|---|---|
| 26 | **Erratum:** one space tile is missing its outpost icon. It means *conquer, then 1 VP per territory you control*. | [SM-FAQ] |
| 27 | **Tiebreaker change:** the tallest landmark in your capital city replaces "most resources". | [PP][FF][SM-FAQ] |
| 28 | Civilization adjustments are made at the start of the game only, never for civs gained mid-game. A resource the adjustment takes away is lost at the end of income turn 1. | [FF] |

---

## Appendix A: Pre-printed map hexes [BGA `map`, tile ids 49–77]

The terrain list gives the 6 **corner** terrains, starting at the tile's top-left corner and going clockwise, before rotation. `orient` is the rotation in 60° steps. Abbreviations: S=sea, D=desert, F=forest, G=grass, M=mountain.

- **Middle island (both maps):** `0_0` = id 49. All 6 corners are sea; the island in its centre holds D, F, G, M.
- **Large map (4–5p):**
  - `-1_-4`(50): S,S,S,S,F,S · `0_-3`(51, **start 6**): F,S,S,S,F,F · `1_-3`(61): M,F,F,M,S,M · `0_-2`(62): S,M,M,D,S,S
  - `3_-1`(63): D,G,G,D,S,D · `3_0`(55, orient 5, **start 5**): G,G,S,S,S,G · `2_0`(57, o5): S,S,M,F,F,S · `4_1`(56, o5): S,G,S,S,S,S
  - `2_2`(64): S,S,S,S,D,S · `3_3`(65, **start 4**): D,S,S,S,D,D · `4_3`(66): G,D,D,D,S,G · `3_4`(67): S,M,G,G,S,S
  - `0_2`(68): F,S,S,S,G,G · `0_3`(76, o5, **start 3**): S,S,M,F,F,S · `1_4`(69): S,F,S,S,S,D · `-1_3`(70): M,G,G,S,M,M
  - `-4_-1`(77): S,S,S,G,S,S · `-3_0`(59, o4, **start 2**): S,S,S,G,G,D · `-2_0`(58, o4): G,D,D,S,S,S · `-3_1`(71): F,F,D,D,S,D
  - `-2_-2`(72): S,M,S,S,S,S · `-3_-3`(73, **start 1**): S,M,M,M,S,S · `-4_-3`(75): M,G,G,S,M,M · `-3_-4`(74): F,S,S,S,G,F
- **Small map (1–3p):**
  - `-3_-3`(50) · `-2_-2`(51, **start 1/6**) · `-1_-2`(52): M,F,F,F,S,M · `-2_-1`(53): S,D,M,M,S,S
  - `1_-1`(54): M,M,G,G,M,S · `2_0`(55, **start 3/5**) · `3_0`(56) · `2_1`(76)
  - `-1_1`(58) · `0_2`(59, **start 2/4**) · `1_2`(60): S,D,G,F,D,D · `0_3`(77, orient 2)
  - Hexes `0_-3`, `-3_0` and `3_3` do not exist on the small map.

## Appendix B: Territory tiles [BGA `territory_tiles`]

Corner terrains are listed clockwise from the top-left corner (S/D/F/G/M as in Appendix A). "isl" = a tile whose 6 corners are all sea, with an island of the named terrain in the middle.

| id | corners | benefit | id | corners | benefit |
|---|---|---|---|---|---|
| 1 | S,D,S,S,S,S | coin | 25 | S,D,D,D,G,G | house |
| 2 | S,M,M,D,D,S | 2 territory tiles | 26 | isl G | food |
| 3 | S,M,D,D,S,S | food | 27 | S,G,S,S,S,S | worker |
| 4 | S,M,D,S,S,S | culture | 28 | isl G | coin |
| 5 | isl D | food | 29 | S,D,D,G,G,S | tapestry |
| 6 | S,D,S,S,S,S | worker | 30 | S,D,D,G,S,S | culture |
| 7 | isl D | coin | 31 | S,D,G,S,S,S | worker |
| 8 | S,M,M,M,D,D | farm | 32 | S,D,D,D,G,G | invent |
| 9 | S,M,M,D,D,S | tapestry | 33 | S,D,D,G,G,S | armory |
| 10 | S,M,D,D,S,S | culture | 34 | S,D,D,G,S,S | food |
| 11 | S,M,D,S,S,S | worker | 35 | S,D,G,S,S,S | culture |
| 12 | S,M,M,M,D,D | research (X) | 36 | S,G,S,S,S,S | coin |
| 13 | S,F,S,S,S,S | coin | 37 | S,M,S,S,S,S | coin |
| 14 | S,G,F,S,S,S | culture | 38 | S,F,M,S,S,S | culture |
| 15 | S,F,S,S,S,S | worker | 39 | S,M,S,S,S,S | worker |
| 16 | isl F | coin | 40 | isl M | coin |
| 17 | isl F | food | 41 | isl M | food |
| 18 | S,G,G,G,F,F | market | 42 | S,F,F,F,M,M | invent |
| 19 | S,G,G,F,F,S | tapestry | 43 | S,F,F,M,M,S | tapestry |
| 20 | S,G,G,F,S,S | culture | 44 | S,F,F,M,S,S | culture |
| 21 | S,G,F,S,S,S | worker | 45 | S,F,M,S,S,S | worker |
| 22 | S,G,G,G,F,F | upgrade tech | 46 | S,F,F,F,M,M | research (X) |
| 23 | S,G,G,F,F,S | invent | 47 | S,F,F,M,M,S | 2 territory tiles |
| 24 | S,G,G,F,S,S | food | 48 | S,F,F,M,S,S | food |

---

## Sources (actually used)

**Official rulebooks and FAQ**
- Official base rulebook r12 (PDF, hosted by Tabletopia): https://c.tabletopia.com/games/tapestry/rules/tapestryrules-r12/en
- Official integrated rulebook (Fantasies & Futures r10, with Track Reference, FAQ and civ adjustments): https://c.tabletopia.com/games/fantasies-and-futures/rules/ff-rulebook-r10-low/en
- Official Plans & Ploys rulebook r2 (new tiebreaker, rule notes): https://c.tabletopia.com/games/tapestry/rules/pp-tap-rulebook-r2/en
- Stonemaier Tapestry page: https://stonemaiergames.com/games/tapestry/
- Stonemaier Rules/Translations/FAQ page (amendments, erratum): https://stonemaiergames.com/games/tapestry/rules-translations-faq/
- Stonemaier Revised Civ Pack page (checked: no core-rule changes): https://stonemaiergames.com/games/tapestry/revised-adjusted-rebalanced-civilization-pack/

**Board Game Arena**
- BGA Tapestry game help: https://en.doc.boardgamearena.com/Gamehelptapestry
- BGA implementation source (data tables, board/mat/tile/dice art, developer rules notes with cited designer rulings): https://github.com/elaskavaia/bga-tapestry
  - Files used: `material.inc.php`, `modules/PGameXBody.php`, `misc/FORMAL_RULES.txt`, `misc/FORUM.md`, `img/*`

**BoardGameGeek threads**
Cited through the BGA repo's forum dump; BGG itself returned HTTP 403 to direct fetches.
- 3053734 (tiebreaker / City in a Bottle)
- 3193257 (era-5 tapestry rule)
- 3054727 (misprints)

## Open questions

1. **Science die faces:** is each track icon on exactly 3 of the 12 faces? I could not see a physical die. BGA assumes 4 equally likely outcomes.
2. **Conquer dice duplicates:** which faces repeat? BGA says the red die has 2× "VP per controlled territory" and the black die 2× "?". The art sprite shows only 5 distinct faces per die.
3. **Tiebreaker heights:** the tallest-landmark tiebreaker needs the physical heights of the 18 landmark miniatures, which are not published. We also need a fallback for a remaining tie, or for players with no landmark in the city. Decide on a digital house rule.
4. **Conquering unexplored hexes:** can you conquer an unexplored hex? BGA says no. No explicit official ruling was found.
5. **Landmark overhang and rotation:** must an overhanging landmark cover at least 1 grid plot? May landmarks be freely rotated? BGA says yes to both; official text is silent.
6. **Tapestry hand limit:** no limit is stated anywhere. Confirm.
7. **Trap card wording:** the exact text (gain 1 any resource when used as a trap? 10 VP when played as a tapestry?) comes from BGA. The tapestry-card researcher should confirm it against the physical card.
8. **Achievement VP timing:** VP are presumably gained the moment the token is placed. That is the BGA behaviour and the obvious reading, but the rulebook only says "place a token on the highest available VP space".
9. **Small-map hex count:** 34 hexes (radius-3 hexagon minus 3 corners) is taken from BGA and was not hand-counted on the art.
10. **"Tanks" with a trapped conquest:** if your Tanks conquest is trapped, does "was controlled by an opponent" still give both dice? Not addressed officially.
