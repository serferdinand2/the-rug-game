# Arts & Architecture reliefs (#132): design

Written 2026-10-31. The owner set the look over two rounds of throwaway sketches in the brainstorming browser. What the owner said or chose is marked **(owner)**; every other decision is **(my call)**.

The approved sketches are kept as a reference in `docs/art/issue-132/`:
- [approved-mats.png](../../art/issue-132/approved-mats.png): the six real mats, on their ground;
- [approved-specimens.png](../../art/issue-132/approved-specimens.png): the six specimen sheets;
- [approved-close-up.png](../../art/issue-132/approved-close-up.png): the corner joins and 2×2 blocks at 3×;
- [approved-spike.mjs](../../art/issue-132/approved-spike.mjs), their source. `node docs/art/issue-132/approved-spike.mjs <out dir> approved` draws the six approved sketches; `1` and `2` draw each round as shown.

The script is not run by the build or the tests. It shows how the approved pictures were made: the build reuses its ideas, not its code as is.

The same folder holds `sketches.html` and `spike.mjs`, an earlier set of sketches made by ChatGPT. The owner preferred these: "Yeah I like yours better" **(owner)**. They are flat shapes seen from straight above, which is what this design avoids.

## 1. Why

#82 drew each group of a base mat's impassable plots as one 2.5D mass. This issue does the same for the six Arts & Architecture advanced mats: Archipelago, Canyon, Cavern, Cloud City, Mesa and Swamp.

The owner's rules from #82 hold **(owner, #82)**:
- 2.5D, seen from the front and above;
- a lone plot is one mass, and plots that touch by a side or a corner are one bigger mass;
- the mass grows out of the ground, with no hard outline at its foot; small hills on its sides are welcome;
- a corner-only join may reach into the two buildable plots' corners, as long as it looks natural;
- no stamped icons or symbols.

What the owner said about the sketches **(owner, 2026-10-31)**:
- Round 1: Canyon, Cavern and Swamp looked right.
- "Mesa and desert look too much alike."
- "Archipelago volcanos look off and art does not seem to be unison."
- "cloud city is the city so high up in the mountains it is in the clouds. it is not literally built on top of the clouds."
- Round 2: "B for cloud city", with the new Mesa and Archipelago, "all good".
- In the component library, the built six on their ground with their features and specimens: "looks good" (2026-10-31). That is the issue's step 4 approval, so the release (§4.2–§4.4) went ahead.

### Goals

- Each of the six mats has one relief, drawn from its printed layout as #82 does, in its biome's own look (§2).
- Each biome has natural ground for its buildable plots (§2.7).
- Every printed feature is kept (§3).

### Non-goals

- The rules don't change. Which plots are impassable, and which hold a cactus or a lily pad, still comes from the mat.
- The game doesn't show these mats yet: #36 makes them playable (§4.5).
- The Fantasies & Futures mats are #133.

### Anti-goals: it fails if

- any of #82's anti-goals is broken: stamped icons, a group that reads as separate obstacles, a corner-only join that reads as a thin pipe or a gap, a mass pasted on with a hard outline at its foot, or art on a buildable plot outside the corner patches;
- a mass is a flat shape seen from straight above, as in the rejected ChatGPT sketches;
- the Mesa reads like the Desert: separate buttes among dunes **(owner)**;
- a volcano looks pasted on, or in a different style from the sea around it **(owner)**;
- Cloud City looks like a city built on top of the clouds **(owner)**.

## 2. The look

Every relief uses #82's footprint unchanged: `footprint(layout)` in `src/lib/art/paint/relief/footprint.js`, with its `mask`, `plots`, `reach` and `corners`. A relief paints only inside `reach`. The numbers below are the sketch's and are a starting point, not a spec.

### 2.1 Mesa: one tableland (owner, round 2)

- **The shape.** Each group is one long tableland, not a cluster of buttes. Its plan is the footprint worn ragged: the mask eroded by noise by up to about 3 px, so its outline is never a rounded box.
- **Each column of the tableland**, from back to front:
  - the flat **top**: red soil (`mesaSoil`, `mesaSoilLight`), with scrub (`mesaSage`) and dark juniper dots. It has an ink outline at its back and sides, and a lit rim (`mesaStrata`) along its front.
  - the **cliff**: about 55% of the column's run, between 8 and 19 px. It is painted in layers that run parallel to the rim above it: cream cap rock, then red, cream, red, orange, deep red and maroon, repeating. Its lighting follows the rim: a stretch where the rim steps back is lit, one where it steps forward is in shade. Rain flutes darken every fifth column a little. The tableland's ends get a lit face on the left and a shaded one on the right.
  - the **talus**: about 18% of the run, between 3 and 7 px, in soil tones with rubble and gullies. Its lower part dithers into the plain, so there is no hard foot.
- **Notches.** The front edge wobbles by a few pixels, and every so often a notch cuts 4 px deeper, so a long cliff never runs straight.
- **A corner-only join** gets one flat-topped butte over the corner: a remnant of the same tableland. The butte is #82 Desert's outcrop shape, painted in the Mesa's red rock.
- **Why it isn't the Desert:** the Desert packs separate pale sandstone buttes among dunes. The Mesa is one continuous red tableland with painted layers and a talus skirt.

### 2.2 Canyon: a gorge cut into the plain (owner, round 1)

- **The shape.** The gorge is cut down into the plain instead of standing on it, so it can't be mistaken for the Mesa. Its rim is the footprint worn ragged by about 1.5 to 4 px.
- **At a corner-only join** the gorge bends through the corner: a round patch of about 8.5 px around the gap pixel, inside `reach`. It never narrows to a pipe.
- **Seen from the front and above**, using the distance from each pixel to the rim and which way that rim lies:
  - the far wall and the side walls step down in terraces that follow the rim, in red-rock tones. Each step's ledge is lighter, and the rock gets darker with depth. The east wall is lit and the west wall is in shade.
  - the near wall faces away, out of sight. Below the near rim lies floor in its shadow, darkest right under the rim.
  - the floor is the strip within about 1.5 px of the gorge's middle line, with a blue river along that line.
  - the rim's lip is lit (`mesaSoilLight`), except along the near rim, which is dark (`mesaSoilDark`).
- **Around the gorge:** dusty soil, ragged where it meets the plain. Small red boulders sit on the near and far rims. Beside each corner-only join a boulder stands on the ground of a corner patch. A hoodoo is placed on the other side too, but it is taller than the patch reaches, so it never fits: the approved specimen shows the boulder alone, and the real Canyon mat has no corner-only join **(corrected after the final review, 2026-10-31, to match the approved art)**.

### 2.3 Cavern: cave rock, stalagmites and crystals (owner, round 1)

- **Rock.** Each impassable plot gets one formation of grey cave rock, of its own size and place: half-width 10 to 15, height 12 to 19, base near the plot's bottom. About 60% of plots also get a smaller one behind it. This stops a run of plots from repeating one shape.
  - The rock is shaped like #82's peaks, but rounder and lower: `rough` 0.3, with a flat top of about 20% of its width.
  - It is lit on the left and shaded on the right, with secondary ridges. Now and then a vein of teal crystal shows.
  - Its lower half darkens into the cave floor. The ink outline covers only the upper rock.
- **Stalagmites** stand in front where they would show: tall narrow cones with drip rings, half-width 3 to 5 and height 15 to 26. There are only a few, so they don't read as a picket fence.
- **Crystal clusters** stand on about two plots in three: four shards each, teal or, one time in three, violet. They have an ink outline and glow on the floor around their foot.
- **Around the rock:** a darker floor and low rubble mounds along the open sides. A corner-only join gets a formation over the corner.

### 2.4 Swamp: black water and dead trees (owner, round 1)

- **The water.** Black water fills the footprint about 2.5 to 7.5 px in from its edge, with a shore that wobbles.
  - Its far bank has a peaty face, one or two rows deep, and its near bank a muddy lip.
  - The water itself is in dark bands, with rare light streaks and duckweed near the shore.
- **The banks.** Mud lies round the water. Tall reed beds stand on the far bank behind it, and a few reeds on the near bank. Mud hummocks with sedge sit along the open sides.
- **Dead trees.** There are a few big ones standing in the water, about one to every two plots, 16 to 24 px tall.
  - The wood is bleached and warm grey (`creamShade`, `plasterShade`, `timberShade`).
  - Each tree has flared roots, a trunk that narrows upward, crooked branches and moss hanging from them.
  - A short reflection of the trunk shows in the water.
- **Cypress knees** stand in the water.
- **A corner-only join** gets a dead tree over the corner, inside `reach`.

### 2.5 Archipelago: the sea and its volcanic islands (owner, round 2)

- **The sea.** Every impassable plot that isn't a volcano is sea, drawn with #134's approved `paintSea` (`src/lib/art/paint/sea.js`).
  - Along the far shore it shows a wet sand face and surf, and foam along the near shore.
  - The 2-px margin of a water plot is wet sand, so it continues the island's beach.
- **A corner-only join** bends the water through the corner as a strait. This is a round patch of about 8 to 10 px, inside `reach`, ringed with sand.
- **Islets.** A few rocky islets stand only where the water is wide: about one to every eight water plots, at least 70 px apart. They are grey rock with a grassy top and a foam ring.
- **The volcanoes** stand at `VOLCANOES` (rows and columns 4,3, 5,3 and 9,2). Each is a volcanic island in the same 2.5D style as the sea **(owner, round 2)**:
  - foam, then a black-sand shore (`ash`, `ashShade`), then green jungle inland;
  - a dark basalt cone with a glowing crater;
  - a lava flow down its shaded flank that steams where it meets the sea, and a plume of grey smoke.
- **The two touching volcano plots are one massif:** a tall cone behind, its foot reaching into the lower plot, and a smaller cone in front of it.
- In the specimen sheet, the lone plot is a volcano, so the sheet shows one up close.

### 2.6 Cloud City: stone pillars rising out of cloud (owner, round 2, option B)

- **The idea.** The city stands high in the mountains, among the clouds; it is not built on the clouds **(owner)**.
- **The pillars.** Each group's impassable plots are tall stone pillars rising out of banks of cloud.
  - The pillars stand on a loose grid, about one to each plot, half-width 5 to 9 and 24 to 42 px tall, with a slight lean.
  - They are grey stone with near-vertical sides and vertical cracks, lit on the left.
  - Each has a grassy summit with one or two pines, and an ink outline on the upper part.
- **The clouds.**
  - Cumulus puffs of every size fill the footprint round the pillars' feet. They are lumpy like a cauliflower, with their belly in shade.
  - Only the outside of a bank is outlined, so the puffs inside it read as one cloud.
  - Each puff is drawn in the tint of the cloud (district) under its centre: `CLOUDS` and `CLOUD_TINTS` from `capital-biomes/cloud-city.js`.
  - A pillar is drawn behind the puffs in front of its foot, so the cloud wraps round its base.
- **A corner-only join** is bridged by two puffs over the corner, inside `reach`. A pillar is placed there too, but with its pines it is taller than the corner patch reaches, so it never fits: the approved sketches and the library show the puffs alone, and the owner approved that look **(corrected after the final review, 2026-10-31, to match the approved art)**.
- **Rejected options:**
  - round 1's plain cloud banks: "does not seem to have much to it" **(owner)**;
  - round 2's option A, the Mountain's snowy peaks wrapped in cloud **(owner chose B)**.

### 2.7 Natural ground (approved with the mats)

Each biome's buildable plots get #82-style natural ground: mostly one tone, with sparse dithered patches of a lighter and a darker tone and a few small things lying on it.

| Biome | Ground | Scatter |
|---|---|---|
| Mesa | red soil (`mesaSoil`, light `mesaSoilLight`, dark `mesaSoilShade`) | sage shrubs, red pebbles, hardpan cracks |
| Canyon | paler, dustier red earth (`mesaSoilLight`, light `sandLight`, dark `mesaSoil`) | dry tufts, pebbles, rare sage |
| Cavern | dark cave floor (the #6 cavern floor tones) | grit, still puddles with a glint, crystal glints, pebbles |
| Swamp | mud (`swampMud`, light `swampMudLight`, dark `swampMudShade`) | moss tufts, puddles, sedge, twigs |
| Archipelago (island plots) | meadow grass (`grass`, light `grassLight`, dark `grassShade`) | grass tufts, cream and gold flowers |
| Cloud City | alpine terraces in the tint of their cloud: four opaque grounds, one per tint (white, grey, tan, cream), each the alpine meadow tones mixed with its tint | stones, wisps of mist, alpine tufts, all in the plot's tint |

## 3. The printed features (issue step 2)

Each biome module's `FEATURES` lists what the mat prints beyond buildable and impassable. None is dropped. The owner approved where each one is drawn, as the sketches show it **(owner, in the approved sketches)**.

| Biome | Feature | Where it is drawn |
|---|---|---|
| Archipelago | the three volcanoes, impassable land with a beach | In the relief: volcanic islands with a black-sand shore (§2.5) |
| Archipelago | a beach on every island side that faces water | On the island plots, mat-level art (§4.3): a sand strip of about 3.5 px with a wet edge on each side facing a water plot, plus a sand quarter-circle at an island corner whose diagonal plot is water. A volcano plot is land, so no beach faces it. |
| Canyon | a saguaro on each `C` plot | On the plot, mat-level art: one saguaro with an ink outline and a soft shadow |
| Cloud City | each cloud's tint | In the ground: each plot's tile is drawn in its cloud's tint (§4.2). In the relief: each puff takes the tint under it. |
| Cloud City | the scalloped rims between clouds | On the plots, mat-level art, along every edge between two different clouds in `CLOUDS`, as #6 draws them |
| Swamp | a lily pond on each `L` plot | On the plot, mat-level art: a pond with a muddy rim, a peaty far bank and three lily pads, one in flower |
| Cavern, Mesa | none | — |

Cacti and lily pads may be built over (03-expansions §2: the Canyon and Swamp mat texts). So the mat-level art always sits under the buildings. The Swamp's end-game loss is per visible lily pad, and a building on a pond hides it.

## 4. How it is built

### 4.1 Where the code goes (my call)

The issue was written before #134 moved the shared painting code into `src/lib/art/paint/`. Its paths are corrected here:

- **Ground.** Each biome's natural ground is added to `GROUNDS` in `src/lib/art/paint/relief/ground.js`, beside the base biomes'. The issue's `tools/art/parts/capital-relief/ground.js` doesn't exist.
- **Painters.** One painter per biome goes in `tools/art/parts/capital-relief/<biome>.js`: `paintMesa`, `paintCanyon`, `paintCavern`, `paintSwamp`, `paintArchipelago` and `paintCloudCity`.
- **Shared code.** Code the painters share is not copied between them:
  - the red-rock butte, hoodoo and boulder (Mesa, Canyon);
  - the cloud puffs and their bank outline (Cloud City);
  - #82's jagged peak outline (`jagged` and `peakShape` in `mountain.js`), which Cavern, the islets and the volcanoes reuse.

  Each goes in one module that the painters import. For `mountain.js` that means exporting what is now module-private.
- **Extra data.** Two painters need data beyond the footprint: the Archipelago its volcano plots, and Cloud City its clouds and their tints.
  - `ReliefPainter` gains an optional fourth argument for that data: `(canvas, fp, seed, mat?)`. `mat` carries `{ volcanoes?: [row, col][], clouds?: readonly string[], tints?: readonly number[] }`.
  - `drawRelief` and `drawReliefPreview` pass it through.
  - A drawing passes its biome module's data. The library passes the specimen's own: a volcano on the specimen's lone plot, and the real `CLOUDS`.
- **Registration.**
  - The painters are registered in `RELIEF_PAINTERS` (`tools/art/parts/capital-relief/index.js`).
  - The six slugs join `RELIEF_BIOMES` (`src/lib/art/relief.js`): `archipelago`, `canyon`, `cavern`, `cloud-city`, `mesa` and `swamp`.
  - `tools/art/drawings/capital-relief/<slug>.js` draws each mat's relief from its biome module's `LAYOUT`. The Archipelago's is `reliefSize(11, 9)`, 296×362.
- **Palette.** Every colour the sketch mixes on the fly becomes a named entry in `src/lib/art/paint/palette.js`, named for its biome. This covers:
  - the cave floor tones;
  - Cloud City's four tints, which `cloud-city.js` mixes today;
  - Cloud City's tinted terrace tones;
  - the Mesa strata's lit and shaded tones.

  The relief tests allow palette colours only, plus ink at partial opacity for shadows.

### 4.2 The ground tiles

- `capital-terrain/<biome>-open-01` to `-08` keep their ids and are redrawn as natural ground (§2.7), for Archipelago, Canyon, Cavern, Mesa and Swamp.
- Cloud City's ground is drawn in its four tints, eight variants each: `capital-terrain/cloud-city-<tint>-open-01` to `-08`, where `<tint>` is `white`, `grey`, `tan` or `cream`. These 32 tiles replace `cloud-city-open-01` to `-08` **(my call)**.
  - The approved sketch draws each tint as its own opaque ground, with stones, wisps and tufts in that tint. One neutral ground under a see-through tint couldn't match those colours.
  - A Cloud City plot's tile is therefore picked from its cloud's tint (`CLOUD_TINTS[CLOUDS[row][col]]`), not from one pool. #36's composition has to do that (§4.5).
- `capital-terrain/<biome>-blocked-01` to `-06` retire for all six biomes, once that biome's relief is approved: their drawings, SVGs, catalog entries and `FEATURES.pools.blocked`.
  - The issue says to keep the special variants. The only special one among these six is the Archipelago's volcano tile, `VOLCANO_VARIANT`.
  - It retires too, because the relief draws the volcanoes now. The owner's ruling is not to duplicate art (2026-10-29) **(my call)**.

### 4.3 What only the mat draws: one features picture per mat (my call)

- Today only the example mats `capital-mat/<biome>` draw `FEATURES.matOnly`.
- The 2026-10-29 ruling, recorded in `docs/art/README.md`, retires an expansion mat's example once its relief is drawn and whatever only the example draws is drawn somewhere else. This replaces the issue's "redraw its example mat".
- So the toolkit draws one more picture for each mat that prints features: `capital-feature/<slug>`.
  - It is transparent and the size of the mat's relief. It is drawn from the biome's `LAYOUT` and, for Cloud City, `CLOUDS` and `CLOUD_TINTS`.
  - There are four: Canyon's saguaros, Swamp's lily ponds, the Archipelago's beaches, and Cloud City's rims between clouds.
  - Cavern and Mesa print nothing beyond their layout, so they have no features picture and no empty placeholder. A lookup of their features picture returns none.
  - Like a relief, it uses opaque palette colours, plus ink at partial opacity for shadows.
  - The `capital-feature` catalog group lists only these four. #133 adds the Fantasies & Futures mats' features pictures when it designs them.
- The layers stack in this order: ground tiles, then features, then relief, then buildings. That is the order the game will use.
- Once a biome's relief and features are approved, its example mat retires: its drawing, SVG and catalog entry, and its entry in `EXAMPLES` and the library's Capital mats note. The library's preview shows the same picture.
- `FEATURES.matOnly` stays. Each entry now names the features picture that draws it, for #36.

### 4.4 The library

- The Art area's Capital relief group shows each of the six mats: its relief over its ground and features, at 2×. It also shows the specimen sheet, as it does for the base mats.
- `drawReliefPreview` draws the features picture, where the mat has one, between the ground and the relief. It picks Cloud City's ground by tint. The preview is then the game's composition.
- Capital features is its own catalog group, so its pictures are listed and checked like the reliefs.
- The owner approves each biome there before anything approved changes (issue step 4). None of these six biomes' tiles or example mats are in `docs/art/approved-assets.json` today. Once approved, the manifest gains:
  - the six reliefs;
  - the four features pictures;
  - 72 ground tiles: eight each for five biomes, and 32 for Cloud City.

### 4.5 The game (handed to #36)

`CapitalGrid` already lays `reliefUrl(biome)` over the grid for any biome in `RELIEF_BIOMES`. However:
- `CapitalBiome` in `src/lib/ui.js` lists only the six base biomes;
- `plotTerrain` reads the base `CAPITAL_MATS`;
- the grid assumes 9×9.

Making the advanced mats playable is #36's work, so #132 doesn't change `CapitalGrid` **(my call)**. #36 adds:
- the advanced biomes to `CapitalBiome`;
- their layouts to `plotTerrain`;
- a `featureUrl(biome)` layer between the ground and the relief, which returns none for Cavern and Mesa;
- Cloud City's ground picked by each plot's cloud tint (§4.2);
- the Archipelago's 11 rows.

Then it checks that the capital shows all six, as the issue's step 5 asks. #132 records this hand-off in its status entry and as a comment on #36.

## 5. Tests (in `tests/art-capital-relief.test.mjs`, as #82's)

- **For each of the six biomes:**
  - the relief is deterministic and stays within the reach;
  - every impassable plot's middle is covered;
  - it uses palette colours only, plus ink below full opacity for shadows;
  - a piece stands over every corner-only join;
  - the mat's relief is `reliefSize` of its layout (296×362 for the Archipelago).
- **Natural ground:** eight deterministic variants per biome, and per tint for Cloud City, in palette colours, filling their plot.
- **Per biome:**
  - the Mesa's relief is red rock and red soil, not the Desert's sandstone (as the existing Desert test checks the reverse);
  - the Archipelago's volcano plots are land, not sea: no `paintSea` colour at their middles;
  - each Cloud City puff takes its district's tint;
  - the Canyon's middle line carries the river's blue.
- **Features pictures:**
  - Canyon paints only on `C` plots, and Swamp only on `L` plots;
  - the Archipelago paints only on island plots, and only within the beach width of a side or corner that faces water;
  - Cloud City draws rims only within 3 px of an edge between two clouds;
  - Cavern and Mesa have no features picture.
- **Catalog:**
  - `capital-relief` lists the six, and `capital-feature` the four;
  - `capital-terrain` holds Cloud City's 32 tinted tiles;
  - every drawn picture has an SVG and a drawing;
  - the retired tiles and examples are gone.
- The approval manifest is updated only after the owner approves.

## 6. Order (my call)

- One branch. Canyon, Cavern and Swamp come first, as the owner approved them first, then Mesa, Archipelago and Cloud City.
- Each biome's relief, ground and features are built test-first, then shown in the library.
- The owner approves them there. Only then do the blocked tiles and examples retire and the manifest changes.

## 7. Documentation

- `docs/status.md`: the summary and #132's entry, with the hand-off to #36.
- `docs/architecture.md`: the features pictures and the painters' fourth argument.
- `docs/art/README.md`: the toolkit table, `RELIEF_BIOMES`, and the retired examples.
- The README's screenshots don't change: the game doesn't show these mats until #36 (issue step 4).

## 8. Left to the builder

- The exact sizes, counts, thresholds and colours: the sketch's numbers are a starting point.
- How the modules split internally, and the palette entries' names.
- How the library lays out the six.
- Any speed-ups, as long as the output stays deterministic.
