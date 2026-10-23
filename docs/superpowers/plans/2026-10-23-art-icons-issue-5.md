# Issue #5 · approved asset release

The owner requested publication of only the artwork they directly reviewed in the local mockup, and archival of the full mockup. Dice faces, terrain hex markers and game symbols are resolved through text rendering or later drawings rather than shipping their placeholder art.

1. Freeze the complete icon mockup and its linked capital terrain page, including interactive player colors, as standalone archived HTML with embedded SVGs.
2. Convert the latest reviewed resource, building, track and player-piece images into exact vector drawing sources. Preserve alpha and use the outpost gray only inside the token. Generate all five player-color variants.
3. Register the 84 reviewed capital plot variants and six base capital mats with stable ids, and reproduce them through the art build. These contribute to #6 while the rest of #6 remains open.
4. Check the exported SVGs against frozen hashes, dimensions, transparency and recolor masks. Check distinct impassable variants for every biome and run the repository checks.
5. Publish the scoped update, record the deferred-group explanation in #5 and close it when the release is on the default branch.

The release inventory and handoff are in [docs/art/issue-5.md](../../art/issue-5.md). The former `art/preview/` entry points link to the frozen archive. The component library uses the production drawing sources directly.
