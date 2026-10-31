# Income mat symbols and reveal design

Issue #151 replaces exposed reward prose with the game's shared symbols. The follow-up visual decisions standardize the layout of covered and uncovered spaces and define how buildings reveal the same printed tile beneath them (#142).

## Final design

- Four rows of six identical, fixed 110px tiles. The game still decides which indexes are exposed; this work does not change income rules or `exposedSpaces()`.
- Every tile draws the same light-gray surface, fancy-font brown name, and bottom reward box. The box is 60px tall, inset 2px on every side, dark gray, and bordered in gold at 2px.
- If a tile has income symbols, bold **Income:** sits immediately above the reward box. The income and score symbols are in the box; no redundant **Score** label is shown.
- Resources, VP, buildings, counters and other effects use `spaceGlyphs()` and `SpaceGlyphs`. Accessible labels retain the full reward in words.
- A covered tile receives only a dark building cover over its same content. Hover or keyboard focus slides the cover to the left and casts a shadow; the cell does not move or resize. The row's track-color glow also appears on already exposed spaces. Reduced-motion mode reveals instantly.
- The Preservation, Fertilization and E-Commerce titles fit on one line by sizing to the tile width. Income-mat VP cups are 19px; multiplication marks are tightened only within this component.
- The capital-scoring glyph uses the owner-edited 24×24 PNG, kept under `tools/art/imported-pngs/symbol/` and vectorized to the shared `symbol/capital-city` asset. All game views using the shared glyph update together.

## Approaches

- A separate income-only icon renderer was rejected because it would duplicate the existing glyph vocabulary and miss effects such as VP per tech card or capital scoring.
- `incomeRows()` continues to expose `covered` from `exposedSpaces()` and adds the two glyph arrays. `IncomeMat` always renders the same tile face, then adds a building cover only when `covered` is true. This preserves the engine's meaning of exposed spaces while keeping presentation consistent.

## Constraints

- No game data, income amounts, building counts or exposure rules change.
- Keep the existing `reward` and `label` strings for compatibility and assistive technology.
- Keep the six-column row layout and original building art.
