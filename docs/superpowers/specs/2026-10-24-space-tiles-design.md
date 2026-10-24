# Space tiles: 19 illustrations (#11): design

Written 2026-10-24. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)) and follows the masterpieces ([2026-10-23-masterpieces-design.md](2026-10-23-masterpieces-design.md)) and the landmark cards ([2026-10-23-landmark-cards-design.md](2026-10-23-landmark-cards-design.md)).

## 1. What and why

Every space tile gets **one 64×64 style C picture**. The space tiles are the last pictures of #11.

A player explores space from exploration tier IV (Interstellar Travel, Warpgates) and with some cards. The tile goes next to their income mat, never on the map, and gives its benefit (research 01 §7.2, R5). There are 19 tiles: 15 in the base game and 4 in Plans & Ploys (research 03 §1.5). P&P's replacement for the misprinted base tile is not a separate tile: R5 gives tile 11 the corrected benefit in both versions.

| Tile | Set | Benefit |
|---|---|---|
| 1 | base | Advance on science, then 1 VP per science space you have reached |
| 2 | base | Gain an armory, then 1 VP per armory in your capital |
| 3 | base | Gain a house, then 1 VP per house |
| 4 | base | Gain a tapestry card and play it on top of your current one, then 1 VP per tapestry card |
| 5 | base | 1 coin, 1 worker and 8 VP |
| 6 | base | Research and 6 VP |
| 7 | base | 1 food, 1 culture and 8 VP |
| 8 | base | 1 culture, then score your capital |
| 9 | base | Advance on technology, then 1 VP per technology space |
| 10 | base | Invent, upgrade, then 1 VP per tech card |
| 11 | base | Conquer, then 1 VP per territory you control (R5) |
| 12 | base | Advance on military, then 1 VP per military space |
| 13 | base | 13 VP |
| 14 | base | Gain a farm, then 1 VP per farm |
| 15 | base | Gain a market, then 1 VP per market |
| Technology 5 VP | P&P | Ongoing: 5 VP whenever you advance on technology |
| Science 5 VP | P&P | Ongoing: 5 VP whenever you advance on science |
| Military 5 VP | P&P | Ongoing: 5 VP whenever you advance on military |
| Monolith | P&P | Gain the Monolith landmark |

The 19 ids are already in `src/lib/art/catalog.js` (`space-tile/1` to `space-tile/15`, and `space-tile/technology-5-vp`, `science-5-vp`, `military-5-vp` and `monolith`), and the component library's Art area shows them as empty slots.

## 2. What the owner decided (2026-10-24)

- "Finish up issue #11 and push to main." The space tiles are drawn straight through, without stopping for approval, and #11 closes when they are in, as #9 did when the owner asked for it to be finished.
- The issue asks for "space scenes: stars, planets and alien landscapes".
- The rules of the earlier #11 pictures carry over (§8): style C, 64×64, full bleed, no lettering, no likeness of a real person, real religious and political signs allowed, explicit material allowed where the subject calls for it, parallel subagents, few buildings, and about 7/10 on detail (one clear hero, about 50 to 90 colours).

## 3. Goals

1. **19 pictures**, one for each space tile, each a full 64×64 space scene with its own sky and light.
2. **The scene hints at the benefit.** The benefit is not drawn (the interface shows it, as for the inspiration tiles), but each scene leans towards it: a space telescope for the science tile, a gold asteroid for coin and worker, a black hole for the 13 VP jackpot, a battle for military. A player who knows the tiles can tell what a tile does from across the table.
3. **Told apart at a glance.** Nine scenes are in deep space, eight on alien ground and two seen from orbit, and the light and colour vary: a violet galaxy, a teal day, an amber gas giant, a red giant sun, hard white sunlight, a magenta dusk, gold city lights, an orange star, green-gold twin suns, a red nebula, a pale dawn.
4. **A hex frame can trim it.** The physical tiles are hexagons, and the frame that will show them is not designed yet (#47 and the income tab, #35). The hero stays out of the four corners, about 12 pixels in from each corner along the diagonal, so a hexagonal frame of either orientation trims only sky, space or ground.

## 4. Non-goals

- **Benefits.** No icons or numbers on the picture; the interface shows them.
- **The tile frame** and where explored tiles sit next to the income mat (#35, #47).
- **Tile effects.** The rules engine has the base tiles' data (#12); #17 explores them and #32 adds the P&P tiles.
- **The space-tile back** and the space-tile game symbol (`symbol/space-tile`). #5 decided that game symbols use text or later artwork.

## 5. Anti-goals

- **Copying Stonemaier's tile art**, a famous photograph of space (the Pillars of Creation, Earthrise, the Pale Blue Dot), or a famous film still (the moon excavation or the apes round a monolith).
- **Lettering.** No words, letters or numbers. The carved frieze shows pictures, the containers carry colours, not codes.
- **Real people.** No likeness of a real person. Astronauts' faces stay behind their visors.
- **Real national flags on spacecraft.** They would make one country the explorer. Banners and hull marks are plain shapes and colours.
- **A building as the subject.** A station or a ship may be the hero; a city is lights seen from orbit.
- **A repeat** of an earlier picture (§6.3) or of another space tile.

## 6. Design

### 6.1 Files and checks

- **Files.** One drawing per tile at `art/drawings/space-tile/<slug>.js`, exporting `draw()`, built to `static/art/space-tile/<slug>.svg` by `npm run art`. The library page picks it up by itself.
- **Tests.** `tests/art-space-tile.test.mjs`, written before the drawings, as for the landmark cards: every space tile paints all 4,096 pixels; no two are the same; every space tile of each finished set is drawn (`FINISHED = ['base', 'pp']`).

### 6.2 The pictures

- **Composition** as in the Lighthouse and the earlier sets: the background on a layer, the hero and any figures on a foreground canvas, `outline(scene, PALETTE.ink)`, `underlay(scene, layer)`, then glows, stars and beams that skip the outline.
- **Space is not flat black.** Deep space is a gradient from `night` through the night-sky blues, or a nebula's colour, with stars in two or three brightnesses and a few four-point sparkles. Each deep-space tile gets its own tint, so they don't blur together.
- **Detail at 7/10**: the hero gets a base tone, a shade, a highlight and some texture (panels, rivets, craters, bands, grain); the setting gets a gradient or simple texture and at most two or three small props.

| Tile | Subject (the builder may refine) | Light |
|---|---|---|
| 1 Science | A space telescope: a gold mirror of hexagonal segments on a five-layer silver sunshield, floating before a violet and pink spiral galaxy | deep space, galaxy glow |
| 2 Armory | A fallen colossus: the huge helmeted head of an alien warrior statue toppled and half sunk in orange dunes, its broken spear beside it, two small moons in the sky | alien day, teal sky |
| 3 House | An explorer in a white suit on a blue ice field, helmet lamp lit, beside a planted marker pole, looking up at a banded amber gas giant (no rings) that fills half the sky | the gas giant's amber light on ice |
| 4 Tapestry | A canyon wall carved with a great frieze of alien pictures: stars, spirals, long-necked beasts and a procession of figures, lit by a huge low red sun | red giant sun |
| 5 Coin and worker | A gold-veined asteroid split open, a small mining drone with a headlamp drilling at the gold, other rocks of the belt drifting behind | hard white sunlight, black space |
| 6 Research | A comet close up: its dark icy nucleus venting bright jets, the glowing coma round it and a long tail streaming away from a far sun | blue-white on deep navy |
| 7 Food and culture | An alien tree hung with glowing fruit pods by a pink lake, a long-necked grazer reaching for the fruit | magenta dusk, bioluminescence |
| 8 Capital | The night side of a planet webbed with gold city lights, a thin blue crescent of dawn on its rim and the sun about to rise over it | black, gold, blue rim |
| 9 Technology | A Dyson lattice: an orange star half wrapped in a hexagonal frame of solar panels, a few panels still flying in to their places | the star's orange glow |
| 10 Invent and upgrade | A vast derelict alien ship drifting, its hull torn open on a lit interior of strange machinery, debris tumbling away | cold blue-grey, green glow inside |
| 11 Conquer | Planetfall from high above: a wedge of drop pods plunging on fiery trails into the clouds of an ochre desert world | orange entry fire |
| 12 Military | A broadside: two warships trading beams above a cratered grey moon, an explosion blooming on one hull | grey moon, red and green beams |
| 13 13 VP | A black hole with a blazing gold accretion disc, its light bent over the top and under the bottom of the dark centre | gold and orange on black |
| 14 Farm | A field of tall blue-green alien grain with round seed heads, two suns setting together behind low hills | green-gold twin sunset |
| 15 Market | A convoy of cargo freighters with stacked coloured containers cruising past a teal nebula towards a far station's lights | teal nebula |
| Technology 5 VP | A space elevator seen from the ground: a cable rising from its anchor platform on an alien plain straight up into a violet sky, a climber car halfway up, the station a bright point far above | violet dusk |
| Science 5 VP | A six-wheeled science rover drilling a blue crystal rock on a sulphur-yellow moon, a volcano's plume rising behind | yellow ground, dark sky |
| Military 5 VP | Three arrowhead starfighters in formation diving out of a red nebula towards the viewer, engines blazing | red nebula |
| Monolith | The black Monolith standing in the shallows of a glassy alien sea at dawn, three moons in a pale sky and its reflection broken by ripples | pale dawn |

### 6.3 Not a repeat

Several earlier pictures are already set in space. The tiles keep clear:
- **No ringed planet.** The Aliens portrait and Astral Expeditions both have one. Tile 3's gas giant is banded, with no rings.
- **The Monolith tile** is the slab in a dawn sea, not the slab on a night plain with a lone figure (landmark/monolith).
- **Tile 8** is a planet's night side and its city lights, not the cloud-swirled blue day side beside the white ark (tapestry/generation-ships).
- **Tile 6** is the comet's nucleus close up, not a comet in the sky over an observatory (tapestry/astronomy).
- **Tile 1** is a space telescope in orbit, not the brass telescope on a hilltop (tech/telescope) or the observatory (tapestry/astronomy).
- **Technology 5 VP** is a cable, not a rocket (tapestry/space-race, landmark/launch-pad).
- **Science 5 VP** is a rover, not the moon lander and its flag (tapestry/moon-landing).
- **Tile 2** is an alien colossus fallen in teal-sky dunes, not the upright statue with a staff beside the pyramid (tapestry/age-of-wonders).
- **Tile 7** is an alien tree and grazer by a lake, not the mushroom ring in a dark forest (civ/faefolk), and it has no crystals (civ/aliens).
- **Tile 10** is a broken alien hull, not the white ark with its ring of windows (tapestry/generation-ships).
- **Tile 12 and Military 5 VP** differ in scale and colour: two big warships over a grey moon against three small fighters in a red nebula. Neither is the battleship at sea (tech/warships).
- **No saucer** (civ/aliens, tapestry/alien-disclosure) and **no terraced red mountain** (tapestry/terraforming).
- **Tile 5** is raw gold in rock, not coins (tech/treasury).

### 6.4 Palette and parts

- **Colours.** New tones are blended with `mix()` inside a drawing, so drawings made side by side never edit a shared file.
- **Parts.** No new scene parts. Existing parts (sky, terrain, figure) may supply settings.

### 6.5 Work and review

1. **The checks first**, test-first.
2. **Side-by-side drawing:** seven subagents draw two or three tiles each, grouped so that look-alike subjects sit with one builder who keeps them apart: tile 12, Military 5 VP and tile 10 (ships); tile 1 and Science 5 VP (science); tile 9, Technology 5 VP and tile 13 (technology and a star's glow); tiles 8, 11 and 15 (worlds seen from orbit, and trade); tiles 2 and 4 and the Monolith (ancient alien remains); tiles 3, 7 and 14 (alien worlds with life); tiles 5 and 6 (rocks in space). They write only their own drawing files.
3. **A fresh review** of all 19 at 1× and 4×, side by side and beside the earlier space pictures, against this design (benefit hinted, hero out of the corners, no lettering, no likeness, no repeats, detail near 7/10), and its findings are fixed.
4. **One commit** for the checks, the drawings and their SVGs ("Fix #11: draw the 19 space tiles"), pushed to main, which closes #11.

### 6.6 As drawn

The builders refined some subjects at 1× and 4×:
- **Tile 1:** the sunshield's five sheets fan out in a V, because evenly stacked sheets read as a solid tray.
- **Tile 2:** the helmet's crest is a fan across it, because a single fin read as a horn once the head was tipped. The head lies at about 22°, the steepest angle at which the face still reads at 1×.
- **Tile 5:** the asteroid is two pieces with space between them, because a crack alone didn't read at 1×.
- **Tile 6:** the nucleus has two lobes, so it doesn't echo tile 5's rock.
- **Tile 7:** the tree's crown is drooping fronds, because a flat dome read as a mushroom (civ/faefolk).
- **Tile 8:** the sun peeks over the rim at the right, and the dawn crescent fades faster than real sunlight would, so it doesn't run round the whole planet.
- **Tile 11:** only the pods have ink outlines, because outlined fire looked like carrots.
- **Tile 12:** all beams are diagonal with one clear crossing, and the gunship's bridge sits aft in a stepped superstructure, because a mid-hull tower read as a submarine.
- **Tile 13:** the disc is tilted and brighter on the left, with no ink outline, so it reads as light round a hole, not a ringed planet.
- **Tile 14:** the round seed heads became ears of round seeds, because single round heads read as balloons or lamp posts.
- **Tile 15:** the freighters have a spine with containers clamped above and below, because a boat-shaped hull read as a sea cargo ship. The station is a cross, not a ring, to stay clear of the Generation Ships ark.
- **Technology 5 VP:** the cable has no ink outline and the climber is clamped onto it, because the first versions read as a TV tower and then a saucer.
- **Science 5 VP:** the crystal is made of hard-edged six-sided columns, because a rounded lump read as a drop.
- **Military 5 VP:** the plumes are short, because long trails looked like strings hanging the fighters from a lamp.
- **Monolith:** no figure and nothing lined up over the slab, to stay clear of the landmark's scene and the film still.

The fresh review then had these fixed:
- **Tile 4:** the top band of the frieze read as typed characters ("+ @ * ☼ +"). It is now a scattered sky: a comet, a two-armed spiral galaxy, a crescent and single stars at uneven gaps and heights. The procession is seen side on, with varied heights, poses and gaps, and the sun's two spots, which read as eyes, are one diagonal group.
- **Tile 8:** the city lights were thick gold outlines that read as a wireframe or a constellation map, close to tile 9's lattice. They are now single-pixel lights in three brightnesses, densest round the capital and along a river and a coast, with three dim broken roads.
- **Technology 5 VP:** the elevator was too small to be the hero, and the climber's 2×3 lit windows read as a die showing six. The cable is now 2 px wide, 3 px near the ground, and the climber is centred on it with one wide window band. The anchor is 36 px wide.
- **Tile 9:** the star read as a honeycomb planet and the flying panels as moons. The panels now cover about 40% of it, the open face is white and yellow with a hot orange limb and a prominence, and the incoming panels are hexagons with motion streaks.
- **Tile 10:** the breach read as crystal shards, and its strokes formed letter-like marks. It is now a bite torn out of the ridge, with two ribs across it, a blazing round core and a conduit of lit nodes.
- **Tile 2:** the spear, teal like the sky, read as a fish. It is dark bronze with a pale leaf-shaped head and jagged breaks.
- **Tile 7:** the lake has a shoreline, the hills mirrored in it and broken streaks of moon and pod light, and the grazer's legs have knees and splayed feet.
- **Tile 3:** the reflection's even dashes read as lines of text. They are now long streaks of varied length broken by ice cracks, and the visor tilts up to the giant.
- **Military 5 VP:** the wingmen, which read as bats, are smaller copies of the leader, and every engine has a 3 px flame cone.
- **Science 5 VP:** the pale blue plume read as a fountain. It is now an umbrella of sulphur-lit ash.
- **Tile 14:** the ears are slimmer, upright and curling over, with gold awns, and the straight bar at the top is a cloud streak.
- **Corners:** the heroes of tiles 1, 2, 3, 7, 12 and 15 were moved or trimmed so that each sits inside both a flat-top and a pointy-top hexagon. Only sky, space, ground, exhaust and trail ends reach the corners.

## 7. Changes to other documents

- **`docs/art/README.md`:** `tests/art-space-tile.test.mjs` beside the other full-bleed checks.
- **CLAUDE.md:** #11 under "Where the work stands": done, with the space tiles drawn.

## 8. Calls made in this document (not yet confirmed by the owner)

- "Finish up" read as drawing the space tiles under the rules and process of the earlier #11 pictures, then closing #11.
- Each scene hints at its tile's benefit (§3).
- Full bleed 64×64 like the other illustrations, with the hero kept out of the corners for a hexagonal frame (§3).
- No national flags on spacecraft (§5).
- Every subject and light in §6.2.
- No new scene parts.
