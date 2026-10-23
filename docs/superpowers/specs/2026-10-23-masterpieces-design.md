# Masterpieces: 20 illustrations (#11): design

Written 2026-10-23. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)) and follows the tapestry pictures (#9), the civilization portraits (#8) and the tech cards (#10, [2026-10-22-tech-cards-design.md](2026-10-22-tech-cards-design.md)).

## 1. What and why

Every Arts & Architecture masterpiece card gets **one 64×64 style C picture**. The card frame (#47) puts the card's name and benefit icons around it. Masterpieces are square cards (57×57 mm, research 03 §2), so a square picture fits them as it is.

The 20 ids are already in `src/lib/art/catalog.js` (`masterpiece/<slug>`), and the component library's Art area shows them as empty slots.

#11 also covers the 10 landmark cards, the 19 space tiles and the inspiration tiles. They are not part of this design (§4).

## 2. What the owner decided (2026-10-23)

- **Masterpieces now:** "generate masterpieces and push to main".
- **The same rules as the other pictures** ("follow the rules we did for other images"): style C, 64×64, full bleed, no lettering, no likeness of a real person, real religious and political signs allowed, explicit material allowed where the subject calls for it, the same checks and the same review place.
- **Parallel subagents** draw them ("use multiple agents").
- **Few buildings** ("don't add too many buildings"). No masterpiece has a building as its subject. A wall, a window or a room may stand behind the artwork as its setting.
- **About 7 out of 10 on detail** ("7/10 on details"). That is richer than the simpler last tech cards (about 40 to 60 colours) and plainer than the busiest tapestry pictures and portraits (up to 250). The yardstick is the Compass and Calendar tech cards and the Entertainers portrait: one clear hero, a setting with some texture, about 50 to 90 colours.

## 3. Goals

1. **20 pictures**, one for each masterpiece, each a full 64×64 picture with its own setting and light.
2. **The art form is the hero.** Each picture shows its art: the work itself (a painting, a window, a tapestry), the performer doing it (a dancer, a mime), or the maker's hands at it (a potter, a globe painter). It fills about half the frame or more.
3. **Told apart at a glance.** A player with three masterpieces face up can tell them apart at card size. Settings and light vary across the 20: day, dusk, night, lamplit interiors, a studio, a garden, a street.

## 4. Non-goals

- **The 10 landmark cards, 19 space tiles and the inspiration tiles.** They are the rest of #11 and get their own design.
- **The card frame** and how the name and the benefits sit around the picture (#47).
- **Card effects.** The rules engine encodes them (#35).

## 5. Anti-goals

- **Copying Stonemaier's card art**, or copying a famous real artwork. Each picture is our own reading of the card's name.
- **Lettering.** No words, letters or numbers. Calligraphy shows a brush stroke, not script; Graffiti shows shapes, not tags; a seal or a label is blank or a picture.
- **Real people.** No likeness of a real person, artist or performer.
- **A building as the subject** (§2).
- **A repeat** of an earlier picture (§6.3) or of another masterpiece.

## 6. Design

### 6.1 Files and checks

- **Files.** One drawing per card at `art/drawings/masterpiece/<slug>.js`, exporting `draw()`, built to `static/art/masterpiece/<slug>.svg` by `npm run art`. The library page picks it up by itself.
- **Tests.** `tests/art-masterpiece.test.mjs`, written before the drawings, as for the tech cards: every masterpiece paints all 4,096 pixels; no two are the same; every masterpiece of each finished set is drawn (`FINISHED = ['aa']`).

### 6.2 The pictures

- **Composition** as in the Lighthouse and the earlier sets: the background on a layer, the hero and any figures on a foreground canvas, `outline(scene, PALETTE.ink)`, `underlay(scene, layer)`, then glows and details that skip the outline.
- **Detail at 7/10** (§2): the hero gets a base tone, a shade, a highlight and some texture (folds, grain, brush marks); the setting gets a gradient or simple texture and at most two or three small props. No crowds.
- **Era follows the art form**: the fresco in a Roman villa, the tapestry on a medieval loom, Art Deco in the 1920s, the zoetrope and the film projector in their early days, graffiti on a modern street.
- **People** appear where the art is a performance (Ballet, Modern Dance, Krav Maga, Mime, Theater) or a craft in the making (Ceramics' hands, Topiary's gardener). They use the palette's three skin pairs, and across the set they vary.

| Card | Subject (builder may refine) | Light |
|---|---|---|
| Animation | A brass zoetrope drum spinning on its stand, its slits blurred, a strip of a galloping horse in a row of frames showing over its rim, a candle beside it | interior, night |
| Art Deco | A gold statuette of a leaping gazelle on a stepped black marble plinth, before a black lacquer screen inlaid with a gold sunburst fan and chevrons | interior, night |
| Ballet | A ballerina in a white tutu and pink pointe shoes, en pointe in an arabesque, in a rehearsal studio with a wooden barre and a tall window | interior, day |
| Baroque | A gilded harpsichord with curving carved legs, its raised lid painted with a sky of clouds, a lit candelabra on it in a dark palace room | interior, night |
| Calligraphy | A bamboo brush finishing one sweeping ink circle on white rice paper, an ink stone, a brush rest and a blank red seal beside it | interior, day |
| Ceramics | A potter's hands raising a tall pot of wet red clay on a spinning wheel, slip streaking the hands, glazed pots on a shelf behind | interior, day |
| Costuming | A dressmaker's dummy in a jewelled stage gown with a lace ruff and puffed sleeves, pins in it and a tape measure draped over it, a feathered mask on a hook | interior, lamplight |
| Fresco | A Roman garden fresco on a plaster wall: lemon trees, a lattice fence and birds on a blue-green ground in a Pompeian red border, one corner still bare wet plaster with a brush and pigment bowls on a plank | interior, day |
| Graffiti | A bright mural of bubbles, arrows, stars and drips (shapes only) across a brick wall, a spray can in the foreground hissing out a mist of colour, under a streetlight | night |
| Haute Cuisine | A gourmet plate on white linen: a seared fillet with a swirl of sauce, herb sprigs and edible flowers, a silver cloche lifted above it, a glass of red wine beside | interior, candlelight |
| Krav Maga | Two fighters on gym mats: one blocks the other's knife arm and strikes in the same move, a punching bag hanging behind | interior, day |
| Mapmaking | A big globe on a wooden stand, half painted (blue seas, green and tan lands) and half still blank white with a paper gore being pasted on, a brush and paint pots beside it | interior, day |
| Mime | A white-faced mime in a striped shirt and black beret pressing both palms against an invisible wall, an upturned hat with coins on the cobbles of a sunny square | day |
| Modern Dance | A barefoot dancer in a flowing red dress caught mid-leap, the fabric swirling, on a bare stage before a glowing dusk-coloured backdrop | interior, stage light |
| Motion Picture | A hand-cranked film projector in a dark booth, its two reels turning, a cone of dusty light streaming from its lens towards a far bright screen | interior, night |
| Painting | A landscape oil painting in an ornate gold frame on a deep red gallery wall, lit by a brass picture light, a velvet rope on brass posts in front | interior |
| Stained Glass | A tall pointed stained-glass window glowing with sun from behind: lead lines dividing jewel-coloured panes into a radiant flower pattern, coloured light pooling on the stone floor | interior, day |
| Tapestry | A great tapestry on an upright loom, half woven: a white unicorn in a field of tiny flowers on red, loose threads and bobbins hanging below where the weaving stops | interior, day |
| Theater | An actor in a black doublet and white ruff holding up a skull in a single spotlight on bare boards, a painted moon backdrop behind | interior, night |
| Topiary | A hedge clipped into a big green peacock in a formal garden, a gardener on a ladder with long shears, clippings on the lawn, a cone and a ball of clipped box behind | day |

### 6.3 Not a repeat

Several masterpieces sit close to earlier pictures. They keep clear:
- **Painting** is a framed work on a gallery wall, not the painter at his easel (tapestry/renaissance), the palette and tubes (tech/oil-paint) or the framed painting in the Collectors' cabinet (civ/collectors, small and behind).
- **Theater** is a lone actor with a skull, not the jester on a red-curtained stage with footlights (civ/entertainers), the juggler in the square (tapestry/entertain-the-masses) or the far stage seen from a box (tech/opera). Its curtain, if any, is not red.
- **Mime** keeps clear of the Entertainers' harlequin and the Muses' mask (tapestry/muses).
- **Ballet and Modern Dance** differ in everything: white tutu, pointe and daylight studio against a red dress, bare feet, a leap and stage light.
- **Mapmaking** is a globe being made, not the map table at night (tapestry/cartography) or the binnacle (tech/compass).
- **Motion Picture** is a projector and its beam, not the microphone under a spotlight (tech/microphone).
- **Art Deco** is a statuette and a screen, not a skyscraper (landmark/skyscraper).
- **Stained Glass** is the window close up from inside, not a temple seen from outside (tapestry/theocracy).
- **Ceramics** is a pot on the wheel, not the Collectors' vase.
- **Baroque** is a harpsichord, not the opera glasses (tech/opera) or the Opera House (landmark/opera-house).
- **Topiary** is a clipped hedge, not the sculpture in the park (tech/public-art).

### 6.4 Palette and parts

- **Colours.** New tones are blended with `mix()` inside a drawing, so drawings made side by side never edit a shared file.
- **Parts.** No new scene parts. Existing parts (sky, terrain, interior, figure, street) may supply settings.

### 6.5 Work and review

1. **The checks first**, test-first.
2. **Side-by-side drawing:** seven subagents draw two or three cards each, grouped so that look-alike subjects (the two dances; the painting, the fresco and the window) sit with one builder who keeps them apart. They write only their own drawing files.
3. **A fresh review** of all 20 at 1× and 4× against this design (art form readable, no lettering, no likeness, no repeats, detail near 7/10), and its findings are fixed.
4. **One commit** for the drawings and their SVGs ("Refs #11: draw the 20 masterpieces"), pushed to main. The owner reviews them in the component library (`/components.html#art-parts`). #11 stays open for the landmark cards, space tiles and inspiration tiles.

### 6.6 As drawn

The builders refined some subjects at 1× and 4×:
- **Calligraphy:** the brush lies on its rest beside the ink stone instead of finishing the stroke, because brush and circle together read as a letter Q. The ensō stands alone and fades out in dry streaks.
- **Motion Picture:** the projector stands in a dark hall with rows of seat backs, not a booth, and its beam runs off the right edge towards a screen just out of frame. A screen seen from the side looked like a doorway.
- **Theater:** no curtain at all. Side curtains looked like a second frame.
- **Haute Cuisine:** a waiter's white-gloved hand lifts the cloche, so it doesn't float.
- **Tapestry:** the cloth is about three-quarters woven, so the unicorn is whole.
- **Fresco:** the bare plaster runs down the right third, with the red underdrawing showing, because a small bare corner read like a window.
- **Mime:** a faint vertical sheen beside the gloves shows the invisible wall, and a pigeon sits on the low wall.

The review then had two things fixed: the Modern Dance dancer was redrawn with shaded arms in a raised V, a profiled head and a shaped torso, and the Calligraphy seal became a plain vermilion square, because the specks inside it could read as a carved character.

## 7. Changes to other documents

- **`docs/art/README.md`:** `tests/art-masterpiece.test.mjs` beside the other full-bleed checks.
- **CLAUDE.md:** #11 under "Where the work stands": the 20 masterpieces drawn and waiting for the owner.

## 8. Calls made in this document (not yet confirmed by the owner)

- Every subject and light in §6.2.
- "7/10 on detail" read as about 50 to 90 colours, with Compass, Calendar and the Entertainers as the yardstick.
- No reference picture drawn first: 212 finished pictures already set the style, and the yardstick pictures set the detail.
- No new scene parts.
