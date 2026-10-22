# Tech cards: 56 illustrations (#10): design

Written 2026-10-22. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)) and follows the tapestry pictures from #9 ([2026-10-22-tapestry-cards-design.md](2026-10-22-tapestry-cards-design.md)) and the civilization portraits from #8 ([2026-10-22-civilization-portraits-design.md](2026-10-22-civilization-portraits-design.md)).

## 1. What and why

Every tech card gets **one 64×64 style C picture**. It is the card's picture on screen: the frame (#47) puts the card's name, its circle and square benefits and its prerequisite around it.

| Set | Cards |
|---|---|
| Base | 33 (6 of them landmark cards) |
| Arts & Architecture | 11 |
| Fantasies & Futures | 12 |
| **Total** | **56** |

The ids are already in `src/lib/art/catalog.js` (`tech/<slug>`), and the component library's Art area already shows all 56 as empty slots, split by expansion.

## 2. What the owner decided (2026-10-22)

- **The same rules as the tapestry pictures and the portraits** ("follow what we did for the rest of the assets rules wise"): style C, 64×64, full bleed, no lettering, no likeness of a real person, real religious and political signs allowed, explicit material allowed where the subject calls for it, the same checks and the same review place.
- **The first 10 come first.** They are the first 10 base cards in catalog order: Air Conditioning, Ammonia, Anesthesia, Assembly Line, Bakery, Barn, Calendar, Canned Food, Clocks and Com Tower. The owner reviews them before any other tech card is drawn.
- **The invention is the hero.** A tech picture shows the invention itself, up close and large, like the issue's example of a brass compass on an unrolled map, lit by a lantern. A tapestry picture shows a wide scene; a tech picture shows a thing.

## 3. Goals

1. **10 pictures now**, one for each of the first 10 base cards, each a full 64×64 picture with its own setting and light.
2. **One invention per card, large in the frame**, so a player can tell the cards apart at a glance in a row of tech cards.
3. **Varied settings.** Not every invention sits on a table in a room. Across the 10, the settings run from a sun-baked wall to a polar camp, a factory floor and an operating theatre, and the light runs through day, dawn, dusk and night.
4. **Room for the other 46.** The first 10 keep clear of the subjects that later cards need (§6.4).

## 4. Non-goals

- **The other 46 tech cards.** Their subjects are added to this document after the owner has reviewed the first 10, and they are drawn after that.
- **The card frame**, and how the name, the benefits and the prerequisite sit around the picture. That is #47.
- **Card effects.** The rules engine encodes them (#18, #37, #40).
- **The innovations on the income mat** ("Farming", "Breeding", "Telephone" and the rest). They belong to the income mat (#6).

## 5. Anti-goals

- **Copying Stonemaier's card art.** Each picture is our own reading of the card's name.
- **Lettering.** No words, numbers or letters, including on labels, dials, gauges and packaging. Dials and gauges show tick marks only; labels show pictures.
- **Real people.** No likeness of a real person, including inventors.
- **A repeat.** No tech picture repeats a tapestry picture or a portrait (§6.3), and no two tech pictures look alike.
- **A lost invention.** The invention is large and lit. People appear only to show it in use or for scale.

## 6. Design

### 6.1 Files and checks

- **Files.** One drawing per card at `art/drawings/tech/<slug>.js`, exporting `draw()`, built to `static/art/tech/<slug>.svg` by `npm run art`. The library page picks it up by itself.
- **Size and bleed.** 64×64, every pixel painted.
- **Tests.** `tests/art-tech.test.mjs`, written before the drawings, as for the portraits: every tech picture paints all 4,096 pixels; no two tech pictures are the same; every card of each finished set is drawn (`FINISHED` grows with each set). While only the first 10 exist, one more test names them, so none can be missing when they go to the owner.

### 6.2 The landmark cards reuse their landmark

Six base tech cards are landmarks: Bakery, Barn, Com Tower, Library, Stock Market and Treasury. Three of them are in the first 10. As the issue allows, each shows **its landmark's picture from #7**, so the card and the building in the capital look the same.

- The drawing imports the landmark's `draw()` and returns it, or a 64×64 crop of it when the landmark is larger.
- **Bakery** (2×2, 64×64): the landmark picture as it is.
- **Barn** (3×3, 96×96): the crop with its top-left at (8, 22). It holds the whole barn, from the roof to the fence, with a hay bale and the edge of the silo.
- **Com Tower** (3×2, 96×64): the crop with its top-left at (10, 0). It holds the whole tower, its signal rings, the whole moon and the city lights.
- The builder may move a crop by a pixel or two to show what it describes.
- A crop helper, `crop(canvas, x, y, w, h)`, goes into `art/painter.js` with a test, because the later Library card needs it too.
- If a landmark picture changes, its card changes with it. The no-twins test compares tech pictures only with each other, so a card matching its landmark is fine.

### 6.3 The pictures

- **Framing.** The invention fills roughly half the frame or more, close to the viewer, with its setting behind it. It gets the outline pass; the background comes from the scene parts.
- **Composition.** As in the Lighthouse and the earlier sets: the background on a layer, the invention and any figures on a foreground canvas, `outline(scene, PALETTE.ink)`, `underlay(scene, layer)`, then glows and details that skip the outline.
- **Era follows the invention.** Each picture is set when its invention was new: the calendar in the ancient world, anaesthesia in a 19th-century operating theatre, the assembly line in an early motorcar factory.
- **Light follows the setting and the mood**, as in #9: day for the hopeful and the everyday, dawn and dusk for industry and turning points, night for lamplit work, and interiors with a window or lamp.
- **Dawn uses the dusk sky**, as the Riverfolk portrait did; the sky part has no dawn of its own.
- **Snow** for the Canned Food camp is painted inside that drawing from the palette's `snow` and `snowShade`; there is no snow ground part.

**The first 10 (base game)**

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Air Conditioning | A boxy window air-conditioning unit set in a sun-baked brick wall, cool blue air curling out of its grille, heat shimmering off the street and a wilting plant on the sill beside it | day, hot |
| Ammonia | A riveted steel pressure reactor with pipes, valves and a gauge, a burlap sack of white fertiliser pellets spilling at its foot, rows of lush green crops beyond | dusk |
| Anesthesia | An ether inhaler (a glass globe with a brass mouthpiece) and a tray of surgical tools in the foreground, a patient asleep on the table behind under a lamp, the tiered benches of an old operating theatre in shadow | interior, night |
| Assembly Line | A conveyor belt carrying a row of identical early motorcar bodies across the frame, workers in caps fitting the wheels, a chain hoist overhead and tall factory windows behind | interior, day |
| Bakery | The Bakery landmark (§6.2) | day |
| Barn | The Barn landmark, cropped (§6.2) | day |
| Calendar | A round stone calendar disc, carved with a sun face at the centre, a ring of moon phases and a ring of tally notches, set in a temple wall and lit by the rising sun | dawn |
| Canned Food | An open wooden supply crate of tin cans with picture labels (a fish, a pea pod, a tomato) in the snow beside an expedition tent, one can opened with a hammer and chisel and steaming | day, polar |
| Clocks | An open gold pocket watch close up on dark velvet, its lid raised over the dial and the back opened on its gears and balance wheel, the chain coiled beside it, by lamplight | interior, night |
| Com Tower | The Com Tower landmark, cropped (§6.2) | night |

### 6.4 Not a repeat

Several of the first 10 sit close to earlier pictures, or to tech cards still to come. They keep clear:
- **Clocks** is a pocket watch, not the clockmaker with a wall of clocks and a longcase clock (civ/tinkerers), the clock tower (landmark/clock-tower), or the clocks in the sky (tapestry/deja-vu).
- **Anesthesia** is about sleep and surgery: its glass globe must not read as the flask bench of Empiricism (tapestry/empiricism), and it is not the plague doctor (tapestry/plague).
- **Assembly Line** is an indoor line of motorcars, not the cannon works under searchlights (tapestry/wartime-economy) or the brick factories outside (tapestry/industrialism). The robots of Automation (an A&A tech card) stay for that card.
- **Ammonia** is a reactor by a field, not a mine (tapestry/coal-baron), oil derricks (tapestry/oil-magnate) or a granary (tapestry/socialism).
- **Calendar** is a carved disc close up, not a temple in rays of light (tapestry/theocracy) or a wonder of the desert (tapestry/age-of-wonders). Telescope and Astrolabe, still to come, keep the stars and instruments.
- **Canned Food** keeps clear of the food subjects still to come: the Bakery's shop front and the farm of Irrigation.
- **Light Bulb, Radio, Transistors and Time Travel** stay for their own cards, so none of the first 10 shows a bulb, a radio set, a circuit or a time machine as its subject.

### 6.5 Palette and parts

- **Colours.** New tones are blended with `mix()` inside a drawing, as in #8, so drawings made side by side never edit a shared file.
- **Parts.** No new scene parts. Each invention is drawn in its own module; existing parts (sky, terrain, buildings, interior, figure, crowd, smoke, factory, street) supply the settings. The only shared addition is `crop` (§6.2).

### 6.6 Work and review

1. **The checks and the crop helper first**, test-first, with the three landmark cards.
2. **A reference picture: Clocks.** It is the purest close-up of an object, and sets the scale and finish the others follow.
3. **Side-by-side drawing:** subagents draw the other six, two or three each. They write only their own drawing files.
4. **A fresh review:** a reviewer who drew none of them looks at all 10 at 1× and 4× against this design (invention readable, no repeats, no lettering, no likeness, full bleed), and its findings are fixed.
5. **One commit** for the drawings and their SVGs ("Refs #10: draw the first 10 tech cards"), pushed to main, then the owner reviews the 10 in the component library (`/components.html#art-parts`). #10 stays open.

## 7. Changes to other documents

- **`docs/art/README.md`:** `crop` in the painter's row, and `tests/art-tech.test.mjs` beside the other full-bleed checks.
- **CLAUDE.md:** #10 under "Where the work stands": the first 10 drawn and waiting for the owner.

## 8. Calls made in this document (not yet confirmed by the owner)

- "First 10" means the first 10 base cards in catalog order.
- Every subject and light in §6.3.
- The landmark cards reuse their landmark picture, with the crops in §6.2.
- No new scene parts; only the `crop` helper.
- Clocks as the reference picture.
- The Barn and Com Tower crop points, and dawn on the dusk sky.
- The other 46 subjects are written after the owner's review, not now.
