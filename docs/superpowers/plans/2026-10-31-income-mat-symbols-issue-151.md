# Income mat implementation record (#151, #142)

The income mat display and edited capital-scoring symbol are implemented in this branch.

- [x] Add `incomeGlyphs` and `scoreGlyphs` to income-space views using shared `spaceGlyphs()` mappings.
- [x] Preserve full textual rewards and `covered` values from `exposedSpaces()` for logic and accessible labels.
- [x] Render every tile face consistently with its name and inset dark reward box; show only the bold Income label when income exists.
- [x] Render the building as an independent dark cover for covered spaces, sliding it left on hover or keyboard focus without changing tile geometry.
- [x] Apply the track-color glow to all spaces and keep the compact 19px VP cup and multiplication spacing local to IncomeMat.
- [x] Fit the three long names and document the final visual decisions.
- [x] Vectorize the owner-edited capital scoring PNG, preserve it as an art source, and update the shared SVG used by every game view.
- [x] Preserve regression coverage for reward symbols, accessible descriptions and the unchanged exposure calculation.
