# Another player's tabs in the player area (#145, #143): design

Written 2026-10-30. #145 (M4) asks for an opponent's public tabs in the 1/4 player area; #143 asks for opponents' eras and territory tiles in the players overview. The owner's ruling below decides both. Every other decision here is **(my call)**.

## 1. The owner's ruling (owner, 2026-10-30)

> When I click on the other player in the top nav, no longer open the card view of all players, just show me their view of the right sidenav but hide all cards that are private.

So:

- Clicking another player's chip in the game header no longer opens the players overview. The right-hand 1/4 player area (`PlayerTabs`: Capital, Hand, Income, Eras, Civ, Tech, Terrain) shows **that player's** tabs instead, read-only.
- Everything private stays hidden: their hand is a count, never card faces; a face-down tapestry card is a back ("Face-down card"), as it is in your own Eras tab; nothing else the server hides is shown.
- Their Eras tab shows their face-up tapestry cards and their Terrain tab the territory tiles they hold. That is #143's goal, met in the player area. **#143's checklist (two new `PlayerCard` rows, the overview's detail views, its mockup) is superseded by this ruling** and is not built.

## 2. What the player sees

- **A chip opens that player's tabs.** The tab on show stays the same tab (Capital opens their Capital), so comparing one tab across players is one click per player.
- **Whose tabs they are.** While another player's tabs show:
  - the tab area has a border in that player's colour (`var(--player-n)`), drawn as an inset outline so nothing moves;
  - a small line at the top of the area says **Viewing Vera's area**, with the player's colour square as in their chip, and a **Back to your area** button (the existing `Button`, small, secondary);
  - the tab headings name them: "Vera's eras", "Vera's technology", and the tab list's label "Vera's city and cards".
- **The way back.** Back to your area, your own chip, the same chip again, the same 1–5 key again, or Escape (after anything open over the screen: Escape closes the top layer first, as #88 ordered).
- **Read-only.** No placement on their capital, no tile picks on their Terrain tab, no spots on their civilization card. Hovering a face-up card still shows it in full over the shared area, since it is public and changes nothing. Your turn, your selection on the tracks, the footer and any open decision panel are untouched.
- **A decision that needs your own tab takes you back.** When a decision opens that belongs on a tab (`tabFor`), the area goes back to your own tabs and opens that tab, as it already switches tab by itself. The hot-seat screen passing to another seat also goes back.
- **Hand.** Their Hand tab says how many tapestry cards they hold ("Vera holds 3 tapestry cards. A hand stays private.") and the tab carries the count, as yours does.
- **The summary at the foot of the area** is the shown player's (#157, superseding the first ruling that it stayed yours, which read as every player holding your resources): their name, era, VP, counts and resources from the view, with no highlight, and the border in their colour continues down its sides and foot. Back in your own area it is yours again, with your open prompt's preview of your resources. `areaSummary(view, shown, viewer, preview)` in `src/lib/overview.js` chooses it.
- **The public view** (no seat of yours on show at a shared screen): a chip shows that player's tabs too, read-only, without a Back control (there is no own area); the same chip again closes them. The note there now says "Open a player's chip to see their tabs."

## 3. The keys (#83)

**1–5** do what the chip does: open that player's tabs, and the same key again (or your own number) goes back. How to play's keyboard shortcuts say so.

## 4. The players overview

Nothing opens it any more: the chips and 1–5 were its only ways in. Its component (`PlayersOverview`, `PlayerCard`), its layer in `layers.js` and its footer stay in the code, unreachable, for the owner to decide whether to delete them **(my call: kept, as asked)**. The header chips no longer fill with colour, since the overview never opens.

## 5. Privacy

`view()` already removes another seat's `hand` and `picks` and turns every face-down tapestry card into `null`. The client adds a guard all the same: `publicSeat(entry, viewer)` in `src/lib/area/inspect.js` returns the seat without `hand` and `picks` unless it is the viewer's own, and `PlayerTabs` draws only from it. Tests prove that no hidden card is drawn: the guard on a view that leaked a hand, and `PlayerTabs` rendered with `svelte/server` on another seat's Hand and Eras tabs, which must hold no card of their hand and no face-down card.

## 6. Code

- `src/lib/area/inspect.js` (new): `nextInspected` (which seat a chip or key leaves on show), `shownSeat`, `publicSeat`, `handCount` and `areaWords` (the area's words for the seat on show).
- `src/lib/words.js`: `possessive` ("Vera's", "Marcus'").
- `src/lib/components/player/InspectBar.svelte` (new): the "Viewing X's area" line and Back to your area. Library section and README row.
- `src/screens/game/PlayerTabs.svelte`: takes `viewer`; draws `publicSeat`; read-only, bordered and with `InspectBar` when the seat is not the viewer's; `onPlayerTabsBack`.
- `src/screens/Game.svelte`: an `inspected` seat; the chip and 1–5 call `nextInspected`; Escape; a decision with a tab and a seat change go back.
- `src/screens/game/GameHeader.svelte`: chips no longer fill.

## 7. Tests

- Vitest: `tests/client-area-inspect.test.mjs` (the rules of §2–§5 on an engine game, and `PlayerTabs` rendered on the server), `tests/client-words.test.mjs` (`possessive`).
- Playwright: `tests/browser/opponent-tabs.test.mjs` opens the other player's tabs from the header at a hot-seat table, checks the border, the line, the hand count and that no card face shows, then goes back with the button, the chip and Escape. `tests/browser/hotkeys.test.mjs`: 2 opens the other player's tabs instead of the overview.
