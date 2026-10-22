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
- **Few buildings** (owner, 2026-10-22): "try not to use that many buildings. For example, Bakery would be better as newly discovered bread." No tech picture has a building as its subject, and the landmark cards show their invention, not their landmark (§6.2). A wall or a room may still stand behind an invention as its setting.

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

### 6.2 The landmark cards show their invention

Six base tech cards are landmarks: Bakery, Barn, Com Tower, Library, Stock Market and Treasury. Three of them are in the first 10. The issue allowed them to reuse their landmark's picture from #7, but the owner asked for the invention instead (§2), so each gets a picture of its own:
- **Bakery** is the bread itself, newly discovered.
- **Barn** is what the barn is for: livestock sheltered and bred (its innovation on the income mat is Breeding).
- **Com Tower** is the transmitting equipment up close, not the tower standing over a city.

The first plan reused the landmark pictures through a crop helper. It was removed when the owner changed this, because nothing else needs it.

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
| Bakery | A golden domed loaf of risen bread on a wooden peel, fresh from the glowing mouth of a clay oven, steam curling off it, a bowl of dough rising under a cloth and a sheaf of wheat beside it | firelight, night |
| Barn | A newborn calf in a bed of fresh straw beside its mother, a pitchfork and a milk pail by them, hay drifting down in a shaft of light | interior, day |
| Calendar | A round stone calendar disc, carved with a sun face at the centre, a ring of moon phases and a ring of tally notches, set in a temple wall and lit by the rising sun | dawn |
| Canned Food | An open wooden supply crate of tin cans with picture labels (a fish, a pea pod, a tomato) in the snow beside an expedition tent, one can opened with a hammer and chisel and steaming | day, polar |
| Clocks | An open gold pocket watch close up on dark velvet, its lid raised over the dial and the back opened on its gears and balance wheel, the chain coiled beside it, by lamplight | interior, night |
| Com Tower | A dish antenna and a cluster of aerials on a mast top, close up against the night sky, rings of signal pulsing out and a red warning light blinking | night |

**The next 10 (base game, owner asked for them on 2026-10-22: "do another 10", quickly, same rules, parallel agents)**

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Compass | A ship's binnacle close up on deck: the compass card under glass in a brass hood with side lamps, the ship's wheel and a blue sea behind | day |
| Concrete | A trowel smoothing wet grey concrete poured into timber formwork, steel rods sticking up, a turning mixer drum spilling more beside it | day |
| Dynamite | A bundle of red dynamite sticks tied with twine, its fuse fizzing with sparks, a plunger detonator box beside it on a rocky ledge | dusk |
| Eyeglasses | A pair of round wire spectacles held up before a blurred market street, the view through each lens sharp | day |
| Irrigation | A wooden water wheel lifting buckets from a river and tipping them into a channel that runs into green fields | day |
| Library | A great brass-cornered book chained to a slanted lectern, open on illuminated pages (pictures and ruled lines only), an oil lamp and a basket of scrolls beside it | interior, night |
| Light Bulb | A glowing filament bulb hanging from its cord in a brass socket, lighting a dark workshop, a snuffed candle stub below it | night |
| Lithium-Ion Battery | A cylindrical battery cell cut away to show its rolled layers, a bright spark arcing to its terminal, a charging cable coiled beside it | night, teal glow |
| Paper | A papermaker's wooden mould lifted dripping from a vat of white pulp, fresh sheets drying on lines behind | interior, day |
| Penicillin | A glass dish close up with a blue-green mould bloom and a clear ring around it, a dropper and test tubes on a sunlit lab bench | interior, day |

These keep clear of Cartography's night map table (Compass), the quarry of Exploitation (Dynamite), the study of Academia (Library), the Inventors' bulb held in a hand (Light Bulb), and Microbial Magic's microscope over glowing microbes (Penicillin).

**The last 13 (base game, 2026-10-22)**

The owner asked for the rest of the base set and for "something a tiny bit simpler": the style stays, the pictures get plainer.
- **One big subject**, about 60% of the frame or more, with at most two small props.
- **Plain backgrounds**: a sky gradient or a two-tone wall, with little texture and no crowds, clutter or busy patterns.
- **Flatter shapes**: each material gets a base tone, one shade and one highlight, rather than many blended tones; glows are used sparingly.
- **Fewer colours**: roughly 40 to 60 per picture, against 70 to 160 in the first 20.
- Everything else stays: the ink outline, light from one side, full bleed, palette colours and `mix()`, no lettering, no real people, no building as the subject.

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Printing Press | A wooden screw press, its platen raised over a freshly printed sheet (ruled grey lines only), an ink ball beside it | interior, day |
| Radio | A wooden arched cabinet radio with a glowing dial (ticks only) and a cloth speaker grille, sound waves rippling from it | interior, night |
| Sewage & Plumbing | A brass tap on a copper pipe pouring clean water into a basin, a valve wheel on the pipe | interior, day |
| Siegecraft | A wooden trebuchet close up, its arm swinging and a stone flying from the sling | dusk |
| Stock Market | A ticker-tape machine under a glass dome, a curl of tape (dots and dashes only) spilling out of it | interior, day |
| Telescope | A brass telescope on a wooden tripod on a hilltop, aimed at a large moon in a starry sky | night |
| The Nail | A hammer driving an iron nail into a plank, a few nails lying beside it | day |
| Time Travel | A brass time machine seat with a great spinning ring of dials around it, crackling with violet light | night |
| Transistors | A green circuit board close up with three-legged transistors standing on it and glowing traces | night |
| Treasury | An open iron-bound strongbox heaped with gold coins and a gold bar, lit by a lamp | interior, night |
| Vaccines | A glass syringe and two small vials on a white tray | interior, day |
| Warships | A steel battleship at sea firing its guns, smoke and splashes around it | day |
| Zeppelins | A huge silver airship above the clouds, its gondola beneath | day |

Stock Market and Treasury are landmark cards and show their invention, not the building. These keep clear of Astronomy's observatory dome (Telescope), Temporal Nomadism's hourglass portal and Déjà Vu's clocks (Time Travel), the sailing ships of the tapestry cards (Warships), Cloud Colonies' floating islands (Zeppelins), Com Tower's dish (Radio), and Penicillin's dish and Anesthesia's inhaler (Vaccines).

**Arts & Architecture (11) and Fantasies & Futures (12), 2026-10-22**

The owner asked for the rest "according to these rules": the simpler rules of the last 13 apply to all 23. The F&F powers each get their own glow colour, so the magic cards don't all turn violet.

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Astrolabe | A brass astrolabe held up against the stars, its pierced rete and pointer catching the light | night |
| Automation | A jointed steel robot arm lifting a gear off a moving belt | interior, day |
| Calculus | A brass calculating machine of gears and a crank, a paper strip of plain dashes curling out | interior, day |
| Duct Tape | A silver roll of tape, a strip wrapped round a cracked pipe to stop a leak | day |
| Jet Fuel | A jet engine close up, its fan in the cowl, a blue-orange flame and heat shimmer behind | day |
| Microphone | A chrome studio microphone on a stand under a spotlight | night |
| Oil Paint | An artist's palette with squeezed blank tubes and a loaded brush | interior, day |
| Opera | Opera glasses on a red velvet box ledge, the lit stage far below | interior, night |
| Public Art | A bright abstract sculpture, a looped steel ribbon on a plinth in a sunny park | day |
| Suburbs | A blank mailbox by a white picket fence and a striped lawn with a sprinkler, small rooftops behind | day |
| War College | A war-game table: a terrain model with toy soldiers, little blank flags and a pointer | interior, day |
| Golem Minions | A hulking clay golem striding forward, amber light in its eyes and a plain glowing mark on its chest | dusk |
| Levitation | A heavy stone block floating above the ground, a rope trailing, small rocks hovering in a violet glow | dusk |
| Mind Control | A brass helmet with an antenna on a stand, green spiral waves pulsing from it | night |
| Object Cloning | A machine with two glass chambers, an apple in each, one a glowing pink copy of the other | interior, night |
| Perfect Memory | A brain in a glass jar glowing gold, tiny pictures orbiting it | night |
| Pyrokinesis | A fireball blazing above an open hand | night |
| Remote Viewing | A glowing eye shape floating in the dark, a faraway valley seen in its iris | night |
| Superhuman Strength | A figure lifting a huge boulder over their head | day |
| Super Speed | A runner as a blur of speed streaks along a road, dust trailing | day |
| Teleportation | A crate dissolving into teal sparkles on one pad and reappearing on a second pad | night |
| Transmogrification | A grey stone in a dish halfway turned to gold, violet sparks swirling | interior, night |
| Weather Control | A copper coil machine firing a beam into a storm cloud, the sky stormy on one side and sunny on the other | day, storm |

These keep clear of Renaissance's painter at an easel (Oil Paint), Found Art's driftwood (Public Art), the Mystics' third eye (Remote Viewing), Uploaded Consciousness's head of pixels (Perfect Memory), Doppelgangers' mirror (Object Cloning), Superpower Regulators' containment ring (Teleportation), the Entertainers' curtained stage (Opera), Spymaster's wall map (War College) and the Assembly Line's motorcars (Automation).


### 6.4 Not a repeat

Several of the first 10 sit close to earlier pictures, or to tech cards still to come. They keep clear:
- **Clocks** is a pocket watch, not the clockmaker with a wall of clocks and a longcase clock (civ/tinkerers), the clock tower (landmark/clock-tower), or the clocks in the sky (tapestry/deja-vu).
- **Anesthesia** is about sleep and surgery: its glass globe must not read as the flask bench of Empiricism (tapestry/empiricism), and it is not the plague doctor (tapestry/plague).
- **Assembly Line** is an indoor line of motorcars, not the cannon works under searchlights (tapestry/wartime-economy) or the brick factories outside (tapestry/industrialism). The robots of Automation (an A&A tech card) stay for that card.
- **Ammonia** is a reactor by a field, not a mine (tapestry/coal-baron), oil derricks (tapestry/oil-magnate) or a granary (tapestry/socialism).
- **Calendar** is a carved disc close up, not a temple in rays of light (tapestry/theocracy) or a wonder of the desert (tapestry/age-of-wonders). Telescope and Astrolabe, still to come, keep the stars and instruments.
- **Canned Food** keeps clear of the Bakery's bread and the farm of Irrigation, still to come.
- **Bakery** is a loaf and an oven, not the Bakery landmark's shop front (landmark/bakery).
- **Barn** shows animals in straw, not the red barn and silo (landmark/barn) or ploughing (tapestry/feudalism).
- **Com Tower** is the antenna close up, not the lattice tower over the city (landmark/com-tower); Radio, still to come, keeps the radio set.
- **Light Bulb, Radio, Transistors and Time Travel** stay for their own cards, so none of the first 10 shows a bulb, a radio set, a circuit or a time machine as its subject.

### 6.5 Palette and parts

- **Colours.** New tones are blended with `mix()` inside a drawing, as in #8, so drawings made side by side never edit a shared file.
- **Parts.** No new scene parts. Each invention is drawn in its own module; existing parts (sky, terrain, buildings, interior, figure, crowd, smoke, factory, street) supply the settings.

### 6.6 Work and review

1. **The checks first**, test-first.
2. **A reference picture: Clocks.** It is the purest close-up of an object, and sets the scale and finish the others follow.
3. **Side-by-side drawing:** subagents draw the other nine, two or three each. They write only their own drawing files.
4. **A fresh review:** a reviewer who drew none of them looks at all 10 at 1× and 4× against this design (invention readable, no repeats, no lettering, no likeness, full bleed), and its findings are fixed.
5. **One commit** for the drawings and their SVGs ("Refs #10: draw the first 10 tech cards"), pushed to main, then the owner reviews the 10 in the component library (`/components.html#art-parts`). #10 stays open.

## 7. Changes to other documents

- **`docs/art/README.md`:** `tests/art-tech.test.mjs` beside the other full-bleed checks.
- **CLAUDE.md:** #10 under "Where the work stands": the first 10 drawn and waiting for the owner.

## 8. Calls made in this document (not yet confirmed by the owner)

- "First 10" means the first 10 base cards in catalog order.
- Every subject and light in §6.3.
- The Bakery, Barn and Com Tower subjects, from the owner's "newly discovered bread" example.
- No new scene parts.
- Clocks as the reference picture.
- Dawn on the dusk sky.
- The other 46 subjects are written after the owner's review, not now.
