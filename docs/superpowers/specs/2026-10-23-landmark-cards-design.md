# Landmark cards: 10 illustrations (#11): design

Written 2026-10-23. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)) and follows the landmarks (#7, [2026-10-21-landmarks-design.md](2026-10-21-landmarks-design.md)), the tech cards (#10, [2026-10-22-tech-cards-design.md](2026-10-22-tech-cards-design.md)) and the masterpieces ([2026-10-23-masterpieces-design.md](2026-10-23-masterpieces-design.md)).

## 1. What and why

Every landmark card gets **one 64×64 style C picture**. The card frame (#47) puts the card's name, its goal and the landmark's footprint around it.

There are 10 landmark cards, the personal goals of Plans & Ploys and Arts & Architecture (research 03 §1.6 and §2.10). At the end of your turn, if you meet your card's goal, you gain its landmark:

| Set | Card | Goal at the end of your turn |
|---|---|---|
| P&P | Game Store | at least 1 tech card in your top row |
| P&P | TV Station | at least 3 income buildings of the same type in your capital |
| P&P | Digital Studio | at least 2 complete districts in your capital |
| P&P | Skyscraper | at least 1 complete row or column in your capital |
| P&P | Urban Farm | at least 6 territory tiles in your supply |
| A&A | Villa | at least 3 different types of income buildings in your capital |
| A&A | Birdwatching Perch | at least 3 tech cards invented |
| A&A | Castle | you moved this turn into a tier whose landmark was already taken |
| A&A | Windmill | tier II or higher on at least 2 advancement tracks |
| A&A | Bridge | you control 3 territories adjacent to your starting territory |

The 10 ids are already in `src/lib/art/catalog.js` (`landmark-card/<slug>`), and the component library's Art area shows them as empty slots. Each landmark already has its own picture (`landmark/<slug>`, #7), drawn in its footprint's shape, which the capital grid shows.

#11 also covers the 19 space tiles and the inspiration tiles. They are not part of this design (§4).

## 2. What the owner decided (2026-10-23)

- **The landmark cards now:** "work on the landmark cards now. push to main when done."
- **Only artwork again**, as for the masterpieces: the pictures, their checks and their notes, no other work.
- The masterpieces' rules carry over (§8): style C, 64×64, full bleed, no lettering, no likeness of a real person, real religious and political signs allowed, explicit material allowed where the subject calls for it, parallel subagents, few buildings, and about 7/10 on detail (one clear hero, about 50 to 90 colours).

## 3. Goals

1. **10 pictures**, one for each landmark card, each a full 64×64 picture with its own setting and light.
2. **The life of the landmark is the hero, not its outside.** The landmark picture (#7) already shows each building whole. The card shows what happens there, close up: the game on the store's table, the camera in the studio, the gears inside the mill. The building is only the setting, seen in part or from inside. This follows the owner's rule for the tech cards that are landmarks ("the landmark cards show their invention, not their landmark", #10) and the "few buildings" rule.
3. **The card still says its landmark at a glance.** A player who knows the landmark pictures can match each card to its landmark.
4. **Told apart at a glance.** Settings and light vary across the 10: lamplight, studio light, screen glow at night, a high morning, golden afternoon, a misty dawn, torchlit dusk, sunbeams in a mill, bright day under an arch.

## 4. Non-goals

- **The 19 space tiles and the inspiration tiles.** They are the rest of #11 and get their own design.
- **The landmark pictures** (#7). They stay as drawn.
- **The card frame**, the goal text and the footprint drawing on the card (#47).
- **Card effects.** The rules engine encodes them (#32, #37).

## 5. Anti-goals

- **Copying Stonemaier's card art**, or a famous real photograph (no "lunch atop a skyscraper").
- **Lettering.** No words, letters or numbers: game boxes, screens, the on-air light and dials are blank or show pictures.
- **Real people.** No likeness of a real person.
- **The landmark's outside as the subject**, or a repeat of its landmark picture.
- **A repeat** of an earlier picture (§6.3) or of another landmark card.

## 6. Design

### 6.1 Files and checks

- **Files.** One drawing per card at `art/drawings/landmark-card/<slug>.js`, exporting `draw()`, built to `static/art/landmark-card/<slug>.svg` by `npm run art`. The library page picks it up by itself.
- **Tests.** `tests/art-landmark-card.test.mjs`, written before the drawings, as for the masterpieces: every landmark card paints all 4,096 pixels; no two are the same; every landmark card of each finished set is drawn (`FINISHED = ['pp', 'aa']`).

### 6.2 The pictures

- **Composition** as in the Lighthouse and the earlier sets: the background on a layer, the hero and any figures on a foreground canvas, `outline(scene, PALETTE.ink)`, `underlay(scene, layer)`, then glows and details that skip the outline.
- **Detail at 7/10** (§2): the hero gets a base tone, a shade, a highlight and some texture; the setting gets a gradient or simple texture and at most two or three small props. No crowds.
- **People** appear only where the subject needs hands at work (Game Store, Digital Studio, Urban Farm) or one worker (Skyscraper, a rower under the Bridge). They use the palette's three skin pairs, and across the set they vary.
- **Colours** echo the landmark picture where they can (the Game Store's brick and lit window, the TV Station's grey and blue, the Villa's white and terracotta), so the card and the landmark feel like one place.

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Game Store | A player's hand letting go of two dice over a board game in play on the store's demo table: a map of hex tiles, wooden pieces and a fan of cards. Shelves of colourful game boxes behind, all blank | interior, warm lamplight, evening |
| TV Station | A big studio camera on its wheeled pedestal, its red tally light lit, aimed across the dark studio floor at a bright, empty news desk; lights hang from a grid above and cables snake over the floor | interior, studio light |
| Digital Studio | An artist's hand drawing with a stylus on a glowing tablet; a wide monitor above shows the pixel-art landscape being drawn, with headphones and a mug on the desk in a dark room | night, screen glow |
| Skyscraper | An ironworker in a hard hat balanced on a high steel girder, catching a glowing hot rivet in a tin cone; the street grid tiny far below, another girder rising beside him | day, high morning |
| Urban Farm | Gloved hands picking ripe tomatoes off the vine in a raised bed on a city roof, a basket of greens and a watering can beside; water tanks and chimney pots behind | morning |
| Villa | A table on the villa's terrace under a vine-covered pergola: grapes, bread, olives and a carafe of wine on a linen cloth, the view over rolling hills and cypresses; a white column and terracotta pots at the edge | golden afternoon |
| Birdwatching Perch | From inside the wooden hide: brass binoculars resting on the plank sill of the viewing slot, and through it a grey heron landing in the reeds of a misty pond | dawn |
| Castle | The drawbridge coming down over the moat, its chains taut, torches flaring on either side of the gate arch, the raised portcullis's teeth above | dusk |
| Windmill | Inside the mill: the great wooden brake wheel turning, its cogs meshing a lantern gear, the millstone below and flour pouring down a chute into a sack, sunbeams in the flour dust | interior, day |
| Bridge | From under the bridge: the ribbed stone vault of the arch frames the bright river and the far bank; a rowing boat glides through, swallows dart under the arch | day |

### 6.3 Not a repeat

Several cards sit close to earlier pictures. They keep clear:
- **Each card** keeps clear of its own landmark picture: no whole shopfront, broadcast building, studio block, tower, greenhouse, villa, hide on stilts, castle on a hill, windmill in fields or bridge seen from the bank.
- **Game Store** is a wooden board game on a demo table, not the Gamblers' felt, chips, cards and whiskey at night (civ/gamblers).
- **TV Station** is the studio camera, not the microphone under a spotlight (tech/microphone), the film projector (masterpiece/motion-picture) or the spy's radio set (civ/spies).
- **Digital Studio** is one artist at a tablet, not a dark room of green screens and server racks (tapestry/information-age) or the scientists' monitors (tapestry/superpower-regulators).
- **Skyscraper** is a worker on a girder, not the tower crane over an overpass (tapestry/infrastructure-upgrade) or the glass towers (tapestry/technocracy).
- **Urban Farm** is hands picking tomatoes on a roof, not the farmers at the grange hall (tapestry/granges), the crops behind the reactor (tech/ammonia) or the topiary gardener (masterpiece/topiary).
- **Villa** is a rustic terrace table in the afternoon, not the plated fillet by candlelight (masterpiece/haute-cuisine) or the painted villa wall (masterpiece/fresco).
- **Birdwatching Perch** is binoculars and a heron, not the telescope on a hill (tech/telescope) or the reed boat in the dawn mist (civ/riverfolk).
- **Castle** is the drawbridge close up, not the fortress on a hill (tapestry/militarism), the throne room (tapestry/monarchy) or the far castle down the road (tapestry/quest-culture).
- **Windmill** is wooden gearing and a millstone, not the pithead's winding wheel (tapestry/coal-baron), the brass gears of the clocks and machines (tech/clocks, tech/calculus, tapestry/steam) or the bread (tech/bakery).
- **Bridge** is the view from under the arch, not the keystone lowered onto timber centering (tapestry/engineering), the soldiers crossing (tapestry/retreat), the schemers on a moonlit bridge (tapestry/double-cross), the timber trestle (tapestry/steam-tycoon) or the reed boat (civ/riverfolk).

### 6.4 Palette and parts

- **Colours.** New tones are blended with `mix()` inside a drawing, so drawings made side by side never edit a shared file.
- **Parts.** No new scene parts. Existing parts (sky, terrain, interior, figure, wheel, sea, skyline, street) may supply settings.

### 6.5 Work and review

1. **The checks first**, test-first.
2. **Side-by-side drawing:** five subagents draw two cards each, paired so that look-alike subjects sit with one builder who keeps them apart: Game Store and Digital Studio (a table and a desk, indoors); TV Station and Skyscraper (the 20th century at work); Urban Farm and Villa (food in the open air); Birdwatching Perch and Bridge (water seen from shelter); Castle and Windmill (timber and iron mechanisms). They write only their own drawing files.
3. **A fresh review** of all 10 at 1× and 4×, beside their landmark pictures, against this design (landmark readable, no lettering, no likeness, no repeats, detail near 7/10), and its findings are fixed.
4. **One commit** for the drawings and their SVGs ("Refs #11: draw the 10 landmark cards"), pushed to main. The owner reviews them in the component library (`/components.html#art-parts`). #11 stays open for the space tiles and inspiration tiles.

### 6.6 As drawn

The builders refined some subjects at 1× and 4×:
- **Game Store:** the game boxes lie flat in stacks, because upright boxes read as books. A brass lamp hangs over the table.
- **TV Station:** the camera is seen in profile, with its vents as a grid of dots, because slotted vents looked like a label. A globe drawn in lines of light fills the blue backdrop.
- **Digital Studio:** the picture on the monitor still has a pencil-sketch corner on white, to show it is being drawn, and a column of colour swatches stands in for the app's tools.
- **Skyscraper:** the rising girder is a riveted column the worker grips with his other hand, and all the steel is red primer.
- **Urban Farm:** one gloved hand, not two, because two hands crowded the frame.
- **Villa:** no people. The carafe's glass shows the view through it.
- **Castle:** the gate is seen head-on, with the bridge nearly down over a stone pier on the near bank.
- **Windmill:** the brake wheel has paired clasp arms instead of spokes, which keeps it apart from the water wheel in tech/irrigation.
- **Bridge:** the arch is a little flattened so its ribs show. The arch's reflection in the dark water and the light rippling up onto the stone make it read as a bridge, not a tunnel. The parapet is left out, because it can't be seen from below.

The review then had seven things fixed:
- The Urban Farm glove turned palm-up under the tomato, in tan suede, because the cream glove under the tomato read as a mushroom.
- The Digital Studio stylus turned round so its nib touches the line, pinched between thumb and index finger.
- The Game Store's cards show closed shapes (discs, a tree, a diamond), because hooked marks read as letters.
- The Birdwatching Perch binoculars were redrawn black with brass rings, in three-quarter view, because brown barrels read as pots. The heron got its eye and crest.
- The Castle passage got depth and a cool courtyard beyond, because the flat orange passage read as a fireplace.
- The Skyscraper city became dark streets running to a vanishing point in blue haze, and the cone became tin grey, so the height reads.
- The Windmill's flour stream was widened and its sack tied.

## 7. Changes to other documents

- **`docs/art/README.md`:** `tests/art-landmark-card.test.mjs` beside the other full-bleed checks.
- **CLAUDE.md:** #11 under "Where the work stands": the 10 landmark cards drawn and waiting for the owner.

## 8. Calls made in this document (not yet confirmed by the owner)

- "Only artwork again" read as the masterpieces' rules and process, including 7/10 on detail.
- The card shows the life of the landmark, not its outside (§3), carrying over the owner's rule for the tech cards that are landmarks.
- Every subject and light in §6.2.
- No new scene parts.
