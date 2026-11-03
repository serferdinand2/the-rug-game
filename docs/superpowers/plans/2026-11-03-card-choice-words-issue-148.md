# Tapestry and civilization choices in plain words (#148): plan

Design: `docs/superpowers/specs/2026-11-03-card-choice-words-design.md`. Built inline, test-first, in one commit.

1. Inventory every decision the tapestry cards and the civilizations open, with its words (a scratch script over `resolveTapestry`); the mockup's table (`docs/ui/prompt-and-hand.html`), approved by the owner on 2026-11-03.
2. Engine tests first: the new `purpose`, `shared`, `civ` and `from` fields in the existing tests of each card and civilization; watch them fail.
3. The engine fields: `offer()`'s `fields`, the purposes, `shared` through `sharedAdvance`, `sharedAdvanceOn` and the advance effect; export `REVOLUTION_MORE` and `DARK_AGES_ADVANCES`.
4. Wording tests in `client-decision-words`, from literal decisions and one real view; watch them fail.
5. The titles and answers in `decision-words.js`, the VP preview, and the free-bonus phrase in `describe.js`.
6. The random games and the related suites; screenshots, README, `docs/ui/README.md` and `docs/status.md`.
