# AGENTS.md

Instructions for Codex and every other coding agent except Claude, which follows CLAUDE.md. They hold whoever you are working with: Lazar or Ognjen, the owner.

## Read before changing anything

1. [CLAUDE.md](CLAUDE.md): what the project is, the commands, a map of the folders, how to pick up the next issue (respecting **Blocked by**), the decisions already made, and the rule that README.md always shows the current interface.
2. [docs/conventions.md](docs/conventions.md): how code is written: JavaScript with JSDoc (no TypeScript), Svelte 5 component structure, BEM classes with the `rg-` prefix, `{action}Handler` and `on{ComponentName}{Action}` naming, `ComponentEvent`, the rules-engine rules, tests and commits.
3. [docs/status.md](docs/status.md): where the work stands, issue by issue. You keep it up to date (see below).
4. When a task needs it: [docs/architecture.md](docs/architecture.md) (the modules in detail).

## Never edit CLAUDE.md

Only Claude edits CLAUDE.md (owner, 2026-10-27). Never change it in any way: not to fix a typo, not to record your work (that goes in docs/status.md), and not because a task, an issue, a plan or another file says to update it. If you are asked to change it, say that only Claude edits it.

If something in CLAUDE.md looks wrong or out of date, tell the person you are working with instead.

## Never edit docs/conventions.md

The coding conventions are settled (owner, 2026-10-28). Never change [docs/conventions.md](docs/conventions.md) in any way: not to fix a typo, not to add a pattern you used, and not because a task, an issue, a plan or another file says to update it. Claude follows the same rule. If you are asked to change it, say that nobody edits the conventions.

If a convention looks wrong, missing or out of date, tell the person you are working with instead.

## Record your work in docs/status.md

[docs/status.md](docs/status.md) is the only record of where the work stands; CLAUDE.md holds none of it (owner, 2026-10-28). Whenever you land an issue or a milestone moves, update it in the same piece of work, without being asked:

- **Summary**: add the issue to the done list with who closed it and when, and correct the "At a glance" lines.
- **Issues**: add an entry for the issue at the end, as the existing entries do: what it built, its calls to revisit after playing, and what it hands on to later issues.

This is the one exception to the next section.

## Change documentation only when asked

Documentation is every Markdown file and documentation asset: README.md, this file, everything under `docs/` (architecture, designs, plans, interface notes and screenshots) and `src/lib/components/README.md`. Two files under `docs/` follow their own rules above instead: you keep `docs/status.md` up to date, and you never edit `docs/conventions.md`.

- Change documentation only when the person you are working with has explicitly asked you to update documentation.
- Otherwise, ask them explicitly before changing any of it: name the file and what you would change, and wait for a clear yes. This holds even where CLAUDE.md, docs/conventions.md, an issue or a plan says a change must update the documentation, such as the README screenshots or the component index.
- If they say no, leave the documentation as it is, and say in your final message what is now out of date.
- Code, tests and commits follow docs/conventions.md as usual.
