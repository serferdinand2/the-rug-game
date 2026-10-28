# AGENTS.md

Instructions for Codex and every other coding agent except Claude, which follows CLAUDE.md. They hold whoever you are working with: Lazar or Ognjen, the owner.

## Read before changing anything

1. [CLAUDE.md](CLAUDE.md): what the project is, the commands, a map of the folders, how to pick up the next issue (respecting **Blocked by**), the decisions already made, and the rule that README.md always shows the current interface.
2. [docs/conventions.md](docs/conventions.md): how code is written: JavaScript with JSDoc (no TypeScript), Svelte 5 component structure, BEM classes with the `rg-` prefix, `{action}Handler` and `on{ComponentName}{Action}` naming, `ComponentEvent`, the rules-engine rules, tests and commits.
3. [docs/status.md](docs/status.md): where the work stands, issue by issue. You keep it up to date (see below).
4. When a task needs them: [docs/architecture.md](docs/architecture.md) (the modules in detail) and [docs/superpowers/](docs/superpowers/) (each issue's design and plan).

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

## Change any other documentation freely

Every other document is yours to change without asking (owner, 2026-10-28): README.md, this file, everything under `docs/` (architecture, designs, plans, interface notes and screenshots) and `src/lib/components/README.md`. Only CLAUDE.md and docs/conventions.md are closed to you, as above.

- **Use Superpowers in `docs/superpowers/`**, as Claude does. Before coding an issue, write its design in `docs/superpowers/specs/<date>-<topic>-design.md` and its plan in `docs/superpowers/plans/<date>-<topic>-issue-<n>.md`, following the existing ones. Read the designs and plans of earlier issues when your work touches theirs.
- **Keep the documentation current** in the same piece of work, wherever CLAUDE.md, docs/conventions.md, an issue or a plan says a change must update it, such as the README screenshots, docs/architecture.md or the component index.
- Code, tests and commits follow docs/conventions.md as usual.
