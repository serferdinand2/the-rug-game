# The header's glow while End turn counts down (#177)

**Asked (issue #177):** the header's green glow sometimes stays on the player who just finished, for up to 6 seconds, so the screen shows the wrong player as having the turn. The owner asked for all of M5 to be built on 2026-11-04 and chose the fix the same day (below). Other choices are Claude's, marked **(my call)**.

## The cause, confirmed

Since #146 a turn whose choices are all made waits on `confirmEndTurn`, which the server presses `endTurnMs` (6 s) after it opens. The engine changes `state.current` only when the next turn starts, so during the wait the finished player is still current, and `playerChips()` gave them the glow. `tests/engine-confirm-end-turn.test.mjs` already showed `state.current` staying on the player; `tests/client-area-players.test.mjs` now shows their chip keeping the turn, from either seat's view.

The issue's other suspects are not the cause of this delay: a conquest's defender deciding (#24) is still the attacker's turn, so the glow is right there; `shownClock()` names a clock, not the glow; and a long poll falling behind would delay every change on the screen alike, not only the glow.

## The fix (owner, 2026-11-04: "Dim the glow while closing")

- `playerChips()` marks a chip `closing` when the current player's End turn is the only open decision (`openDecisions(view)`). While anyone else still decides, such as a defender, nothing is closing **(my call)**.
- `PlayerChip` takes `closing`: with `current`, the outline thins from `--border-thick` to `--border` and the glow dims to the new token `--glow-closing` (the same green at about a third of its strength), and the chip's name ends "current player, ending their turn" **(my call: the look)**. The glow moves to the next player when the turn passes, as before; no chip previews the next player **(my call)**.
- `GameHeader` passes it; the library's PlayerChip section shows a current chip beside a closing one.

## Testing

- `tests/client-area-players.test.mjs`: after a turn's last choice, from both seats, the finished player's chip is current and closing and no other chip glows; mid-turn nothing is closing.
- `tests/browser/end-turn.test.mjs`: while End turn counts down, the finished player's chip carries the closing class and its name says "ending their turn", and only one chip is current. `SHOTS=1` also takes `docs/ui/screens/game-end-turn-header.png`.
