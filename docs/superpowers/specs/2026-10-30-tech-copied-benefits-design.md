# Tech cards that use another card's benefit (#144): design

Written 2026-10-30. #144 is a bug in M5 · Playable base game, filed by Lazar after playing. It builds on #18 (tech cards, `docs/superpowers/specs/2026-10-25-tech-cards-design.md` §8). Every decision here is **(my call)**; nothing the owner has ruled changes.

## 1. What and why

The report: Assembly Line's circle uses the square benefit of a top-row card and its square the circle benefit of a middle-row card; choosing an eligible card should resolve that card's benefit without moving it, and "the row-specific copied-benefit effects do not work as expected".

**Done when** every base effect that uses another tech card's benefit offers only the cards of its row, resolves the chosen benefit in full without moving the card, handles an empty row, and the player can see in the game which card's benefit was taken.

## 2. The effects traced

The base game has four, all as `{ techBenefit: { icon } }` (02 §4 card 4, 01 §3.4 spaces 9 and 11):

| Effect | Takes | From the row | Data |
| --- | --- | --- | --- |
| Assembly Line's circle | the square | top | `techCard('assembly-line').circle` |
| Assembly Line's square | the circle | middle | `techCard('assembly-line').square` |
| Electronics (technology 9) | the circle | middle | `TRACKS.technology` space 9, in any order with an upgrade (FAQ #8) |
| Nanotechnology (technology 11) | the square | top | `TRACKS.technology` space 11, with an upgrade |

All four were right in the data. Industrialism (gain the circle of the card just invented, which stays in the bottom row), Alliance and the Inventors' tokens gain the benefit of a named card, not of a card chosen from a row, so they don't use `techBenefit`. The expansion effects (Engineering, Information Age) aren't built yet.

## 3. What was found

Traced in the engine, the client's prompt model and the running game (a two-seat hot-seat table in Chromium, at ef56a28 and at 96af4e9, the main branch when the issue was filed):
- `techBenefitOptions` offers the middle row for the circle and the top row for the square, so Assembly Line never offers itself (R19).
- `chooseTechBenefit` refuses a card it didn't offer; the chosen benefit resolves in full, with its own decisions (The Nail's choice, a farm to place), and no card moves.
- An empty row emits `noTechBenefit` and asks nothing.
- The decision opens the Tech tab and puts exactly the offered cards on the tech shelf, each worded with the right icon's benefit; Confirm sends the answer and the benefit follows.
- Every one of the 33 cards' circles and squares was copied through `techBenefit` and through Assembly Line's own upgrade, both ways, with the state invariants checked: none failed.

What does go wrong for a player: **nothing in the game says whose benefit was taken.** With one card in the row the engine takes it without asking (#18 §8), so Assembly Line moves up and the player is straight away asked to place a farm, or simply gains something, with no word of the card it came from. When the player chooses, the log still never names the card. A copied benefit looks like a benefit from nowhere, or like nothing at all.

## 4. The fix

- **`techBenefitUsed { player, card, icon }`**, a public event, emitted by `useTechBenefit` before the card's benefit is pushed, whether the card was chosen or the only one. It is the only engine change: rows, options and resolution stay as they are.
- **The log** words it: "Ana took the square benefit of The Nail, which stays in the top row." (or "the circle benefit of …, which stays in the middle row."). It comes before the benefit's own lines, so the farm or the VP that follows reads as The Nail's.
- One card is still taken without asking, as #18 decided for every mandatory single choice; the log line now shows it.

## 5. Tests

- `tests/engine-tech-copied-benefits.test.mjs`: for each of the four effects, the row and icon from the data, and with no card in the row (a card in the other row is not eligible), one card (taken at once, with the event, its benefit's own decision open, nothing moved), and several (exactly the row's cards offered, a card of the other row refused, the chosen card's nested decision next, nothing moved). Then Assembly Line's own upgrade both ways, as the issue's example plays it, never offering itself (R19).
- `tests/client-tech-benefit-prompt.test.mjs`: the prompt from the viewer's own view (Tech tab, the tech shelf, the cards and their benefit words), the answer it sends resolving the benefit, and the log line, also when nothing is asked.
- `tests/client-log.test.mjs`: the event's sample and its two sentences.

## 6. Questions no rule covers

These are not decided by R1–R110 and are left as the engine has them; they need the owner:
- When Alliance or an Inventors token gives a player an opponent's Assembly Line benefit, "your top row" or "your middle row" is read as the gaining player's own rows.
- Nanotechnology or Assembly Line's circle may still pick a landmark card whose landmark is gone; it gains nothing (`noLandmarkLeft`), as #18 §8 decided.

## 7. Reopened report: copied income-building benefit appears not to work (2026-10-31)

The owner reports that a copied benefit that gains an income building does not appear to award it, and asks whether that benefit is consumed when the source card first gains the building. They confirm that matching building pieces remained in the failing game. They also ask to check copied non-building circle and square effects.

The building is not consumed by its tech card. Each activation runs the card's effect again, but only while a piece of that type remains on the income mat. Starting supply is five pieces per building type (space 1 is already uncovered); with zero left, `building` emits `noBuildingLeft` under FAQ #23. A source card already having gained its building does not prevent a second gain while supply remains.

Initial trace on 2026-10-31: with one Ammonia in the middle row and one Farm left, copying its circle emits `buildingGained`, decrements the mat supply, and opens the usual placement decision. With zero Farms left, it emits `noBuildingLeft` and opens no placement. The owner confirms the failing game had pieces left, so exhausted supply does not explain their report. A direct engine sweep of all 66 base tech-card circle/square benefits completed with no thrown errors, no source-card movement, and no tech upgrades. Follow-up regressions also exercise building benefits through Assembly Line's circle and square and through Technology 9/11's full any-order effect; each awards and places the building. The live UI failure remains unreproduced.

Regression coverage now includes a source card whose original building benefit already resolved, repeated building gain with supply remaining, exhausted supply, observable resource/VP benefits, and all four copy-entry paths. Keep #144 open: verify the live shelf selection and follow-on placement prompt, and capture the source card, copied icon and exact trigger if the player still sees no building.

## 8. Follow-up report: no building, prompt or Capital switch (2026-10-31)

The owner confirms the building did not appear and the UI did not open a placement prompt or switch to Capital. The client path explains why a shelf selection can appear to do nothing: `PromptState.choose(index)` only marks the card; `PromptState.confirm()` is what sends the selected answer to the engine. Until the panel action is pressed, the game remains on Tech and no copied effect runs. The generic button text was `Confirm choice`, which did not say it would activate the selected card's benefit. `chooseTechBenefit` now labels the action **Use benefit**. The copied-benefit prompt test checks this label, and after submit the existing engine/client test verifies that a copied Farm benefit opens `Where does the Farm go?` and the Capital tab. The owner requested closing #144 after the change was merged to main. A live-game check of the new label was not separately performed.
