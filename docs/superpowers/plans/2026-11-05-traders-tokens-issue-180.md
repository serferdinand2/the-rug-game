# Plan: the Traders' tokens (#180)

The design is [2026-11-05-traders-tokens-design.md](../specs/2026-11-05-traders-tokens-design.md). Built in the main session, test first; no review (owner).

1. Tests in `tests/client-civ-card.test.mjs` for the reserve marks of the three civilizations and the Traders' card counting a placed token; then `civCardMarks()`, `CARD_CIVS` and `SAMPLE_CIV_DATA`.
2. A test in `tests/client-prompt-state.test.mjs` that every decision placed on the map opens it; it fails for the Nomads, then `isMap` follows any map option.
3. The browser test `tests/browser/traders-map.test.mjs`: the Map opens for the Traders' token, the reserve drops from 4 to 3, and the map draws the token picture.
4. `WorldMap` draws the token picture through `playerTokenUrl()`; `CardTokenReserve` takes the seat; the library sections and the components' README.
5. The docs: this plan, the design and `docs/status.md`.
