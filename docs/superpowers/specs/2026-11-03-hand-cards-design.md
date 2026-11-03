# The Hand tab's cards big enough to read (#158): design

## Intent

The Hand tab drew the viewer's tapestry cards at 0.42 (134 px wide) in one fan overlapping by 70 px, so a card's name was cut off and its effect text was about 5 px high. The cards should be drawn big enough to read in the tab itself, and hovering a card still opens it in full.

## Owner's decision (2026-11-03)

The mockup `docs/ui/prompt-and-hand.html` (screenshots in `docs/ui/screens/issues-148-149-158/`) offered two layouts over the running game:

- A: two columns at 0.65, each card fully readable, a long hand scrolling the tab;
- B: rows of overlapping cards at 0.6, every card's name in sight, a covered card's text cut until it is hovered.

The owner chose **B**.

## The layout

- Each card is drawn at 0.6 (about 191 px wide), the size of the era card on the Eras tab.
- The cards fill rows across the tab's width. A row holds as many cards as fit while each covered card still shows at least 120 px, enough for its name, and never more cards than the hand has. The last card of each row shows in full. Cards that fit side by side keep a 14 px gap instead of overlapping.
  - 1920×1080: the tab is about 436 px wide, so three to a row, 122 px apart.
  - 1536×864 and 1440×900: two to a row.
  - 1366×768 and 1280×720: one to a row, each card whole.
- Rows stand 14 px apart; a hand taller than the tab scrolls it, as the tab already does.
- Hovering or focusing a card raises it in front of its neighbours without moving them, and reports it for the full view (`inspect`), as the fan did. Tab and Shift+Tab move through the cards in hand order.
- Another player's hand (#156) draws its card backs in the same rows at the same size, so the two tabs match.

## How it is built

- `fanRows(width, cardWidth, count, spacing)` in `src/lib/cards/card-sizes.js` works out the row length and the distance between the cards' left edges, with `FAN_ROWS` holding the 120 px and the 14 px. It is a plain function, tested under Vitest.
- `CardFan` gets a `wrap` prop with the card's drawn `cardWidth`: it measures its own width and lays its cards on a grid of `fanRows()`'s columns instead of one overlapping row. Its other looks are unchanged, and the Tech tab and the card shelf keep their one row.
- `PlayerTabs` draws both hands with `wrap` at the scale `HAND_SCALE` (0.6).

## Tests

- `fanRows()` at the widths above, with fewer cards than a row holds, and unmeasured.
- The player-area browser test (#64) gives the viewer five cards and, at each desktop size, checks that every card lies inside the player area and every covered card shows at least 120 px.
- The library's CardFan section shows the wrapped rows.
