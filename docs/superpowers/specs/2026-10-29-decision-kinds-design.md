# Each decision kind's client facts in one table (#129): design

Written 2026-10-29. #129 is in M13 · Refactor (Words and names), after #126. The owner made #31 and #32 wait for it (2026-10-29), since each adds decision kinds. Every decision here is **(my call)** unless marked; the issue gave the shape.

## 1. What and why

A decision kind's client facts are spread over two modules:
- in `prompts.js`, `SHELVES` (which card shelf it fills), `CONFIRM_LABELS`, `TRACK_ANSWERS`, the switch in `placeOf` (which repeats `SHELVES`' kinds) and the switch in `artOf`;
- in `area/tabs.js`, `TAB_OF`.

Its title and answer words are in `decision-words.js` (#126). Only the titles are checked against the engine's kinds. A new kind from #31 or an expansion means editing up to six places, and nothing says which.

**Done when** each kind's facts are one entry in one table, and a test walks the engine's `DECISIONS`.

## 2. The table

**`src/lib/decision-kinds.js`** holds `DECISION_KINDS`: one entry for each of the engine's 38 kinds, like the engine's `kinds.js`, listing only the facts the kind has. `kindFacts(kind)` returns its four facts, each null when it has none, also for a kind the table doesn't know. The four facts:
- `shelf`: the card shelf its answers are on (`tapestry`, `tech`, `civ` or `mat`);
- `tab`: the player tab it opens;
- `confirm`: the Confirm button's words;
- `art`: the shape of the art beside its answers. The shapes are `track`, `resources`, `payment`, `die`, `landmark`, `space-tile`, `gift`, `explore`, `civ`, `placement`, `option`, `order` and `slot`, listed in `ART_SHAPES`. Kinds share shapes: resource and conversion answers draw alike, and so do bonus and trade.

The modules that read it:
- **`prompts.js`:**
  - `placeOf` reads the shelf: a mat is always on the shelf, a civilization when the answer names one, and a card when it names one.
  - `artOf` draws a shelf answer from its shelf, and any other answer through one art maker per shape, in a map typed by `ArtShape`. `npm run check` then fails on a shape without a maker.
  - The Confirm label comes from the table, still defaulting to "Confirm choice".
- **`area/tabs.js`:** `tabFor` reads the tab from the table. The Nomads' map-only placement stays its one exception.
- **Unchanged:** the titles and answer words stay in `decision-words.js`, where #60 edits them.

A new kind is one entry in the table, plus its title and answer words. A new art shape also needs its maker.

Nothing on screen changes.

## 3. Tests

**New `tests/client-decision-kinds.test.mjs`:**
- every engine kind has an entry, and no entry names a kind the engine lacks;
- every fact is one the client knows: a shelf, a `TABS` id, words and an `ART_SHAPES` shape;
- an unknown kind has no facts;
- every engine kind has its own entry in `decision-words.js`' `TITLES` and `ANSWERS`, read from the source, so the answers are checked as well as the titles;
- a guard: no `SHELVES`, `CONFIRM_LABELS`, `TRACK_ANSWERS` or `TAB_OF` remains, and `prompts.js` switches on no kind.

`client-prompts`, `client-area-tabs` and the browser tests check that the prompts and the tabs behave as before.

## 4. Hand-offs

#31 and #32–#41 add their kinds to `DECISION_KINDS` and `decision-words.js`; the new test fails until they do.
