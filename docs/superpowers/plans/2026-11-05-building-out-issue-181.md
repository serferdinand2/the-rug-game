# Plan: a building with none left can't be picked (#181)

The design is [2026-11-05-building-out-design.md](../specs/2026-11-05-building-out-design.md). Built in the main session, test first; no review (owner).

1. The owner's calls on one option left and on bonuses, asked before building (2026-11-04).
2. Engine tests (`tests/engine-building-out.test.mjs`), then `buildingsOut()` and `noneLeftMessage()`, `choice()`, `chooseOption` and `chooseBonus`.
3. A log test, then the `noBuildingLeft` line with its `buildings`.
4. Prompt tests, then `unavailable` in `promptFor()`, the panel's merge in `PromptState` and `DecisionOption`'s `reason`; the library section.
5. R117 in the README's Rules conventions; the simulation; the docs.
