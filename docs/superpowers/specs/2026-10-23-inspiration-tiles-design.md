# Inspiration tiles: 4 strips (#11): design

Written 2026-10-23. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)), the owner-approved small pieces of #5 ([docs/art/issue-5.md](../../art/issue-5.md)) and the landmark cards ([2026-10-23-landmark-cards-design.md](2026-10-23-landmark-cards-design.md)).

## 1. What and why

Arts & Architecture gives each player 4 inspiration tiles, one for each income row of the income mat: markets, houses, farms and armories (research 03 §2.6–2.9, "Inspiration tiles"). When a player **inspires**, they lay one of their unused tiles on its row. The tile repeats the row's six spaces with the same innovations and improves spaces 2, 4 and 6. Spaces 1, 3 and 5 are the same as on the mat.

| Row | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Markets (coin) | Barter | Currency | Banking | Credit Cards | E-Commerce | Biometrics |
| Houses (worker) | Symbology | Language | Writing | Telephone | Email | Neural Implants |
| Farms (food) | Hunting | Farming | Breeding | Preservation | Fertilization | Food Printing |
| Armories (culture) | Ceremony | Racing | Team Sports | Tabletop Games | Video Games | Virtual Reality |

The 4 ids are already in `src/lib/art/catalog.js` (`inspiration-tile/<row>`, kind `board`), and the component library's Art area shows them as empty slots. They are the last pictures of #11 apart from the 19 space tiles.

## 2. What the owner decided (2026-10-23)

- "Finish up the inspiration tiles and push to main."
- "Use parallel agents for all 4": one subagent per tile.

## 3. Goals

1. **4 strips**, one for each income row, each the row's six spaces side by side.
2. **Each space shows its innovation** as one big subject on a plain ground, so a player reads the row's story from the past on the left to the future on the right.
3. **The improved spaces stand out** at a glance: spaces 2, 4 and 6.
4. **The tile fits the income mat's scale.** A building sits on each space, so each space is the size of the approved 32×32 building icon.

## 4. Non-goals

- **Benefits.** The coin, worker, food or culture and the VP of each space are not drawn. As with the other game symbols (#5), the interface shows them with text and the approved resource icons.
- **The income mat** and its F&F overlay. They are cosmetic boards (#51).
- **The interface** that lays a tile on the income tab (#3, #35).
- **The 19 space tiles.** They get their own design.

## 5. Anti-goals

- **Copying Stonemaier's tile art.**
- **Lettering.** No words, letters or numbers: the coin's face, the card, the screens, the dial and the pages carry pictures or plain lines.
- **Real people.** No likeness of a real person.
- **A scene per space.** At 30×30 pixels a scene turns to mush; each space is one object or one creature, as in the approved icons.

## 6. Design

### 6.1 The strip

- **Size.** 192×32: six 32×32 spaces, space 1 on the left, as on the mat. The game can cut a space out at `(space − 1) × 32`.
- **Frame.** Each space has a 1-pixel frame: ink on spaces 1, 3 and 5, gold on spaces 2, 4 and 6.
- **Ground.** The arts track's violet, in four bands from top to bottom: deep on the plain spaces, lit on the improved ones. The arts track symbol (`track/arts`) uses the same violet. The tile is an arts reward, and the violet keeps it apart from the mat it lies on.
- **Sparkle.** A small gold sparkle in the top right corner of each improved space.
- **Shared part.** `art/parts/inspiration-tile.js` draws the frame, the ground and the sparkle, so the four tiles match. Each drawing hands it six drawers, one per space, each painting its innovation on an empty 30×30 canvas.

### 6.2 The innovations

- **Like the approved small pieces** (#5): a bold silhouette with a 1-pixel ink outline, a base tone, a shade and a highlight, light from the top left. About 8 to 20 colours per space. Readable at 2×, the size the income tab will show it at.
- **One subject per space**, filling most of the space with a pixel or two of ground round it. On an improved space, the top right 6×6 corner stays clear for the sparkle.
- **Colours that show on violet.** No large violet or purple areas; new tones are blended with `mix()` inside the drawing.
- **The past on the left, the future on the right.** Stone, wood and clay on spaces 1 and 2; metal, paper and brass in the middle; plastic, screens and teal light on spaces 5 and 6.

| Row | Space | Subject (the builder may refine) |
|---|---|---|
| Markets | 1 Barter | A fish and a clay jar held out to each other by two hands |
| | 2 Currency | A small stack of gold coins, the front one stamped with an owl, not a number |
| | 3 Banking | A round iron vault door with its spoked wheel and bolts |
| | 4 Credit Cards | A plastic card at an angle, its gold chip and coloured stripe, no numbers |
| | 5 E-Commerce | A cardboard parcel taped shut in front of a phone showing a shopping-cart picture |
| | 6 Biometrics | A fingerprint glowing teal on a scanner pad |
| Houses | 1 Symbology | A rock slab painted with a red hand print and a little ochre animal |
| | 2 Language | Two speech bubbles, each holding a small picture: a sun and a fish |
| | 3 Writing | A quill dipped in an inkpot beside a scroll of plain ruled lines |
| | 4 Telephone | A black candlestick telephone with its earpiece on a cord |
| | 5 Email | A white envelope leaping out of a computer screen |
| | 6 Neural Implants | A head in profile with a glowing teal chip at the temple and circuit lines into the brain |
| Farms | 1 Hunting | A leaping deer and a stone-tipped spear |
| | 2 Farming | A sheaf of golden wheat tied with straw, a wooden hoe behind it |
| | 3 Breeding | A ewe and her lamb |
| | 4 Preservation | A glass jar of red fruit, its cloth cap tied with twine |
| | 5 Fertilization | A green seedling in dark soil, granules pouring from a sack |
| | 6 Food Printing | A teal-lit printer nozzle laying down a layered cake on a plate |
| Armories | 1 Ceremony | A painted ceremonial mask crowned with feathers |
| | 2 Racing | A galloping horse's head and neck, mane flying |
| | 3 Team Sports | A leather ball flying into a goal net |
| | 4 Tabletop Games | A chess knight on a corner of a chequered board, a die beside it |
| | 5 Video Games | A grey gamepad with red and blue buttons, its cable curling |
| | 6 Virtual Reality | A VR headset with a glowing teal visor |

### 6.3 Files and checks

- **Files.** One drawing per tile at `art/drawings/inspiration-tile/<row>.js`, exporting `draw()`, built to `static/art/inspiration-tile/<row>.svg` by `npm run art`. The library page picks it up by itself.
- **Tests.** `tests/art-inspiration-tile.test.mjs`, written before the drawings:
  - every tile is 192×32 and paints all 6,144 pixels;
  - the improved spaces have a gold frame and the others an ink one;
  - every space's innovation covers at least a fifth of its inside;
  - no two spaces are the same, on one tile or across tiles;
  - the shared part refuses anything but six spaces;
  - every inspiration tile of A&A is drawn.

### 6.4 Work and review

1. **The shared part and the checks first**, test-first.
2. **Side-by-side drawing:** four subagents, one tile each, writing only their own drawing file.
3. **A fresh review** of all four at 2× and 4× against this design (subject readable, no lettering, improved spaces clear, the four tiles alike in style), and its findings are fixed.
4. **One commit** for the part, the checks, the drawings and their SVGs ("Refs #11: draw the 4 inspiration tiles"), pushed to main. The owner reviews them in the component library (`/components.html#art-parts`). #11 stays open for the space tiles.

### 6.5 As drawn

The builders refined some subjects at 2× and 4×:
- **Currency:** the owl is a stamped silhouette with big round eyes and ear tufts, because a detailed owl read as a cat.
- **Banking:** the wheel has a ring, because four plain spokes read as an "X".
- **Credit Cards:** one plain embossed line, because a row of dashes broke into specks once tilted.
- **Biometrics:** the pad lies flat in perspective, because face-on it read as a monitor.
- **Writing:** seven plain straight lines on the scroll.
- **Email:** the envelope tilts up out of the screen with two speed lines, because a straight one looked pasted on.
- **Neural Implants:** circuit traces run back across the skull instead of a drawn brain.
- **Farming:** serrated ears with whiskers, because plain rounded ears made the sheaf look like a glove. The hoe has a stone blade lashed to its handle.
- **Breeding:** the lamb's face is cream, because pink read as a piglet.
- **Team Sports:** a leather basketball dropping through a hoop into its net. At 30 pixels a laced football read as a bun and a black-and-white one as a skull.
- **Tabletop Games:** an ivory knight, so it shows on the violet, on a board seen from the front.

The fresh review then had these fixed:
- **Ceremony** was redrawn as a teal festival half mask on a stick, with gold-ringed eye holes and a fan of blue, gold and green plumes. The first version, a brown face with cheek stripes, fangs and a feather crown, read as a caricature of a people's regalia.
- **Racing** became a whole dark bay horse at full gallop with a red saddle cloth and speed lines, because a horse's head two spaces from the chess knight read as the same subject.
- **Fertilization** was redrawn with a burlap sack tied at the neck, its mouth spilling an arc of pale granules onto a big two-leaved seedling, because the first sack read as a loaf of bread.
- **Barter:** two raised forearms with cuffs hold up the fish and the jug, because the first hands were too small to read and one sleeve looked like a plant stem.
- **Telephone:** a charcoal body with brass rims on the mouthpiece and foot, because a near-black phone could pass for a microscope.
- **Symbology** paints a bison instead of a deer, and the **Language** bubble holds a bird instead of a fish, so no subject repeats another tile's.
- **Hunting:** a bigger deer leaping up, with the spear flying diagonally toward it. **Farming:** the hoe's handle runs diagonally behind the sheaf.
- **Biometrics:** the scan rays are teal, because the first ones vanished into the violet.
- Every subject now leaves at least one pixel of ground before the frame. The exception is the Neural Implants neck, which runs off the bottom as a cropped portrait.
- **The shared ground:** the plain spaces' two lower bands were lifted a step, because dark outlines faded into them.

## 7. Changes to other documents

- **`docs/art/README.md`:** the inspiration-tile part in the toolkit table, and the strip's own check.
- **CLAUDE.md:** #11 under "Where the work stands": the 4 inspiration tiles drawn and waiting for the owner.

## 8. Calls made in this document (not yet confirmed by the owner)

- **A strip of six innovations**, not one card picture: the tile is a `board` in the catalog and lies on a row of the mat.
- **32 pixels per space**, the size of the approved building icons.
- **The arts track's violet** as the tile's ground, with gold frames and sparkles marking spaces 2, 4 and 6.
- **No benefits drawn**: the interface shows them, as #5 decided for the game symbols.
