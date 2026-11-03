# The Hand tab's cards big enough to read (#158): plan

Design: `docs/superpowers/specs/2026-11-03-hand-cards-design.md`. Built inline, test-first, in one commit.

1. Mockup over the running game (`docs/ui/prompt-and-hand.html`); the owner chose option B (2026-11-03).
2. Tests in `tests/scaled-card.test.mjs` for `fanRows()`, the wrapped `CardFan` and both hands in `PlayerTabs`; watch them fail.
3. `fanRows()` and `FAN_ROWS` in `src/lib/cards/card-sizes.js`.
4. `CardFan`'s `wrap` and `cardWidth`: measured width, a grid of rows, no overlap margins.
5. `PlayerTabs`: both hands wrapped at `HAND_SCALE` 0.6.
6. The library's CardFan section and `src/lib/components/README.md`.
7. The player-area browser test: a hand of five at every desktop size.
8. Screenshots, README, `docs/ui/README.md` and `docs/status.md`.
