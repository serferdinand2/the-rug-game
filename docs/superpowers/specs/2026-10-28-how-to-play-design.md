# How to play in the game, and the civilizations' text (#42): design

Written 2026-10-28. #42 is in M10 · Rules pages; its only blocker, #30, is closed. The owner asked for it while #77 was being finished: first "add keyboard actions in the hamburger menu so that players know how to use keyboard shortcuts", then "just resolve 42 as well then". What the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. What and why

Today How to play only explains tables (`src/screens/HelpPanel.svelte`); the game has no rules help, and the 16 base civilizations' abilities exist only inside `CivilizationCard.svelte`'s markup, so nothing else can show them. The tapestry cards, the tech cards and the base space tiles already have words (`describe.js`, `game-cards.js`), shown in the card gallery (#47), which doubles as the card reference.

**Done when** a player in a game opens How to play and reads the rules in our own words, opens Keyboard shortcuts from the menu and sees every shortcut, and hovers a player's chip to read that civilization's full ability.

## 2. Goals, non-goals and anti-goals

- **Goals.** The base game's rules in plain words, every number exact, paraphrased from `docs/research/` and never the rulebook; the keyboard shortcuts **(owner)**; each base civilization's full ability as plain text, in the table's version.
- **Non-goals.** The expansions: their content isn't built, so it is never invented here. Each expansion issue adds its own civilizations and sections to the same modules (hand-off). Card text the gallery already has is not rewritten.
- **Anti-goals.** Copying the rulebook; a number that disagrees with the engine; a panel that steals Escape from something else open.

## 3. The pieces

- `src/lib/rules-help.js` **(my call)**: `RULES_HELP`, the sections of How to play in order, each `{ id, title, blocks }` where a block is `{ text }` or `{ list: string[] }`. Sections: your turn (advance or income; the first turn is taken for you, #77), advancing on the tracks (tiers and their costs, benefits and bonuses, landmarks, the track's end), income turns (the steps by income turn, eras, tapestry cards, the first-of-neighbours bonus, finishing after the fifth), the capital city (placing, districts, rows and columns), the map (exploring, conquering, the dice, traps, control), achievements and the end (the three achievements, the game end, scoring and tiebreakers).
- `src/lib/civ-rules.js` **(my call)**: `civRules(id, version)` → the ability as short paragraphs, with the current version's adjustment where it applies (R34), for the 16 base civilizations; `civAbilityText(id, version)` joins them for a tooltip; `null` for an id without text (an expansion's).
- `src/lib/shortcuts.js` **(my call)**: `SHORTCUTS`, groups `{ title, shortcuts: { keys: string[][], action }[] }`: anywhere (Tab, Enter and Space, Escape one thing at a time), menus and tabs (arrows, Home, End), exploring on the map (R, Shift+R), placing a landmark on the Capital tab (Space or Enter, arrows, R, Enter, Backspace or Delete).
- `src/screens/game/RulesPanel.svelte` **(my call)**: How to play in the game, a modal like HelpPanel (`aria-modal`, Close, Escape, the backdrop) with a `Tabs` row: one tab per `RULES_HELP` section and a last **Keyboard shortcuts** tab, each key drawn as a `<kbd>`.
- `Game.svelte`: the menu's **How to play** opens the RulesPanel; a new **Keyboard shortcuts** entry opens it on that tab **(owner)**. Before a game, How to play stays the table steps.
- `PlayerChip`: a new `ability` prop joins the native tooltip, so hovering a chip reads the civilization's full ability **(my call: the native tooltip, as the track spaces use)**.

## 4. Tests

Vitest: every section and shortcut has words; every base civilization in the engine's `CIVS` has text in both versions; spot checks of numbers against the engine's data. Playwright: in a game, How to play opens on the rules, the menu's Keyboard shortcuts opens on its tab, Escape closes it, and a chip's tooltip carries the ability.

## 5. Documentation and hand-offs

The README and `docs/ui/README.md` show the panel; `docs/status.md` and `docs/architecture.md` record it. Hand-offs: each expansion issue (#32–#41) adds its civilizations to `civ-rules.js` and its rules to `rules-help.js`.
