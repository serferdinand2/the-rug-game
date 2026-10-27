# The hot-seat pass screen (#30): design

Written 2026-10-27. #30 is the last issue of M5 · Playable base game. At a hot-seat table one screen serves every player, and until now it switched straight from one player's view to the next, so the next player could see the last one's hand. The pass screen stands between them.

The owner asked for #30 to be resolved without a question round ("resolve issue 30", 2026-10-27). What the owner said is marked **(owner)**, every other decision **(my call)**. The owner's rule for collisions holds: Lazar's mockups decide the look, the owner's design decides what works **(owner)**. No mockup draws a pass screen, so it takes the launch and lobby pages' look: the chrome panel, Cinzel for the name, the gold button.

## 1. What and why

The design document's build plan: "Done when: a hot-seat game never shows one player's hand to the next player." The issue adds: "The pass screen for #17's response question must not show who holds a response card: every asked defender gets the same pass screen and wait."

Hand-offs this issue takes on:
- **#22:** at a hot-seat table the host plays every seat; names at one table differ (ignoring case), so the pass screen can name the next player.
- **#23:** `GET /api/state` gives the public view at a hot-seat table unless `?seat=` asks for a seat, so "the pass screen asks for the next seat's view only after the hand-over".
- **#24:** undo and the clock follow the seat being shown.
- **#26:** the lowest asked seat is shown, without a pass screen until #30.

## 2. When the pass screen shows

- At a hot-seat table, whenever the seat to show becomes a different player: a new turn, another player's question in the middle of a turn (a conquest's response, a neighbour's pick), the next player's setup, the first seat of a new deal, and after a refresh or a return to the table **(my call)**.
- Not when the same player is asked again: the turn's choices follow each other without one.
- The seat to show is still the lowest asked seat (#26).
- Online and solo tables never show it.

## 3. Nothing private before the hand-over

- While the pass screen is up, the client asks `state` without a seat and polls it the same way (#23). The move that brought the pass screen is the last player's own view; the pass screen covers it, and the public view replaces it as soon as it arrives. The pass screen draws only public things: names, the reason line and the clock.
- The named player presses **I'm Vera**. Only then does the client ask `state?seat=` for that seat, and the pass screen stays until that view arrives. No other player's view is ever asked for while someone else holds the screen.

## 4. The same pass screen and wait for every defender

- **No automatic decline at a hot-seat table (my call).** Online, a defender who holds cards but no trap is declined by the server after a random 3 to 10 seconds (#24), so nobody learns who holds traps. At a hot-seat table that decline would come while the pass screen waits: the defender's clock would vanish and the reason line could change, which a trap holder's screen never does. So the server schedules no decline at a hot-seat table, and every asked defender takes the screen and answers the response question themselves; one without a trap sees it with only Decline. A defender with a trap and one without get the same pass screen, the same wait and the same question.
- The pass screen names one player and holds until that player takes the screen, even when the game moves on meanwhile (a clock running out) **(my call)**. If, once they take the screen, the player is no longer asked, the next pass screen follows at once.
- Events that arrive while a pass screen is up make no sound, motion or toast **(my call)**. The log keeps them. The events of the move that led to the pass screen still play, because they belong to the player who made it.

## 5. The pass screen

- A full page, under the page header (the brand, sound and the menu with How to play and Leave table), on the table's texture.
- In a chrome panel: "Pass the screen to", the player's token in their colour, their name large in Cinzel, and a reason line from the public view: "It's Vera's turn.", "Vera's setup choices." or "Vera has a choice to make." The last one serves every question outside a player's turn, so a response question reads like any other **(my call)**.
- When the table has a turn timer, the named player's clock shows and runs, as in the game header.
- A line under it: "Vera's hand and cards stay hidden until Vera opens them."
- The gold button **I'm Vera** takes the screen.
- **No slip-through (my call):** the button is not focused when the screen appears, and it waits 0.6 seconds before it answers, so a click or key meant for the last player's Confirm can't open the next player's view. The heading takes the focus, so a screen reader announces the hand-over.
- It is a component, `PassScreen` in `src/lib/components/ui/`, shown in the library in its states; `App.svelte` shows it instead of the game.

## 6. The end of the game

At a finished hot-seat game the client shows the public view: the results belong to everyone (#29), and reviewing the board shows no player's hand, since there is no next player to pass to **(my call)**.

## 7. Calls to revisit

- The pass screen holds its player even when the game moves on, so a player whose clock ran out on the pass screen takes the screen to find nothing to do, and passes on.
- No undo from the pass screen: once the screen is passed, undo belongs to the next seat, as before #30. The server would still allow the last player's undo until the next player's first choice.
- The 0.6-second wait before **I'm Vera** answers.
- No automatic decline at hot-seat tables, where #24 had it in every mode.
- The pass screen's menu offers How to play and Leave table, not the host's table settings, which need the game screen.
- After the game, the board is reviewed through the public view.

## 8. Not in #30

- Solo play and the Automa (#31).
- A pass screen for online tables, which have one person per screen.

## 9. Tests

- **Client logic** (`src/lib/pass.js`, `tests/client-pass.test.mjs`): the hand-over over every case in §2–§6: a new seat asks for the public view and names the player; the pass holds through a decline and a timeout; the seat's view is asked only after the hand-over and taken when it arrives; a seat no longer asked passes on at once; the same seat asked again needs no pass; a finished game shows the public view; online tables are untouched; the reason line for a turn, setup and any other question.
- **Server** (`tests/rooms-clocks.test.mjs`): a hot-seat table schedules no decline, with the timer on or off.
- **Browser** (`tests/browser/pass-screen.test.mjs`): a two-seat hot-seat game in Chromium. After the deal the pass screen names the first player and the page holds no hand; taking the screen shows that seat. When the turn passes, the pass screen names the next player, and nothing of the last player's hand is in the page. A refresh shows the pass screen again. The setup browser test takes the screen for each seat.

## 10. The review

A fresh review traced every way a view reaches the client and found no path that shows or asks for a seat's view before its player takes the screen. It found the server's automatic decline would still give a no-trap defender away when the turn timer is on (the clock vanished from the pass screen) and when the decline ended the attacker's turn (the reason line changed); §4's server change removes the decline at hot-seat tables. Its smaller findings are fixed: the final move of the game shows at once, a late answer after leaving the table is dropped, the pass screen's menu can leave the table, the opening status is announced, and the clock ticks only when there is one.
