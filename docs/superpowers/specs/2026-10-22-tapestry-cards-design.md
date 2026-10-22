# Tapestry cards: 115 illustrations (#9): design

Written 2026-10-22. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)) and follows the review pattern the landmarks used in #7 ([2026-10-21-landmarks-design.md](2026-10-21-landmarks-design.md)).

## 1. What and why

Every tapestry card gets **one 64×64 style C scene**. It is the card's picture on screen: the frame (#47) puts the card's name, type and text around it.

| Set | Cards | Pictures |
|---|---|---|
| Base | 43 + the trap | 44 |
| Plans & Ploys | 13 (R43 and R44 leave out "Arc…" and Infrastructure Boost) | 13 |
| Arts & Architecture | 20 | 20 |
| Fantasies & Futures | 38 (Cloud Colonies is back, R77 and #49) | 38 |
| **Total** | | **115** |

The ids are already in `src/lib/art/catalog.js` (`tapestry/<slug>`), and the component library's Art area already shows all 115 as empty slots, split by expansion.

## 2. What the owner decided (2026-10-22)

- **The picture is what players see of the card on screen.**
- **Start designing without more questions.** As with the landmarks, the look is the builder's call, within art style C. Every subject in §6.2 is a builder's call that the owner reviews through the samples and the batches.
- **Real religious and political signs are allowed** (owner, 2026-10-22). Crosses, crescents, stars, real flags and political emblems may appear where a card's subject calls for them. The base batch was drawn under the earlier, stricter rule, and its invented flags and devices stay.
- **The base batch is approved** (owner, 2026-10-22), and work moves on to Plans & Ploys.

## 3. Goals

1. **115 pictures**, one per tapestry card in the catalog, each a full 64×64 scene with its own sky or room, setting and detail, like the Lighthouse.
2. **One clear subject per card**, taken from the card's name, so a player can tell their cards apart at a glance in a hand of five.
3. **A set that reads as a journey**: the subjects run from the ancient world to the far future, and the F&F cards add magic and science fiction.
4. **Four review batches** (§6.6), each approved by the owner in the component library.

## 4. Non-goals

- **The card frame**, its layout, and how the name, type and text sit around the picture. That is #47.
- **The building-plot squares** on Commercial Center, Monuments and Star Chamber. They are part of the frame and the capital view, never baked into the picture.
- **The charm icons** on the F&F cards. They are rules content for the frame.
- **Card effects.** The rules engine encodes them (#19, #33, #37, #40).
- **Tech, civilization, landmark-card and masterpiece pictures.** They are #8, #10 and #11.

## 5. Anti-goals

These would make the work a failure even if it ran:
- **Copying Stonemaier's card art.** Each picture is our own reading of the card's name.
- **Lettering in the picture.** No words, numbers or letters. The frame carries the name.
- **Real people.** No picture shows a likeness of a real person. Real religious and political signs, flags and emblems are allowed (§2).
- **Two pictures that look alike.** Cards sharing a theme (the ships, the crowds, the throne rooms) must still differ in subject, setting or light, and no two pictures may be identical.
- **A picture whose subject is lost at the size it's shown.** One clear subject, large in the frame; small figures only for scale or as a crowd.
- **Pictures for left-out cards.** "Arc…" and Infrastructure Boost (R43, R44) get nothing.

## 6. Design

### 6.1 Files and checks

- **Files.** One drawing per card at `art/drawings/tapestry/<slug>.js`, exporting `draw()`, built to `static/art/tapestry/<slug>.svg` by `npm run art`. The library page picks it up by itself.
- **Size.** 64×64. The build already refuses any other size for an illustration.
- **Full bleed.** Every pixel is painted, as in the Lighthouse: the frame needs a picture with no holes.
- **The trap.** One picture serves all seven trap copies (`tapestry/trap`).

### 6.2 The pictures

- **Light follows the card's mood.**
  - **Day** for hopeful, prosperous and building cards.
  - **Dusk** (and dawn, which uses the dusk sky) for turning points, industry and trade.
  - **Night** for dark, secret, violent or magical cards, with glowing lights.
  - **Interiors** for a few cards whose subject is a room (a throne room, a study, a council chamber). They show a window or lamp, so they still have light and depth.
- **Era follows the subject.** Feudalism is medieval, Industrialism is 19th century, Dystopia and Technocracy are the future. The F&F cards are fantasy or science fiction.
- **Framing.** As in the Lighthouse: the subject is large, it gets the outline pass, and the background comes from the scene parts.

**Base game (44)**

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Academia | A scholar's study: open books, a globe and a candle by a tall window | interior, night |
| Age of Discovery | An explorer planting a flag on an unknown palm-lined shore, a small ship at anchor | day |
| Age of Sail | A tall ship under full sail leaving harbour at sunrise | dawn |
| Age of Wonders | A great pyramid and a giant statue rising over the desert | day |
| Alliance | Two banners of different colours crossed above two tents sharing one campfire | dusk |
| Boast of Superiority | A herald on a high rampart blowing a long trumpet, banners streaming | day |
| Broker of Peace | A white dove over a sheathed sword lying in a meadow | day |
| Capitalism | A busy shopping street with awnings and a gold coin sign | day |
| Coal Baron | A mine's headframe with carts of coal and a smoking chimney | dusk |
| Colonialism | A wooden fort with an invented flag on a tropical coast, a rowboat on the sand | day |
| Dark Ages | A ruined tower and bare trees under a stormy sky, with a crow | night |
| Democracy | Citizens queueing at a ballot box in a town square before a columned hall | day |
| Dictatorship | A giant stern statue over a grey square hung with red banners | dusk |
| Diplomacy | Two envoys bowing across a table with a sealed treaty, two banners behind | interior, day |
| Dystopia | A walled grey city of the future under smog, searchlights and a giant screen | night |
| Empiricism | An experiment bench: bubbling flasks, a balance and a notebook by a sunny window | interior, day |
| Espionage | A cloaked spy reading a stolen letter under one lamp in a dark alley | night |
| Exploitation | A quarry cut into a mountain, with carts and a crane | day |
| Feudalism | A lord's manor on a hill, a peasant ploughing strip fields with an ox below | day |
| Golden Age | A city of golden domes glowing in the sunset | dusk |
| Guilds | A timber-framed craft street with hanging signs: an anvil, a boot, a loaf | day |
| Industrialism | Rows of brick factories with smokestacks and a railway | dusk |
| Marriage of State | Two crowned figures under a flower arch, wedding bells in a tower behind | day |
| Mercantilism | A harbour quay of crates and barrels, a merchant ship being loaded | day |
| Meritocracy | A lone climber halfway up a long stone stair to a laurel-crowned temple | day |
| Militarism | A column of spear-carrying soldiers marching under banners past a fortress | day |
| Monarchy | A throne room: a crown resting on a red throne under banners | interior, day |
| Oil Magnate | Oil derricks and a gushing well on a desert plain | dusk |
| Olympic Host | A torch runner nearing a lit cauldron above a classical stadium | day |
| Pillage and Plunder | Raiders' longship beached by a burning village, chests of loot | night |
| Pirate Rule | A pirate ship with a black flag in a moonlit cove, treasure on the sand | night |
| Plea for Aid | A beacon fire blazing on a hill tower, answered by a distant one | night |
| Renaissance | A painter at an easel before a great domed cathedral | day |
| Revisionism | A mason chiselling a new face on a monument, the old statue toppled beside it | day |
| Revolution | A crowd with torches and a waving flag climbing a barricade | dusk |
| Socialism | Workers carrying sheaves into one shared granary under a banner | day |
| Steam Tycoon | A steam locomotive crossing a trestle bridge in plumes of steam | day |
| Technocracy | A city of glass towers around a central computer spire beaming light | night |
| Terraforming | Green terraced fields cut into a barren mountain, a waterfall feeding them | day |
| Theocracy | A grand temple on steps, rays of light breaking through the clouds onto it | day |
| Trade Economy | A market square of stalls, traders swapping fruit, cloth and pots | day |
| Tyranny | A black fortress on a crag with one red-lit window and a chained gate | night |
| Wartime Economy | A munitions works rolling out cannons under searchlights | night |
| Trap | A pit of sharpened stakes hidden under branches across a path, an enemy flag beyond | dusk |

**Plans & Ploys (13)**

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Astronomy | An observatory dome with its telescope aimed at a comet | night |
| Cartography | A map table: an unrolled map with a compass rose, dividers and a quill, candlelit | interior, night |
| Double Cross | Two hooded figures shaking hands, each hiding a dagger behind their back | night |
| Engineering | A crane lifting a keystone onto a stone arch in scaffolding | day |
| Entertain the Masses | A juggler on a stage in a crowded square strung with bunting | dusk |
| Manifest Destiny | A covered-wagon train heading towards mountains at sunset | dusk |
| Public Works | Workers paving a road beneath a new aqueduct | day |
| Retreat | Soldiers withdrawing over a bridge with a tattered flag, mist rising | dusk |
| Status Quo | A great balance scale resting perfectly level on a plinth in a quiet square | day |
| Stolen Plans | A thief climbing from a window with a rolled blueprint, a guard's lantern below | night |
| Surprise Party | Revellers leaping from behind a wall with streamers and fireworks as a soldier arrives | night |
| Surrender | A white flag raised on a broken rampart, swords laid down before it | dusk |
| World's Fair | An exhibition palace of glass and iron with many flags and a big wheel | day |

**Arts & Architecture (20)**

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Age of Enlightenment | A thinker on a hill as the sun breaks through clouds over a city of spires | dawn |
| Artistic Inspiration | A sculptor at a half-carved marble statue in a sunlit studio | interior, day |
| Commercial Center | A covered arcade of shop windows and shoppers | day |
| Found Art | A sculpture built from driftwood and junk on a beach | day |
| Government Grants | An official handing a sack of coins to an artist outside a columned ministry | day |
| Granges | Farmers gathering at a grange hall with baskets of harvest | dusk |
| Information Age | A room of glowing screens, cables and server racks | interior, night |
| Infrastructure Upgrade | Cranes over a city and a new overpass under construction | day |
| Migration | A line of travellers with bundles following a river, birds flying the same way | day |
| Monuments | A stepped stone monument topped by a statue | day |
| Moon Landing | A lander and a planted flag on the grey moon, the Earth rising | night |
| National Parks | A waterfall in a pine canyon with a ranger's lookout | day |
| Plague | A deserted night street, a beaked plague doctor and marked doors | night |
| Political Posturing | A speaker on a balcony draped in banners, gesturing to a crowd | dusk |
| Silk Road | A camel caravan crossing dunes towards an oasis town | dusk |
| Space Race | Two rockets climbing side by side on trails of smoke | dusk |
| Spymaster | A figure at a desk under a wall map pinned with strings, a raven at the window | interior, night |
| Star Chamber | A secret council at a round table under a star-painted ceiling | interior, night |
| S.T.E.A.M. | A workshop bench of gears, a flask, a ruler and a paintbrush, a small steam engine puffing behind | interior, day |
| Trade Routes | A crossroads signpost with carts heading off down each road | day |

**Fantasies & Futures (38)**

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Alien Disclosure | A flying saucer beaming light onto a field, onlookers below | night |
| Astral Expeditions | A sailing ship voyaging among stars and planets | night |
| Chimera-Citizen Rights | A chimera standing among townsfolk in a square, holding a scroll | day |
| Citadel of Power | A towering citadel crowned with a glowing crystal, lightning around it | night |
| Cloud Colonies | Floating islands of houses above the clouds, joined by rope bridges | day |
| Déjà Vu | A figure in a street meeting a fading echo of itself, clocks in the sky | dusk |
| Doppelgangers | Two identical figures facing each other through an empty mirror frame | night |
| Dream Monitors | A sleeper in bed wired to a machine whose screen shows their dream | interior, night |
| Ecstatic Visions | A figure on a peak, arms raised, as ribbons of coloured light fill the sky | night |
| Generation Ships | A huge ark spaceship with a lit ring drifting past a planet | night |
| Ghost Ship | A pale, glowing ghost ship sailing through fog under the moon | night |
| Ghost Towns | An empty frontier town with tumbleweeds and faint ghosts in the windows | dusk |
| Good Omens | A double rainbow over green hills, a white stag watching | day |
| Great Library of Potions | Shelves of glowing coloured potion bottles around a bubbling cauldron | interior, night |
| Gremlins | Little gremlins pulling apart a clockwork engine in a shower of sparks | night |
| Haunted Houses | A crooked old house on a hill, glowing windows, a ghost and bats under a full moon | night |
| High Council | Robed elders on high-backed thrones around a glowing orb | interior, night |
| Hive Mind | A glowing honeycomb tower, drones linked by threads of light | dusk |
| Interdimensional Trade | A trader's stall before a swirling portal, a strange hand reaching through with goods | night |
| The Kraken | Giant tentacles wrapping a ship in a stormy sea | night |
| League of the Charmed | Adventurers around a campfire, each holding up a glowing charm | night |
| Living Cities | Houses grown into a giant living tree, lit windows among the leaves | day |
| Lost Artifacts | An explorer in a jungle ruin uncovering a glowing relic on a pedestal | dusk |
| Microbial Magic | A brass microscope over a dish of glowing, swirling microbes, sparks rising | interior, night |
| Muses | Three robed muses with a lyre, a scroll and a mask on a golden hillside | dusk |
| Phantasmal Paladins | Spectral knights on ghostly horses charging across a moonlit field | night |
| Quest Culture | A knight, a wizard and an archer setting off down a road towards a far castle | day |
| Robotic Decoys | Rows of identical robots standing as a fake army before a fort | dusk |
| Secret Societies | Hooded figures with candles around a carved eye symbol in a cellar | interior, night |
| Seer Sight | A seer gazing into a glowing crystal ball, a vision swirling inside it | interior, night |
| Soothsaying | A fortune teller's tent, cards laid out on a table by lamplight | dusk |
| Superpower Regulators | A caped hero inside a glowing containment ring, monitors around it | night |
| Suspended Animation | A sleeper in a frosted glass pod in a quiet lab | interior, night |
| Technomancy | A wizard whose staff is a circuit board, spells of glowing code around it | night |
| Temporal Nomadism | A traveller stepping through a giant hourglass portal, past on one side and future on the other | dusk |
| Uploaded Consciousness | A head in profile dissolving into glowing pixels that stream into a server tower | night |
| Wizards' Guild | A guildhall of crooked towers with pointed roofs, sparks rising from the chimneys | night |
| Zombie Army | Zombies shambling out of a graveyard under a green moon | night |

### 6.3 Palette and parts

- **Colours.** New colours go into `PALETTE`, as the toolkit's rules require. The F&F cards will need glow colours (ghostly, arcane and alien), and the interiors need wall and floor tones.
- **Parts.** A shape that two or more cards need becomes a scene part in `art/parts/`, tested like the others. Anything used once stays in its drawing. Likely parts, decided by the builder:
  - **a ship:** a tall ship with sails, its sails and flag coloured by option (Age of Sail, Age of Discovery, Mercantilism, Pirate Rule, Ghost Ship, The Kraken, Astral Expeditions);
  - **an interior:** a back wall, a floor and a window or lamp (about a dozen cards);
  - **a banner** on a pole (Alliance, Militarism, Dictatorship, Revolution, Retreat, Surrender and others);
  - **a crowd:** a row of figures in varied clothes, built on `drawFigure`.
- **Reuse.** Existing parts are used wherever they fit: the factory for Industrialism, the classical front for Democracy, the skyline for Technocracy and so on.

### 6.4 Tests

In `tests/art-tapestry.test.mjs`, written before the drawings they check:
- **Full bleed:** every drawn tapestry picture paints all 4,096 pixels.
- **No twins:** no two tapestry pictures are pixel-identical.
- **Completeness by batch:** every tapestry card of each finished set is drawn. The test lists the finished sets (`base`, then `pp`, `aa`, `ff`) and gains one with each batch, so the issue can't close with a card missing.
- **Already covered elsewhere:** the 64×64 size and the catalog entry (the build and `art-build.test.mjs`), up-to-date SVGs, and palette-only parts (`art-parts.test.mjs`). Each new part gets a test in `art-parts.test.mjs`, like the existing ones.

### 6.5 Where the owner reviews

In the **Art** part of the component library (`/components.html#art-parts`), where the tapestry slots fill in as drawings land. The issue says the card gallery (#47), but #47 doesn't exist yet. As with the landmarks, the component library is the review place until it does.

### 6.6 Review and order

1. **Three samples** from the base game, chosen to test the riskiest choices: **Age of Sail** (the issue's own example, dawn at sea, and the ship part), **Monarchy** (an interior) and **Dark Ages** (night and ruin). The owner approves the direction.
2. **The other 41 base pictures.** The owner approves the base batch.
3. **Plans & Ploys** (13), then **Arts & Architecture** (20), then **Fantasies & Futures** (38), each approved before the next starts.
4. Each approval ticks its box on #9, and #9 closes after the F&F batch with "Fix #9: …".

Commits say "Refs #9: …", with one commit per batch (or a few within the larger batches), each holding the drawings and their SVGs together.

## 7. Changes to other documents

- **`docs/art/README.md`:** note the full-bleed rule for illustrations and any new parts.
- **CLAUDE.md:** move #9 through "Where the work stands" as batches are approved.
- **Issue #9:** note that each batch is reviewed in the component library until #47 exists.

## 8. Calls made in this document (not yet confirmed by the owner)

- Every subject in §6.2, and the mood-based light scheme.
- Interiors for about a dozen cards.
- Full bleed, no lettering, and no likeness of a real person.
- The three samples, and one approval per set.
- New parts only for shapes two or more cards share.

## 9. Left to the builder

- Each picture's composition and details, within its subject and light.
- Which new parts and palette colours to add.
