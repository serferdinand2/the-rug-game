# Tech cards that use another card's benefit (#144): plan

Written 2026-10-30. The design is `docs/superpowers/specs/2026-10-30-tech-copied-benefits-design.md`.

1. **Trace.** Find every `techBenefit` in the data (Assembly Line's circle and square, Electronics, Nanotechnology) and check its icon and row against 02 §4 and 01 §3.4. Reproduce the issue's example in the engine, in `promptFor` and in the running game.
2. **Tests first** (`tests/engine-tech-copied-benefits.test.mjs`): each effect's row and icon; none, one and several cards in the row; a card in the other row refused; a benefit that opens its own decision; nothing moved; Assembly Line's own upgrade both ways (R19). The one- and several-card tests fail on the missing `techBenefitUsed`.
3. **Engine.** `useTechBenefit` emits `techBenefitUsed { player, card, icon }` before pushing the benefit.
4. **Log.** `tests/client-log.test.mjs` samples the event and its two sentences; `log.js` words it.
5. **Client prompt** (`tests/client-tech-benefit-prompt.test.mjs`): the Tech tab, the tech shelf with exactly the row's cards and their benefit words, the answer resolving the benefit, and the log line when nothing is asked.
6. **Check.** `npm run check`, the touched test files, `tests/simulation.test.mjs`, Prettier on the changed files.
