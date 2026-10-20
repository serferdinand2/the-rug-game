# 02 — Tapestry (2019) BASE GAME card-like content catalogue

> **Decisions:** every **[UNVERIFIED]** item and open question in this file is decided in the README's [Rules conventions](../../README.md#rules-conventions) (R1–R104). Follow those decisions, not the working assumptions here.

Scope: the base game's civilizations, civ balance adjustments, tapestry cards, tech cards, landmarks, capital city mats, territory/space tiles and map, achievements, and the Automa + Shadow Empire solo system. Advancement-track spaces and core turn rules belong to the other researcher. They appear here only where a card refers to them.

Conventions
- Effects are paraphrased. Every number and condition is kept exact.
- **[UNVERIFIED]** means I could not confirm the item from a source. **[INFERRED]** means my own deduction from sources, marked as such.
- "Any resource" (the four-coloured circle icon) means 1 coin, worker, food or culture of your choice.
- Resource icons: coin = yellow pouch, worker = grey bust, food = brown mushroom-shaped loaf, culture = red star.
- Income buildings: farm = brown, house = grey, market = yellow, armory = red.
- Action icons:
  - Research = green d12 "science die". An **X** on it means no benefit and no bonus.
  - Conquer = black/red tower.
  - Explore = hex tile.
  - Invent = orange tech card.
  - Upgrade = orange arrow.
  - Tapestry card = green card.
  - Territory tile = grey hex.
- "IT n" = income turn n; the game has exactly 5. "Era" = the period that starts with an income turn.
- Base component counts, from Rulebook r12/r17 (identical):

| Component | Count |
|---|---|
| Tech cards | 33 |
| Tapestry cards | 50, which is 43 unique cards + 7 traps |
| Territory tiles | 48 |
| Space tiles | 15 |
| Landmarks | 18 (12 on the tracks, 6 on tech cards) |
| Capital city mats | 6 |
| Income mats | 5 |
| Civilization mats | 16 |
| Player tokens | 13 per player |
| Outposts | 10 per player |
| Dice | 1 science d12 + 2 conquer d6 (red and black) |

---

## 1. The 16 base civilizations (ORIGINAL printing text)

List verified: Alchemists, Architects, Craftsmen, Entertainers, Futurists, Heralds, Historians, Inventors, Isolationists, Leaders, Merrymakers, Militants, Mystics, Nomads, The Chosen, Traders. Sources:
- Stonemaier adjustment sheets
- Automa rulebook
- BGG FAQ wiki
- mat images: 15 of the 16 base mats appear in the myautoma web app. Traders is excluded from solo, so it has no image there.

General civilization rules (Rulebook r17 / F&F integrated rulebook):
- **Draft:** draw 2, keep 1. Unused and discarded mats are shuffled into a civ deck.
- **When abilities fire:** civ abilities fire at step 1 of an income turn. On the income-mat chart that step applies on IT 2–5 only.
- **Extra civs:** additional civs come from Mechs, the Radio tech card, Plague (A&A) and similar. Place them to the left of your current mat.
- **Ending:** after your 5th income turn you can still gain VP from passive civ abilities, but nothing else.
- **Solo:** the Automa rules remove Futurists\*, Heralds\*, Inventors\* and Traders. The \* means "may be used, but unbalanced".

Complexity stars come from the official Civ Complexity Guide (2024). They refer to the current (revised) mats:

| Stars | Civilizations |
|---|---|
| ★ | Craftsmen, Heralds, Historians, Inventors, Leaders, Merrymakers, Militants, Traders |
| ★★ | Entertainers, Isolationists, The Chosen |
| ★★★ | Alchemists, Architects, Futurists, Mystics, Nomads |

### 1.1 Summary table

| Civ | Start-of-game setup (as printed) | Trigger | Core ability (short) |
|---|---|---|---|
| Alchemists | none | start of IT 2–5 | Push-your-luck science-die rolls, then advance on each distinct track rolled (no benefit) |
| Architects | none | on district completion; on every city scoring | Uniform districts give +1 any resource; uniform rows/columns score 2 VP instead of 1 |
| Craftsmen | none | whenever you gain an income building | Optional 12-space "statue" grid; each covered space gives its benefit |
| Entertainers | 1 token on the start space | start of IT 2–5 | Move 1 step right along a path grid and gain the benefit |
| Futurists | when gained: +4 spaces on every track, +1 of each resource | once | Head start (no benefits, bonuses or landmarks) |
| Heralds | 4 tokens; at end of IT 1 may play a tapestry card on Maker of Fire | start of IT 2–5 | Copy any face-up "when played" tapestry card (1 token each) |
| Historians | 4 tokens covering 4 benefit squares | start of IT 2–5 (send); any time (trigger) | Send tokens to opponents; when such an opponent gains a landmark, gain all exposed squares |
| Inventors | 4 tokens | start of IT 2–5 | Put a token on any tech card to upgrade it instantly; steal opponents' cards when they reach the top row |
| Isolationists | 4 tokens | when conquering an empty territory; final IT | Block territories (+1 any resource); final-IT VP for largest same-terrain landmass |
| Leaders | none | start of IT 2–5 | Once per track: free advance with benefit, no bonus |
| Merrymakers | 1 token at the bottom of each of 3 columns | start of IT 2–5 | Move 1 token up 1 and gain that space |
| Militants | 8 outposts on the mat (2 rows × 4) | on conquer (take outpost); start of every income turn | Gain all exposed spaces each income turn |
| Mystics | when gained: predict a number in 4 categories | when a number is reached; final IT | +1 any resource on reaching each prediction; 10 VP per exact prediction |
| Nomads | none | whenever you gain a building or landmark | May place buildings on the map instead of the capital |
| The Chosen | none | start of IT 2–5 | VP per track where you lead; resources per achievement (5 VP each on the final IT) |
| Traders | 4 tokens | start of IT 2–5 | Place a token on a territory for VP or a territory benefit |

### 1.2 Full texts (paraphrased, numbers exact)

#### ALCHEMISTS
- Mat: 4 boxes marking rolled tracks: Exploration, Technology, Science, Military. Each shows the track icon with an X, meaning advance without benefit.
- **Start of IT 2–5:**
  1. Roll the science die. Mark the rolled track with a player token.
  2. You may roll again or stop.
  3. If you roll a track you already rolled this activation, you **bust**: remove all tokens and gain **1 any resource** as consolation.
  4. If you stop without busting, you may advance once on **each** rolled track, with no benefits and no bonuses. Then remove all tokens.
- Each time the final result of this ability would push you off the end of a track, gain **5 VP**.
- No mid-game clause.

#### ARCHITECTS
- Completing a district normally gives 1 any resource. When you complete one in which **all income buildings are identical**, gain **+1 more any resource**. The district must contain at least 1 income building.
- Whenever you score your capital city, each complete row or column whose income buildings are all identical (minimum 1) is worth **2 VP instead of 1**.
- Mid-game gain: you may immediately swap the positions of 2 income buildings in your capital, and may repeat this **up to 2 more times** (3 swaps maximum).
- [INFERRED] Landmarks and impassable plots in the row/column/district are ignored for the "identical" test. The text only constrains income buildings.

#### CRAFTSMEN
- You may place income buildings on this mat instead of in your capital city.
- Each building must go on the **lowest open space of a column of your choice**. You do not have to finish a column before starting another.
- When you cover a space, gain its benefit immediately.
- The grid counts as part of your capital city for building-related benefits (e.g. "1 VP per house"). It does **not** score completed rows or columns.
- Grid (bottom → top):

| | Column A (3 spaces) | Column B (4 spaces) | Column C (5 spaces) |
|---|---|---|---|
| row 5 (top) | – | – | **15 VP** |
| row 4 | – | **10 VP** | Research (with benefit, may pay bonus) |
| row 3 | **5 VP** | Upgrade 1 tech card | 1 culture |
| row 2 | 1 territory tile | Invent 1 tech card | 1 tapestry card |
| row 1 (bottom) | 1 worker | 1 coin | 1 food |

#### ENTERTAINERS
- Start with a player token on the far-left start space.
- **Start of IT 2–5:** advance the token one space to the right along a path and gain that benefit. That is 4 moves, one per column.
- Mid-game gain: put the token on **any** space of the grid and gain that benefit.
- Grid, read from the mat image (rows top → bottom):

| Row | Col 1 | Col 2 | Col 3 | Col 4 |
|---|---|---|---|---|
| 1 | 1 worker | 1 farm | Conquer | Advance on Technology |
| 2 | 1 culture | 1 market | Research **without** benefit or bonus (X) | Advance on Exploration |
| 3 | 1 food | 1 house | Invent | Advance on Military |
| 4 | 1 coin | 1 armory | Explore | Advance on Science |

- The start space connects to all 4 Col-1 spaces.
- Between columns, each space connects to the same row in the next column plus one or both diagonally adjacent rows, via drawn "X" crossings. **[UNVERIFIED]** The exact edge set: the only image available is 300 px wide. What can be seen:
  - Col 2 → Col 3: crossings between rows 1–2 and between rows 3–4, plus straight lines.
  - Col 1 → Col 2 and Col 3 → Col 4: crossings also appear between rows 2–3.
- **[UNVERIFIED]** Whether the Col-4 "advance" icons allow paying the bonus. The plain track icon normally means "advance, gain the benefit, may pay the bonus".

#### FUTURISTS
- **When you gain this civ** (at setup or mid-game): advance on **each** of the 4 tracks by exactly **4 spaces**. The end of a track is the limit.
- Do **not** gain benefits, bonuses or landmarks for this. Also gain **1 of each resource**.
- Ruling (BGG FAQ): landmarks you pass stay available. You can gain one later only by actually advancing onto that landmark's space, not by repeating or regressing.

#### HERALDS
- Start with **4 player tokens** on the mat.
- If you **start** the game with the Heralds: at the end of your first income turn you may play a tapestry card on top of **Maker of Fire**.
- **Start of IT 2–5:** you may move one token from the mat onto any "**when played**" tapestry card, yours or an opponent's, and gain that card's benefits.
- Each tapestry card may hold at most 1 token. Only topmost (exposed) cards can be chosen (official FAQ).

#### HISTORIANS
- Start with **4 player tokens** covering 4 squares:

| | | |
|---|---|---|
| top row | **3 VP** | **1 food** |
| bottom row | **1 worker** | **3 VP** |

- **Start of IT 2–5:** you may discard **1 territory tile** from your supply to give one token to any opponent. That opponent may already have one.
- Whenever **any opponent holding your token gains a landmark**, gain **all currently exposed** squares.
- Mid-game gain: immediately give all 4 tokens to opponents, leaving every square exposed.
- **[UNVERIFIED]** Which square you uncover when giving a token. Presumably your choice.

#### INVENTORS
- Start with **4 player tokens**.
- **Start of IT 2–5:** you may move one token onto any tech card, yours or an opponent's. That card is **instantly upgraded** one row and **ignores top-row prerequisites**. Per the BGG FAQ ruling, it ignores them for the rest of the game.
  - On an opponent's card, the opponent gains the upgrade benefit and you may then gain it too.
  - On your own card, gain the benefit normally.
- When an opponent's tech card carrying your token is upgraded to the **top row** (by anyone):
  1. The opponent gains the benefit.
  2. You may gain it as well. The official FAQ says "your opponent gets the square benefit, then you do".
  3. You **take the card** into your bottom row. Your token stays on it.
- A landmark on a tech card the opponent already claimed does nothing for you.

#### ISOLATIONISTS
- Start with **4 player tokens**.
- Whenever you conquer an **empty** territory, you may also place one of these tokens there besides your outpost. The territory then has 2 tokens and can never be conquered. If you do, gain **1 any resource**.
- **Final income turn:** score VP for your largest connected land mass of a single terrain type that you control:

| Territories | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| VP | 5 | 10 | 16 | 23 | 31 | 40 |

- Example on the mat: 3 connected grassland territories = 16 VP.
- Rulings: water is not a land mass. The middle island is not a wildcard; it is surrounded by water.
- **[UNVERIFIED]** Scoring above 6 territories (presumably capped at 40). Also how multi-terrain tiles are judged (see Open questions).

#### LEADERS
- 4 leader squares: Exploration, Technology, Science, Military.
- **Start of IT 2–5:** you may place a player token on an uncovered leader square and advance **for free** on that track. Gain the benefit but **not** the bonus.
- Each square can be used once, so 4 uses at most.

#### MERRYMAKERS
- Three columns. Start with 1 token below the bottom of each.
- **Start of IT 2–5:** pick 1 token, move it up one space, and gain that space. Each double-icon space gives **both** icons.

| Level | Column 1 | Column 2 | Column 3 |
|---|---|---|---|
| 3 (top) | 1 culture + 1 armory | Explore + Research (with benefit) | 15 VP |
| 2 | 1 worker + 1 food | Invent + 1 tapestry card | 10 VP |
| 1 | 1 coin | 1 territory tile | 5 VP |
| start | token | token | token |

#### MILITANTS
- Start with **8 outposts** on the mat's 8 hex spaces. These, plus the 2 on your capital, are all 10 of your outposts.
- Whenever you conquer, take the outpost from the **far left of either row**.
- At the beginning of each of your income turns, gain **all exposed** benefits. The printed text does not limit this to IT 2–5.
- Mid-game gain: place your remaining outposts on these spaces from **right to left**, choosing the row for each.

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Top row (left → right) | 1 coin | 2 VP | 1 food | 4 VP |
| Bottom row (left → right) | 1 VP | 1 worker | 3 VP | 1 culture |

#### MYSTICS (original printing)
- **When you gain this civ:** place player tokens to predict a number in each category:

| Category | Allowed values |
|---|---|
| Tech cards you have | 1–9 |
| Complete districts | 1–9 |
| Territories you control | 1–9 |
| Completed advancement tracks | 1–4 |

- The **first time** you reach a predicted number, gain **1 any resource**.
- **Final income turn:** gain **10 VP** for each category predicted **exactly**.
- Mid-game gain: discard it and gain another civ.
- Stonemaier tells owners to keep this original mat for the P&P solo campaign.

#### NOMADS
Whenever you gain a building or a landmark, you may place it in your capital or on the map in one of two ways:
- **(a)** On a territory you control that holds **exactly 1 other token** (outpost or building). Gain **1 any resource**. Opponents can no longer conquer that territory.
- **(b)** On an **empty territory adjacent** to one you control. This gives you control, but it is **not** a conquer action. If an opponent conquers it, it counts as an outpost.

Per-building VP icons (e.g. "1 VP per house") still count buildings on the map. Nothing is printed for a mid-game gain.

#### THE CHOSEN
**Start of IT 2–5:**
- For each track you have **completed**, or on which **no token is further advanced** than yours, gain **1 VP per opponent**.
- For each achievement you have earned, gain **1 any resource**. On your **final** income turn, gain **5 VP per achievement** instead.

#### TRADERS
- Start with **4 player tokens**.
- **Start of IT 2–5:** you may place one token on any map territory of one of these kinds:
  - **Empty territory:** gain **1 VP per adjacent territory controlled by opponents**. If an opponent later conquers this territory, you may gain the benefit of any **unselected** conquer die, as if you had rolled it.
  - **Territory with exactly 1 opponent outpost and nothing else:** gain the benefit on that territory, if it has one.
- Reminder printed on the mat: a territory with 2 tokens of any kind cannot be conquered.
- **[UNVERIFIED]** Whether a lone Traders token gives control. The text is silent.

---

## 2. Official civilization balance adjustments

Stonemaier published **setup-only** adjustments several times, then replaced them with fully rewritten mats. All adjustments apply at game start only, unless a column below says otherwise. The F&F FAQ says required resource losses happen "at the end of income turn 1".

### 2.1 Versions found

| # | Version | Date | Where printed | Notes |
|---|---|---|---|---|
| A | "Civilization Adjustments" v1.1 | Nov 2019 | Stonemaier PDF (Dutch copy on Storyblok); the BGG FAQ quotes the English text | Some adjustments also apply when the civ is gained mid-game |
| B | P&P rulebook back page | 2020 | Plans & Ploys rulebook p.4 | "These adjustments are made at the start of each game… No adjustments are made when gaining civilizations during the game." |
| C | "Civilization Adjustments" r10 | Jan 2022 | Stonemaier Dropbox PDF | Asterisks mark changes since the previous guide |
| D | F&F rulebook back page and "civ adjustments from FF.png" | 2022–2023 | F&F integrated rulebook p.32; Dropbox PNG (Jul 2023) | The tabletopia r10-low PDF mislabels the Heralds entry as "HISTORIANS"; the PNG has it right |
| E | Revised, Adjusted, Rebalanced Civilization Pack | 2023–2024 | Physical replacement mats (31 civs + 2 capital mats), marked with a puzzle-piece icon | Full ability rewrites, not setup tweaks. Final text: Stonemaier Google Sheet (bit.ly/3URyOTn) |
| (BGA) | "Version 8 civilization adjustments" | ? | Board Game Arena option "with Adjustments" (default) | **[UNVERIFIED]** content; not found |

### 2.2 Setup adjustments: original vs each version (base civs only)

"Original" = no adjustment in the first printing. "any" = any resource of your choice.

| Civ | Original | A: v1.1 (Nov 2019) | B: P&P (2020) | C: r10 (Jan 2022) | D: F&F (2022–23) |
|---|---|---|---|---|---|
| Alchemists | – | +2 any; not if gained mid-game | +2 any | +2 any **and +10 VP** | **+1 any and +10 VP** |
| Architects | – | 3+ total players: +10 VP per opponent; not if gained mid-game | same | same | **Place 1 cube per opponent on your capital as an impassable plot, each cube in a different district** |
| Craftsmen | – | Lose 1 any (if possible), also when gained mid-game. If starting with them, choose the lost resource after IT 1 | Gain 1 fewer resource during your first income turn | Lose 1 any | **No change** |
| Entertainers | – | none | none | **+1 any** | **+1 any and +10 VP** |
| Futurists | – | Lose 1 culture and 1 other any, at start or when gaining their starting benefits | Lose 1 culture + 1 any | Lose 1 culture + 1 any | Lose 1 culture + 1 any |
| Heralds | – | **−15 VP**, also when gained mid-game ("start the game at −15 VP") | −15 VP | **No change** (marked updated) | At the end of your first income turn, draw tapestry cards until you find a "When Played" or "Continuous" card. Discard the others. You may play a When Played or Continuous card on top of Maker of Fire. Heralds may **not** put Renaissance over Maker of Fire |
| Historians | – | none | none | **If playing with the Arts track (A&A), lose 5 VP per opponent** | none (the r10-low PDF's "Historians" heading is a mislabelled Heralds entry) |
| Inventors | – | none | none | none | none |
| Isolationists | – | none | none | none | **Also gain 2 territory tiles** |
| Leaders | – | none | none | none | none |
| Merrymakers | – | +1 any, also when gained mid-game | +1 any | +1 any | +1 any |
| Militants | – | none | none | none | none |
| Mystics | – | none | none | **+1 any** | +1 any |
| Nomads | – | none | none | none | none |
| The Chosen | – | +15 VP per opponent; The Chosen cannot be gained mid-game | +15 VP per opponent | +15 VP per opponent | +15 VP per opponent |
| Traders | – | +2 any; not if gained mid-game | +2 any | +2 any **and +10 VP** | +2 any and +10 VP |

### 2.3 Revised Civ Pack (E): what changed for each base civ

Source: Stonemaier's public final-text spreadsheet, column "Pre-Typesetting Revisions", with status as of 7/31. **[UNVERIFIED]** Wording of the printed mats may differ slightly. Stonemaier says to ignore the setup adjustments in §2.2 when using these mats. Keep the original Historians, Islanders and Mystics for the P&P solo campaign.

| Civ | Revised version (summary, numbers exact) |
|---|---|
| Alchemists | **New ability.** Mat has a "pot" and a "beaker", each holding max 2 dice. Start of IT 2–5, "research elixirs": roll all 3 dice (science + 2 conquer). Remove one die to the pot (if it is the red die) or the beaker (if black or science). Repeat with 2 dice, then 1. Move 1 die from beaker to pot, then gain the pot. Science die: advance on its track with benefit (may pay bonus) plus the red die's points. Black die: gain the resource **and** a benefit (food = explore, star = conquer, coin = invent, worker = advance without benefit) plus the red die's points. "?" = benefit of a territory you control. |
| Architects | Setup: 1 impassable cube per opponent, each in a different district (= adjustment D). Row/column wording becomes "worth 1 extra VP". |
| Craftsmen | Adds a mid-game clause. Place up to 1 token per column, in rows up to the current era number, and gain only one covered benefit. Later buildings go above those tokens. |
| Entertainers | Trigger changes to **start of IT 1–4** (was 2–5). |
| Futurists | Changes to: at the end of IT 1 (or immediately if gained mid-game), advance on **up to two different tracks by exactly 4** (end of track is the limit). No benefits, bonuses or landmarks. Gain **any 2 resources**. |
| Heralds | Start bonus = adjustment D, but you only place the card (no immediate benefit). Official note: target only "when played" cards with the main ability. |
| Historians | Start with 1 territory tile. Sending tokens happens at the start of IT 2–5 in 1–3 player games and IT 1–4 in 4–5 player games. Trigger becomes "an opponent with your historian gains a landmark **from an advancement track**". Benefits become: research without benefit/bonus; pay 1 tapestry card to gain 1 tech card; 1 food; score VP for territories controlled. Mid-game: discard and redraw if in era 1 or 2. Otherwise give 4 tokens, and gain the exposed benefits if no track landmarks remain. |
| Inventors | Wording clarified: you gain the card "after the benefits have been resolved". A token permanently waives prerequisites. |
| Isolationists | Start with 4 tokens (**+1 in 4–5 player games**) **and 2 territory tiles**. |
| Leaders | The square of track icons becomes a pentagon that adds the Arts track (A&A). |
| Merrymakers | **New ability.** Two tokens on a grid. Start of IT 2–5, move each token once orthogonally and gain the space; tokens may never share a space. The old "conquer" space becomes "1 VP per territory controlled". |
| Militants | The trigger becomes "whenever you would **place an outpost**". Top row: 1 coin, 2 VP, 1 food, 1 VP per territory controlled. Bottom row: 3 VP, 1 worker, 5 VP, conquer (resolved last during income). May use player tokens as outposts when out of outposts. |
| Mystics | **New ability.** A private 8-card tapestry deck. After playing a tapestry card on IT 2–4, gain the top public card, discard your whole hand, then gain rewards by cards discarded (2 / 4 / 6 tiers) and draw 2 from your private deck. |
| Nomads | Adds a mid-game clause: gain an income building of your least-held type and place it per the ability. |
| The Chosen | **New ability.** A personal achievement track. Each achievement completed (public, or one of 6 private ones: 4+ of a resource, 4+ tapestry cards, 4+ territory tiles, 4+ tech cards, 4+ of one income building type, 4+ landmarks) advances a token to gain the next benefit or 5 VP. Track: worker → coin → tech card → food → any income building → culture → science die (full) → score city → conquer with both dice. |
| Traders | **New ability.** Start with 2 territory tiles. Three options at the start of IT 2–5: build on a 1-outpost opponent territory and share benefits; share control of a 1-outpost opponent territory; or token on your own 1-outpost territory for 1 any resource or 5 VP plus a black-die roll. |

---

## 3. Tapestry cards: 43 unique + 7 traps

- Count: Stonemaier design diary ("43 unique tapestry cards"), Rulebook ("TAPESTRY CARDS (x50)"), retailer component list ("7 trap cards"). The F&F Automa rules also say that after removing 2 traps for solo "there should be 5 traps in the game".
- Text: paraphrased from the BGG FAQ wiki's tapestry table, cross-checked against official rulings where they exist (official FAQ page, F&F rulebook FAQ).
- Timing:
  - **WHEN PLAYED** = one-time effect on play.
  - **THIS ERA** = active from play until the start of your next income turn.
  - **Trap** = response card.
- Playing: tapestry cards go on IT 2, 3 and 4 onto the leftmost blank space of the income mat. Era 1 is the printed **Maker of Fire**; no rulebook describes any ability for it.
- First of your neighbours to start a new era: gain the resource shown under the newly covered space. That is income-mat content.
- **Solo** column: ✗ = removed for Automa games, per the base Automa rulebook. ✗\* = may be kept but unbalanced.
- Not base, but appears in fan lists: Commercial Center (P&P) and the A&A cards (Age of Enlightenment, Artistic Inspiration, Found Art, Government Grants, Granges, Information Age, Infrastructure Upgrade, Migration, Monuments, Moon Landing, National Parks, Plague, Political Posturing, S.T.E.A.M., Silk Road, Space Race, Spymaster, Star Chamber, Trade Routes).

| # | Name | Timing | Effect | Solo | Notes / official rulings |
|---|---|---|---|---|---|
| 1 | Academia | This era | Whenever you invent a tech card or gain a tapestry card, gain 3 VP | | |
| 2 | Age of Discovery | When played | Roll the science die. **All** players must advance on that track; only you gain the benefit (you may pay the bonus) | | Landmark ties resolve in turn order from the current player. Blocked by Dictatorship |
| 3 | Age of Sail | This era | Whenever you explore, draw a total of 3 territory tiles. Before placing, you may give 1 territory tile to an opponent to gain 3 VP | ✗\* | The 3 draws are in addition to any "gain territory" on the same space |
| 4 | Age of Wonders | When played | Fewest landmarks: gain 2 any resources. Most landmarks: 12 VP. Otherwise, **including ties**: 1 any resource + 6 VP | | Tech-card landmarks count. Solo: Shadow Empire landmarks count as the Automa's |
| 5 | Alliance | This era | Choose an opponent; neither of you may conquer the other's territories. Whenever they upgrade a tech card, you gain the same benefit after them | ✗ | |
| 6 | Boast of Superiority | When played | For each track where no token is further advanced than yours, gain 4 VP | | |
| 7 | Broker of Peace | This era | You cannot advance on the military track. Each time an opponent advances on military, gain 3 VP | | |
| 8 | Capitalism | This era | When you gain income (step 4 of the income turn), gain 2 VP per coin earned. Whenever you gain a market, also gain 1 coin | | |
| 9 | Coal Baron | When played | Gain 1 territory tile and explore with it. Then each neighbour gains 1 territory tile | ✗\* | |
| 10 | Colonialism | When played | Choose a territory **tile** you control. Gain 1 resource per land terrain type on it: mountain → worker, grassland → culture, forest → food, desert → coin | | Not usable on territories printed on the map, including the middle island (official FAQ) |
| 11 | Dark Ages | When played | Regress once on 3 different tracks (if possible), then advance 3 times on the remaining track. No benefits or bonuses | | Verbatim in the F&F FAQ. Landmarks gained on the advancing track |
| 12 | Democracy | When played | Draw 3 tapestry cards, then discard any number of tapestry cards from hand for 2 VP each | | |
| 13 | Dictatorship | When played | Advance on any track and gain the benefit (may pay bonus). Opponents may not advance on that track until after your next turn | ✗ | Blocks movement from other cards, e.g. Socialism (official FAQ) |
| 14 | Diplomacy | When played | Each player gains 1 any resource. You also gain 1 income building of your choice from your income mat | ✗\* | |
| 15 | Dystopia | When played | Gain any landmark still on the landmark board (a track landmark) and place it in your capital | | Tech-card landmarks excluded (BGG FAQ) |
| 16 | Empiricism | This era | If you advance on the science track, gain 2 VP. Whenever you roll the science die, roll twice and choose 1 result | | |
| 17 | Espionage | When played | Copy the ability of any tapestry card on any income mat | ✗\* | Covered cards can't be copied. A copied Marriage of State must name a different track while another is active |
| 18 | Exploitation | This era | Whenever you place a territory tile on the board, you may gain **double** the tile's benefit; if you do, gain no alignment VP | | Space tiles are not territories (official FAQ) |
| 19 | Feudalism | When played | Choose: gain 1 any resource, **or** 3 VP per landmark you have | | |
| 20 | Golden Age | This era | Ignore tech-card upgrade prerequisites. Whenever you upgrade, gain 3 VP | | |
| 21 | Guilds | When played | Pay 5/10/15 VP for 1/2/3 any resources, **or** pay 1/2/3 any resources for 5/10/15 VP. You cannot spend VP you don't have | | |
| 22 | Industrialism | This era | Whenever you invent a tech card, gain its circle benefit; the card stays in the bottom row | | |
| 23 | Marriage of State | This era | Choose a track and an opponent. After they gain any benefit on that track, you gain it too (no bonus) | ✗ | Anti-loop rule, see Espionage |
| 24 | Mercantilism | This era | When you gain income, you may convert food into any other resource; gain 2 VP per food converted | | |
| 25 | Meritocracy | When played | Invent a tech card, then gain 2 VP per tech card you have | | |
| 26 | Militarism | This era | Whenever you explore a territory, you may also place an outpost on it. This is not a conquer | | |
| 27 | Monarchy | This era | Whenever you place an income building in your capital city, gain 3 VP | | |
| 28 | Oil Magnate | When played | Choose a track; you and your neighbours may advance on it. Only you gain the benefit and may pay the bonus | ✗ | |
| 29 | Olympic Host | When played | Starting with you, each player may pay 1 worker for 10 VP. If at least 1 opponent pays, you gain 1 income building from your income mat; if none do, you gain 1 coin | ✗ | |
| 30 | Pillage and Plunder | This era | Whenever you conquer an opponent's territory, gain the results of both conquer dice. Traps cannot be played against you | | |
| 31 | Pirate Rule | This era | Whenever you conquer a territory tile, also gain the benefit on that tile | | |
| 32 | Plea for Aid | When played | For each track where all other tokens are more advanced than yours, gain 2 VP and 1 any resource | | |
| 33 | Renaissance | When played | Advance on each track exactly once. No benefits, but you may take any resulting bonuses for free | | Heralds may not put it over Maker of Fire (adjustment D) |
| 34 | Revisionism | This era | Whenever you gain a landmark on a track, also gain 1 any resource. If you reach an already-claimed track landmark space, gain 1 armory | | |
| 35 | Revolution | When played | Gain 1 any resource, **or** choose up to 3 territories with your toppled outposts: stand them up and topple those opponents' outposts | | Not a conquer; can't award middle island. Can't remove an achievement already earned |
| 36 | Socialism | When played | Choose a track; advance or regress (your choice) to match the closest opponent. No benefit or bonus | | Can't move on a track blocked by Dictatorship |
| 37 | Steam Tycoon | When played | Invent a **face-up** tech card and upgrade it. Then your neighbours (right, then left) each invent the top card of the tech deck | ✗\* | |
| 38 | Technocracy | When played | If you are the first player to enter this era: gain a tech card and upgrade it. Otherwise gain 3 VP per opponent in the game | | "First" means first of all players. Played over a "this era" card: big benefit only if nobody else is in that era |
| 39 | Terraforming | This era | You may build on impassable plots of your capital. Each time you do, gain 5 VP | | Once per building, not per plot |
| 40 | Theocracy | This era | You cannot advance on the science track. Whenever you enter a new tier (I–IV) on any track, gain 4 VP | | |
| 41 | Trade Economy | When played | Pick an opponent's current position on any track; you gain that space's benefit. If it has a bonus, that opponent gains it for free | ✗\* | |
| 42 | Tyranny | This era | When you gain a tapestry card, you may immediately play it on top of this card. The first (and only) time you do, gain 5 VP | | |
| 43 | Wartime Economy | This era | All bonuses that cost "any resource" are free | | |
| T | **Trap** ×7 | Response / when played | **As a trap:** when an opponent tries to conquer your territory, discard it from your hand. Gain 1 any resource, keep control, and topple their outpost; they still gain 1 conquer-die benefit. **As a tapestry** on an income turn: gain 10 VP | ✗ ×2 | Cannot be used after your final income turn. An opponent's trap on your middle-island conquest denies that achievement |

---

## 4. Tech cards (33)

Mechanics, from the rulebook:
- **Invent:** take one of the 3 face-up cards or the top of the deck into your bottom row. Replenish face-up cards immediately.
- **Upgrade:** bottom → middle row gives the **circle** benefit. Middle → top gives the **square** benefit.
- **Top-row prerequisite:** you **or a neighbour** must currently be in or beyond the stated tier of the stated track.
- **Landmark tech cards:** the prerequisite is that you or a neighbour has **uncovered a named innovation on the income mat** (revealed by removing an income building). The icon beside the name shows the income row: food = farm row, worker = house row, coin = market row. **[UNVERIFIED]** Exact income-mat space positions of these innovations (income-mat data).
- Track icon colours: gear = Technology, sword = Military, flask = Science, compass = Exploration.

| # | Card | Type | Circle (to middle row) | Square (to top row) | Top-row prerequisite |
|---|---|---|---|---|---|
| 1 | Air Conditioning | Invention | 1 worker | 1 house | Technology tier II |
| 2 | Ammonia | Invention | 1 farm | 1 VP per farm in your capital | Military tier III |
| 3 | Anesthesia | Invention | 1 armory | 1 VP per armory in your capital | Science tier II |
| 4 | Assembly Line | Invention | Square benefit of 1 tech card in your top row | Circle benefit of 1 tech card in your middle row | Exploration tier III |
| 5 | Bakery | **Landmark** | 4 VP | Place the **Bakery** in your capital | Innovation **"Farming"** (food icon, farm row) |
| 6 | Barn | **Landmark** | 3 VP | Place the **Barn** | **"Breeding"** (food icon, farm row) |
| 7 | Calendar | Invention | 1 culture | 7 VP | Exploration tier II |
| 8 | Canned Food | Invention | 1 food | 7 VP | Military tier II |
| 9 | Clocks | Invention | Advance on Technology (no benefit/bonus) | 1 VP per Technology track space you've advanced | Technology tier II |
| 10 | Com Tower | **Landmark** | 5 VP | Place the **Com Tower** | **"Telephone"** (worker icon, house row) |
| 11 | Compass | Invention | 2 territory tiles | Explore (place 1 territory tile) | Technology tier II |
| 12 | Concrete | Invention | 1 market | 1 VP per market in your capital | Exploration tier II |
| 13 | Dynamite | Invention | Conquer 1 territory | 1 VP per territory you control | Military tier II |
| 14 | Eyeglasses | Invention | Invent 1 tech card | 1 VP per tech card you have | Technology tier II |
| 15 | Irrigation | Invention | 1 food | 1 farm | Science tier II |
| 16 | Library | **Landmark** | 3 VP | Place the **Library** | **"Writing"** (worker icon, house row) |
| 17 | Light Bulb | Invention | 1 coin | 1 market | Military tier II |
| 18 | Lithium-Ion Battery | Invention | 4 VP | Gain the benefit, and pay for the bonus, of your current position on any track; **at most 1×/turn** | Exploration tier IV |
| 19 | Paper | Invention | 1 house | 1 VP per house in your capital | Science tier II |
| 20 | Penicillin | Invention | Research (no benefit/bonus) | 5 VP | Science tier II |
| 21 | Printing Press | Invention | 1 tapestry card | Play a tapestry card on top of your current tapestry | Technology tier II |
| 22 | Radio | Invention | 3 VP | Gain a random additional civilization | Science tier IV |
| 23 | Sewage & Plumbing | Invention | 1 culture | 1 armory | Technology tier II |
| 24 | Siegecraft | Invention | Advance on Military (no benefit/bonus) | 1 VP per Military track space you've advanced | Military tier II |
| 25 | Stock Market | **Landmark** | 5 VP | Place the **Stock Market** | **"Banking"** (coin icon, market row) |
| 26 | Telescope | Invention | 1 culture + 1 territory tile | 1 VP per territory tile in your supply | Technology tier II |
| 27 | The Nail | Invention | 1 tapestry card | 1 market, house or farm | Technology tier II |
| 28 | Time Travel | Invention | 1 coin | Regress on Exploration **or** Military (no benefit/bonus) | Technology tier IV |
| 29 | Transistors | Invention | 1 coin | 1 culture + 4 VP | Military tier IV |
| 30 | Treasury | **Landmark** | 4 VP | Place the **Treasury** | **"Currency"** (coin icon, market row) |
| 31 | Vaccines | Invention | Advance on Science (no benefit/bonus) | 1 VP per Science track space you've advanced | Science tier II |
| 32 | Warships | Invention | 1 worker | Conquer 1 territory | Exploration tier III |
| 33 | Zeppelins | Invention | Advance on Exploration (no benefit/bonus) | 1 VP per Exploration track space you've advanced | Exploration tier II |

Notes:
- F&F optional variant: players may agree to remove Radio and Lithium-Ion Battery as too strong.
- Playing a tapestry card in or after IT 5 (e.g. Printing Press on IT 5) goes on top of the era-4 card (F&F rule).
- Inventors' upgrades ignore prerequisites.
- Whether an Assembly Line circle ↔ square chain may hit the same card twice is undecided; see Open questions.

---

## 5. Landmarks (18 in the base game)

Rules (Rulebook / F&F rulebook):
- **Uniqueness:** there is exactly one of each. If it is gone, it is gone, with no substitution.
- **Track landmarks:** the first player to advance **into** tier II, III or IV of a track gains that tier's landmark, by any means. This includes advances on an opponent's turn. Place it **before** resolving the space's benefit and bonus. Placement may be deferred to end of turn if it doesn't matter.
- **Tech landmarks:** gained by upgrading the landmark tech card to the top row.
- **Placement:** aligned with the grid. Landmarks may hang off the edge of the grid. If there is no room, place the landmark beside the mat; it still counts.
- **Impassable plots:** cannot be built on, except with Terraforming.
- Landmarks count as "buildings" (e.g. Nomads) but **not** as income buildings.
- **Tie-breaker:** base game = most total resources. A&A/F&F amendment = tallest landmark in the capital.
- **[UNVERIFIED]** Explicit rule text allowing rotated placement. Physical pieces can be turned, and nothing forbids it.
- Footprints come from the official Landmark Guide (Apr 2023). In the grids, `X` = occupied plot and `.` = not occupied.
- Track spaces come from the BGG FAQ / Reference Guide.
- "Height" is the myautoma web app's tall/medium class. **[UNVERIFIED]** Exact heights. The design diary gives only the 28–70 mm range.

| Landmark | Source | Granted by | Plots | Footprint | Height class |
|---|---|---|---|---|---|
| Forge | Technology track, tier II | Space 4 "Metallurgy" | 4 | `XX/XX` (2×2) | tall |
| Rubber Works (guide: "Rubber Factory") | Technology, tier III | Space 7 "Rubber" | 12 | `..XX/..XX/XXXX/XXXX` (4×4 minus a 2×2 corner) | medium |
| Tech Hub | Technology, tier IV | Space 10 "Computers" | 6 | `XXX/XXX` (3×2) | tall |
| Barracks | Military, tier II | Space 4 "Standing Army" | 4 | `XX/XX` | medium |
| Tank Factory | Military, tier III | Space 7 "Tanks" | 9 | `XXX/XXX/XXX` (3×3) | medium |
| Fusion Reactor | Military, tier IV | Space 10 "Nuclear Bomb" | 8 | `.XX/XXX/XXX` (3×3 minus a corner) | tall |
| Lighthouse | Exploration, tier II | Space 4 "Navigation" | 4 | `XX/XX` | tall |
| Train Station | Exploration, tier III | Space 7 "Trains" | 9 | `XXX/XXX/XXX` | medium |
| Launch Pad | Exploration, tier IV | Space 10 "Space Shuttle" | 6 | `XXX/XXX` | tall |
| Apothecary | Science, tier II | Space 4 "Medicine" | 4 | `XX/XX` | medium |
| Academy | Science, tier III | Space 7 "Academic Research" | 8 | `XXXX/XXXX` (4×2) | medium |
| Laboratory | Science, tier IV | Space 10 "Neuroscience" | 6 | `XXX/XXX` | tall |
| Bakery | Tech card | Bakery square | 4 | `XX/XX` | – |
| Barn | Tech card | Barn square | 9 | `XXX/XXX/XXX` | – |
| Com Tower | Tech card | Com Tower square | 6 | `XXX/XXX` | – |
| Library | Tech card | Library square | 8 | `XXXX/XXXX` | – |
| Stock Market | Tech card | Stock Market square | 4 | `XX/XX` | – |
| Treasury | Tech card | Treasury square | 4 | `XX/XX` | – |

Multi-row footprints drawn out:

```
Rubber Works      Fusion Reactor    Academy / Library   Tech Hub / Launch Pad /
. . X X           . X X             X X X X             Laboratory / Com Tower
. . X X           X X X             X X X X             X X X
X X X X           X X X                                 X X X
X X X X
```

- The 12 track landmarks start on the landmark board. The 6 tech landmarks sit beside the tech deck.
- In solo play, landmarks gained by either bot go to the Automa's mat.

---

## 6. Capital city mats (6 basic mats in the base game)

Facts (Rulebook):
- **Grid:** each basic mat is a 9×9 grid in nine 3×3 **districts**.
- **Impassable plots:** marked with red/orange dots. They cannot be built on, but they **count toward completing** districts, rows and columns.
- **Pre-filled squares:** there are none; only impassable plots are printed.
- **District completion:** covering the last plot of a district gives 1 any resource.
- **City scoring:** 1 VP per complete row and per complete column.
- **Numbering:** mats are numbered 1–6. That number links each mat to a capital territory on the map.
  - 4–5 players: draw 1 mat and start on the territory with its number.
  - 1–3 players: mats are paired by the numbers on the board (pairs such as "2/4" and "3/5"). Draw a random pair and keep 1.
- **Revisions:** the Revised Civ Pack includes "revised versions of 2 capital city mats from the core game". **[UNVERIFIED]** Which two, and what changed.

### 6.1 Mat #1 "MOUNTAIN"
Read from the Rulebook r17 p.4 illustration, a photo of mat #1 with buildings on it.
- `#` = impassable plot. `.` = buildable plot.
- Plots covered by buildings in the photo are shown as buildable, since buildings cannot sit on impassable plots.
- Total impassable plots = 22.
- **[UNVERIFIED]** Confirm against the physical mat, since some cells were partly hidden by miniatures.

```
     c1 c2 c3 | c4 c5 c6 | c7 c8 c9
r1    .  .  . |  .  .  . |  .  .  .
r2    #  #  . |  .  .  # |  #  #  .
r3    .  .  . |  #  #  # |  .  .  .
     ---------+----------+---------
r4    .  .  . |  #  #  # |  #  #  .
r5    .  .  . |  .  .  # |  #  .  .
r6    .  #  # |  #  .  . |  .  .  #
     ---------+----------+---------
r7    .  .  # |  .  .  . |  .  .  .
r8    .  .  . |  .  .  . |  .  #  .
r9    .  .  # |  .  .  . |  .  .  .
```

### 6.2 Mats #2–#6
**[UNVERIFIED]** I found no grids for mats #2–#6, and no source states their names. BGG photo captions mention "Grassland", "forest" and "tropical" capitals, which suggests terrain-themed names. Getting the remaining layouts needs mat scans or the physical game.

---

## 7. Territory tiles, space tiles and the map

### 7.1 Territory tiles (48)
- 48 unique hex tiles (design diary).
- **Land terrains:** grassland, forest, desert, mountain. These four are named on Colonialism and the P&P Treasure Hunters. Water also appears.
- **Exploring:** place a tile adjacent to a territory you control, in any orientation. Gain **1 VP per side with at least 1 aligned terrain** (max 6). Thin "river" strips at tile edges are decorative and ignored; thicker water does count as water. Then gain the tile's printed benefit, if any; many tiles show a resource icon.
- Tiles are kept face up in your supply. Discards go to a discard pile, reshuffled if the stack runs out.
- **[UNVERIFIED]** The per-tile 6-edge terrain makeup and benefit of all 48 tiles. No textual source or scan found; this needs the physical tiles or a BGA/Tabletopia data dump.

### 7.2 Space tiles (15)
- Explored from tier IV of exploration. Placed next to your income mat, with no alignment, and give their printed benefit. A limited supply, so they can run out.
- One base tile was misprinted with a missing icon. Its intended text: "conquer, then score 1 VP per territory you control". P&P includes a corrected replacement tile.
- Examples readable in a BGG photo **[UNVERIFIED reading]**: "13 VP"; "gain 1 market + 1 VP per market"; "gain 1 coin + 1 worker + 8 VP".
- **[UNVERIFIED]** The full list of 15.

### 7.3 Map board
The board is double-sided: a big map for 4–5 players and a small map for 1–3.

**1–3 player side.** Hex model taken from the fan-made Automa companion web app (myautoma.github.io), which digitises this side for Automa hex tiebreaking. **[UNVERIFIED]** Cross-check against the physical board.
- **34 hexes**, ids 0–33, laid out in 7 columns using doubled-row coordinates.
- **13 pre-printed territories:** 0, 4, 6, 7, 15, 16, 17, 22, 24, 25, 26, 27, 28.
- **Middle island = hex 16.** Confirmed in the app's middle-island code.
- **Solo capitals:** hexes 22 and 24 are the two capital territories used in solo ("2/4" for you, "3/5" for the Automa). **[UNVERIFIED]** Which id is which, and where the third capital pair (presumably "1/6") sits.
- Neighbour directions: N = row−2, NW = row−1/col−1, SW = row+1/col−1, S = row+2, SE = row+1/col+1, NE = row−1/col+1. `-` = off-map.

| Hex | Row | Col | Pre-printed | Special | N | NW | SW | S | SE | NE |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 4 | yes |  | - | - | 1 | 4 | 2 | - |
| 1 | 2 | 3 | no |  | - | - | 3 | 6 | 4 | 0 |
| 2 | 2 | 5 | no |  | - | 0 | 4 | 7 | 5 | - |
| 3 | 3 | 2 | no |  | - | - | - | 8 | 6 | 1 |
| 4 | 3 | 4 | yes |  | 0 | 1 | 6 | 9 | 7 | 2 |
| 5 | 3 | 6 | no |  | - | 2 | 7 | 10 | - | - |
| 6 | 4 | 3 | yes |  | 1 | 3 | 8 | 12 | 9 | 4 |
| 7 | 4 | 5 | yes |  | 2 | 4 | 9 | 13 | 10 | 5 |
| 8 | 5 | 2 | no |  | 3 | - | 11 | 15 | 12 | 6 |
| 9 | 5 | 4 | no |  | 4 | 6 | 12 | 16 | 13 | 7 |
| 10 | 5 | 6 | no |  | 5 | 7 | 13 | 17 | 14 | - |
| 11 | 6 | 1 | no |  | - | - | - | 18 | 15 | 8 |
| 12 | 6 | 3 | no |  | 6 | 8 | 15 | 19 | 16 | 9 |
| 13 | 6 | 5 | no |  | 7 | 9 | 16 | 20 | 17 | 10 |
| 14 | 6 | 7 | no |  | 10 | 17 | 21 | - | - | - |
| 15 | 7 | 2 | yes |  | 8 | 11 | 18 | 22 | 19 | 12 |
| 16 | 7 | 4 | yes | middle island | 9 | 12 | 19 | 23 | 20 | 13 |
| 17 | 7 | 6 | yes |  | 10 | 13 | 20 | 24 | 21 | 14 |
| 18 | 8 | 1 | no |  | 11 | - | - | 25 | 22 | 19 |
| 19 | 8 | 3 | no |  | 12 | 15 | 22 | 26 | 23 | 16 |
| 20 | 8 | 5 | no |  | 13 | 16 | 23 | 27 | 24 | 17 |
| 21 | 8 | 7 | no |  | 14 | 17 | 24 | 28 | - | - |
| 22 | 9 | 2 | yes | solo start capital | 15 | 18 | 25 | 29 | 26 | 19 |
| 23 | 9 | 4 | no |  | 16 | 19 | 26 | 30 | 27 | 20 |
| 24 | 9 | 6 | yes | solo start capital | 17 | 20 | 27 | 31 | 28 | 21 |
| 25 | 10 | 1 | yes |  | 18 | - | - | - | 29 | 22 |
| 26 | 10 | 3 | yes |  | 19 | 22 | 29 | 32 | 30 | 23 |
| 27 | 10 | 5 | yes |  | 20 | 23 | 30 | 33 | 31 | 24 |
| 28 | 10 | 7 | yes |  | 21 | 24 | 31 | - | - | - |
| 29 | 11 | 2 | no |  | 22 | 25 | - | - | 32 | 26 |
| 30 | 11 | 4 | no |  | 23 | 26 | 32 | - | 33 | 27 |
| 31 | 11 | 6 | no |  | 24 | 27 | 33 | - | - | 28 |
| 32 | 12 | 3 | no |  | 26 | 29 | - | - | - | 30 |
| 33 | 12 | 5 | no |  | 27 | 30 | - | - | - | 31 |

**4–5 player side.** **[UNVERIFIED]** Hex layout, pre-printed territories and the positions of capitals 1–6 were not found in any source.

---

## 8. Achievements (3, printed on the board)

| Achievement | Condition | VP spaces (as printed in Rulebook r17 and F&F rulebook) |
|---|---|---|
| Complete any advancement track | Have a player token on the **last space** of any track. You need not have gained that space's benefit. Removing the token via AI Singularity still counts | **15 / 10 / 5** |
| Topple two opponent outposts | Have caused 2 toppled outposts (by conquering or by trapping). They may belong to the same or different opponents, and **both must currently be toppled** | **15 / 10 / 5** |
| Conquer middle island | Take the **conquer** action on the middle island. A successful trap against you denies it; placing tokens there by other means (Militarism, Nomads, Traders, Infiltrators) does not count | **10 / 5** |

- **Claiming:** on first completion, place a player token on the **highest available** VP space under that achievement. Achievements cannot be lost or earned twice. A second completed track scores nothing.
- **Board sides [UNVERIFIED]:** the values above match the rulebook picture. A strategy article says the maximum is "40 VPs in a 4-5 player game or 30 VPs in a 1-3 player game", and a photo of the 1–3 side shows fewer VP boxes per achievement. So the 1–3 side probably has different, smaller ladders, possibly 10/5 each [INFERRED]. Exact values need a photo of that side.
- **Solo:** the Automa earns achievements and their VP like a player, except that only **your** outposts count toward its "topple 2". The Shadow Empire can only earn "complete any track" and gets no VP for it; it still occupies the space.

---

## 9. Automa & Shadow Empire (base game solo, by Automa Factory)

Designed by Morten Monrad Pedersen with Lieve Teugels and Nick Shaw. Sources:
- Automa rulebook r8 (base, 2019)
- the later F&F Automa rulebook r6 (2024), which restates base rules with clarifications; its additions are marked "(r6)"
- the Shadow Empire 2-player sheet
- the myautoma companion web app (card data, mat values)

### 9.1 Components (base)

| Component | Count / detail |
|---|---|
| Automa income mat | 1, double-sided: Normal / Hard |
| Decision cards | 22. Cards 1–7 have a **circle** ID (start in the decision deck); cards 8–22 have a **rectangle** ID (the progress deck). Card colour only matters for the 2-player Shadow Empire variant, which uses cards 1–12 |
| Automa income cards | 2, double-sided, covering the mat's income chart for levels 1, 3 and 4 |
| Automa civilization cards | 2, double-sided = 4 civs: Explorers, Conquerors, Scientists, Engineers |
| Player aid cards | 2 |

### 9.2 Setup (solo = you + Automa + Shadow Empire)
1. Use the **3-player** setup and the small map.
2. You always start on the territory labelled **"2/4"**, whatever capital mat you take.
3. **Remove** from the game:
   - Tapestry cards: Age of Sail\*, Alliance, Coal Baron\*, Dictatorship, Diplomacy\*, Espionage\*, Marriage of State, Oil Magnate, Olympic Host, Steam Tycoon\*, Trade Economy\*, and **2 traps** (5 traps remain).
   - Civilizations: Futurists\*, Heralds\*, Inventors\*, Traders.
   - (\* = may be used, but it unfairly helps or hurts you.)
4. **Automa:**
   - It gets only: the income mat (Normal side for level 2), **all** its outposts (**2 placed on "3/5"**), and all its player tokens (1 on 0 VP, 1 on each track start).
   - Base r8: roll the science die and use the Automa civ card side matching the rolled track. r6 instead says: draw a random Automa civ; for first games use Engineers, Explorers or Scientists.
   - The heart icon on the civ card marks the **Automa's favourite track**. Mark it with an outpost (r8) or a second player token moving with the first (r6).
5. **Shadow Empire (SE):**
   - It gets all its outposts and 5 player tokens (1 on each track start, 1 spare).
   - Roll the science die **until** it shows a track different from the Automa's favourite. That is the **SE favourite**.
6. **Decks:**
   - **Progress deck:** shuffle cards 8–22 face down.
   - **Decision deck:** shuffle the **top progress card** with cards 1–7, giving 8 cards.
7. **Turn order:** the bot pair takes one combined turn in the seat after or before you, depending on who is first player. Their first turn is an income turn, as for any player.

### 9.3 Automa civilization cards (base, 4)

| Civ | Favourite track (heart) | Income-turn ability |
|---|---|---|
| Explorers | Exploration | IT 2 & 4: advance on Exploration. IT 3 & 5: advance on Military. These are normal Automa advances and gain Automa-usable benefits |
| Conquerors | Military | IT 2–5: (1) if it controls **fewer territories than the income-turn number**, it does a conquer action; (2) if **more than 2** of its territories have only 1 token, place a **toppled SE outpost** on one of them (hex tiebreaker). Also IT 2–5: **+1 VP per territory** it controls |
| Scientists | Science | IT 3–5: roll the science die and advance on the rolled track (with benefit) |
| Engineers | Technology | IT 2–5: **+1 VP per landmark** it has |

The r6 rules note that civ VP (e.g. Engineers' +1 per landmark) is **not** multiplied by the mat multipliers.

### 9.4 Decision cards: anatomy and full data

Each card has:
- **Upper half:**
  - a **track-tiebreaker** column: 5 icons, namely the 4 tracks plus one heart for "favourite";
  - a blue **Automa track indicator**;
  - a grey "S" **Shadow Empire track indicator**.
- **Lower half:**
  - a **hex tiebreaker** (mini-map with a black start arrow and a grey next-row arrow);
  - an optional **income icon** (hand);
  - an optional **toppled-outpost icon**.

Cards are played as a **pair**:
- the **left** card is the **track card**: its track indicators and income icon are used;
- the **right** card is the **tiebreaker card**: its track tiebreakers, hex tiebreaker and topple icon are used.

Track-indicator meaning (valid tracks for this advance):
- **ALL:** every track where the bot hasn't reached the end.
- **LMK** (flag + building): track(s) with the shortest distance from the bot's token to **an unclaimed landmark or the end of the track**. Ignore finished tracks.
- **END** (flag): track(s) with the shortest distance to the **end** of the track. Ignore finished tracks.
- If several tracks are valid, use the tiebreaker card's list. The **Automa reads it top → bottom**, the **SE bottom → top**. FAV = that bot's own favourite track.

Full card data below comes from the myautoma web app. I spot-checked cards 1, 3 and 14 against their card images.

| ID | Deck | Automa track ind. | SE track ind. | Track tiebreakers (top→bottom) | Hex TB # | Income icon | Topple icon |
|---|---|---|---|---|---|---|---|
| 1 | decision (circle) | END | ALL | FAV > MIL > EXP > TEC > SCI | 1 | yes | yes |
| 2 | decision (circle) | ALL | LMK | MIL > EXP > FAV > SCI > TEC | 2 | yes | — |
| 3 | decision (circle) | LMK | END | SCI > TEC > MIL > EXP > FAV | 1 | — | yes |
| 4 | decision (circle) | LMK | ALL | TEC > SCI > FAV > MIL > EXP | 3 | yes | — |
| 5 | decision (circle) | ALL | LMK | EXP > MIL > TEC > SCI > FAV | 10 | — | — |
| 6 | decision (circle) | ALL | ALL | MIL > SCI > FAV > TEC > EXP | 1 | — | yes |
| 7 | decision (circle) | ALL | ALL | FAV > TEC > EXP > MIL > SCI | 5 | — | — |
| 8 | progress (rect, grey) | ALL | ALL | EXP > MIL > TEC > FAV > SCI | 6 | yes | — |
| 9 | progress (rect, grey) | ALL | ALL | TEC > SCI > FAV > EXP > MIL | 4 | yes | yes |
| 10 | progress (rect, grey) | LMK | ALL | MIL > EXP > TEC > SCI > FAV | 9 | — | yes |
| 11 | progress (rect, grey) | ALL | LMK | FAV > EXP > MIL > SCI > TEC | 7 | — | — |
| 12 | progress (rect, grey) | ALL | ALL | SCI > TEC > FAV > MIL > EXP | 8 | yes | yes |
| 13 | progress (rect, red) | ALL | LMK | SCI > TEC > MIL > FAV > EXP | 6 | — | — |
| 14 | progress (rect, red) | LMK | ALL | EXP > FAV > SCI > MIL > TEC | 4 | yes | yes |
| 15 | progress (rect, red) | LMK | LMK | FAV > MIL > TEC > EXP > SCI | 9 | — | yes |
| 16 | progress (rect, red) | ALL | LMK | TEC > EXP > FAV > SCI > MIL | 7 | yes | — |
| 17 | progress (rect, red) | ALL | ALL | EXP > FAV > TEC > MIL > SCI | 5 | yes | — |
| 18 | progress (rect, red) | LMK | ALL | FAV > EXP > MIL > SCI > TEC | 1 | — | — |
| 19 | progress (rect, red) | ALL | ALL | MIL > TEC > SCI > EXP > FAV | 2 | yes | yes |
| 20 | progress (rect, red) | ALL | ALL | TEC > EXP > SCI > MIL > FAV | 1 | — | — |
| 21 | progress (rect, red) | ALL | END | EXP > TEC > FAV > SCI > MIL | 3 | yes | yes |
| 22 | progress (rect, red) | END | ALL | MIL > EXP > TEC > FAV > SCI | 1 | — | yes |

Notes:
- The Automa and the SE always use the **same** track-tiebreaker list, read in opposite directions.
- "Hex TB #" is the web app's id (1–10) for the card's hex-tiebreaker pattern; the orderings are in §9.8.
- A&A tells owners to **replace** base cards 1, 2, 4, 5, 8, 10, 13, 15, 17 and 19 permanently. The replacements "work with and without expansions"; they add the Arts track to the tiebreakers.
  - The app's expansion data shows identical non-arts fields for all 22 cards, so the base behaviour is unchanged [INFERRED].

### 9.5 Bot turn procedure
If you need to draw a decision card and the decision deck is empty, the bots take an **income turn** (§9.7). Otherwise:
1. Discard last turn's decision pair, if any.
2. Draw the top 2 cards and place them face up, **in random order**, as the pair (left = track card, right = tiebreaker card).
3. If the decision deck is **now empty** and the track card shows the **income icon**, the bots take their income turn now and skip step 4.
4. Otherwise, take an advance turn:
   - a. advance the Automa one space on a track chosen per §9.4;
   - b. advance the SE one space the same way, using its own indicator and reading the tiebreakers bottom → top.

You may look through the discard pile at any time.

**Regression (r6).** Tracks where the Automa sits on the start space are valid for a regression, which then has no effect.

**Benefits the Automa gains.** Only these icons count; all other benefits and text are ignored. A benefit that appears twice on a space is gained once. Neither bot ever gains bonuses. The **SE gains no benefits at all** (only landmarks and the track achievement).

| Normal icon on the space | What the Automa does |
|---|---|
| Science die, with or without X | Roll it and advance on the rolled track, with or without the benefit as the icon says. r6: if the Automa is at the end of that track, the roll is wasted |
| Tech card (invent) | **Discard all 3 face-up tech cards and replace them.** The Automa never holds tech cards |
| Conquer / Conquer anywhere | Conquer (§9.6) |
| Explore / Explore anywhere | Explore (§9.6) |
| Advance or regress on one of several indicated tracks (Physics, Neuroscience, Quantum Physics) | Roll the science die **until** it shows one of the indicated tracks, then carry out that advance or regression |
| Tapestry card | Give the Automa 1 tapestry card **face down beside its mat** (these act as traps, §9.7) |

**Track spaces that trigger an Automa action** (per the companion app; space numbers 1–12):

| Track | Spaces and actions |
|---|---|
| Exploration | Explore on spaces 2, 3, 4, 7; Explore anywhere on 9 |
| Military | Conquer on 1, 3, 5, 7, 12; tapestry card on 2; conquer + tapestry card on 6; conquer anywhere on 8 |
| Science | Research without benefit on 1, 3, 12; tapestry card on 2, 4; research with benefit on 5, 6; advance Mil/Tec/Exp on 9; regress Mil/Tec on 10; advance twice on Mil/Tec/Exp on 11 |
| Technology | Invent (tech-card refresh) on 1, 3, 4, 7; tapestry card on 2 |

**[UNVERIFIED]** For space 12, Science, the app treats Alien Biology as a single research without benefit; the rulebook gives no specific instruction.

**Landmarks.** A landmark gained by **either** bot goes in the landmark box of the Automa's mat and belongs to the Automa. r6 clarifications:
- For the Historians, SE and Automa landmarks are separate "gains".
- For Age of Wonders, SE landmarks count as the Automa's.

### 9.6 Map procedures

**Hex tiebreaker.** Start at the hex the **black arrow** points to and go along that row in the arrow's direction. If no valid hex is found, continue with the row the **grey arrow** points to, then the next row, and so on. Choose the first valid hex. The 10 patterns as hex orderings are in §9.8.

**Distance.**
- Distance = fewest hexes along a path the Automa could conquer through: hexes with **0 Automa outposts and 0–1 of your tokens**. Empty (unexplored) hexes may be on the path.
- It is not straight-line distance.
- r6: a hex is at distance 0 from itself.
- [INFERRED] The web app instead uses plain hex-ring distance.

**Conquer.**
1. If the Automa can legally conquer a territory **you** control, use **Conquer Opponent**.
   - Valid targets: all your territories it can legally conquer, including "anywhere" when it applies.
   - Tiebreakers:
     1. If the Automa can still gain the middle-island achievement, keep only the targets closest to the middle island.
     2. Then use the hex tiebreaker.
   - Action: place an Automa outpost and topple yours. If you play a trap, its outpost is toppled instead.
2. Otherwise use **Conquer Neutral**.
   - Valid targets: all hexes the Automa can legally conquer **or explore**. Hexes **adjacent to your territories** are valid **only if** the tiebreaker card shows the topple icon. If none are valid, skip.
   - Tiebreakers, in order:
     1. If it can still gain the middle island, keep only the hexes closest to the middle island.
     2. If you control any territory with a single token, keep only the hexes closest to such territories.
     3. Otherwise keep only the hexes closest to any territory you control.
     4. Then use the hex tiebreaker.
   - Actions:
     1. If the hex is unexplored, draw a territory tile and place it face up in random orientation.
     2. Place an Automa outpost.
     3. If the topple icon is on the tiebreaker card and the hex isn't the middle island, also place a **toppled SE outpost** there. The SE never places outposts any other way.

**Explore.**
- Valid hexes: all hexes the Automa can legally explore, including "anywhere". If none, skip.
- Tiebreaker:
  1. If the Automa's favourite is **not** Military, keep only the valid hexes **furthest** from your territories.
  2. Then use the hex tiebreaker.
- Action: draw a territory tile and place it face up in random orientation. The Automa gains no exploration VP or tile benefit.

**Ties during income turns.**
- r8: in IT 1, draw and use the top progress card, then reshuffle it. In IT 2–5, use the latest tiebreaker card.
- r6: whenever no decision card is face up, draw one from the progress deck and shuffle it back after use.

### 9.7 Income turns, scoring, traps, end

**Income chart.** The chart is printed on the Automa mat, or on an income card at levels 1, 3 and 4. Resolve it **top → bottom, left column first**. The number list on each step is the income turns in which it happens (checked against the companion app's per-level step lists):

| Step (icon) | L1 | L2 (mat, Normal) | L3 | L4 | L5 (Hard) | L6 (Hard) |
|---|---|---|---|---|---|---|
| Change favourite track (hearts) | 2–5 | 2–5 | 2–5 | 2–5 | 2–5 | 2–5 |
| Advance both bots using the most recent decision pair | – | – | 2–5 | 2–5 | 2–5 | 2–5 |
| Automa civ income bonus | – | 2–5 | 2–5 | 2–5 | 2–5 | 2–5 |
| Score VP (multipliers) | 2–5 | 2–5 | 2–5 | 2–5 | 2–5 | 2–5 |
| Add progress cards to the decision discard | +2 in IT 2, 3, 4 | +2 in IT 2, 3, 4 | +0 in IT 2; +2 in IT 3, 4 | +2 in IT 2; +4 in IT 3, 4 | +2 in IT 2; +6 in IT 3, 4 | +2 in IT 2; +6 in IT 3, 4 |
| Put the top tapestry-deck card face down on the leftmost empty tapestry space of the Automa mat (covers a multiplier column) | 2, 3, 4 | 2, 3, 4 | 2, 3, 4 | 2, 3, 4 | 2, 3, 4 | 2, 3, 4 |
| Give the Automa 1 face-down tapestry card beside its mat (its trap pool) | – | 1–4 | 1–4 | 1–4 | 1–4 | 1–4 |
| Shuffle the decision deck (all cards of the latest era plus those just added) | 2, 3, 4 | 2, 3, 4 | 2, 3, 4 | 2, 3, 4 | 2, 3, 4 | 2, 3, 4 |
| IT 1 extras | You advance once on each track, in the order Mil, Exp, Tec, Sci, with benefits | – | – | – | Each bot advances once on its favourite track | Each bot advances once on all 4 tracks (Mil, Exp, Tec, Sci); the Automa starts with a 2nd civ of your choice (its heart has no effect; resolve civ 1, then civ 2) |

Level names:

| Level | Name |
|---|---|
| 1 | Automa the Underachiever |
| 2 | Automa the Average (default) |
| 3 | Automa the Slightly Intimidating |
| 4 | Automa the Somewhat Awesome |
| 5 | Automa the Definitely Awesome |
| 6 | Automa the Crusher of Dreams |

**Change favourite.**
- If a bot's token has reached the **end** of its favourite track, or **any token is further advanced there**, its new favourite is the track it would pick with the LMK indicator. That may be the same track, or the other bot's favourite.
- Move its favourite marker. r6 moves the second token instead.

**VP scoring (Automa only).**
- The Automa gains VP almost only on income turns, and it gains them **before** placing its tapestry card.
- Each icon row's count is multiplied by the **leftmost multiplier not covered** by a tapestry card. The first card goes down at the end of IT 2, so IT 2 uses column 1, IT 3 column 2, IT 4 column 3 and IT 5 column 4.
- Advances = spaces advanced from the start on each indicated track.

| Row | Normal: IT2 / IT3 / IT4 / IT5 | Hard: IT2 / IT3 / IT4 / IT5 |
|---|---|---|
| Per landmark on its mat **and** per territory it controls | ×1 / ×2 / ×2 / ×3 | ×1 / ×2 / ×2 / ×3 |
| Per space advanced on **Military and Science** | ×0 / ×1 / ×1 / ×2 | ×0 / ×1 / ×2 / ×3 |
| Per space advanced on **Technology and Exploration** | ×1 / ×1 / ×2 / ×3 | ×1 / ×2 / ×2 / ×4 |
| First to start a new era (bonus printed under the tapestry spaces) | +2 / +3 / +4 (eras 2, 3, 4) | +2 / +3 / +4 |

The rulebook example agrees with column 2: IT 3 on Normal is ×2, ×1, ×1, plus 3 VP if it is first into the era.

**Traps vs the Automa.** If you conquer a territory the Automa controls and it has face-down tapestry cards beside its mat:
1. Discard one at random.
2. If it was a trap, the Automa keeps control and **your outpost enters toppled**.
3. Otherwise repeat until a trap is discarded or its cards run out.

**Achievements.** See §8.

**What bots never gain.**
- No income buildings, resources, tech cards or civ-ability effects beyond those stated.
- The SE never gains VP.
- r6: the bots therefore never help you meet income-mat tech prerequisites such as WRITING.

**Game end.**
- Use the normal winner rules. Only you or the Automa can win; the SE never wins.
- **[UNVERIFIED]** No explicit statement that the bots stop after their 5th income turn. I [INFERRED] that they do, as players do.

### 9.8 Hex-tiebreaker orderings (1–3 player map, hex ids from §7.3)
Each row is the order in which hexes are checked for a given pattern; pick the first valid one. Source: companion web app (fan-made). **[UNVERIFIED]** The mapping from the app's pattern numbers to the arrows printed on each card has only been spot-checked.

| Pattern | Hex order |
|---|---|
| 1 | 0 2 5 1 4 7 10 14 3 6 9 13 17 21 8 12 16 20 24 28 11 15 19 23 27 31 18 22 26 30 33 25 29 32 |
| 2 | 5 2 0 14 10 7 4 1 21 17 13 9 6 3 28 24 20 16 12 8 31 27 23 19 15 11 33 30 26 22 18 32 29 25 |
| 3 | 14 21 28 5 10 17 24 31 2 7 13 20 27 33 0 4 9 16 23 30 1 6 12 19 26 32 3 8 15 22 29 11 18 25 |
| 4 | 28 21 14 31 24 17 10 5 33 27 20 13 7 2 30 23 16 9 4 0 32 26 19 12 6 1 29 22 15 8 3 25 18 11 |
| 5 | 28 31 33 21 24 27 30 32 14 17 20 23 26 29 10 13 16 19 22 25 5 7 9 12 15 18 2 4 6 8 11 0 1 3 |
| 6 | 33 31 28 32 30 27 24 21 29 26 23 20 17 14 25 22 19 16 13 10 18 15 12 9 7 5 11 8 6 4 2 3 1 0 |
| 7 | 32 29 25 33 30 26 22 18 31 27 23 19 15 11 28 24 20 16 12 8 21 17 13 9 6 3 14 10 7 4 1 5 2 0 |
| 8 | 25 29 32 18 22 26 30 33 11 15 19 23 27 31 8 12 16 20 24 28 3 6 9 13 17 21 1 4 7 10 14 0 2 5 |
| 9 | 25 18 11 29 22 15 8 3 32 26 19 12 6 1 30 23 16 9 4 0 33 27 20 13 7 2 31 24 17 10 5 28 21 14 |
| 10 | 11 18 25 3 8 15 22 29 1 6 12 19 26 32 0 4 9 16 23 30 2 7 13 20 27 33 5 10 17 24 31 14 21 28 |

### 9.9 Shadow Empire alone: 2-human-player variant
- **Setup:**
  1. Choose a colour.
  2. Put 1 token on each track start and set 1 aside.
  3. Roll the science die for its favourite track.
  4. Shuffle **decision cards 1–12** (grey ID backgrounds) as its deck.
- **Turn:** it takes a normal seat in turn order. On its turn:
  1. If its deck is empty: reshuffle all 12 cards, then re-check the favourite. If its token is at the end of the favourite track, or a further-advanced token is there, the new favourite is the track chosen by the LMK indicator.
  2. Draw 2 cards as a pair (track card left, tiebreaker card right).
  3. Advance per its S indicator, reading the tiebreakers **bottom → top**.
  4. Discard the pair.
- **Gains:** only landmarks and the "complete any track" achievement, with no VP.
- **End:** it stops when the last human finishes their final income turn. It cannot win.
- Official FAQ: if a tiebreaker is needed for the next favourite track, swap steps 1a/1b so the previous turn's tiebreaker card is used.

---

## Sources
- Stonemaier Tapestry page: https://stonemaiergames.com/games/tapestry/
- Stonemaier Rules/FAQ page: https://stonemaiergames.com/games/tapestry/rules-translations-faq/
- Stonemaier Dropbox, Tapestry folder: https://www.dropbox.com/sh/f2tekc23yvb27w3/AADWdwC3POTS09LOrPk0en1Qa/Tapestry?dl=0 (downloaded files listed below)
  - TapestryRules_r17.pdf
  - Tap_ReferenceGuide_r11.pdf (tech card faces, track spaces)
  - Tap_ReferenceCards_r2.pdf
  - Automa_TapRules_r8.pdf
  - Automa_Shadow Empire Rules.pdf
  - Tapestry Civilization Adjustments_r10.pdf
  - civ adjustments from FF.png
  - Civ Complexity Guide.png
  - TapestryLandmarkGuide_HomePrint230420.pdf
  - Plans & Ploys/Tap_CivilizationMat_OriginalMystics.pdf
  - Fantasies & Futures/FF_Automa_TapRules_r6.pdf
  - P&P and A&A Automa rulebooks
- Rulebook r12: https://c.tabletopia.com/games/tapestry/rules/tapestryrules-r12/en
- P&P rulebook r2 (civ adjustments, p.4): https://c.tabletopia.com/games/tapestry/rules/pp-tap-rulebook-r2/en
- A&A rules r6: https://c.tabletopia.com/games/tapestry-arts-architecture/rules/aa-tap-rules-r6/en
- F&F integrated rulebook r10 (FAQ, achievements image, adjustments p.32): https://c.tabletopia.com/games/fantasies-and-futures/rules/ff-rulebook-r10-low/en
- Revised Civ Pack rulesheet r3: https://c.tabletopia.com/games/tapestry/rules/tap-civpack-rulesheet-r3/en
- Revised Civ Pack product page: https://stonemaiergames.com/games/tapestry/revised-adjusted-rebalanced-civilization-pack/
- Final revised civ text (Stonemaier Google Sheet, via bit.ly/3URyOTn): https://docs.google.com/spreadsheets/d/1feYU2frJocoC40yGhf3f-nwkg9w6zAy7WRbfTUGBrak/edit#gid=0
- Civ adjustments v1.1 (Nov 2019, Dutch): https://a.storyblok.com/f/187813/x/d63decc867/tapestry_civilization_adjustments.pdf
- Design diary compilation: https://stonemaiergames.com/?p=14112
- BGG Tapestry FAQ wiki (original civ texts, tapestry card table, rulings): https://boardgamegeek.com/wiki/page/Tapestry_FAQ
- BGG image gallery API (component photos): https://api.geekdo.com/api/images?objectid=286096&objecttype=thing
- BGA Tapestry game help: https://en.doc.boardgamearena.com/Gamehelptapestry
- myautoma Tapestry companion app (decision card data, mat multipliers, level charts, 1–3 map model, civ images): http://myautoma.github.io/#tapestry and https://github.com/myautoma/myautoma.github.io/tree/HEAD/games/tapestry
- Strategy notes (achievement totals): https://wojciechkozlowski.eu/post/2024-05-04-tapestry-strategy-notes/
- Wayland Games listing (7 trap cards): https://www.waylandgames.co.uk/tapestry-stm150

## Open questions
1. Capital city mats #2–#6: names and impassable layouts. Also which 2 mats were revised in the Revised Civ Pack, and how.
2. All 48 territory tiles: edge terrains and benefits. All 15 space tiles: benefits. A scan or physical inventory is needed.
3. The 4–5 player map side: hex layout and capital positions 1–6. For the 1–3 side: which hex is "2/4", which is "3/5", and where "1/6" is.
4. Achievement VP ladders on the 1–3 player side of the board.
5. Entertainers: exact path edges between grid columns, and whether the column-4 track advances allow paying the bonus.
6. Isolationists: how "largest connected land mass of the same terrain type" treats tiles with several terrains; whether 7+ territories cap at 40 VP.
7. Traders, original: does a lone Traders token on an empty territory give control (for adjacency, scoring and conquer)?
8. Historians: does the owner choose which square is exposed when sending a token?
9. Landmark acquisition when a token jumps **past** a tier's first space (e.g. Socialism or Dark Ages multi-step moves): is the trigger "entering the tier" (rulebook wording) or "landing on the landmark space" (BGG ruling for the Futurists)?
10. Automa: do the bots stop after their 5th income turn? How does the Automa resolve Alien Biology (science 12)?
11. Re-trigger chains: may Assembly Line's circle or square, Electronics or Nanotechnology target Assembly Line itself, creating a loop? Lithium-Ion Battery's "at most 1×/turn" suggests loops were a concern. The A&A/F&F rule is "you may not activate the same advancement-track space more than once per turn", but no tech-card equivalent was found.
12. BGA's "version 8" civ adjustments: content not found. They may differ from §2.2.
13. Income-mat innovation positions for Farming, Breeding, Writing, Telephone, Banking and Currency (income-mat researcher).
