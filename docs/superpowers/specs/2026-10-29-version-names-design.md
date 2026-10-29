# Rules versions, expansions and variants named and coloured in one place (#101): design

Written 2026-10-29. #101 is in M13 · Refactor (Lobby). The owner made #32 wait for it (2026-10-29), since Plans & Ploys is the first expansion to show these names. What the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. What and why

Each rules version had two names:
- the lobby said **Current rules** and **Original 2019 rules**;
- the results said **Current official rules** and **Original 2019 printing**;
- the log mixed the two sets.

Expansion names came from five copies of one lookup. The results drew every expansion badge gold. `OpenTableRow` took one expansion, although a table can have several. Variant names came from a map in `lobby.js` plus three fallback chains.

**Done when** each version, expansion and variant has one name, and each expansion has one colour, all from one module.

## 2. The names

- **The owner's wording:** "Current rules" and "Original 2019 rules", the lobby's mockup words, are the versions' names everywhere. The settings row keeps the short "Original 2019" **(owner, 2026-10-29)**. The engine's own names stay in the engine and on the server's config.
- **`game-names.js`** (#123's module) gains three functions:
  - `versionName(id, { short })`;
  - `expansionName(code)`, from the art catalog;
  - `variantName(id, fallback)`, the lobby's short row titles. The fallback is what a variant without a short title reads; the lobby passes the server's full name.
- **`ui.js`** gains `expansionColor(code)`, beside its other token helpers: each expansion's own token, and the gold for the base game.
- **`lobby.js`** gains `expansionBadges(codes)`, a name and a colour per expansion, for the open tables and the results.
- `rulesLabel`, `VARIANT_LABELS`, the lobby's and the log's `RULES` maps and every `EXPANSIONS.find` outside the module go.
- **The results:** the facts list says "Current rules", and the tie sentence "Under the current rules". Each expansion badge has its own colour.
- **The log:** "under the Current rules".
- **`OpenTableRow`** takes `expansions: { name, color }[]`, one badge each, stacked under the rules line as the one badge was. The landing page passes the open table's expansions, which it dropped before.

Until an expansion is built, the only change a player sees is the wording.

## 3. Tests

- **`client-game-names`:**
  - every engine version and variant has a name;
  - every catalog edition has its name;
  - a guard against new copies of the lookups.
- **`ui.test`:** each expansion's colour token exists.
- **`client-results`:** the badges' colours.
- **Wording:** `client-log` and `client-results` take the new wording.
- **Moved:** `client-lobby`'s naming tests moved to `client-game-names`.

## 4. Screens

- `docs/ui/screens/game-results.png` is retaken from a real three-player game, so it shows "Current rules".
- The library's OpenTableRow section adds a table with two expansions, for the owner to check.

## 5. Hand-offs

- #109's edition chips use `expansionName` and `expansionColor`.
- #32 is the first expansion to show them.
