# Arts & Architecture advanced capital mats (#36): design

Written 2026-11-06. What the owner said or chose is marked **(owner)**; every other decision is **(my call)**.

## 1. Why and what

A table with Arts & Architecture on deals each player one random advanced capital mat beside their basic mat(s), and each player keeps one mat together with their civilization (03 §2.2, player step A). The six A&A mats each change the capital's rules: Archipelago, Canyon, Cavern, Cloud City, Mesa and Swamp (03 §2 "Advanced capital city mats"; R49–R52). #132 drew their art; this issue makes them playable.

Goals:
- the official draw and the joint choice of mat and civilization, on both map sizes, for 1–5 players;
- each mat's rules in the engine, test-first, on all six mats (the issue's checklist);
- the game screen shows the six mats with #132's art and asks the new choices.

Non-goals: the F&F mats (#40 builds on what this issue generalizes); the Automa (#34 and #38 are Lazar's, done separately); a variant without the advanced mats, since none is official (R53).

Anti-goals: mixing the advanced mats with the basic mats beyond the official draw (the issue); inventing a rule a source doesn't give. The gaps are owner rulings R120–R123 (§2).

## 2. The owner's decisions (2026-11-06)

- **Start now, before #34** **(owner)**: "We will do Automatas separately. That's on Lazar to do." #36 keeps its GitHub blocker, as #35 did.
- **One branch for the milestone** **(owner)**: "Let's make sure everything regarding this milestone is committed on a separate branch." M8's work is committed on `m8-arts-and-architecture`, which starts from #35's design and plan; #35's branch `issue-35-arts-track` merges into it, not into main. Nothing of M8 reaches main until the owner says so.
- **One setup choice** **(owner)**: the player keeps a mat and a civilization in one prompt, not two.
- **The looks are built from the existing patterns and checked afterwards** **(owner)**, as #33's were: no mockup round. The owner checks them in the library and in a running game, and fixes follow.
- **R120** **(owner)**: the table's version decides whether the Riverfolk may be kept with Cloud City. Current rules (the F&F adjustments, the revised Riverfolk): no. Original 2019 rules: yes.
- **R121** **(owner)**: Cloud City's move is one more item in the order the player picks for the masterpieces at the start of an income turn (#35 §3.7), so it may come before or after any of them. Until #35's masterpieces exist, it comes first.
- **R122** **(owner)**: landmarks count as buildings for surrounding a Canyon cactus, as do income buildings, impassable plots and the Architects' cubes.
- **R123** **(owner)**: the Archipelago's water and volcanoes are impassable plots like any other, so the Riverfolk and Terraforming may build on them. Water belongs to no island, so filling a water plot completes no district.

R120–R123 join the README's "Rules conventions" (Arts & Architecture).

## 3. The engine (part 1)

### 3.1 The mats' data

- The six mats join `src/lib/engine/data/capitals.js` with their printed numbers 7–12 (R49), their catalog slugs (`archipelago`, `canyon`, `cavern`, `cloud-city`, `mesa`, `swamp`), names, `expansion: 'aa'` and their layouts from 03 §2, each grid read row by row as the basic mats' are. The new plot symbols are a cactus and a lily pad, both open plots. The Archipelago has 11 rows. **(my call)**
- **Districts as data.** A mat lists its districts, each as plot indices: the nine 3×3 squares by default; the Archipelago's 9 islands (land plots only, its volcanoes included, from 03's island map) and Cloud City's 9 clouds (03's cloud map) otherwise.
- **Rows and columns as data.** A mat's rows and columns, and what each completed one scores: 1 VP each, except Cavern's columns score 0, its rows 1–6 score 2 and rows 7–9 score 3 (R51).
- **One source for the layouts.** #132's art modules (`tools/art/parts/capital-biomes/<slug>.js`) keep their own `LAYOUT` and `CLOUDS`; a test asserts the engine's data and the art's agree plot for plot, so neither drifts **(my call: moving the art's source would change approved files for nothing)**.
- One lookup takes any mat number to its mat, basic or advanced; every `CAPITAL_MATS[number - 1]` goes through it.

### 3.2 The grid of any shape

`src/lib/capital.js` (shared by the engine and the client) stops assuming 9×9 and 3×3 districts. Its geometry takes a mat's shape: rows, columns and districts. A plot's index is `row × columns + column` **(my call: generalize the columns too, so #40's 6×6 City in a Bottle needs nothing new)**. The basic mats' shape is the default, so their behaviour is unchanged. Everything that reads `GRID_SIZE` or `groupsOf('districts')`, in the engine (`city.js`, `placing.js`, the Riverfolk, the Architects, the Mystics, the landmark-card goals, P&P's cards) and in the client, takes the seat's mat instead.

### 3.3 Setup: the draw and the joint choice

- With `'aa'` in the table's expansions, setup shuffles the six A&A mats and deals one to each player, face up (it is public, as the basic mats are). On the large map a player's mats are their basic mat and the advanced one; on the small map, their pair and the advanced one.
- The starting outposts go where the basic mat(s) say, as now; keeping the advanced mat changes nothing there (03 §2 "Advanced capital city mats"). R40's solo start stays.
- **One decision** **(owner)** replaces `chooseCapital` and `chooseCiv` in each lane: its options are the mats and the two civilizations; its answer is one mat and one civilization. The civilizations stay hidden from the others, as now; the mats are public. Under R120, an answer pairing the Riverfolk with Cloud City is refused in current-rules games. Only setup's pick is limited, as the ruling is about choosing **(my call: our moves fire no placement triggers (§3.5), so the loophole the ban closes can't happen mid-game)**.
- Without A&A, setup is unchanged, decisions included.
- The reveal sets every player's mat from their pick, on both maps; unchosen mats go back to `supply.capitals`.
- The table switch: `EXPANSIONS_BUILT` gains `'aa'`, as #35 §3.1 also does; whichever lands first on the milestone branch adds it.

### 3.4 Each mat's rules

- **Archipelago (7):** 11 rows and 9 columns score 1 VP each when complete (R50). Islands are districts; water is in none. Landmarks may hang off the outer edge (R14, R106) but never cover water, as water is impassable, except under R123.
- **Canyon (8):** a cactus is an open plot. When all 8 plots around it are filled by buildings, landmarks, impassable plots or cubes (R122; "completely surrounded", 03 §2 Canyon), it counts as filled and becomes impassable: the capital derives this from what surrounds it, so a district or line it completes is completed by the piece that surrounded it, and pays then. The Riverfolk count it as impassable (03 §2.12), and may build on it.
- **Cavern (9):** a piece may cover a plot in the second or third row of districts only if the district directly above that plot's district is complete once the piece is placed. So a building there needs the district above complete; a landmark may complete the district above and reach into the one below (03 §2 Cavern, BGG rulings). The top three districts are always open. Scoring per R51; the Architects' uniform bonus is 0 on the Cavern (03 §2 Cavern: "nothing on the Cavern mat is worth 1").
- **Cloud City (10):** clouds are districts. The move is in §3.5.
- **Mesa (11):** a landmark must lie wholly inside the grid. A piece with no place goes beside the mat, as now (03 §2 Mesa; R14).
- **Swamp (12):** a lily pad counts as filled for districts, rows and columns, and stays open to build on. Covering one in a complete district pays nothing, as the district was complete already (03 §2 Swamp). At the start of the player's final income turn (income turn 5), they lose 2 VP for each lily pad still showing (R52). Under #35 it comes after the masterpieces **(my call: the FAQ allows before or after (03 §2.12), and after is never worse, as no masterpiece uncovers a pad)**; until then, first.

A lily pad is a new plot kind in `cityPlots`: filled for completion, coverable for placing. A surrounded cactus shows as `blocked`.

**The Architects' cubes** go one per district of the mat (each island, each cloud), on an empty plot as now **(my call)**: a lily pad isn't empty, so no cube hides one, and Cavern's gates are for buildings, so they don't bind the cubes.

### 3.5 Cloud City's move

- At the start of income turns 2–5, a Cloud City player may move up to 2 income buildings, one at a time, each from a cloud that isn't complete to a plot in a different cloud (the mat's text, 03 §2 Cloud City). Under R121 it is an item in the masterpieces' order once #35 lands; until then it is the first step of the income turn.
- **Two decisions per move** **(my call, so each answer is one plot the capital lights)**: which building, or stop; then where it goes. Where: any plot the player could put an income building on now (the Riverfolk's and Terraforming's impassable plots included), in another cloud. The second move is asked only if the first was made and a move is still possible; no move possible means no question.
- **What a move does** **(my call)**: it isn't gaining or placing a building, so it fires no `piecePlaced` triggers (Terraforming's 5 VP, the Riverfolk's resource). A cloud the move completes pays its district reward, since filling a district's last plot pays (01 §6.1), followed by the `districtsCompleted` triggers; then the `countsChanged` triggers, as rows and columns may change. Lines may also become incomplete; capital scoring always counts what is there now.

### 3.6 Tests (test-first)

- The data: each mat's plots, districts, symbols and numbers against 03 §2, and against #132's art layouts.
- Setup with A&A: both maps, 1–5 players; the deal is public, the civilizations hidden; the joint answer; R120 in both versions; the reveal; the starts unchanged; without A&A nothing changes.
- Each mat, on its own tests: placement (Mesa's overhang, the Archipelago's water and edge, Cavern's gates for buildings and landmarks, lily pads open and filled), completion (islands, clouds, a surrounded cactus completing a district, a lily pad in a complete district paying nothing), scoring (R50, R51, the Architects on the Cavern), the Swamp penalty on income turn 5 only, Cloud City's move (one, two, stopping, a cloud completed by a move paying, no `piecePlaced`), R122, R123 with the Riverfolk and with Terraforming.
- The simulation plays A&A games (mats dealt and kept), under the invariants and view checks: each mat dealt once; every pick hidden until the reveal.
- Base and P&P games unchanged: the existing suite.

## 4. The screen (part 2)

Built from the existing patterns, then checked by the owner in the library and a running game **(owner)**:

- **The grid of any shape:** `CapitalGrid` and the Capital tab take rows and columns from the mat (the Archipelago's 11 rows; #132's relief and features are already `reliefSize(11, 9)`).
- **#132's handoff:** `CapitalBiome` gains the six slugs, `plotTerrain` their layouts, `CapitalGrid` a `featureUrl(biome)` layer between the ground and the relief for `FEATURE_BIOMES` (Archipelago, Canyon, Cloud City, Swamp), and Cloud City's ground by each plot's cloud tint.
- **Districts that aren't squares:** the grid's dashed district boundaries and its completed-district highlight follow the islands and clouds instead of 3×3 squares.
- **The setup choice:** one shelf, the mats in one row (the advanced one drawn with its relief and features) and the two civilization cards below; the player picks one of each, then confirms. Under current rules, the Riverfolk and Cloud City grey each other out with the reason, as unavailable options do now. As built (part 2): two `CardShelf` rows sharing the panel's room, 40% for the mats and 60% for the taller civilization cards **(my call)**; a greyed card is a disabled one, without a reason line.
- **Cloud City's move:** the Capital tab lights the buildings that may move, then the plots one may go to; the panel offers "Don't move" and says which move of two it is.
- **Cavern, Canyon, Mesa:** nothing new to see. Only legal plots light, as now.
- **Swamp:** the penalty in the log and the VP; no new widget.
- **The words:** the decisions' words, the log lines and the card reference's mat entries in our own words. The other players' views show each player's mat.
- **The lobby's A&A switch** comes with #35's part 4; if #36's screen part lands first, it adds the switch.
- The README's "Current interface" and `docs/ui/screens/` change with it.

Client tests in Vitest (prompts, words, terrain, the grid's shape), and a browser test for an A&A table: the joint pick, then a placement on an advanced mat.

## 5. With #35 on the same branch

Whichever of the two lands second on `m8-arts-and-architecture` does the joining: `'aa'` in `EXPANSIONS_BUILT` once; R121 (Cloud City's move joins the masterpieces' order); the Swamp penalty after the masterpieces; setup's step order for the mats, the masterpieces and the landmark draft.

**Joined (2026-11-08, #35 landing second):**
- `'aa'` is in `EXPANSIONS_BUILT` once.
- R121: with the arts track, the income turn's masterpiece question offers Cloud City's moves as one more answer, last, while a building can move; picking it makes the moves, then the question comes back for the masterpieces left. With no masterpiece to fire, the moves come at once; a lone masterpiece with no move possible fires without a question, as before. Broadcast and Streaming Implants never offer the moves. Without the arts track, the moves stay the first step of the income turn **(my calls)**.
- The Swamp's penalty step follows the masterpieces' step.
- Setup: the masterpiece supply is dealt as the game is created, the joint pick of a mat and a civilization follows, and the landmark draft ends setup, as each issue already ordered them; nothing else needed joining.
- Ballet and Modern Dance count the mat's complete rows and columns on its own shape, as `capitalScore` gives them, so the Cavern's columns count though they score 0.
- Solo: the arts track needs 2 or more players (R59), so a solo A&A game plays without it, with the advanced mats; the simulation plays its solo A&A games so **(my call)**.
- The joint pick: the civilization cards take the room the mats' shelf leaves, down to 0.2, and the mats shrink to 0.25, so no tall card reaches up behind the mats at any desktop size, which the browser test checks **(my call; it fixes an overlap #36 had at 1280×720 and with the tallest cards at 1920×1080)**.

## 6. Left to the builder

- The names of the new decisions, events, plot kind and data fields, following the existing ones.
- The exact prompt and log words.
- Splitting each part into tasks in its plan.

## 7. Handed on

- **#40:** the F&F mats join the same deal and the same data; the grid already takes any number of columns.
- **#37:** A&A's cards that read rows, columns or districts use the mat's shape.
- **#35:** the joining in §5, and Ballet and Modern Dance read the mat's rows and columns (not capital scoring, so the Cavern's values don't apply).
