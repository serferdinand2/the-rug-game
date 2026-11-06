# Fantasies & Futures reliefs (#133): design

Written 2026-11-06. The owner set the look over one round of throwaway sketches. What the owner said or chose is marked **(owner)**; every other decision is **(my call)**.

The approved sketches are kept as a reference in `docs/art/issue-133/`:
- `approved-<biome>.png`, one per mat: the specimen sheet (a lone plot, a side pair, two corner-only pairs, an L of three and a 2×2), the real mat at the Capital tab's size, and the example mat they replace;
- [spike.mjs](../../art/issue-133/spike.mjs), their source: `node docs/art/issue-133/spike.mjs <out dir>` draws them and `sketches.html`. It also draws Polar's option A, which the owner didn't choose.

The script is not run by the build or the tests. The build reuses its ideas and its pieces, not its code as is: it reaches the biome modules' inner sprite functions by copying the modules, which the build must not do.

## 1. Why

#82 drew each group of a base mat's impassable plots as one 2.5D mass, and #132 did the same for the Arts & Architecture mats. This issue does it for the six Fantasies & Futures advanced mats: Quagmire, City in a Bottle, Veil, Savanna, Polar and Netherworld.

The owner's rules from #82 hold **(owner, #82)**: 2.5D, seen from the front and above; a lone plot is one mass, and plots that touch by a side or a corner are one bigger mass; the mass grows out of the ground, with no hard outline at its foot, and small hills on its sides are welcome; a corner-only join may reach into the two buildable plots' corners, as long as it looks natural; no stamped icons or symbols.

What the owner said about the sketches **(owner, 2026-11-06)**: "Polar B is better. Everything else looks okay." That approves the six looks below, with Polar's option B, and the way each printed feature is kept (§3).

## 2. The six looks

Each painter takes the footprint (`mask`, `plots`, `reach`, `corners`), packs its pieces back to front, blends their feet into the ground with a ragged floor and mounds, and stands a piece over each corner-only join, as #82's and #132's do. It reuses #132's pieces: `drawFloor`, `edgeMounds` and `drawMound`, `frontToBack`, and `rockShape` and `drawRock` with a new `RockStyle` per biome.

1. **Quagmire:** one bog per group. Water deeper than a wobbling shore, scummed green (`quagWater`, `quagSlime`, `quagWeed`), with half-sunk logs, cattails thick on the far banks and in tufts on the near ones, and peat hummocks with moss. It keeps clear of #132's Swamp: no dead trees, no black water **(my call)**.
2. **City in a Bottle:** one reef per group on the seabed sand. Rounded rocks (a `RockStyle` in the `bottleRock` tones, boulders only), with coral and sea-glass crystals among them, and sand mounds with shells.
3. **Veil:** each side of the veil has its own look, and a group that crosses the veil changes look at the line. The worldly side: grey boulders with grassy tops, and bramble mounds with red berries. The charmed side: violet crystal clusters and giant glowing toadstools, on mossy night mounds.
4. **Savanna:** granite kopjes, rounded boulders piled up, with flat-topped acacias in front, in dry grass.
5. **Polar (option B):** the base Mountain's joined ridges and foothills (`paintMountains`), turned to blue ice under snow by a colour map. Option A, blocky seracs round dark open water, was not chosen **(owner)**.
6. **Netherworld:** black basalt crags round a pool of glowing lava (`lava`, `ember`, `amber`), with ash mounds and skulls on the banks.

### 2.7 Natural ground

Each biome gets natural ground in `GROUNDS` (`src/lib/art/paint/relief/ground.js`), as #132's did: Quagmire's bog, the Bottle's sand, the Veil's worldly meadow and charmed night (picked by `isCharmed`), the Savanna's grey dust and gold district ground (picked by `DISTRICTS`), Polar's snow and the Netherworld's scorched rock.

## 3. The printed features

Every feature the mats print is kept **(owner, approving the sketches that drew them so)**:

| Mat | Feature | How it is kept |
|---|---|---|
| Quagmire | the four will-o'-the-wisps (`WISPS`) | drawn into the relief, floating over the water of their plots, with their light on the scum below |
| Quagmire | the reeds on the open plots beside a wisp (`REEDS`) | their own art below the relief, on those open plots, as #132's Canyon saguaros are |
| City in a Bottle | the glass rim, its reflection and its glints | their own layer over everything, tinting the edge of the mat |
| Veil | the veil line with its sparkles, and the three pocket icons | their own art over the relief |
| Savanna | the six unicorn herds (`UNICORNS`, impassable plots) | each herd's sprite stands in a grassy clearing the relief leaves on its plot |
| Savanna | the grey ground and the district ground | the two natural grounds (§2.7) |
| Savanna | the brass district borders | their own art over everything |
| Polar | the teal rings and the dashed field lines | their own art over the relief, the lines running through it as printed |
| Netherworld | the imps on the `I` plots and the city centre's gold ring | their own art; they stand on open plots |

**A layer over the relief is new** **(my call)**. #132's features (`capital-feature/<slug>`) lie between the ground and the relief. The Veil's line and icons, the Savanna's herds and borders, Polar's rings and lines, the Netherworld's imps and ring, and the bottle glass must show over the relief, so they need a second picture per mat drawn above it, in the library's preview and, once #40 makes these mats playable, in `CapitalGrid`. Its name and shape are settled in the plan.

## 4. Tests and approval

- Test-first, as `tests/art-capital-relief.test.mjs` does for #132: each relief deterministic, inside its reach, every impassable plot's middle covered, palette colours only (ink at partial opacity for shadows), and a piece over every corner-only join, on the specimen and on the real mat. The sketches break two of these, which the build fixes: the wisp's glow and the bottle glass are mixed colours, so they become palette entries; an acacia's shadow fell one pixel outside the reach.
- The owner approves the built six in the library's Capital relief section before anything approved changes. Then, as #132 did: the six biomes' buildable tiles become natural ground, their ordinary impassable tiles retire (the special ones stay), their example mats are redrawn, and `docs/art/approved-assets.json` is updated.
