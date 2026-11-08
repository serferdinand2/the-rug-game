# Automa and Shadow Empire (#31)

## Intent

Let a table mark each player seat human or bot, then choose the bot type in the
lobby: official Automa or Shadow Empire where official player-count rules allow
it. This is the only bot-play system; there is no separate solo-mode switch.
The bots follow documented official procedures, use the shared game state and
rules engine, and make their moves understandable to the people playing.

## Goals

- Build the base Automa and Shadow Empire setup, turn cycle, decision and
  progress decks, all six difficulty levels, the four base Automa civilizations,
  map procedures, track benefits, income scoring, traps, achievements and final
  ranking.
- Support the original 2019 and current official rules differences already
  recorded by R36, plus official Automa and Shadow Empire setups.
- Let setup mark seats human or bot. In the lobby, select Automa or Shadow
  Empire for each bot seat; expose the six Automa levels there. Preserve official
  player-count restrictions for each bot type.
- Treat bots as seats in the engine, reusing its event, operation, visibility,
  neighbour and opponent systems. Bot-only fields remain separate from
  player-only capital, income-mat, hand and resource fields.
- Show bot activity to every human at the table. In the transient
  `PlayerAction` report, use a greenish edge and greenish pixel-noise surface so
  bot moves are distinct from human reports. Show the actual decision-card pair
  used for the move, rendered from the card data.
- Cover setup and full solo games with scripted tests; include bot pieces and
  seats in the existing state, room and view invariants and randomized solo
  simulation.

## Non-goals

- The Arts & Architecture track in Automa games remains unavailable per R59.
- Expansion-specific Automa civilizations and replacement decision or income
  cards remain in #34, #38 and #41. Owner confirmed #31 should support base-game
  bot rules only; do not offer expansion combinations until corresponding
  Automa rules are implemented.
- Do not replace the existing table log or change how human `PlayerAction`
  reports look.

## Constraints and source of truth

- `docs/research/02-base-content.md` §9 is the detailed source for setup,
  Automa civilizations, decision cards, turns, map rules, scoring and the
  Shadow Empire.
- `README.md` Rules conventions R36–R42 and R59 settle the version-specific
  rules, Alien Biology, decision-card hex patterns, solo map, distance,
  ranking and arts-track restriction. Follow these rulings over research notes
  marked inferred or unverified.
- The issue's blockers (#21, #22, #24, #28, #32, #53, #126 and #129) are
  closed on GitHub.
- Keep the existing JavaScript/JSDoc engine, operation stack and generated
  event flow. Random decisions use the injected `random(n)` function.
- `AGENTS.md` requires a clickable mockup and owner approval before any new
  interface is built. The bot action report and generated decision-card pair
  will be shown as a mockup after this design is approved.
- Keep `README.md` current with the shipped interface and update `docs/status.md`
  when issue #31 is completed.

## Approaches

1. **Chosen: bots are typed engine seats.** Use the existing `Seat` model and
   operation stack; bot procedures push automatic operations and emit public
   events just like player actions. The project already reserves `automa` and
   `shadow` seat kinds. This keeps maps, tracks, scoring and turn order shared,
   and lets existing views and invariants protect the whole state.
2. **Rejected: a separate Automa simulation beside the engine.** This would
   duplicate track, map, landmark and scoring rules, then require translating
   its results back into engine events. The duplicated rules could diverge from
   player effects and interactions.
3. **Rejected: treat bots as ordinary human seats.** Bots have no capital,
   resources, income buildings, hand or player choices. Giving them
   `PlayerSeat` fields would invite invalid effects and blur privacy boundaries.

The owner approved the typed-seat approach and specified that bot activity
reports use greenish borders/noise and show generated decision cards. The
recommended rendering is the revealed track card and tiebreaker card, side by
side, in each report for a bot move that used a pair. The cards are generated
from the exact pair data used by the engine, not separately selected art.

## Product and engine shape

- A one-human table with an Automa uses the small map and fixed solo starting
  territories; there is no separate solo-mode toggle. The selected Automa level
  controls its mat side, income schedule and deck additions.
- A Shadow Empire seat follows its official player-count restriction, joins
  normal turn order and uses the 12-card decision deck and reversed tie-break
  direction.
- The engine stores exact decision-card data once: each card's two bot track
  indicators, track tiebreak order, hex pattern, income icon and topple icon.
  Pair draws, discards, reshuffles and the selected pair are represented in
  serializable state and public events.
- The Automa and Shadow Empire advance automatically from those data and the
  injected random source. The Automa gains only listed benefits; the Shadow
  Empire gains only landmarks and track-completion achievements. Neither bot
  takes human-only choices. Bot-caused actions still pass through shared
  operation handlers where that preserves official effects.
- Conquests, explores, legal targets, distance, territory control, traps,
  landmarks, achievements, neighbour checks, card effects and winner ranking
  use the shared map and seat data. Rules that explicitly omit or exclude a bot
  remain exceptions as recorded in the research and README.
- Bot turns do not need an automatic timeout. A decision that requires a human
  is timed against the human seat that must answer.
- Owner said to apply optional draft variants to Automa where applicable. The
  base Automa does not take the human's income-turn-1 Ceremony tapestry card:
  its face-down tapestry cards are separate trap and mat-multiplier systems,
  not a gain-of-tapestry effect, so `tapestry-draft` does not change them. The
  base Automa also selects from its separate Automa-civilization pool, not the
  regular civilization pool, so `civ-draft` does not change its civ selection.
  Shadow Empire does not draw either type of card. Expansion Automa pools remain
  out of scope here.
- The `PlayerAction` feed reports bot actions to every human viewer. Its bot
  variant uses the requested greenish pixel-noise treatment and includes the
  exact decision pair that caused the action. Human reports keep their current
  player-colour style. The compact mockup will settle the card size and
  placement before implementation.

## Acceptance

- Solo and two-human Shadow Empire setup are valid and match the official
  starting positions, seats, decks and first-turn rules.
- All six levels follow their income schedule and scoring multipliers; original
  and current rules choose the right Automa-civ and tiebreaker procedures.
- The decision pair is the source for each bot move, and the card pair shown in
  `PlayerAction` matches that move. Bot reports are visible to all human
  players and use the approved green treatment; human reports are unchanged.
- Bots count as neighbours/opponents where the rules require, including
  income-first-neighbour gains, tech prerequisites, tapestry cards,
  civilizations and achievements. Bot-only and player-only fields remain
  separated.
- Shared-state checks, view privacy checks, a scripted full solo game and
  randomized full solo games pass.
- Lobby setup, bot seat chips, names, footer and results identify the bots
  consistently. The table can finish and score normally.

## Calls still needing owner approval

- Design approved by owner, with human/bot seat selection and lobby bot-type
  choice clarified on 2026-11-08.
- Approve the compact decision-card treatment in the clickable mockup before it
  is implemented in the game.
