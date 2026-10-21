# Landmarks: 33 pictures in their footprint's shape (#7): design

Written 2026-10-21 and revised the same day after the owner reviewed the first samples. It builds on the art toolkit from #4 ([2026-10-21-art-toolkit-design.md](2026-10-21-art-toolkit-design.md)) and its catalog ids.

## 1. What and why

Each landmark gets **one picture, drawn in the shape of its footprint**.
- **On the board,** that picture covers exactly the landmark's plots on the capital-city grid.
- **On the card,** the same picture sits inside the card frame. The frame is #47.

There are no separate board pieces. The owner's firm requirement is that every landmark **takes exactly the right squares on the board**. The look of the pictures is left to the builder.

## 2. What the owner decided (2026-10-21)

- **The look is the builder's call**, within art style C.
- **Approved.** The owner reviewed all 33 pictures in the asset gallery, sorted from the largest footprint to the smallest, and approved them on 2026-10-21.
- **One picture per landmark, in its footprint's shape**, used both on the card and on the board.
  - The first version of this design had a 64×64 card picture plus a separate top-down board piece. After seeing the samples, the owner dropped the top-down pieces.
- **32 pixels per plot.**
  - A 2×2 landmark is 64×64, exactly the size of the approved Lighthouse, so the Lighthouse and the Forge stay as drawn.
  - Bigger footprints get bigger pictures: 96×96 for 3×3, and up to 128×128 for the Rubber Works.
  - On a card, larger landmarks are scaled down to fit the frame.
- **Footprints must be exact.** The plot count and shape must match the rules, and the build and a test prove it.
- **An asset gallery in `art/preview/`, for now.**
  - It shows every sprite and SVG in the catalog: drawn ones as pictures, the rest as labelled empty slots.
  - The owner approves art there, including #7's landmarks.
  - The players' gallery with card frames (#47) stays for later and still waits for #3.

## 3. Goals

1. **Footprint data** for all 33 landmarks, taken from the research and the rules conventions, in one plain data module.
2. **33 landmark pictures**, each covering exactly its footprint at 32 pixels per plot. They vary by era and time of day, so the set reads as a journey through history.
3. **The asset gallery** in `art/preview/`, where the owner reviews everything (6.5).
4. **A review step.** Three sample landmarks first, then the other 29. The Lighthouse is already done.

## 4. Non-goals

- **Card frames and the players' gallery page.** They are #47 and wait for #3. #47 decides how a non-square picture sits in the frame.
- **Placement rules.** Rotating, placing and checking a landmark against the grid belong to the rules engine (#12 onward) and the Capital view (#27). This work only supplies footprints and pictures.
- **The icons in #5:** resources, buildings, dice and so on.
- **Landmark heights**, used for a tie-breaker. That is rules data for #12.

## 5. Anti-goals

These would make the work a failure even if it ran:
- **A picture that covers the wrong plots.** One plot too many or too few counts.
- **A mirrored footprint.** The Villa, Birdwatching Perch and Castle use the corrected footprints that match the miniatures (R65). Mirroring is never legal (R15).
- **Copying Stonemaier's miniatures or card art.** The pictures are our own interpretation of each landmark's name.
- **Changing the approved Lighthouse.** `landmark/lighthouse` stays exactly as it is.
- **A landmark cut off by its own shape.** In an uneven footprint, the landmark itself sits inside the shape. Only background (sky, ground) fills the outer plots.

## 6. Design

### 6.1 Footprint data

- **The module.** `art/footprints.js` exports:
  - `FOOTPRINTS`, a frozen record from landmark slug to rows. Each row is a string of `X` (occupied plot) and `.` (empty), with the top row first, exactly as printed. Example: `'rubber-works': ['..XX', '..XX', 'XXXX', 'XXXX']`.
  - `PLOT_SIZE = 32`.
  - `footprintMismatches(canvas, rows)`.
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

### 6.2 The pictures

- **Files.** One drawing per landmark at `art/drawings/landmark/<slug>.js`, built to `client/static/art/landmark/<slug>.svg`.
- **Size and shape.** The canvas is `columns × 32` wide and `rows × 32` tall: the Forge is 64×64, the Launch Pad 96×64 and the Rubber Works 128×128.
  - Every pixel inside an occupied plot is filled.
  - Every pixel inside an empty plot is empty, so on the board the picture covers exactly its plots.
  - The build refuses a landmark picture that breaks this. The 64×64 rule for other illustrations doesn't apply to landmarks.
- **Orientation.** Pictures are drawn in the footprint's printed orientation. The Capital view rotates them in 90° steps for rotated placements (R15). Nothing is ever mirrored.
  - The sources disagree for two landmarks. 02 §5 draws the Launch Pad and the Library wider than tall, while 01 §6.3 has them taller than wide. This document follows 02. All four rotations are legal, so this only sets the default way the picture faces. **(builder's call)**
- **Framing.** As in the Lighthouse: the landmark is the large subject, standing in its own setting, with an outline pass and the background drawn from the scene parts. In an uneven footprint, compose the landmark inside the shape (anti-goals).
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

### 6.3 Palette and parts

- **Colours.** New colours go into `PALETTE`, as the toolkit's rules require.
- **Parts.** A shape that two or more landmarks need, such as a city skyline, smoke or floodlights, becomes a scene part in `art/parts/`, tested like the others. Smoke and steam are already one (`art/parts/smoke.js`). Anything used once stays in its drawing.

### 6.4 Tests

- **Footprints:**
  - there is one entry per landmark in the catalog, and no others;
  - each row has the same length and contains only `X` and `.`;
  - no edge row or edge column is completely empty;
  - each landmark's plot count matches the table in 6.1, written as literals in the test;
  - the checker reports a wrong size, a hole, and paint outside the footprint.
- **The scale:** the approved Lighthouse covers its 2×2 footprint exactly at 32 pixels per plot.
- **Every drawn landmark** covers exactly its footprint. The test runs over whatever is drawn, so it covers each batch as it lands, and the build refuses a mismatch.
- **Completeness:** every landmark in the catalog is drawn. This test is added with the last batch.
- **No regressions:** the Lighthouse still matches the approved prototype. The #4 tests already pin it.

### 6.5 The asset gallery (`art/preview/`)

The owner's working gallery, until the players' gallery (#47) exists.

- **Where it lives.** `npm run art` writes `art/preview/index.html`, generated by `art/preview/build.mjs`.
  - The page is self-contained, with every SVG inline, so it opens straight from disk without a server.
  - It is git-ignored.
- **What it shows.**
  - The scene parts on their own.
  - **Every asset in the catalog**, in `GROUPS` order, each group under its label with counts, for example "Landmarks · 33 · 4 drawn". Within a group, assets are listed by expansion.
  - **Each drawn asset** as its SVG at its own size, scaled 2× and 4×, with its id and name.
  - **Each asset not drawn yet** as a labelled empty slot with its id, name and the issue that will draw it.
  - **Each landmark** with its 32-pixel plot grid laid over it, so the footprint can be checked by eye.

### 6.6 Review and order

1. **The gallery, the footprint data and the build check** come first. Done.
2. **Three samples:** Forge (day), Train Station (dusk) and Launch Pad (night). The owner reviews them in the gallery to approve the direction.
3. **The other 29** follow in two commits: the rest of the base game, then Plans & Ploys and Arts & Architecture. The owner approves the whole set in the gallery, and #7 closes.

## 7. Changes to other documents and issues

- **The catalog.**
  - The `landmark-marker` group is removed: the board shows each landmark's picture.
  - The catalog drops from 445 to 412 assets (293 illustrations, 37 icons, 82 boards).
- **The toolkit design §7.4 and the main design document:** remove the landmark grid markers, and update the counts.
- **Issue #5:** the landmark markers are dropped, not moved.
- **Issue #7:** one picture per landmark in its footprint's shape. "The gallery" in its checklist means the asset gallery in `art/preview/`.
- **CLAUDE.md and `docs/art/README.md`:** the landmark picture rule, `art/footprints.js` and the new asset count.

## 8. Calls made in this document (not yet confirmed by the owner)

- The era and time-of-day scheme, and every subject in 6.2.
- The footprints living in `art/footprints.js` for now, with #12 required to reuse them.
- Review in two steps: three samples, then the rest.
- New scene parts only for shapes two or more landmarks share.
- The gallery page: generated and git-ignored, self-contained so it opens from disk, with 2× and 4× sizes, grouped by group and then expansion.

## 9. Left to the builder

- Each picture's composition and details, within the subjects in 6.2 and the footprint's shape.
- Which new parts and palette colours to add.
