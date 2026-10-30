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
