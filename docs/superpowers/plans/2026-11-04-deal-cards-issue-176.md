# Plan: dealing cards and tiles in with a whoosh (#176)

The design is [2026-11-04-deal-cards-design.md](../specs/2026-11-04-deal-cards-design.md). Built in the main session, test first; no review (owner).

1. Tests for `deckOffset`, `dealFrames`, `dealDelay`, `createDealQueue` and `dealIn` in `src/lib/transitions.js`, and for `shareSounds` and `soundCue` in `src/lib/sound.js`; then the code, with the `deal` cue and the player's `rate`.
2. `tools/audio/card-whoosh.mjs` synthesizes `static/audio/card_whoosh.ogg`; its spectrogram checked for the sweep and the landing slap.
3. `CardFan` deals with `dealIn` (a shelf what it shows, other fans what is drawn), replacing #175's rise; `TilePicker` gains `deal`; the Terrain tab deals drawn tiles; App and the library share their players.
4. The library's TilePicker examples (Deal again, Draw a tile); a browser test of the shelf's deal; a live game's first setup choice dealt in.
5. The docs: this plan, the design, `docs/status.md`, `docs/architecture.md`, the components' README, `docs/ui/README.md` and the README.
