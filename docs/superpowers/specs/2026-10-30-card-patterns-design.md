# The card patterns as data components (#106): design

Written 2026-10-30. #106 is in M13 · Refactor (area Cards), found by the client scan (#80). The issue gave the shape; the choices below marked **(my call)** are mine. #107 draws `CivilizationCard` from data on top of this, so it lands first.

## 1. What and why

The card pattern components (`CardPathGrid`, `CardPredictionTracks`, `CardTerrainRewards`, `CardPlacementRows`, `CardRewardColumns` and the others) wrap one class named after a single civilization, and every caller writes their inner markup and state classes itself:

- the primitives render civilization classes (`rg-card-entertainer-path`, `rg-card-mystic-predictions`, `rg-card-treasure-list`, `rg-card-craftsmen-columns`, five in `CardPlacementRows`), and `CardClarity` and `CardScoreLadder` borrow `CardFrame`'s element names;
- callers write the rows, recipes borrow other recipes' classes (the Historians use the Inventors' effect boxes, the Nomads the Traders'), and `<div class="rg-card-ability-list">` is written 11 times;
- state goes through 24 `rg-card-is-*` caller classes gated by `.rg-card-frame[data-state='play']`;
- no primitive has a `<style>` block: all of it is in the 1,661-line `src/styles/card-patterns.css`, with `.rg-card-frame` defined five times, dead rules and 30 typed font stacks;
- 13 library sections fake `CardFrame`'s root with `<div class="rg-card-frame" data-state="play">`.

**Done when** no primitive renders a civilization's class, state comes from props, each primitive owns a scoped `<style>`, `card-patterns.css` keeps only the frame's palette, paper and the symbols #107 moves, and the library sections render the primitives with real props. Every civilization card looks exactly as before.

## 2. The rules every step follows

- **Pixel-identical.** Each step lands alone, and every civilization card, in both states on the review page (`docs/ui/collectors-review.html`) and every example of the library's `CivilizationCard` section (play, live and choosing), screenshots byte-identical before and after. A computed-style dump of every element in every card (layout boxes and about 80 visual properties, with `::before` and `::after`) is compared too, so a no-op difference shows before it can hide behind an identical picture. **(my call)**
- **Names.** A primitive's classes are `rg-card-{primitive}` and `rg-card-{primitive}--{element|modifier}`, as `tests/library.test.mjs` requires of a `<style>` block. A child component a primitive styles gets one of the primitive's own classes, reached with `:global(.rg-card-{primitive}--…)` under the primitive's root.
- **State is props.** The primitive takes the state (`used`, `current`, `selected`, `filled`, `exposed`, `moved`); the caller passes it only in the play look, which replaces the `.rg-card-frame[data-state='play']` gate. `rg-card-is-*` classes go.
- **Fonts** are `var(--font-body)` and the size tokens where a token matches the value; the computed font stays the same.
- **Rules text stays a snippet.** Text with inline resources, bold words and line breaks (effect bodies, clarifications) stays the caller's markup, inside the primitive's own wrapper; the structure around it (rows, numbers, squares, labels) is data. #107 decides whether the words move into data. **(my call)**

## 3. The steps

1. **Text and effect boxes.** `CardResource` styles itself (`rg-card-resource`, `--art`, `--fine` as a `fine` prop) and reads two inherited custom properties, `--card-resource-center` and `--card-resource-height`, which a container sets instead of styling `.rg-card-resource-icon` from outside. `CardClarity` draws its own paragraph and an optional `setup` line, with `above` and `minHeight` for the Leaders' and Architects' spacing. `CardEffectBox` takes `title`, a `gain` resource or a `label` word as its symbol (or a `symbol` snippet for a pictogram), and `symbolText` (12, 13, 14 or 15 px), which replaces the Mystics', Alchemists', Isolationists' and Inventors' symbol styles; the Traders' style was a no-op and goes. The new **`CardEffectList`** replaces the 11 hand-written lists, with `above` for the Mystics' and Alchemists' spacing.
2. **Score ladder, token reserve, technology transfer.** `CardScoreLadder` takes `steps` (`{ count, points }`, `count` a label such as `6+`), `current`, a `label` and an item `noun`; it draws the Collectors' stepped ladder and the Isolationists' flat score (`kind`). `CardTokenReserve` and `CardTechnologyTransfer` style themselves; the transfer's owner labels stay props.
3. **Terrain rewards.** `CardTerrainRewards` takes `rows` (`{ terrain, name, gain, effect, used }`).
4. **Prediction tracks.** `CardPredictionTracks` takes `categories` (`{ id, label, note?, numbers, selected?, columns? }`) and draws the number squares, with the choice props the card passes through.
5. **Reward columns.** `CardRewardColumns` takes `columns`: the Craftsmen's (`kind="beside"`: a title and `{ benefit, filled }` rows) and the Merrymakers' (`kind="inside"`: cells with their reward, `current` and the column's `moved`).
6. **Path grid.** `CardPathGrid` takes `heads`, `spaces` (rows of four), `links` (svg paths from the engine's moves) and `current`, and draws the start token.
7. **Placement rows.** `CardPlacementRows` takes `items` per `kind`: the Collectors' collection, the Militants' covered rows, the Alchemists' tracks, the Leaders' tracks and the Historians' squares, each with its state.
8. **Clean-up.** `CardSlot`'s `filled` is passed, `CardFrame` gets a `plain` mode without the title and portrait for the library sections, and the dead rules leave `card-patterns.css`.

After each step the library section of every primitive it touched renders the primitive itself with real props, its `@example` shows real props, and its README row says what it takes.

## 4. Tests

- `tests/client-card-patterns.test.mjs` renders each primitive with `svelte/server`: its data drawn (rows, numbers, squares), its state as modifiers, and no civilization class. A guard reads every primitive's source: no civilization name in a class, a `<style>` block, no `rg-card-is-` class; and `CivilizationCard` hand-writes no list the primitives draw.
- The browser tests that reach the cards (`civ-card`, `card-layouts`, `setup-prompts`, `decision-prompt`) pass unchanged.

## 5. Hand-offs

#107 fills `CivilizationCard`'s branches from data with these props, and moves the pictogram symbols (`rg-card-district-icon`, `rg-card-trader-hex`, the quads, the mini cards) that stay in `card-patterns.css` until then. #78's state props are these. The owner checks the card gallery for visual changes; none are meant.

## 6. After the gallery check (owner, 2026-10-30)

The owner checked the card gallery and ruled: "106: fix what needs to be fixed" (owner, 2026-10-30: fix what needs fixing after the gallery check). Two defects were fixed; no approved look was restyled.

- **The Alchemists' rolled token.** It was drawn 43 px, grey and at 0.7 opacity, because it copied the track icon's rule, so a rolled track read as a second grey icon on top of the first. It is now the player's own token (`seat`, which the card passes, blue without one) in full colour, 21 px in the square's top-right corner, as the Merrymakers' token marks its square. The greyed track icon stays readable and the square keeps its unused look, because the card-design rules call these marks temporary results, not used spaces. **(my call: the Merrymakers' corner marker rather than the Historians' covering token, since nothing is hidden under an Alchemists token)**
- **Library examples too narrow.** `Example`'s stage was `border-box`, so its `width` (documented as the component's real width) included its 16 px padding and border: every 425 px card pattern on its plain `CardFrame` stuck 34 px out of its stage, and fluid components were shown 34 px narrower than in the game. The stage is now `content-box`, so the width is the component's own. This touches every library section with a `width`; none overflows any more, and the page has no new horizontal scroll.
- Looked over and left as they are: the other rebuilt player sections and the 32 CivilizationCard examples match the approved cards. The Merrymakers' "+ armory" reaches the square's edge and the Historians' rewards peek around their tokens, as on the reviewed cards.
- Tests: `tests/client-card-patterns.test.mjs` pins the rolled token's seat colour, its corner rule without filter or opacity, that the Alchemists pass their seat, and the stage's `content-box`. Screenshots: `docs/ui/screens/issue-106/`.
