# Picking several things one by one (#75): design

Written 2026-10-28. #75 is in M12 · Cosmetic enhancements, assigned to the owner. What the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. What and why

When a decision asks for several things at once (resources to gain or pay, cards or territory tiles to discard), the prompt lists every legal combination as its own option: `promptFor()` in `src/lib/prompts.js` turns each of the engine's answers into one `DecisionOption`, and the advance's payment panel in `src/screens/Game.svelte` does the same with `advanceOptions()`' payments. The lists are long, read only as words for cards and tiles, and similar entries are easy to confuse.

300 random games (52,000 decisions, every player count, both versions) measured it:

| Decision | How often | Options listed |
|---|---|---|
| `chooseResource`, count 3 | about 1.2 per game | always 20 |
| `chooseResource`, count 2 | about 1.3 per game | always 10 |
| `chooseBonus` paying tapestry cards or territory tiles | under 1 per game | usually 11–16, up to 37 |
| `chooseTrade` | under 1 per game | usually 2, up to 36 |
| `chooseAdvance` payments for one space | about 100 per game | usually 3, at most 10 |
| `chooseBonus` paying resources | about 9 per game | 4 or 5 |
| `chooseConversion` (Mercantilism) | rare | 4 or 10 |

Random players hold few cards and tiles, so real card and tile payments run longer: 6 tiles at Space Shuttle are 20 sets of 3, 8 tiles are 56.

The owner's direction: "do it like BGA does it" and "use bga method" **(owner)**. Board Game Arena's Tapestry (`elaskavaia/bga-tapestry`, `tapestry.js`: `setupResourceLine`, `createPaymentBox`, `setupResourceLineForAdvance`, the `bonus` and `resourceChoice` states) builds every resource choice from **one box per resource**: each box holds the four resources with the player's counts on them, one is clicked in every box, the others in that box fade, and the player's resource counters change as they pick. A cost's fixed resource sits in its own box, already chosen. Cards and tiles to pay are picked where they are shown, several at once. A trade is two steps: the trade, then its boxes.

**Done when** every resource, card or tile choice of more than one thing is made item by item, with each item's art, and the player can never confirm something the engine would refuse.

## 2. Goals, non-goals and anti-goals

- **Goals.** BGA's method in this game's look. A row per resource to choose; cards and tiles as pictures, chosen several at once; a count of what is chosen; Confirm only when the selection is one of the decision's answers. The keyboard and screen readers can make every selection.
- **Non-goals.** The engine and its answers don't change: the client still sends exactly one of the decision's `answers`, matched from the selection. BGA's optional 5-second auto-confirm is left out **(my call)**. Decisions that pick one thing (a card to keep, a tech card, a landmark, a track) keep their prompts.
- **Anti-goals.** A list of ready-made combinations; a selection that looks complete but can't be confirmed without saying why; a choice that only the mouse can make; − and + steppers (the issue's first idea, replaced by BGA's rows **(owner)**).

## 3. The layout (owner)

The owner reviewed a clickable mockup of four prompts over a screenshot of the real board and approved it after one round **(owner, 2026-10-28)**:

- "favor height rather than width": each resource box is a **row**, and rows stack; tiles wrap three to a row; trades are two columns of three **(owner)**;
- "center this in the middle of the screen": every one of these panels sits at the **centre of the screen** (both axes, 960×540 on a 1920×1080 screen), over the shared area, with the usual scrim over the tracks/map region **(owner)**. The one exception is a payment in tapestry or tech cards: the shelf draws tapestry cards 392px tall, which can't fit above a centred panel, so that prompt keeps today's place, the shelf above a panel at the bottom, as every card prompt has it **(my call, after the builder check; no new look to approve)**;
- "cost for advancement as well": the advance's payment is the same **centred panel**, not the footer **(owner)**.

The mockup is kept at `.superpowers/brainstorm/` (ignored). Its four scenes, which the build follows:

1. **Choose 3 resources.** Title "Choose 3 resources", a lead ("Your capital completed 3 districts. Pick one resource in each row."), then three rows. A row is its number (muted), a box of the four resources (coin, food, worker, culture, in `RESOURCES` order from `src/lib/ui.js`, 38px art in 52px buttons, the count held on each), and the name of the resource picked ("Food"), or "—". The status line counts down ("Choose 2 more.") and then says what happens ("You gain 1 coin and 2 food."). Confirm, solid gold.
2. **Advance to Tanks** (tier III). The panel is tinted with the track (`DecisionPanel`'s `track`). The lead names the cost ("Tier III costs 1 culture, the military track's own resource, and 2 resources of your choice."). Row 1 is the track's own resource, already chosen and not clickable, named "Culture · set by the cost"; rows 2 and 3 are free. Cancel and Advance.
3. **Space Shuttle's bonus**, tinted with exploration: "Take the bonus: gain 10 VP?", a lead, "Your tiles · 2 of 3 chosen", the tiles as `TilePicker` pictures that toggle, three to a row; the Terrain tab's tiles toggle too and stay in step. Decline and "Pay 3 tiles".
4. **Guilds**: "Choose a trade", six trade buttons in two columns ("5 VP → any", "10 VP → any ×2", "15 VP → any ×3"; "any → 5 VP" and so on), the ones the player can't afford disabled. Picking one shows its rows in the same panel with Back and Confirm.

The width is about 440px **(my call, from the mockup)**; the builder may size it from tokens.

## 4. Behaviour

### 4.1 Resource rows

- **One row per resource unit to choose.** A cost of 1 culture and 2 any is three rows: one fixed, two free. "Choose 3 resources" is three free rows.
- **Fixed rows** are the cost's named resources (the track's own resource of a tier cost, any resource a bonus or trade names): drawn first, already chosen, not focusable as choices, named "· set by the cost" **(owner, from the mockup)**. The rows come from the cost (`TIER_COSTS` and `TRACK_RESOURCE` for an advance, `decision.cost` for a bonus, the offer's `pay` for a trade, `count` and `from` for `chooseResource`, `max` for `chooseConversion`); legality comes from the answers, below.
- **Picking.** Clicking a resource in a free row chooses it; the row's other resources fade to 30% but stay clickable, and clicking one moves the choice. Clicking the chosen one again clears the row **(my call; BGA keeps it)**. Rows are interchangeable: what counts is how many of each resource is chosen.
- **What can be picked.** A resource in a free row is enabled only if at least one of the decision's answers contains everything chosen so far plus that resource **(my call)**. That one rule gives BGA's behaviour (nothing you don't hold can be paid; your one food goes in one row only) and makes a dead end impossible: whatever is picked can always be completed, and a complete selection is always an answer. A resource a gain row offers is always enabled.
- **The counts.** Each resource shows the count the viewer would hold after the choices so far, as BGA does, never above the cap of 8.
- **The player's counters.** While a resource prompt is open, the viewer's resource counters in `SelfSummary` show the result of the choices so far; a changed count is gold **(owner, from the mockup)**.
- **The cap.** A gain that takes a resource past 8 says so in the status line, in the warning colour: "You gain 1 coin and 2 food. You can hold 8 of each: 1 food would be lost." (the issue's ask, not BGA's).
- **Gains from a list.** A `chooseResource` whose `from` is a list shows only those resources in each row.
- **One resource.** A choice of a single resource (`chooseResource` count 1, a bonus costing 1 any, a tier I advance) is one row, so every resource choice looks the same **(my call; the issue let single picks stay as they are)**.

### 4.2 Cards and tiles

- **Territory tiles** to pay show as `TilePicker` pictures in the panel, toggling several at once, and the Terrain tab's offered tiles toggle too, in step, as #74 made them pickable **(owner, from the mockup)**.
- **Tapestry and tech cards** to pay show on the `CardShelf` above the panel, toggling several at once, with the panel in its usual place at the bottom (§3). The Hand tab's cards don't toggle: its overlapping fan is built for looking at cards, not picking them **(my call)**.
- **The count** reads "Your tiles · 2 of 3 chosen" ("Your cards · …" for cards). Once enough are chosen, the others are disabled until one is unpicked **(owner, from the mockup)**. The same answer rule as resources applies: an item is enabled only if some answer contains the chosen ones plus it.
- **The status** says what is missing ("Choose 1 more tile.") or what Confirm does ("Pay tiles 13, 21 and 25 for 10 VP." — the tile's terrains may replace the number, as `tileWords` does in #74).

### 4.3 Each decision

- **`chooseResource`**: rows, Confirm.
- **`chooseConversion`** (Mercantilism): one row per food it may convert (`max`), each offering food (keep it) and the three other resources, as BGA's "select Food if you want to keep it". Lead: "Pick what each food becomes; food keeps it." Confirm, and Decline, which sends the answer that converts nothing **(my call)**.
- **`chooseBonus`**: the cost's rows, or its cards or tiles, then Decline and a confirm naming the deal ("Pay 3 tiles").
- **`chooseTrade`**: step one, the offers as buttons in two columns (unaffordable ones disabled); an optional trade (`optional`, Olympic Host) adds Decline. Picking an offer that pays resources shows its rows (Back, Confirm), and Confirm sends `{ offer, pay }`. Picking an offer that pays VP shows the rows of the resources it gains; Confirm sends `{ offer, pay: { vp } }` and then, once the engine opens the `chooseResource` the trade causes, the matched resources, in one press, as `advanceHandler` already chains the turn choice and the advance **(my call)**. If the second send can't be made, the `chooseResource` prompt simply opens with its rows.
- **`chooseAdvance`**: picking a track space whose payment has more than one legal answer opens the centred panel at once, as BGA opens its payment on the click **(owner, from the mockup)**. Cancel closes it and clears the space **(my call)**. A space with a single legal payment opens nothing: the footer's Advance pays it, as today. The panel replaces today's "How do you pay for …?" list.
- **Mixed costs.** A cost with several parts (resources and cards, which no base-game cost has) shows each part in the same panel, resources first.
- **One way to pay or pick.** A decision with at most one answer that picks anything (besides declining) keeps today's prompt: that answer as one option, plus Decline where it may be declined, as the issue asks ("a single legal answer stays as it is today"). That covers a free bonus, a bonus or trade with one legal payment (Olympic Host's 1 worker for 10 VP), and an advance with one legal payment, which opens no panel and pays from the footer **(my call, after the builder check)**.

### 4.4 Accessibility

- Every resource, card and tile is a toggle button (`aria-pressed`) with a name that says what it is and what is held ("Food, 7 held"); a fixed row's resource is not a button. Each row is a group named "Resource 2 of 3".
- Tab reaches every enabled item, then the buttons; Space or Enter toggles. Disabled items say why in their title ("You hold no worker").
- The status line is a live region, so the count and the cap warning are read out.
- Reduced motion: no animation is needed; the fading is a static style.

## 5. The pieces

### 5.1 The plain module

A new `src/lib/picks.js` (name the builder's call), tested under Vitest with no DOM:

- builds, for a decision (or an advance's payments), the parts to pick: fixed resources, free resource rows with the resources each offers, and card or tile pickers with their items and count;
- says whether an item can be picked given a selection (the answer rule in §4.1);
- matches a complete selection to the index of exactly one answer, or says what is missing;
- describes the selection for the status line (reusing `describe.js`' words).

`promptFor()` gains a layout for these decisions (for example `'picks'`) and carries the parts; the single-answer and single-pick decisions keep their layouts.

### 5.2 Components

- **`ResourceRows`** (name the builder's call): the rows, with fixed and free rows, counts, the picked name, the fading and disabled states, reporting each pick through a `ComponentEvent`. A library section shows it empty, part chosen, complete, with a fixed row, with a disabled resource and with the cap warning.
- **`TilePicker`** and **`CardShelf`** gain a multiple-choice mode (several `pressed`, others disabled when the count is full), with library examples.
- **`SelfSummary`** accepts the counts to show while a prompt is open and marks the changed ones.
- **`DecisionPanel`** gains a `centred` placement (both axes, at the screen's centre); it is never combined with `docked` or a shelf. Its library section shows the four scenes of §3.

### 5.3 The game screen

`Game.svelte` keeps the selection for the open decision, resets it when the decision changes (as it does for `picked`), feeds `SelfSummary` the pending counts, opens the advance panel on a space pick when there is a choice, chains the VP trade's two sends, and confirms with the matched answer.

## 6. Tests

- **The module** (`tests/client-picks.test.mjs`): rows from each kind of cost; the answer rule (nothing unheld, one food in one row, a gain always open); matching; cards and tiles; conversion, trade and bonus cases; the single-answer case.
- **Random games** (extending the #28 prompt test in `tests/client-prompts.test.mjs`): in 60 or more random games, for every decision the picker handles, every legal answer can be built by picks the answer rule allows, and matches back to its own index; and no complete selection the rule allows matches nothing (the issue's checklist).
- **Library** (`tests/library.test.mjs`): the new and changed sections.
- **Browser**: a test pays a bonus with 2 chosen tiles and gains 2 chosen resources (the issue's checklist), and one pays an advance through the centred panel. If a real table can't reach a tile bonus in reasonable time, the bonus part may use the library's interactive example **(left to the builder)**. A test that creates a table ends and leaves it.

## 7. Documentation

The README's "Current interface" and `docs/ui/screens/` show the new prompt (owner's standing rule); `docs/ui/README.md` describes it and drops the advance footer's payment list; `src/lib/components/README.md` lists the new and changed components; `docs/architecture.md` lists `picks.js`; `docs/status.md` and CLAUDE.md record #75. #75's issue text still proposes steppers: its proposed solution should point to this design **(my call)**.

## 8. Owner approval

The issue asks the owner to approve the prompt in the component library before the game uses it. The owner approved the mockup (owner, 2026-10-28), so, as #74 did, it is built into the game in the same change, and #75 closes once the owner has looked at the library sections. The owner closed it on 2026-10-28.

## 9. Left to the builder

The module's and components' names and APIs; exact sizes from tokens; how the panel centres within `DecisionPanel`; the status line's exact words beyond those above; whether the browser test's bonus runs at a real table or in the library.
