# Rules versions, expansions and variants named and coloured in one place (#101) Implementation Plan

**Goal:** one name per version (the owner's wording), expansion and variant, and one colour per expansion, from `game-names.js` and `ui.js`.

**Spec:** `docs/superpowers/specs/2026-10-29-version-names-design.md`

### Task 1: Tests first

- [ ] `client-game-names`: `versionName`, `expansionName`, `variantName` and the guard; `ui.test`: `expansionColor`; `client-results`: coloured badges; `client-log` and `client-results` in the owner's wording. Run them: FAIL.

### Task 2: The names

- [ ] `game-names.js` and `ui.js`; `expansionBadges` in `lobby.js`; `lobby.js`, `log.js` and `results.js` use them.
- [ ] `OpenTableRow` takes `expansions`; the landing page, the results, `CivilizationCard`, `CardEntry` and the library use the functions.

### Task 3: Verify

- [ ] `npm run test:unit`, `npm run check`, the browser tests; retake `game-results.png`.
- [ ] docs/architecture.md and docs/status.md; commit `Fix #101: …`.
