# Minimizing a decision prompt (#149): plan

Design: `docs/superpowers/specs/2026-11-03-minimize-prompt-design.md`. Built inline, test-first, in one commit.

1. Mockup over the running game (`docs/ui/prompt-and-hand.html`); the owner chose the footer (2026-11-03).
2. Tests: `client-prompt-state` (minimize, restore, a new decision, no payment), `client-footer` (the minimized footer), `client-hotkeys` (V); watch them fail.
3. `PromptState`: `minimized` keyed to the decision, `canMinimize`, `boardDocked`, and `panel` 'none' while minimized.
4. `footerView`'s 'minimized' kind and `TurnFooter`'s Show choice; `hotkeyAction`'s V and the shortcuts list.
5. `DecisionPanel`'s Minimize, passed by `DecisionPrompt`; `Game.svelte` wires the footer, V and Enter.
6. The library's DecisionPanel section and `src/lib/components/README.md`.
7. The browser test in `decision-prompt.test.mjs`: minimize, look at the map, restore, confirm.
8. Screenshots, README, `docs/ui/README.md` and `docs/status.md`.
