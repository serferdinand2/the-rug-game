# Approved icons and small game pieces · issue #5

The owner approved the artwork developed in the local mockup on 2026-10-23 and requested its SVG release. Only that reviewed work is included. The complete mockup, including its historical placeholder sections and linked capital terrain review, is frozen in [archive/2026-10-23-issue-5/](archive/2026-10-23-issue-5/README.md).

| Released artwork | Stable ids | Count | Native size |
|---|---|---:|---|
| Resources: coin, worker, food, culture, any | `resource/<name>` | 5 | 32×32 |
| Income buildings: market, house, farm, armory | `building/<name>` | 4 | 32×32 |
| Exploration, science, technology, military, arts | `track/<name>` | 5 | 32×32 |
| Neutral player token and upright/toppled outposts | `piece/token`, `piece/outpost`, `piece/outpost-toppled` | 3 | Token 32×32; flags 128×128 |
| Five player colors for each of those pieces | `piece/<piece>-<color>` | 15 | Same as the neutral version |
| Capital terrain: 8 buildable and 6 impassable variants for each of 6 biomes | `capital-terrain/<biome>-open-01` through `open-08`, and `<biome>-blocked-01` through `blocked-06` | 84 | 32×32 |
| Six example capital mat compositions, for reference only | `capital-mat/<biome>` | 6 | 288×288 (9×9 plots) |

There are **122 SVGs** in this release. The capital terrain and base mats were reviewed alongside the icons; they contribute to #6 without completing the rest of that issue. Capital terrain plots are separate from the deferred terrain **hex markers** below.

The six full mat SVGs are **examples only**: they demonstrate how the reusable terrain tiles compose into a mat. **Actual capital mats must be generated from those tiles for each game**, using that game's setup and the appropriate buildable/impassable layout. Do not load these fixed example SVGs as the actual in-game mats. The catalog marks them with `example: true`, and the gallery labels them as examples. `drawCapitalMat` produces the fixed reference compositions; the gameplay renderer must assemble each game's actual mats from the tile set. This rendering choice does not change the capital's rules-defined plot layout.

Every released asset lives at `static/art/<id>.svg`, with a matching editable drawing in `art/drawings/<id>.js` and an entry in `src/lib/art/catalog.js`. `npm run art` reproduces the SVGs, and the component library renders the same drawings. The imported sprites retain their exact SVG pixel runs, colors and alpha values; no PNG is embedded in the shipped SVGs. The reference hashes and dimensions are in [approved-assets.json](approved-assets.json).

The neutral player fill is **#b3afc2**, the same gray as the outpost. The token's fill covers only the enclosed interior; the outside stays transparent. The five variants use the player colors from `src/styles/tokens.css`: blue, red, green, yellow and purple. Their suffixes are `-blue`, `-red`, `-green`, `-yellow` and `-purple`; only the reserved gray channel changes.

## Why the remaining groups do not need special assets yet

- **Dice faces:** science results can use text, numerals or the approved track symbols, and conquer results can use text and the existing resource/VP labels. The dice controls can compose those values when implemented. Separate face illustrations are unnecessary for this issue; any decorative die artwork can be drawn later if the final control needs it.
- **Terrain hex markers:** these identify terrain types and can use text labels and the terrain artwork composed for the map and territory tiles in #6. The five mockup marker icons were placeholders. Any dedicated marker drawing belongs with that later map work, rather than being required to close #5.
- **Game symbols (VP, territory tiles, tapestry cards, tech cards and space tiles):** the interface can use text labels and counts for these concepts. Cards and tiles will use their own pictures when drawn. Any additional pictograms can be drawn later when their actual placement is settled.

These groups remain catalogued so existing ids stay stable, but their mockup placeholder drawings are preserved only in the archive. The owner’s scope decision resolves their requirement for #5 without presenting placeholder art as a finished asset.

## Validation

The approved-art tests check every released SVG against its frozen reference, verify the five player masks and exterior transparency, and check that all six impassable variants in each biome are distinct. The existing art build tests check that every committed SVG is reproducible from its drawing and belongs to the catalog.
