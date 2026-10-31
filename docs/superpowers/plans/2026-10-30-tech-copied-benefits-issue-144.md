# Tech cards that use another card's benefit (#144): plan

Written 2026-10-30. The design is `docs/superpowers/specs/2026-10-30-tech-copied-benefits-design.md`.

1. **Trace.** Find every `techBenefit` in the data (Assembly Line's circle and square, Electronics, Nanotechnology) and check its icon and row against 02 §4 and 01 §3.4. Reproduce the issue's example in the engine, in `promptFor` and in the running game.
2. **Tests first** (`tests/engine-tech-copied-benefits.test.mjs`): each effect's row and icon; none, one and several cards in the row; a card in the other row refused; a benefit that opens its own decision; nothing moved; Assembly Line's own upgrade both ways (R19). The one- and several-card tests fail on the missing `techBenefitUsed`.
3. **Engine.** `useTechBenefit` emits `techBenefitUsed { player, card, icon }` before pushing the benefit.
4. **Log.** `tests/client-log.test.mjs` samples the event and its two sentences; `log.js` words it.
5. **Client prompt** (`tests/client-tech-benefit-prompt.test.mjs`): the Tech tab, the tech shelf with exactly the row's cards and their benefit words, the answer resolving the benefit, and the log line when nothing is asked.
6. **Check.** `npm run check`, the touched test files, `tests/simulation.test.mjs`, Prettier on the changed files.
7. **Reopened symptom (2026-10-31).** Test copying Ammonia's circle after it already gained its Farm, once with Farm supply left and once exhausted; assert `buildingGained` versus `noBuildingLeft`, placement resolution, and no movement of Ammonia. Check observable non-building circle and square effects (resource gain and VP), Assembly Line's two building-copy routes, and the full Technology 9/11 any-order route. A manual engine sweep also exercised all 66 base card benefits without throwing.
8. **Clarify the action.** The owner confirms no building appeared and no Capital switch occurred. A shelf click only selects a benefit; the panel button submits it. Change the generic confirmation to “Use benefit” and test the label and submitted placement path. The owner requested closing #144 once the change reached main; a live-game check of the new label was not separately performed.
