# Civilization portraits: 41 illustrations (#8): design

Written 2026-10-22. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)) and follows the tapestry pictures from #9 ([2026-10-22-tapestry-cards-design.md](2026-10-22-tapestry-cards-design.md)).

## 1. What and why

Every civilization gets **one 64×64 style C portrait**. It is the civilization's picture on screen: the mat and the card frame put the name and the ability around it. The Automa uses the same portrait when it plays a civilization.

| Set | Civilizations |
|---|---|
| Base | 16 |
| Plans & Ploys | 10 |
| Arts & Architecture | 5 |
| Fantasies & Futures | 10 |
| **Total** | **41** |

The ids are already in `src/lib/art/catalog.js` (`civ/<slug>`), and the component library's Art area already shows all 41 as empty slots, split by expansion.

## 2. What the owner decided (2026-10-22)

- **Draw them like the tapestry pictures.** Same style, same checks, same review.
- **Go straight through.** No stop for samples or per-set approval: each set gets a fresh review and its findings are fixed, then the work is pushed to main and #8 closes.
- **Draw in parallel.** Subagents draw the portraits side by side.
- **Political and explicit material is allowed.** Real religious and political signs, flags and emblems may appear (as for #9), and so may blood, wounds, weapons drawn, skulls, drink, smoke, gambling and the occult where a civilization calls for it. Bare skin is fine where the subject has it, such as a merman or a werewolf in torn clothes.

## 3. Goals

1. **41 portraits**, one per civilization in the catalog, each a full 64×64 scene.
2. **A face, not a scene.** Each picture is a portrait of the civilization's people: one figure (two at most) shown large, from the head down to the chest or waist, with the setting and props behind them telling what the civilization does.
3. **Told apart at a glance.** Players pick between two civilizations at the start; each portrait must differ from the others in figure, colour, setting and light, and must not repeat a tapestry picture's subject (§6.3).
4. **A varied people.** Across the set, men and women, young and old, and a range of skin tones.

## 4. Non-goals

- **The civilization mat** and its ability grid, tokens and text. That is the frame and the player area (#27, #47).
- **Automa civilization cards.** The Automa reuses these portraits; its cards' own layout is #31.
- **Abilities.** The rules engine encodes them (#20, #33, #37, #40).

## 5. Anti-goals

- **Copying Stonemaier's mat art.** Each portrait is our own reading of the civilization's name and ability.
- **Lettering.** No words, numbers or letters, including on signs, books and posters.
- **Real people.** No likeness of a real person.
- **Twins.** No two portraits alike, and no portrait that repeats a tapestry picture.
- **A lost face.** The face (or the creature's head) is large and lit. Small figures appear only for scale.

## 6. Design

### 6.1 Files and checks

- **Files.** One drawing per civilization at `art/drawings/civ/<slug>.js`, exporting `draw()`, built to `static/art/civ/<slug>.svg` by `npm run art`. The library page picks it up by itself.
- **Size and bleed.** 64×64, every pixel painted.
- **Tests.** `tests/art-civ.test.mjs`, written before the drawings, as for the tapestry pictures: every portrait paints all 4,096 pixels; no two portraits are the same; every civilization of each finished set is drawn (`FINISHED` grows with each set).

### 6.2 The portraits

- **Framing.** The figure is the subject. The head sits in the upper half, roughly 12 to 18 pixels tall, turned to the viewer or three-quarters; the shoulders and arms fill the lower half, with hands holding the civilization's prop where it has one. Background parts fill the rest.
- **Faces.** Eyes are dark 1–2 pixel marks with a lighter lid or brow above, the nose a shade line, the mouth a short dark or red line. A light source in the scene lights one side of the face; the other side takes the shade colour.
- **Composition.** As in the Lighthouse and the tapestry pictures: the background on a layer from the scene parts, the figure on a foreground canvas, `outline(scene, PALETTE.ink)`, `underlay(scene, layer)`, then glows and details that skip the outline.
- **Light follows the mood**, as in #9: day for builders and the hopeful, dusk for trade and turning points, night for the secret, violent and magical, and interiors for workshops and studies.
- **Skin tones.** The palette gains two more skin pairs (`skinTan`/`skinTanShade` and `skinDeep`/`skinDeepShade`) beside `skin`/`skinShade`. Creatures (aliens, genies, merfolk, werewolves, elder ones) blend their skin from palette colours with `mix()`.

**Base game (16)**

| Civilization | Subject (builder may refine) | Light |
|---|---|---|
| Alchemists | A robed alchemist at a bubbling workbench by candlelight, holding up a glowing green flask; retorts, a skull and fumes behind | interior, night |
| Architects | A master builder holding a set square over unrolled plans, a cathedral in scaffolding behind | day |
| Craftsmen | A stonemason in a leather apron chiselling a half-finished statue, chips flying, tools on the wall | interior, day |
| Entertainers | A masked jester juggling flaming torches before red stage curtains and footlights | interior, night |
| Futurists | A pilot in a silver suit, visor raised, before a gleaming city of towers with flying craft and a rising rocket | dusk |
| Heralds | A herald in a quartered tabard blowing a long trumpet hung with a banner, castle walls behind | day |
| Historians | An old archivist in spectacles unrolling a scroll among bookshelves, an old helmet, a sword and an urn kept as relics | interior, night |
| Inventors | An inventor in goggles holding up a glowing bulb, a crackling machine of coils and gears behind | interior, dusk |
| Isolationists | A stern sentinel with a spear on top of a great wall, its gate shut below, empty mountains beyond | dusk |
| Leaders | A ruler in a laurel wreath and purple cloak holding a sceptre, eagle standards and a cheering crowd below | day |
| Merrymakers | A reveller raising an overflowing tankard at a lantern-lit festival, garlands and a maypole behind | dusk |
| Militants | A helmeted warrior with a bloodied sword and a dented shield, a war banner and burning outposts behind | night |
| Mystics | A mystic floating cross-legged in meditation, a third eye glowing, a wheel of star signs behind | night |
| Nomads | A rider in furs beside a horse on the open steppe, yurts with smoke behind | day |
| The Chosen | A figure in white with a radiant halo, rays breaking through the clouds, small worshippers kneeling below | day |
| Traders | A merchant weighing coins on brass scales at a stall of silks and spices, ships in the harbour behind | dusk |

**Plans & Ploys (10)**

| Civilization | Subject | Light |
|---|---|---|
| Advisors | A grey-bearded counsellor in dark robes holding a fan of cards close, an empty throne in the shadows behind | interior, night |
| Aliens | A grey alien with huge black eyes stepping from a saucer's open hatch onto a world of crystals, a ringed planet above | night |
| Infiltrators | A black-masked infiltrator crouched on a roof above an enemy camp of tents and campfires, dagger drawn | night |
| Islanders | An islander with a fishing spear and a shell necklace on a beach, an outrigger canoe and palms behind | day |
| Recyclers | A scavenger in goggles with a towering pack of salvaged parts in a scrapyard, a recycling-arrows sign | dusk |
| Riverfolk | A ferrywoman poling a reed boat through river mist, stilt houses on the banks | dawn (dusk sky) |
| Spies | A spy in a trench coat and hat listening on headphones at a radio set, a tiny camera and photographs on the desk | interior, night |
| Tinkerers | A clockmaker with a loupe in one eye fitting a spring into a clockwork bird, clocks on the wall | interior, day |
| Treasure Hunters | An adventurer in a wide hat holding a torch over an open chest of gold in a cave | interior (cave), torchlight |
| Utilitarians | A sturdy engineer in overalls with a big wrench, a forge chimney and a steaming locomotive behind | day |

**Arts & Architecture (5)**

| Civilization | Subject | Light |
|---|---|---|
| Collectors | A collector studying a gem through a magnifying glass, a cabinet of curiosities behind: a skull, a vase, a stuffed bird, a framed painting | interior, day |
| Gamblers | A card sharp in a green visor at a felt table, cards, dice and chips, a smoking cigar and a glass of whiskey | interior, night |
| Relentless | A sweating builder hauling a great stone up a ramp by torchlight, a half-built tower rising behind | night |
| Renegades | An outlaw in a bandana mask with a torch under a black-and-red flag, a burning tollhouse behind | dusk |
| Urban Planners | A planner with a compass bent over a model city on a table, the real city through the window | interior, day |

**Fantasies & Futures (10)**

| Civilization | Subject | Light |
|---|---|---|
| Artificers | An artificer with a brass mechanical arm reaching into a glowing portal and pulling out a device from the future | interior, night |
| Celestials | A winged celestial in white and gold standing on a floating island with a tiny farm, above the clouds | day |
| Elder Ones | An ancient hooded being with a tentacle beard and glowing eyes, holding an hourglass in a sunken temple | night |
| Faefolk | A fairy with gossamer wings, half see-through, in a moonlit ring of mushrooms | night |
| Genies | A blue genie rising in smoke from a golden lamp, arms folded, a palace dome behind | dusk |
| Illuminati | A masked aristocrat with a goblet of wine and a purse of gold, the eye in the pyramid glowing behind | interior, night |
| Merfolk | A merman with a trident before a coral city under the sea, light rays and bubbles | underwater |
| Psionics | A psychic with glowing temples, stones and books floating round her, ghostly copies of her on either side | night |
| Weefolk | A tiny person in a thimble helmet with a needle sword, hiding behind a teacup on a kitchen table | interior, day |
| Werefolk | A werewolf in torn clothes howling at a full moon in a dark forest, claws bloodied | night |

### 6.3 Not a tapestry picture again

Several civilizations sit close to a tapestry card. The portraits keep clear of them:
- **Spies** listen at a radio set, not the cloaked letter-reader in an alley (Espionage) or the map wall (Spymaster).
- **Aliens** stand on their own world, not the saucer over a field (Alien Disclosure).
- **Illuminati** is one masked figure under the eye, not the hooded circle in a cellar (Secret Societies).
- **Mystics** float in meditation, not the crystal ball (Seer Sight) or the fortune teller's tent (Soothsaying).
- **Entertainers** are one jester on a curtained stage, not the juggler in a square (Entertain the Masses).
- **Treasure Hunters** are in a cave with a chest, not the jungle ruin (Lost Artifacts).

### 6.4 Palette and parts

- **Colours.** Four new skin colours (§6.2). Other new tones are blended with `mix()` inside a drawing, so the parallel drawings never edit a shared file.
- **Parts.** No new scene parts. Each figure is drawn in its own module, because each portrait's pose and clothes are its own; existing parts (sky, sea, terrain, buildings, interior, banner, crowd, skyline, smoke, ship) supply the backgrounds.

### 6.5 Work and review

1. **A reference portrait first:** the Alchemists (the issue's own example). It sets the face size and treatment the others follow.
2. **Parallel drawing:** subagents draw the other 40, a handful each, grouped by set. They write only their own drawing files.
3. **A fresh review per set:** a reviewer who drew none of the set looks at every portrait at 1× and 4× against this design (faces readable, no twins, no lettering, no likeness, full bleed), and its findings are fixed.
4. **One commit per set** ("Refs #8: draw the … civilization portraits"), holding the drawings and their SVGs together, then a closing commit ("Fix #8: …"), pushed to main.

## 7. Changes to other documents

- **`docs/art/README.md`:** the skin colours, and the explicit-material rule next to the political one.
- **CLAUDE.md:** move #8 to done in "Where the work stands".

## 8. Calls made in this document (not yet confirmed by the owner)

- Every subject in §6.2, and its light.
- The portrait framing: one large figure, head in the upper half.
- The four new skin colours.
- No new scene parts.
