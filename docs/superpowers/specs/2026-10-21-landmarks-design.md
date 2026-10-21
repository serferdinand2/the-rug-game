# Landmarks: 33 pictures and 33 board pieces (#7): design

Written 2026-10-21. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)) and its catalog ids.

## 1. What and why

Every landmark needs two pictures:
- **A card picture.** A 64×64 style C scene, framed like the approved Lighthouse (`landmark/<slug>`). The asset gallery, the players' card gallery (#47) and the game's cards show it.
- **A board piece.** A top-down picture that sits on the capital-city grid and covers exactly the landmark's footprint (`landmark-marker/<slug>`). The Capital view shows it when a landmark is placed.

The owner's one firm requirement is that every landmark **takes exactly the right squares on the board**. The look of the pictures is left to the builder.

## 2. What the owner decided (2026-10-21)

- **The look is the builder's call**, within art style C.
- **The board pieces are part of #7**, so the owner approves each landmark's picture and board piece together. Until now they were planned for #5.
- **Footprints must be exact.** The plot count and shape must match the rules, and a test proves it.
- **An asset gallery in `art/preview/`, for now.**
  - It shows every sprite and SVG in the catalog: drawn ones as pictures, the rest as labelled empty slots.
  - It replaces the preview sheet from #4, and the owner approves art there, including #7's landmarks.
  - The players' gallery with card frames and card text (#47) stays for later, still waiting for #3.

## 3. Goals

1. **Footprint data** for all 33 landmarks, taken from the research and the rules conventions, in one plain data module.
2. **33 board pieces.** Each covers every plot of its footprint and nothing outside it, checked by tests.
3. **33 card pictures**, varied by era and time of day, so the set reads as a journey through history.
4. **A review step.** Three sample landmarks first, to approve the direction, then the other 30.
5. **The asset gallery** in `art/preview/`, built first, where the owner reviews all of it (6.7).

## 4. Non-goals

- **Card frames and the players' gallery page.** They are #47 and wait for #3. Review happens in the asset gallery in `art/preview/` (6.7).
- **Placement rules.** Rotating, placing and checking a landmark against the grid belong to the rules engine (#12 onward) and the Capital view (#27). This work only supplies footprints and art.
- **The other icons in #5:** resources, buildings, dice and so on.
- **Landmark heights**, used for a tie-breaker. That is rules data for #12.

## 5. Anti-goals

These would make the work a failure even if it ran:
- **A board piece that covers the wrong plots.** One plot too many or too few counts.
- **A mirrored footprint.** The Villa, Birdwatching Perch and Castle use the corrected footprints that match the miniatures (R65). Mirroring is never legal (R15).
- **Copying Stonemaier's miniatures or card art.** The pictures are our own interpretation of each landmark's name.
- **Changing the approved Lighthouse.** `landmark/lighthouse` stays exactly as it is.

## 6. Design

### 6.1 Footprint data

- **The module.** A new `art/footprints.js` exports `FOOTPRINTS`: a frozen record from landmark slug to rows. Each row is a string of `X` (occupied plot) and `.` (empty), with the top row first, exactly as printed.
  - Example: `'rubber-works': ['..XX', '..XX', 'XXXX', 'XXXX']`.
- **No imports.** Like the catalog, it is plain data, so the client and the rules engine can load it.
- **Sources:** 02 §5 for the 18 base landmarks, 03 §1.6 for Plans & Ploys, and 03 §2.10 for Arts & Architecture. Two rules settle the doubts: R63 (Castle, 12 plots) and R65 (corrected footprints).
- **One source of truth.** The rules engine (#12) must use this module, or move it into `engine/` and have `art/` import it from there. The footprints must never exist twice.

| Landmark | Footprint | Plots | | Landmark | Footprint | Plots |
|---|---|---|---|---|---|---|
| Lighthouse | `XX/XX` | 4 | | Library | `XXXX/XXXX` | 8 |
| Train Station | `XXX/XXX/XXX` | 9 | | Stock Market | `XX/XX` | 4 |
| Launch Pad | `XXX/XXX` | 6 | | Treasury | `XX/XX` | 4 |
| Apothecary | `XX/XX` | 4 | | Digital Studio | `XXX/XXX` | 6 |
| Academy | `XXXX/XXXX` | 8 | | Game Store | `XXX/XXX` | 6 |
| Laboratory | `XXX/XXX` | 6 | | Skyscraper | `XXX/XXX/XXX` | 9 |
| Forge | `XX/XX` | 4 | | TV Station | `.XX/XXX/XXX` | 8 |
| Rubber Works | `..XX/..XX/XXXX/XXXX` | 12 | | Urban Farm | `.XX/XXX/XXX` | 8 |
| Tech Hub | `XXX/XXX` | 6 | | Stadium | `XXXX/XXXX` | 8 |
| Barracks | `XX/XX` | 4 | | Monolith | `XX/XX` | 4 |
| Tank Factory | `XXX/XXX/XXX` | 9 | | Villa | `X../XXX/XXX` | 7 |
| Fusion Reactor | `.XX/XXX/XXX` | 8 | | Birdwatching Perch | `.XXX/XXX.` | 6 |
| Bakery | `XX/XX` | 4 | | Castle | `.XXX/XXXX/.XXX/.XX.` | 12 |
| Barn | `XXX/XXX/XXX` | 9 | | Windmill | `XXXX/.XX.` | 6 |
| Com Tower | `XXX/XXX` | 6 | | Bridge | `.XX./XXXX/.XX.` | 8 |
| | | | | Clock Tower | `XX/XX` | 4 |
| | | | | Opera House | `XX/XX/.X` | 5 |
| | | | | Holocenter | `XXX/XXX/XXX/.X.` | 10 |

### 6.2 Board pieces

- **Files.** One drawing per landmark at `art/drawings/landmark-marker/<slug>.js`, built to `client/static/art/landmark-marker/<slug>.svg` like any other asset.
- **Scale.** 16 pixels per plot. A piece's canvas is `columns × 16` wide and `rows × 16` tall, so the Forge is 32×32 and the Rubber Works 64×64.
- **The exact-footprint rule.** Every pixel inside an occupied plot is filled, and every pixel inside an empty plot is empty. A piece fills its plots edge to edge; the board draws the grid lines.
- **Orientation.** Pieces are drawn in the footprint's printed orientation. The Capital view rotates them in 90° steps for rotated placements (R15). Nothing is ever mirrored.
  - The sources disagree for two landmarks. 02 §5 draws the Launch Pad and the Library wider than tall, while 01 §6.3 has them taller than wide. This document follows 02. All four rotations are legal, so this only sets the default way the piece faces. **(builder's call)**
- **Look.** A top-down view of the landmark: roofs, towers, yards and the like, seen from above. Each piece uses its card picture's colours, so the two read as one landmark. A building whose footprint isn't a rectangle (the Rubber Works, the Castle, the Holocenter) fills its exact shape.

### 6.3 Card pictures

- **Files.** One drawing per landmark at `art/drawings/landmark/<slug>.js`, 64×64. The build already refuses illustrations of any other size.
- **Framing.** As in the Lighthouse: the landmark is the large subject, standing in its own setting, with an outline pass and the background drawn from the scene parts.
- **Era and time of day.** These set the mood. Tier II and the older landmarks are in daylight, tier III and the industrial and modern ones at dusk, and tier IV and the future ones at night with glowing lights. The Lighthouse keeps its approved night scene.

| Landmark | Subject (builder may refine) | Time |
|---|---|---|
| Lighthouse | (approved, unchanged) | night |
| Train Station | A steam train under an iron-and-glass station roof | dusk |
| Launch Pad | A rocket on its gantry, floodlit | night |
| Apothecary | A herbalist's shop with jars and hanging herbs | day |
| Academy | A columned hall with steps and a dome | dusk |
| Laboratory | A domed research building with glowing windows and an antenna | night |
| Forge | A smithy with an open furnace, anvil and chimney smoke | day |
| Rubber Works | A brick factory with smokestacks and a rubber tree beside it | dusk |
| Tech Hub | A glass tower with lit floors and a server glow | night |
| Barracks | A stone fort with a flag and a gate | day |
| Tank Factory | A factory hall with a tank rolling out | dusk |
| Fusion Reactor | A containment dome with a bright core and pylons | night |
| Bakery | A small shop with an oven glow and bread in the window | day |
| Barn | A red barn with a silo and a field | day |
| Com Tower | A lattice radio mast with blinking lights | night |
| Library | A stone library with tall arched windows | day |
| Stock Market | A columned exchange with a ticker board | dusk |
| Treasury | A vault building with a heavy door and gold | day |
| Digital Studio | A modern studio with screens and a satellite dish | night |
| Game Store | A shopfront with a lit sign and board games in the window | dusk |
| Skyscraper | A tall tower rising above a city | dusk |
| TV Station | A broadcast building with a tall antenna | night |
| Urban Farm | A rooftop greenhouse among city roofs | day |
| Stadium | A stadium bowl with floodlights and a crowd | dusk |
| Monolith | A dark alien slab standing on a plain under stars | night |
| Villa | A white villa with a terracotta roof and cypress trees | day |
| Birdwatching Perch | A wooden hide on stilts by the water, with birds | day |
| Castle | Towers and walls on a hill | day |
| Windmill | A windmill with sails over fields | day |
| Bridge | A stone arch bridge over a river | dusk |
| Clock Tower | A clock tower over town roofs | day |
| Opera House | An opera house front with lit arches | dusk |
| Holocenter | A futuristic hall with a hologram above it | night |

### 6.4 Palette and parts

- **Colours.** New colours go into `PALETTE`, as the toolkit's rules require.
- **Parts.** A shape that two or more landmarks need, such as a city skyline, smoke or floodlights, becomes a scene part in `art/parts/`, tested like the others. Anything used once stays in its drawing.

### 6.5 Tests

- **Footprints:**
  - there is one entry per landmark in the catalog, and no others;
  - each row has the same length and contains only `X` and `.`;
  - no edge row or edge column is completely empty;
  - each landmark's plot count matches the table in 6.1. The expected counts are written as literals in the test.
- **Board pieces:**
  - each piece's canvas is `columns × 16` by `rows × 16`;
  - every pixel in an occupied plot is filled;
  - every pixel in an empty plot is empty.
  - The test runs over every board piece that exists, so it covers each batch as it lands.
- **Completeness:** every landmark has both a card picture and a board piece. This test is added with the last batch.
- **No regressions:** the Lighthouse still matches the approved prototype. The #4 tests already pin it.

### 6.6 Review and order

1. **The asset gallery** (6.7) comes first, because every review happens there.
2. **Footprint data and tests** come next, because they are the owner's firm requirement.
3. **Three samples** follow, one per era: Forge (day), Train Station (dusk) and Launch Pad (night), each with its board piece. The owner sees them in the gallery, with each board piece shown on its plot grid. This approves the direction before 30 more are drawn.
4. **The other 30**, plus the Lighthouse's board piece, follow in two commits: the base game first, then Plans & Ploys and Arts & Architecture. The owner approves the whole set in the gallery, and #7 closes.

### 6.7 The asset gallery (`art/preview/`)

The owner's working gallery, until the players' gallery (#47) exists.

- **Where it lives.** `npm run art` writes `art/preview/index.html`, generated by `art/preview/build.mjs` (moved from `art/preview.mjs`).
  - The page is self-contained, with every SVG inline, so it opens straight from disk without a server.
  - It is git-ignored, like the preview sheet it replaces (`docs/art/preview.html` goes away).
- **What it shows.**
  - The scene parts on their own, as on today's sheet.
  - **Every asset in the catalog**, in `GROUPS` order, each group under its label with counts, for example "Landmarks · 33 · 1 drawn". Within a group, assets are listed by expansion, under the expansion's name.
  - **Each drawn asset** as its SVG at its own size, scaled up 2× and 4×, with its id and name. Nothing is cropped or padded to 64×64; this fixes a minor item deferred from #4.
  - **Each asset not drawn yet** as a labelled empty slot with its id, name and the issue that will draw it.
  - **Each board piece** over a grid of 16-pixel plots, so its footprint can be checked by eye.
- **Tests** (in `tests/art-build.test.mjs`):
  - the page lists every catalog id exactly once;
  - each group's heading shows its total and drawn counts;
  - drawn assets appear as SVG and undrawn ones as empty slots;
  - board pieces are drawn over a plot grid.

## 7. Changes to other documents and issues

- **The catalog.** The `landmark-marker` group's `issue` changes from 5 to 7. The asset counts don't change.
- **The toolkit design §7.4 and the main design document §6:** landmark grid markers move from #5 to #7.
- **Issue #5:** remove the landmark markers.
- **Issue #7:**
  - add the board pieces and the exact-footprint requirement;
  - "the gallery" in its checklist means the asset gallery in `art/preview/`.
- **CLAUDE.md, `docs/art/README.md`, `.gitignore` and `.prettierignore`:**
  - mention `art/footprints.js` and the board-piece rule;
  - replace `docs/art/preview.html` with `art/preview/index.html`.

## 8. Calls made in this document (not yet confirmed by the owner)

- The era and time-of-day scheme, and every subject in 6.3.
- Board pieces at 16 pixels per plot, filling their plots edge to edge, drawn in the printed orientation.
- The footprints living in `art/footprints.js` for now, with #12 required to reuse them.
- Review in two steps: three samples, then the rest.
- The gallery page: generated and git-ignored, self-contained so it opens from disk, with 2× and 4× sizes, grouped by group and then expansion.
- New scene parts only for shapes two or more landmarks share.

## 9. Left to the builder

- Each picture's composition and details, within the subjects in 6.3.
- The top-down design of each board piece, within the exact-footprint rule.
- Which new parts and palette colours to add.
- The preview sheet's layout for board pieces.
