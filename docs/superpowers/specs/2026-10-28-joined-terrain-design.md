# Joined impassable terrain (#82): design

Written 2026-10-28. The owner set the look over five rounds of throwaway sketches in the brainstorming browser. What the owner said or chose is marked **(owner)**; every other decision is **(my call)**. The approved sketch is kept as a reference: [approved-spike.png](../../art/issue-82/approved-spike.png), [approved-close-up.png](../../art/issue-82/approved-close-up.png) and its source [spike.mjs](../../art/issue-82/spike.mjs). That script is not run by the build or the tests. It shows how the approved pictures were made, and the build reuses its ideas, not its code as is.

## 1. Why

Each impassable plot is drawn today as its own 32×32 obstacle on open ground, with the grid's gap around it. A group of 11 impassable plots reads as 11 separate obstacles. The owner wants a group to read as one place, and wants that place to look like what it is:

- "a single block is a hill, but if you match 2 on the corners, it still looks like one hill. More realistic and less symbolic" **(owner)**
- "I actually wanna see the picture that shows that this is a mountain or a forest … update all of these assets to actually represent their niches … Make it visually appear 2.5D" **(owner)**
- "update the background as well and fix those corner connections so they look more natural. it's okay if the hill appears in the corner of the space where we can build as long as it looks nice" **(owner)**
- "I kinda want that mountain to merge into the ground below and not look like it's just pasted on. Smooth it out and it's okay to draw little hills on the side" **(owner)**

### Goals

- A lone impassable plot is one mountain, one grove, or one of whatever its biome holds.
- Impassable plots that touch, by a side or only at a corner, are drawn as one bigger mass. No line shows inside a group.
- The pictures are 2.5D: seen from the front and above, with nearer things overlapping farther ones.
- The mass grows out of the ground: no hard edge at its foot.
- The buildable ground is redrawn to look natural.
- The six base biomes here. The expansion biomes follow in #132 (Arts & Architecture, M8) and #133 (Fantasies & Futures, M9), done the same way, and the World Map's terrain in #134 **(owner, 2026-10-28)**.

### Non-goals

- The rules don't change. Which plots are impassable still comes from the mat.
- The Architects' cubes stay pieces on top of a plot, not terrain (from the issue).
- No per-table variety in the impassable pictures: each mat always looks the same, like the printed mat **(my call)**. The buildable ground still varies with the table's seed, as today.

### Anti-goals: it fails if

- the impassable art looks like stamped icons or symbols (the owner rejected rows of small peak icons);
- a group still reads as separate obstacles, or a corner-only join reads as a thin pipe or a gap;
- a mountain looks pasted onto the ground, with a hard outline at its foot;
- the art covers a buildable plot anywhere except the small corner patches the owner allowed.

## 2. The look

The approved sketch shows Mountain and Forest. Each biome's mass is built the same way.

### 2.1 The footprint

- A group is a set of impassable plots joined by sides or corners (8-neighbour connectivity).
- Its footprint is the union of its plots, inset 2 px from every side that faces a buildable plot or the mat's edge, with convex corners rounded (radius 8). Sides between two impassable plots run straight through, across the gap between them.
- **A corner-only join** is two impassable plots touching at one corner while the two plots beside that corner are buildable. Its footprint gets a diagonal band through the corner point, and a round patch (radius 16 px around the corner point) where a joining piece may stand. That patch reaches into the two buildable plots' corners **(owner: allowed "as long as it looks nice")**.
- Nothing else is drawn on a buildable plot.

### 2.2 Mountain (approved, owner)

- **Peaks** are 2.5D mountain shapes: jagged left and right flanks from the summit down to a horizontal base, a ridge line splitting a lit left face from a shaded right face, rock grain, one or two secondary ridges, and a snow cap with a ragged lower edge. Higher peaks carry more snow; small ones carry none.
- **Packing:** peaks are placed largest first (half-widths 30 down to 7 px) wherever the footprint has room. They are scanned from the front row back, so the biggest peaks stand in front and smaller ones show behind, and each new peak must cover mostly uncovered footprint. Then they are drawn back to front by the y of their base.
- **A corner-only join** gets its own peak standing over the corner point, drawn into the corner patch.
- **Merging into the ground:** the lower half of each peak turns to meadow colours, dithered, more so toward the foot. The ink outline covers only the upper rock; the foot has none. Low rounded foothills with a lit rim and a few stones sit in front of each group's bottom edge, along its open sides, and below each corner peak.
- **Shadows:** a soft shadow falls to the right of each foot.
- **Floor:** a darker meadow under each group, with a ragged edge that fades into the ground.

### 2.3 Forest (approved, owner)

- **Trees:** broadleaf trees (a round crown over a short trunk, lit from the upper left) and about one pine in five, in two leaf tones.
- **Packing:** trees on a jittered grid (about 6 px apart, staggered rows) inside the footprint. A tree is drawn only where its whole crown fits in the group's plots; one that doesn't fit becomes a small tree, or is dropped. Trees are drawn back to front, each with a soft shadow at its base.
- **A corner-only join** gets a clump of about eight small trees over the corner, drawn into the corner patch.
- **Floor:** a dark shade under the trees, with a ragged edge.

### 2.4 The buildable ground (approved, owner)

- Mostly one tone, with small, sparse, dithered patches of a lighter and a darker tone, and a few small details. No large blotches: the owner saw a camouflage-like version and it was replaced.
- **Mountain:** an alpine meadow (sage green) with grey pebbles and a few tufts and flowers, so the grey rock stands out. The earlier grey ground made the peaks vanish.
- **Forest:** a meadow green with grass tufts and a few cream and gold flowers.

### 2.5 The other 16 biomes (my call; the owner approves each batch)

Each biome's mass shows what that biome is, built from the same footprint, packing and merging. The subjects below follow what each biome's impassable tiles show today. They are proposals, and the owner sees each one in the library before it is kept.

The advanced mats carry printed meaning beyond buildable and impassable, listed in each `capital-biomes/<biome>.js` `FEATURES`: Archipelago's volcanoes, Quagmire's wisps and reeds, Savanna's unicorn herds and grey ground, Veil's two sides, Polar's field lines and Cloud City's tinted clouds. That meaning is never lost **(my call)**. Batches 3 and 4 design each of those biomes against its `FEATURES`, either drawing a feature into the relief or keeping it as its own art above the relief. The variants marked special are kept, and only the ordinary impassable variants retire. The relief takes its mat's own size, since Archipelago has 11 rows and City in a Bottle is 6×6 (`rows × 33 − 1` by `columns × 33 − 1`). Batch 1's `drawRelief` takes the layout as rows of plot kinds, so later batches can add kinds without changing its callers.

| Biome | Its mass | Its ground |
|---|---|---|
| Wetland | reed beds around dark pools | wet meadow |
| Tropical | jungle: palms and broadleaf canopy | lush green |
| Desert | rock outcrops among dunes | sand |
| Grassland | rocky hills and boulder tors | grass |
| Archipelago | sea with small rocky islets | sand and grass |
| Canyon | a gorge with cliff walls | red earth |
| Cavern | cave rock and stalagmites | cave floor |
| Cloud City | banks of cloud | cloud deck |
| Mesa | red buttes with banded rock | red desert soil |
| Swamp | black water and dead trees | mud |
| Quagmire | bog pools and peat | peat |
| City in a Bottle | coral and glass | glassy sand |
| Veil | mist over dark stones | pale ground |
| Savanna | acacias and rocky kopjes | golden grass |
| Polar | ice ridges and seracs | snow |
| Netherworld | lava rock and chasms | ash |

## 3. How it is built

### 3.1 One relief picture per mat, drawn at build time (my call)

The look depends on each group's whole shape, so it can't be put together from fixed per-plot pieces, as the issue first planned with quarter tiles. The owner was told this before approving the 2.5D look and went ahead.

- The art toolkit draws one **relief** picture per mat, from the mat's printed layout: `capital-relief/<mat id>`, such as `capital-relief/mountain`. It is an SVG with a transparent background, made of plots of 32 px with a 1-px gap between them. For the 9×9 mats that is 296×296 (9 × 32 + 8 = 296); the two advanced mats of other sizes follow §2.5.
- The base mats' layouts come from `src/lib/engine/data/capitals.js`. The toolkit already imports engine data in `tools/art/parts/territory.js`, so this adds no new direction of import. The advanced mats' layouts come from each `capital-biomes/<biome>.js` `LAYOUT`. `CAPITAL_GRIDS` in `capital-terrain.js` duplicates the engine's layouts, so it goes, and the toolkit reads the engine's.
- The relief paints: the floor, the features, the foothills, the corner pieces, the soft shadows (as ink with partial opacity, which the painter already supports), and the ground across every gap inside a group. Everywhere else is transparent.
- **Why not draw it in the browser:** the conventions say `src/lib/` never imports `tools/art/`, and art is a static SVG referenced by its asset id. A runtime generator would break both. And a whole mat drawn with its ground is about 430 KB of SVG; a relief layer over small ground tiles is far lighter.

### 3.2 The ground stays per plot

- `capital-terrain/<biome>-open-01` to `-08` keep their ids and are redrawn in the new style (§2.4). `capitalTileUrl()` still picks one per plot from the table's seed.
- An impassable plot's cell shows a ground tile too, under the relief.
- `capital-terrain/<biome>-blocked-01` to `-06` are retired once that biome's relief is approved: their drawings, SVGs, catalog entries and approval-manifest entries go. Until then a biome without a relief keeps today's blocked tiles, so nothing breaks between batches.

### 3.3 CapitalGrid

- It draws the relief for its `biome` (which is the mat's id) over the grid, under the buildings. The order is: ground tiles, then relief, then the buildings and the faint preview, then the district dashes, then the landmark pieces, then the completed-group overlays. The relief takes no pointer events.
- The small red X on impassable plots, and their flat `--chrome` background, go **(owner, 2026-10-28)**: the art shows which plots are impassable. `docs/ui/README.md` and the README screenshots change with it.
- The grid's gap becomes proportional, `calc(100% / 296)`, so the plots line up with the relief's pixels exactly: a plot is then 32/296 of the width. The overhang maths for pieces that hang over the edge (R106) uses the same value. The padding and the dark backing stay.
- The plots must be the biome's real mat layout. The game always passes it (`capitalView`, `matPlots`); the library fixtures change from the made-up layout to the real mats.
- The capital shows in three places, and all of them use `CapitalGrid`: the Capital tab, the opponents' capitals in the players overview, and the mats on offer at setup (#56).

### 3.3.1 Plots whose kind changes in play (my call)

`cityPlots()` reports what a plot holds now, not what the mat printed, so two cases differ from the mat's layout. The screen knows the mat, so `capitalView` tells `CapitalGrid` about both; the engine doesn't change.

- **A terraformed plot** (02 #39 Terraforming, and later the Riverfolk) is an impassable plot with a building or landmark on it. It looks cleared, as it does today: its own ground tile is drawn over the relief on that plot, then the building. The relief around it stays, so the cleared plot is a clearing in the mountain or the wood.
- **The Architects' cubes** sit on buildable plots, and `cityPlots()` reports them as `blocked`. Today they are drawn with the blocked tiles, which this work retires. The issue says the cubes "stay pieces on top of the plot, not terrain", so they get a **cube piece**: a new small 32×32 asset, `piece/architects-cube`, drawn on the plot's ground like a building. The owner approves it with batch 1.

### 3.4 Where the code goes (my call)

- `tools/art/parts/capital-relief/`: `footprint.js` (groups, the footprint mask, the corner joins and where art may reach), `index.js` (the biome registry and `drawRelief(layout, biome)`), and one module per biome with its features. They paint only `PALETTE` colours plus ink at partial opacity for shadows, and use `seededRandom` only.
- New palette entries for the alpine meadow and any other colours a biome needs, named for their biome.
- `tools/art/drawings/capital-relief/<mat id>.js`, one per mat, each calling `drawRelief`.
- The example mats `capital-mat/<biome>` stay examples: they are redrawn as ground tiles plus relief, so the library shows the new look.

### 3.5 The library

- The Art area gets a **Capital relief** group: each mat's relief over its ground, at 2×, plus a specimen sheet per biome (a lone plot, a side pair, two corner-only pairs, an L of three and a 2×2 block), drawn live from the toolkit. The owner approves each batch there.
- The CapitalGrid section shows the real mats.

## 4. Scope and order

- **The base game only, for now (owner, 2026-10-28: "just the base game for now").** This issue builds the pipeline, `CapitalGrid` and the six base biomes: Mountain and Forest first, then Wetland, Tropical, Desert and Grassland. The owner approves all six in the library before the approved tiles change.
- **The expansion mats** are in their own milestones, each with step-by-step instructions to repeat this work: #132 (Arts & Architecture, M8) and #133 (Fantasies & Futures, M9). Their reliefs show in the game once #36 and #40 make the mats playable.
- **The World Map's terrain** gets the same 2.5D style in #134 (M12).
- This issue closes when the six base mats are approved and released.

## 5. Tests

- **Footprint:** groups, corner-only joins and footprints for every base mat and for the specimen layouts (a lone plot, a side pair, both diagonals, an L, a 2×2), the mat's edge closing a footprint, and no footprint pixel on a buildable plot outside a corner patch.
- **Relief:** deterministic; 296×296; transparent outside the reach; every impassable plot's middle is covered; only palette colours, plus ink at partial opacity; no pixel on a buildable plot outside a corner patch.
- **Layouts:** the toolkit reads the engine's layouts for the base mats.
- **Catalog:** the `capital-relief` group has the 18 mats; every drawn relief has an SVG and a drawing.
- **Ground:** still 8 variants of 32×32 per biome, deterministic.
- **CapitalGrid:** the relief's URL, the proportional gap, and the stacking order. The browser tests that open the Capital tab and the setup offers keep passing.
- The approval manifest is updated only after the owner approves a batch.

## 6. Documentation

- The README's "Current interface" and `docs/ui/screens/`: the Capital tab, an opponent's capital and the mat offer, with each batch that changes what the game shows.
- `docs/ui/README.md`, `docs/art/README.md` (the toolkit table and the approval steps), `docs/architecture.md` and `docs/status.md`.
- The issue's proposed solution on GitHub describes quarter tiles. It is rewritten to match this design and its four batches **(owner, 2026-10-28)**.
- CLAUDE.md's ruling that "actual capital mats must be generated from the reusable terrain tiles for each game" is updated **(owner, 2026-10-28)**: the buildable ground is still composed per game from tiles picked by the table's seed, and each mat's impassable relief is drawn once, from its printed layout.

## 7. Left to the builder

The exact sizes, counts, thresholds and colours: the sketch's numbers are a starting point, not a spec. How the toolkit's modules split internally. How the library lays out the specimen sheets. Any speed-ups to the packing, as long as the output stays deterministic.
