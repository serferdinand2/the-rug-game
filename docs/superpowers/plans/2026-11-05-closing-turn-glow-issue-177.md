# Plan: the header's glow while End turn counts down (#177)

The design is [2026-11-05-closing-turn-glow-design.md](../specs/2026-11-05-closing-turn-glow-design.md). Built in the main session, test first; no review (owner).

1. The owner's choice of fix (2026-11-04).
2. A chip test that confirms the cause and fails without `closing`; then `closingSeat()` and `closing` in `playerChips()`.
3. `PlayerChip`'s `closing`, the `--glow-closing` token and `GameHeader`; the library section.
4. The End turn browser test checks the header, and takes its screenshot for the README.
5. The docs: this plan, the design, `docs/status.md`, the README and `docs/ui/README.md`.
