# Full-game simulation test (#21): design

Written 2026-10-25. This is the last base-game rules-engine issue (M3). It adds a test that plays random legal games from setup to the end and checks the engine's invariants after every action.

The owner asked for #21 and #22 to be built and pushed to main without a question round ("work on 21 and 22 and push to main when you are done"). So every decision here that the issue doesn't settle is marked **(my call)**, for the owner to revisit.

## 1. What and why

#13–#20 each test their own rules, mostly from hand-built positions. Nothing yet plays thousands of real decisions in a row, in every player count, and checks that the game stays whole. Random play finds the combinations nobody thought to script: a card lost between two piles, a decision with no legal answer, a private card in someone else's view.

Before this design, a throwaway probe played 1,200 random games, with draft conservation checks after every action, and found no failure. So #21 is mostly a permanent guard: it keeps finding the bugs that #22–#41 will add.

## 2. Goals

1. `node --test tests/simulation.test.mjs` plays **200 random games**: 1–5 players, both versions, from `createGame()` to the final ranking.
2. After **every action** it checks:
   - every card, tile and token is in exactly one place (§5);
   - `view()` for each player, and the public view, leaks nothing private (§6);
   - event `seq` numbers go up by 1 with no gaps (§5).
3. A failing game prints its seed and how to replay it alone.
4. It runs in GitHub Actions, as part of `npm test`, without making the suite slow (§7).

## 3. Non-goals

- Solo games against the Automa and Shadow Empire: #31 extends this test to them (the issue says so). One-player games here have no bot, as `createGame()` allows today.
- Expansions: each expansion issue adds its own content to the conservation lists.
- Checking that random play is *good* play. The answers are legal, not clever.
- Replacing the scripted tests. They check that rules are right; this checks that the game stays consistent.

## 4. How a game is played

- **Games.** Game `i` (0 to 199) uses seed `i + 1`, `1 + i % 5` players, the original version when `⌊i / 5⌋` is even and the current one otherwise, and the *random* policy when `⌊i / 10⌋` is even and the *busy* one otherwise. So each of the 20 combinations of player count, version and policy gets 10 games. **(my call)**
- **Two random generators per game**, both `seededRandom()`: one is the engine's `random` (shuffles, dice), the other picks the answers. Splitting them keeps the engine's sequence the same whichever answers are picked. **(my call)**
- **Which decision.** With several decisions open at once (setup picks, lanes), one is picked at random, as players answer in any order.
- **Which answer.** The answer comes from the acting player's own `view()`: its `answers` list for that decision. So the test plays the way a client does, and checks that every answer `view()` offers is one `play()` accepts. **(my call)**
- **Policies.** The *random* policy picks any answer. With it, players take income turns early, so games are short: about 100 actions. The *busy* policy takes an advance turn 85% of the time when one is offered, which plays most of the engine: about 240 actions, with exploring, conquering, inventing and most tapestry cards. **(my call)**
- **The end.** A game must end within 5,000 actions. At the end the phase is `over`, no decision is open, every player has taken 5 income turns and finished, and `state.result` ranks every seat.

## 5. The state invariants

Checked on the full state after `createGame()` and after every action. `tests/helpers/invariants.mjs` holds them, so #31 and the expansion issues can extend them.

**Exactly one place.** Each list below must hold every id exactly once:

| Item | Count | Places |
|---|---|---|
| Tech cards | 33 | the deck, the face-up display, the discards, every player's bottom, middle and top rows |
| Tapestry cards | 50 | the deck, the discards, every hand, every era slot of every income mat (face down included) |
| Territory tiles | 48 | the stack, the discards, every player's tiles, every hex (printed territories 49–77 are not tiles) |
| Space tiles | 15 | the stack, every player's tiles beside the income mat, every player's explored space tiles |
| Civilizations | 16 | the deck, the discards, every player's civilizations; during setup also the open `chooseCiv` options and the kept picks |
| Capital mats | 6 | every player's mat, the unused mats; during small-map setup also the open `chooseCapital` options and the kept picks |
| Landmarks | 18 | the unclaimed landmarks, every capital, beside every mat, the Nomads' pieces on the map, and the open `choosePlacement` decisions waiting to place one |

**Fixed counts per player:**
- **Income buildings:** 5 of each of the 4 kinds, counted on the income mat, in the capital, beside the mat, on the Craftsmen's columns, as Nomads pieces on the map, and in open `choosePlacement` decisions (the issue's own checkbox).
- **Outposts:** 10, in supply or on the map, toppled or not. Nomads pieces are not outposts.
- **Civilization tokens:** 4 each for the Traders and the Isolationists, once set up: on the mat (`civData`) or on the map (`hex.tokens`).

**Values:**
- Resources are whole numbers from 0 to 8 (the cap). VP are whole numbers.
- Every track token is a whole number from 0 to 12.

**Events:** `seq` numbers in `state.events` go up by exactly 1, the last one equals `state.seq`, and every action's new events are numbered above the old `state.seq`.

**Era cards (#19):** an active THIS ERA card is on top of one of its owner's era slots, never covered, and a finished player has no active era.

**Decisions:** while the game is not over, at least one decision is open; every open decision has at least one legal answer; decision ids are unique across the stack and every lane.

## 6. The view invariants

`engine-view.test.mjs` already checks views, but only through setup. Its `checkViews()` moves to `tests/helpers/views.mjs`, so both tests share it, and it gains the checks that only later parts of the game can fail. For every viewer (each player seat, and `null` for the public view):

- No id from the tech, tapestry or civilization deck appears anywhere in the view.
- No card in another player's hand appears.
- No face-down tapestry card appears, to anyone, its owner included (01 §4.2).
- Before the reveal, no other seat's dealt civilizations or picks appear, and on the small map no other seat's capital mat.
- Decks and tile stacks are counts, not lists. Other seats have a `handCount` and no `hand` or `picks`.
- Another player's decisions lack their kind's `hidden` fields and `answers`. Another player's events lack `secret`.
- The viewer's own open decisions carry a non-empty `answers` list.

**Where a secret id may still show.** A secret id is excused only where it is public anyway:
- anywhere in the view, when it is in a public place now: the tech display and rows, the discards, the face-up income-mat cards, the civilizations in play, the Inventors' marks (which stay with a card wherever it goes, #20) and the landmarks;
- in the action's own new events, when it was in a public place before the action (a discard shuffled into a deck and drawn in the same action), or when the event names it in a field the rules reveal: `REVEALS` lists them, today only R35's `cardsRevealed`.

Events older than the action are not searched again: they were checked when they were new. **(my call)** The first version also excused any id named in an older event; the review showed that this hid a real leak (a card discarded publicly, then shuffled back and drawn), and no game needed it, so it went.

**Known limit.** Six tech cards share their id with a landmark (Bakery, Barn, Com Tower, Library, Stock Market, Treasury), and a landmark is always public somewhere, so a leak of those six in the deck can't be seen by id.

Searching a 40 KB view for every secret id would be slow, so the check reads every string in the view into a set once, then looks each secret id up in the set. **(my call)**

## 7. Speed

A probe measured the cost: playing is about 0.5 ms an action, and the views for every seat about 3 ms more. 200 games of both policies are about 34,000 actions, so roughly 2 minutes on one core. Today the whole suite takes 8 seconds.

So the test splits the 200 games across **worker threads**: one per core but one, at most 8 (`node:worker_threads`). Each worker plays its share and sends back each game's result, and the main thread reports one test per game. Locally (10 cores) that is about 15 seconds; on GitHub's 4-core runners about a minute. **(my call)** I considered three other ways:
- checking the views on only some actions, which the issue rules out ("after every action");
- splitting the games across several test files, which works but leaves four near-empty files and no single command;
- fewer or shorter games, which the issue rules out (200).

**Replaying.** `SIM_SEED=17 node --test tests/simulation.test.mjs` plays only game 17, on the main thread, so a debugger and full stack traces work. `SIM_GAMES=1000` plays more games for a longer soak. Either must be a whole number from 1. A failure message names the seed, the player count, the version, the policy, the action number and the decision being answered, then the replay command.

**Stuck games.** A worker says when it starts each game. One that says nothing for a minute is stuck, probably in an endless loop inside one `play()`: the test stops it, fails that game by name with its replay command, and fails the games it still owed. A worker that crashes fails the game it was playing the same way. The CI job also stops after 15 minutes. **(my call, from the review)**

The workers start with the first game's test, so a run filtered to other tests (`--test-name-pattern`) plays no games.

## 8. What the files are

- `tests/simulation.test.mjs`: the games, the workers and one test per game.
- `tests/helpers/simulation.mjs`: `simulate(seed)`, which plays one game and checks everything. Both the workers and `SIM_SEED` call it.
- `tests/helpers/invariants.mjs`: `checkState(state, before)` (§5).
- `tests/helpers/views.mjs`: `checkViews(state, setupFacts)` (§6), shared with `engine-view.test.mjs`.

## 9. Handed off

- #31: solo games, with the Automa's and Shadow Empire's pieces in the conservation lists, and bot seats in the views.
- #32–#41: each expansion adds its cards, tiles and pieces to the lists, and its decks to the view check.
- #24: undo must keep every invariant here; its tests can reuse `checkState()`.
