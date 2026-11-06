# Fantasies & Futures reliefs (#133): plan

Design: [2026-11-06-ff-reliefs-design.md](../specs/2026-11-06-ff-reliefs-design.md). Built inline, test-first, one commit per step (owner: no subagents, no per-step reviews).

## Shape

- **Reliefs:** `tools/art/parts/capital-relief/<slug>.js` with `paint<Biome>(canvas, fp, seed, mat)`, registered in `RELIEF_PAINTERS`; the slug joins `RELIEF_BIOMES`; `tools/art/drawings/capital-relief/<slug>.js` draws it. Polar's painter is `paintMountains` with a colour map to ice.
- **Printed data a painter needs** (`MatData`): `wisps` (Quagmire), `herds` (Savanna), and per-plot strings `sides` (the Veil's charmed plots, '1') and `districts` (the Savanna's, '.' outside). `matData` gives each mat's; `SPECIMEN_DATA` gives the specimen a wisp and a herd on its lone plot and the veil at its column 4|5.
- **Natural ground:** `GROUNDS` gains `quagmire`, `city-in-a-bottle`, `veil-worldly`, `veil-charmed`, `savanna-grey`, `savanna-district`, `polar` and `netherworld`; `groundKey` picks the Veil's by `sides` and the Savanna's by `districts`.
- **Features (below the relief):** `capital-feature/quagmire`, the reeds on `REEDS`; `quagmire` joins `FEATURE_BIOMES`.
- **Overlay (above the relief), new:** `OVERLAY_BIOMES` in `src/lib/art/relief.js`; `tools/art/parts/capital-overlay/` with one painter per mat (`city-in-a-bottle`, `veil`, `savanna`, `polar`, `netherworld`) and `drawOverlay(layout, biome, mat)`; `tools/art/drawings/capital-overlay/<slug>.js`; a `capital-overlay` catalog group (issue 133); `drawReliefPreview` lays it last; the build and the library size it as a relief. Palette colours, translucent ones allowed (the glass).
- **Sprites stay in the biome modules**, exported: the wisp and the reed (Quagmire), the unicorn (Savanna), the sparkle and the pocket icons (Veil), the ring and the dashed line (Polar), the imp and the centre (Netherworld). The wisp's two glow colours become palette entries.
- **Until the owner approves,** the six keep their impassable tiles and example mats: `art-capital-features` names them as awaiting approval.

## Steps

1. Palette entries, the eight natural grounds, `MatData` and `groundKey` for the six; tests for the grounds and the data.
2. One painter per commit, each with its relief drawing, `RELIEF_BIOMES` entry, `CORNER_PIECES` entry and a test of its look: Quagmire (wisps over its water), City in a Bottle, Veil (each side's pieces only on that side), Savanna (no rock on a herd's plot), Polar (ice, no grey rock), Netherworld (lava inside, crags round it).
3. The Quagmire's reeds as its features picture.
4. The overlay layer and its five painters; `drawReliefPreview` stacks it.
5. The library: the six reliefs and specimens show in Capital relief, with their features and overlays. **Stop for the owner's approval.**
6. Release: the six biomes' buildable tiles become natural ground, their ordinary impassable tiles and example mats retire (the special tiles stay as the features and overlays draw them), `FEATURES` names the picture drawing each printed feature, `approved-assets.json` pins the new art; the docs and the status are updated.
