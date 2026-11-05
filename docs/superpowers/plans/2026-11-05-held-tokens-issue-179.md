# Plan: another player's token moves while their advance shows (#179)

The design is [2026-11-05-held-tokens-design.md](../specs/2026-11-05-held-tokens-design.md). Built in the main session, test first; no review (owner).

1. The owner's calls on the Map and on the panel's placement, asked before building (2026-11-05).
2. Unit tests: `client-held-tokens` (new), the advance picture's `from` in `client-player-actions`, `tokenHop`'s `still` in `client-transitions`. Watch them fail.
3. `from` in `pictureOf()`; `src/lib/held-tokens.js`; `tokenHop(position, { still, view })`.
4. `ProgressLanes` reads `still` from its players; `Track` and `TrackBoard` carry it in their typedefs.
5. `App.svelte`: the queue in `$effect.pre`, the move after the display's entrance, the holds and Skip all's `still`, passed to `Game`; `Game` draws the held board and switches to Tracks for an advance.
6. The browser test `held-tokens`, with motion on; the whole suite.
7. Docs: status, the component index if a row changes, the README's interface (no still screen changes).
