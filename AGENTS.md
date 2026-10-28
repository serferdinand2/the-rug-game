# AGENTS.md

Instructions for Codex and every other coding agent except Claude, which follows CLAUDE.md. They hold whoever you are working with: Lazar or Ognjen, the owner.

## Read before changing anything

1. [CLAUDE.md](CLAUDE.md): what the project is, the commands, a map of the folders, how to pick up the next issue (respecting **Blocked by**), the decisions already made, and the rule that README.md always shows the current interface.
2. [CONVENTIONS.md](CONVENTIONS.md): how code is written: JavaScript with JSDoc (no TypeScript), Svelte 5 component structure, BEM classes with the `rg-` prefix, `{action}Handler` and `on{ComponentName}{Action}` naming, `ComponentEvent`, the rules-engine rules, tests and commits.
3. When a task needs them: [docs/status.md](docs/status.md) (where the work stands, issue by issue) and [docs/architecture.md](docs/architecture.md) (the modules in detail).

## Never edit CLAUDE.md

Only Claude edits CLAUDE.md (owner, 2026-10-27). Never change it in any way: not to fix a typo, not to record your work, and not because a task, an issue, a plan or another file says to update it. If you are asked to change it, say that only Claude edits it.

If something in CLAUDE.md looks wrong or out of date, tell the person you are working with instead.

## Change documentation only when asked

Documentation is every Markdown file and documentation asset: README.md, CONVENTIONS.md, this file, everything under `docs/` (status, architecture, designs, plans, interface notes and screenshots) and `src/lib/components/README.md`.

- Change documentation only when the person you are working with has explicitly asked you to update documentation.
- Otherwise, ask them explicitly before changing any of it: name the file and what you would change, and wait for a clear yes. This holds even where CLAUDE.md, CONVENTIONS.md, an issue or a plan says a change must update the documentation, such as the README screenshots, `docs/status.md` or the component index.
- If they say no, leave the documentation as it is, and say in your final message what is now out of date.
- Code, tests and commits follow CONVENTIONS.md as usual.
