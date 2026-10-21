# Art toolkit and asset catalog (#4, part 1): design

Written 2026-10-21. It covers the parts of issue #4 that don't depend on the new interface look. The main design document is [2026-10-20-the-rug-game-design.md](2026-10-20-the-rug-game-design.md).

## 1. Why, and why now

Every picture in the game is a 64×64 pixel-art scene in art style C, approved on 2026-10-20. The reference is `docs/art/style-c/lighthouse-scene.svg`, drawn by the one-off script `docs/art/style-c/lighthouse.mjs`. There are 293 illustrations, 37 icons and 82 boards, tiles and hexes to draw (#5–#11). (The count was 70 icons until the 33 landmark grid markers were dropped on 2026-10-21; see §7.4.) They need:
- a shared way to draw them;
- one list of what exists, so progress can be tracked and the game can refer to each picture by a stable id.

The interface is being redesigned in #3. A new mockup (2026-10-21) has a different layout and look, and a new `base.css`, `tokens.css` and `docs/ui/` are coming from lazar-milin. Anything that depends on the interface's look waits for them. The drawing toolkit and the catalog don't, so they are built now. The owner asked for this on 2026-10-21, while #3 was still open.

## 2. What the owner decided (2026-10-21)

- **There is no phone layout.** The game is for desktop screens only. This is already recorded in the main design document and the issues.
- **The asset gallery is also the players' card reference.**
  - It is one page that shows every card, so players can look things up during a game.
  - Undrawn art appears as a labelled empty slot, so the same page still serves for approving art.
  - This merges the gallery from #4 with the "card reference" planned for M10.
- **A components library is needed.** It is a page that shows every interface piece with its states. It is #48.
- **Art style C stays**, even though the interface around it is changing.
- **The scene parts are approved.** The owner reviewed them on the preview sheet and approved them as built (2026-10-21).
- **Order.**
  - **Now:** the toolkit and the catalog (this document).
  - **Waiting for the new interface base:**
    - the card frames;
    - the gallery and card-reference page;
    - the components library.

## 3. Goals

1. A **pixel painter**: a small library that draws on a pixel grid and writes vector SVG with one `crispEdges` path per colour, generalised from the lighthouse prototype.
2. A **shared art palette** and **reusable scene parts**:
   - skies and the sea;
   - the four land terrains (forest, mountain, desert, grassland);
   - generic buildings and figures.
3. A **catalog of every asset** the game needs, by type and expansion, each with a stable id the game will use.
4. **The Lighthouse rebuilt with the toolkit**, pixel-identical to the approved prototype.
5. **One command** that redraws every asset that has a drawing into the served art folder. Tests check that the committed SVGs are up to date.
6. A **preview sheet** in `docs/art/` that shows the scene parts and the drawn assets, so the owner can review the parts before the gallery exists.

## 4. Non-goals

These belong to other issues or wait for the new interface base:
- **Card frames** for civilizations, tapestry cards, tech cards and landmarks. They wait for the new base, because their colours and fonts come from it. They are part of #47.
- **The gallery and card-reference page.** It also waits, as part of #47. It will read this catalog.
- **The components library** (#48).
- **Drawing the assets themselves** (#5–#11). This work only draws the Lighthouse and the scene parts.
- **Card text.** Names are in the catalog, but effect text comes from the rules data in #12. The reference page will show names and art first and gain text when #12 lands.
- **Icons for card effects**, such as VP, explore, conquer and invent. How effects are written depends on the new `docs/ui/`, so these icons are added to the catalog once that arrives.

## 5. Anti-goals

These would make the work a failure even if it ran:
- Inventing content. Anything the README's "Rules conventions" lists as left out (R43, R44, R46, R47, R55, R57, R59, R60, R66, R77) gets no catalog entry.
- A Lighthouse that only looks close. It must match the prototype pixel for pixel.
- Ids that change later. Once the game uses an id, renaming a card's display name must not change it.
- Raster images. Everything is SVG made of `crispEdges` paths.
- Art production files in `public/` or `client/static/`. Only the finished SVGs are served.

## 6. Constraints from the project

- JavaScript ES modules with JSDoc and no TypeScript. There are no runtime packages, so the toolkit uses only Node built-ins.
- CONVENTIONS.md applies throughout:
  - a one-line comment at the top of each file;
  - JSDoc on exports;
  - braces on every `if`;
  - Prettier formatting.
- `npm run check` must stay at zero errors and zero warnings. Add the new folder to `jsconfig.json`'s `include`.
- `node:test` suites in `tests/`, written first.
- No `Math.random()`. The randomness used in drawings, such as stars and waves, comes from a seeded generator, so every run gives the same picture.
- Served files come from `client/static/`, which Vite copies into `public/`. The server already caches `art/` for a week.

## 7. Design

### 7.1 Where things live

A new top-level folder, `art/`, holds the toolkit, the catalog and the drawings:

```
art/
  painter.js        Canvas, drawing helpers, outline, mix, seeded random, toSvg
  palette.js        Named colours of style C
  catalog.js        Every asset: id, name, kind, group, expansion, art issue
  parts/            Reusable scene parts: sky.js, sea.js, terrain.js, buildings.js, figures.js
  drawings/         One module per drawn asset, at art/drawings/<id>.js
  build.mjs         Draws every asset that has a drawing into client/static/art/<id>.svg
  preview.mjs       Writes docs/art/preview.html (the review sheet)
```

- `npm run art` runs `node art/build.mjs`, then `node art/preview.mjs`.
- The generated SVGs in `client/static/art/` are committed, as in the sibling projects.
- `art/catalog.js` is plain data with no Node or DOM imports, so the client can import it later for the gallery.
- `docs/art/style-c/` keeps the approved prototype and its script unchanged, as the reference the tests compare against.
- Update CONVENTIONS.md's project layout, CLAUDE.md's architecture section and `docs/art/README.md`. The README explains how to add a drawing.

### 7.2 The pixel painter

`art/painter.js` generalises the helpers in `lighthouse.mjs` into documented, exported functions. It must cover everything the Lighthouse needs:
- a canvas of any size, where each pixel is a colour or empty;
- `set`, `get`, `rect` and `fillEmpty`;
- `outline`, which draws a colour around filled shapes;
- `mix(a, b, t)` for colour blending;
- a seeded random generator, the same linear congruential generator as the prototype, so the Lighthouse matches;
- compositing one canvas over another, as the prototype does when it lays the scene over the sky-and-sea layer;
- `toSvg`. It merges horizontal runs and writes one `<path>` per colour, with optional per-colour opacity, a `viewBox` of the canvas size and `shape-rendering="crispEdges"`. Its output format matches the prototype's.

The function names and signatures are the builder's call.

### 7.3 Palette and scene parts

- `art/palette.js` names the colours in the prototype: outline, cream, brick red, gold, lamp light, dusk purples, stone greys, foam, wood and so on. It adds the colours the parts need.
- Each scene part is a function that draws onto a canvas. It takes the canvas, a placement and options, plus the random generator, so a scene's random sequence stays in one stream.
  - **Skies.** The prototype's night sky, with stars and a moon, comes first. Add a day sky and a dusk sky.
  - **Sea.** The prototype's night sea with waves comes first. Add a daytime sea.
  - **Terrain.** Forest, mountain, desert and grassland, as a ground band or foreground that a scene stands on.
  - **Buildings.** A few generic pieces that many scenes need: a house, a tower and a wall.
  - **Figures.** One small standing person.
- The Lighthouse drawing uses the night sky and night sea parts. Its output must still match the prototype, so these two parts reproduce the prototype's drawing order and its use of the random stream.
- How many variants each part has beyond this minimum, and how they look, is the builder's call. The owner reviews them on the preview sheet (7.7), and they can change before #5–#11 start.

### 7.4 The catalog

`art/catalog.js` exports one array of assets. Each asset is a plain object:

| Field | Example | Meaning |
|---|---|---|
| `id` | `'landmark/lighthouse'` | Stable id: `<group>/<slug>`. It is also the file path `art/<id>.svg` |
| `name` | `'Lighthouse'` | Display name, spelt as in Appendix A |
| `kind` | `'illustration'` | `'illustration'`, `'icon'` or `'board'` |
| `group` | `'landmark'` | See the table below |
| `expansion` | `'base'` | `'base'`, `'pp'`, `'aa'` or `'ff'` |
| `issue` | `7` | The art issue (#5–#11) that draws it |

Rules for ids:
- Each id is written out literally in the catalog, never computed from the name, so later spelling fixes don't change ids.
- The slug is lowercase ASCII, with words joined by hyphens and accents and punctuation dropped: `Déjà Vu` → `deja-vu`, `S.T.E.A.M.` → `steam`, `Wizards' Guild` → `wizards-guild`. A leading "The" is kept: `the-chosen`, `the-nail`, `the-kraken`.
- The group prefix separates items that share a name, such as Astronomy (tapestry) and the Opera tech card versus the Opera House landmark. A landmark and its tech card share a slug but not a group: `tech/bakery` and `landmark/bakery`.
- The rules engine (#12) uses the same ids for the same things. This document fixes them first.

Whether an asset is drawn isn't stored. It is drawn when `art/drawings/<id>.js` exists. Nothing in the catalog can then fall out of step with the files.

Groups and counts after the left-out rules (names in Appendix A):

| Group | Kind | Base | P&P | A&A | F&F | Total | Art issue |
|---|---|---|---|---|---|---|---|
| `civ` | illustration | 16 | 10 | 5 | 10 | 41 | #8 |
| `tapestry` | illustration | 44 | 13 | 20 | 37 | 114 | #9 |
| `tech` | illustration | 33 | – | 11 | 12 | 56 | #10 |
| `landmark` | illustration | 18 | 7 | 8 | – | 33 | #7 |
| `landmark-card` | illustration | – | 5 | 5 | – | 10 | #11 |
| `space-tile` | illustration | 15 | 4 | – | – | 19 | #11 |
| `masterpiece` | illustration | – | – | 20 | – | 20 | #11 |
| `resource` | icon | 5 | – | – | – | 5 | #5 |
| `building` | icon | 4 | – | – | – | 4 | #5 |
| `piece` | icon | 3 | – | – | – | 3 | #5 |
| `die` | icon | 14 | – | 1 | – | 15 | #5 |
| `terrain` | icon | 5 | – | – | – | 5 | #5 |
| `track` | icon | 4 | – | 1 | – | 5 | #5 |
| `board` | board | 5 | – | – | 1 | 6 | #6 |
| `hex` | board | 6 | – | – | – | 6 | #6 |
| `territory-tile` | board | 48 | – | – | – | 48 | #6 |
| `capital-mat` | board | 6 | – | 6 | 6 | 18 | #6 |
| `inspiration-tile` | board | – | – | 4 | – | 4 | #11 |

That gives 293 illustrations, 37 icons and 82 boards (412 assets). On 2026-10-21 the owner dropped the 33 `landmark-marker` icons: the board shows each landmark's own picture, drawn in its footprint's shape (see [2026-10-21-landmarks-design.md](2026-10-21-landmarks-design.md)).

Notes on the counts:
- **Tapestry.** The Trap is one picture for its 7 copies. Infrastructure Boost, the unnamed "Arc…" card (R43, R44) and Cloud Colonies (R77) are left out.
- **Replacement cards are not separate pictures.** The F&F Oil Paint, Migration and the three corrected landmark cards, and the P&P space tile 11, each replace the original.
- **Pieces.** These are an upright outpost, a toppled outpost and a player token, each drawn once and recoloured per player. The recolouring technique is the builder's call, for example marking the player-colour paths so CSS can fill them.
- **Dice.** The science faces show the four track symbols. Red: 4, 5, 6 and 7 VP and "1 VP per territory". Black: coin, worker, food, culture and "?". A&A adds the arts face for the d20.
- **Boards follow #6.**
  - The boards are the large map (4–5 players), the small map (1–3 players), the tracks-view backdrop, the income mat, the table background, and the F&F income-mat overlay "[5]" (one design for its 5 copies).
  - The arts track is a fifth row of the tracks view, so it shares the backdrop instead of having its own board.
  - The landmark board and the Automa income mat get no art. The interface shows free landmarks on the track spaces and draws the Automa mat as a component.
- **Hexes** are the map terrain art #6 asks for: sea, desert, forest, grassland, mountain and unexplored. The map sides are built from them.
- **Territory tiles** are the 48 tiles of R4, with ids `territory-tile/1` … `territory-tile/48`. #6 draws them.

### 7.5 Drawings and the build

- A drawing module exports one function that returns a finished canvas: 64×64 for an illustration, and a size of the builder's choosing for icons and boards.
- `art/build.mjs` walks the catalog. For each asset with a drawing, it writes `client/static/art/<id>.svg`.
- It fails if a drawing has no catalog entry.

### 7.6 Tests

- **Painter:**
  - `toSvg` writes one path per colour and merges runs;
  - empty pixels are left out;
  - opacity is applied;
  - `outline` only fills empty neighbours;
  - the seeded generator gives the same sequence for the same seed.
- **Lighthouse:** the toolkit's Lighthouse has exactly the same pixels as `docs/art/style-c/lighthouse-scene.svg`. The test reads both SVGs back into pixel grids, so path order doesn't matter.
- **Catalog:**
  - every id matches `^[a-z0-9-]+/[a-z0-9-]+$` and is unique;
  - every id starts with its own group;
  - each group's count per expansion matches the table in 7.4;
  - no left-out item appears.
- **Build:**
  - every drawing has a catalog entry;
  - every SVG in `client/static/art/` belongs to a catalog id and has a drawing;
  - each committed SVG equals what its drawing produces now, so forgetting `npm run art` fails the tests.

### 7.7 Preview sheet

- `art/preview.mjs` writes `docs/art/preview.html`, a static page for production and review that is never served.
- It shows every scene part on its own at 1× and 4×, and every drawn asset at 64 px and 256 px.
- It is a contributor tool, so its look doesn't need approval. The parts shown on it do.

## 8. Changes to other documents and issues

- **Main design document §5.**
  - The tapestry row becomes 44 / 13 / 20 / 37 = 114.
  - Add a note that the gallery doubles as the card reference, and that M10's card reference is the same page.
- **Issues (done on 2026-10-21, with the owner's approval):**
  - #4 is now "Build the art toolkit and the asset catalog", and #3 no longer blocks it.
  - #47, "Build the card frames and the card gallery page", is blocked by #3 and #4.
  - #48, "Build the components library page", is blocked by #3.
  - #9 now says 114 tapestry pictures, and #42 links to #47.
- **Main design document §6.** Item 4 becomes the toolkit and catalog. Add the card gallery (#47) to M2 and the components library (#48) to M5.

## 9. Calls made in this document (not yet confirmed by the owner)

- The new top-level `art/` folder, and committing the generated SVGs.
- The id format `<group>/<slug>`, the slug rules and the expansion codes `base`, `pp`, `aa` and `ff`.
- The spellings in Appendix A where sources disagree, and Commercial Center counted as A&A.
- Replacement cards replace the original picture instead of adding one.
- The board list follows #6. There is no separate arts-track board, landmark board or Automa income-mat art.
- No illustrations for Automa civilization cards or decision cards. They aren't in the design document's art count. The reference page can show them as text cards from the rules data. Adding portraits later only means adding catalog entries.
- The minimum set of scene parts in 7.3.
- The preview sheet in `docs/art/`.

## 10. Left to the builder

- Function names and signatures in the painter and the parts.
- The extra palette colours, and how many variants each scene part has beyond the minimum in 7.3.
- Icon and board canvas sizes.
- How player colours are swapped into piece icons.
- The preview sheet's layout.

## Appendix A: names per group

Spellings follow the research catalogues: 02 for base content, and 03's card lists for the expansions. Where sources disagree, these are the spellings used:
- Pillage and Plunder; Siegecraft; Lithium-Ion Battery; Rubber Works; Ghost Ship; The Kraken; Wetland.
- Commercial Center is an A&A card. 03 §2.5 lists it among the 20, and 02 calls it P&P.

**Civilizations.**
- **Base:** Alchemists, Architects, Craftsmen, Entertainers, Futurists, Heralds, Historians, Inventors, Isolationists, Leaders, Merrymakers, Militants, Mystics, Nomads, The Chosen, Traders.
- **P&P:** Advisors, Aliens, Infiltrators, Islanders, Recyclers, Riverfolk, Spies, Tinkerers, Treasure Hunters, Utilitarians.
- **A&A:** Collectors, Gamblers, Relentless, Renegades, Urban Planners.
- **F&F:** Artificers, Celestials, Elder Ones, Faefolk, Genies, Illuminati, Merfolk, Psionics, Weefolk, Werefolk.

**Tapestry cards.**
- **Base:** Academia, Age of Discovery, Age of Sail, Age of Wonders, Alliance, Boast of Superiority, Broker of Peace, Capitalism, Coal Baron, Colonialism, Dark Ages, Democracy, Dictatorship, Diplomacy, Dystopia, Empiricism, Espionage, Exploitation, Feudalism, Golden Age, Guilds, Industrialism, Marriage of State, Mercantilism, Meritocracy, Militarism, Monarchy, Oil Magnate, Olympic Host, Pillage and Plunder, Pirate Rule, Plea for Aid, Renaissance, Revisionism, Revolution, Socialism, Steam Tycoon, Technocracy, Terraforming, Theocracy, Trade Economy, Tyranny, Wartime Economy, Trap.
- **P&P:** Astronomy, Cartography, Double Cross, Engineering, Entertain the Masses, Manifest Destiny, Public Works, Retreat, Status Quo, Stolen Plans, Surprise Party, Surrender, World's Fair.
- **A&A:** Age of Enlightenment, Artistic Inspiration, Commercial Center, Found Art, Government Grants, Granges, Information Age, Infrastructure Upgrade, Migration, Monuments, Moon Landing, National Parks, Plague, Political Posturing, Silk Road, Space Race, Spymaster, Star Chamber, S.T.E.A.M., Trade Routes.
- **F&F:** Alien Disclosure, Astral Expeditions, Chimera-Citizen Rights, Citadel of Power, Déjà Vu, Doppelgangers, Dream Monitors, Ecstatic Visions, Generation Ships, Ghost Ship, Ghost Towns, Good Omens, Great Library of Potions, Gremlins, Haunted Houses, High Council, Hive Mind, Interdimensional Trade, The Kraken, League of the Charmed, Living Cities, Lost Artifacts, Microbial Magic, Muses, Phantasmal Paladins, Quest Culture, Robotic Decoys, Secret Societies, Seer Sight, Soothsaying, Superpower Regulators, Suspended Animation, Technomancy, Temporal Nomadism, Uploaded Consciousness, Wizards' Guild, Zombie Army.

**Tech cards.**
- **Base:** Air Conditioning, Ammonia, Anesthesia, Assembly Line, Bakery, Barn, Calendar, Canned Food, Clocks, Com Tower, Compass, Concrete, Dynamite, Eyeglasses, Irrigation, Library, Light Bulb, Lithium-Ion Battery, Paper, Penicillin, Printing Press, Radio, Sewage & Plumbing, Siegecraft, Stock Market, Telescope, The Nail, Time Travel, Transistors, Treasury, Vaccines, Warships, Zeppelins.
- **A&A:** Astrolabe, Automation, Calculus, Duct Tape, Jet Fuel, Microphone, Oil Paint, Opera, Public Art, Suburbs, War College.
- **F&F:** Golem Minions, Levitation, Mind Control, Object Cloning, Perfect Memory, Pyrokinesis, Remote Viewing, Superhuman Strength, Super Speed, Teleportation, Transmogrification, Weather Control.

**Landmarks.**
- **Base:**
  - Track landmarks: Lighthouse, Train Station, Launch Pad, Apothecary, Academy, Laboratory, Forge, Rubber Works, Tech Hub, Barracks, Tank Factory, Fusion Reactor.
  - From tech cards: Bakery, Barn, Com Tower, Library, Stock Market, Treasury.
- **P&P:** Digital Studio, Game Store, Skyscraper, TV Station, Urban Farm, Stadium, Monolith.
- **A&A:** Villa, Birdwatching Perch, Castle, Windmill, Bridge, Clock Tower, Opera House, Holocenter.

**Landmark cards.**
- **P&P:** Game Store, TV Station, Digital Studio, Skyscraper, Urban Farm.
- **A&A:** Villa, Birdwatching Perch, Castle, Windmill, Bridge.

**Space tiles.**
- **Base:** Space tile 1–15 (ids `space-tile/1` … `space-tile/15`).
- **P&P:** Technology 5 VP, Science 5 VP, Military 5 VP, Monolith.

**Masterpieces (A&A).** Animation, Art Deco, Ballet, Baroque, Calligraphy, Ceramics, Costuming, Fresco, Graffiti, Haute Cuisine, Krav Maga, Mapmaking, Mime, Modern Dance, Motion Picture, Painting, Stained Glass, Tapestry, Theater, Topiary.

**Capital mats.**
- **Base:** Mountain, Wetland, Tropical, Desert, Grassland, Forest.
- **A&A:** Archipelago, Canyon, Cavern, Cloud City, Mesa, Swamp.
- **F&F:** Quagmire, City in a Bottle, Veil, Savanna, Polar, Netherworld.

**Inspiration tiles (A&A).** Markets, Houses, Farms, Armories.

**Icons.** The ids are written out here, because their names don't slug cleanly.
- **Resources:** `resource/coin`, `resource/worker`, `resource/food`, `resource/culture`, `resource/any` (any resource; the rules data also calls it `any`).
- **Buildings:** `building/market`, `building/house`, `building/farm`, `building/armory`.
- **Pieces:** `piece/outpost`, `piece/outpost-toppled`, `piece/token`.
- **Terrain:** `terrain/sea`, `terrain/desert`, `terrain/forest`, `terrain/grassland`, `terrain/mountain`.
- **Tracks:** `track/exploration`, `track/science`, `track/technology`, `track/military`, and `track/arts` (A&A).
- **Dice.** Each id names its die, because faces look different on each die.
  - Science: `die/science-exploration`, `die/science-science`, `die/science-technology`, `die/science-military`, and `die/science-arts` (A&A, on the d20).
  - Red: `die/red-4-vp`, `die/red-5-vp`, `die/red-6-vp`, `die/red-7-vp`, `die/red-vp-per-territory`.
  - Black: `die/black-coin`, `die/black-worker`, `die/black-food`, `die/black-culture`, and `die/black-tile-benefit`. That is the "?" face, which gives the conquered territory tile's benefit (R8).

**Boards.**
- **Base:** `board/map-large`, `board/map-small`, `board/tracks`, `board/income-mat`, `board/table`.
- **F&F:** `board/income-overlay` (the "[5]" overlay).

**Hexes.** `hex/sea`, `hex/desert`, `hex/forest`, `hex/grassland`, `hex/mountain`, `hex/unexplored`.

**Territory tiles.** `territory-tile/1` … `territory-tile/48`, numbered as in 01 Appendix B (R4).

**Space tile ids for P&P:** `space-tile/technology-5-vp`, `space-tile/science-5-vp`, `space-tile/military-5-vp`, `space-tile/monolith`.

**Capital mat ids** use the mat name: `capital-mat/mountain` … `capital-mat/city-in-a-bottle`.
