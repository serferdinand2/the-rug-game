# describe.js split into effect words, decision words and card text (#126) Implementation Plan

**Goal:** `describe.js` keeps the effect, cost, bonus and payment words; the decision words and the card texts get their own modules.

**Spec:** `docs/superpowers/specs/2026-10-29-describe-split-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Nothing on screen changes.

### Task 1: Tests first

- [ ] `assertReadable` to `tests/helpers/readable.mjs`.
- [ ] Split `client-describe` into it, `client-decision-words` and `client-tapestry-text`, importing from the new modules; the mixed fallback test splits in two.
- [ ] A test of `describe.js`'s exports; `client-civ-rules` imports `cards/civ-rules.js`.
- [ ] Run them: FAIL.

### Task 2: The modules

- [ ] `src/lib/decision-words.js` and `src/lib/cards/tapestry-text.js` from `describe.js`; `git mv` `civ-rules.js` into `cards/`.
- [ ] `describe.js` exports `effectsPhrase`, `effectPhrase`, `paymentVerbs`, `amounts` and `describeTurn`.
- [ ] The importers: `prompts.js`, `picks.js`, `log.js`, `cards/game-cards.js`, `area/players.js`, the PlayerChip section and the tests.

### Task 3: Verify

- [ ] `npm run test:unit`, `npm run check`, the browser tests on the branch's own servers.
- [ ] docs/architecture.md and docs/status.md.
- [ ] Commit `Fix #126: …`.
