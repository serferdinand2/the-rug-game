# A building with none left can't be picked (#181)

**Asked (issue #181):** an option that would gain an income building none of which is left should be greyed out and impossible to pick, as a rule of the engine, so the server, the client and the bots agree. The owner asked for all of M5 to be built on 2026-11-04 and made the issue's open calls the same day (recorded below). Other choices are Claude's, marked **(my call)**. The rule is **R117** in the README's Rules conventions.

## Owner decisions (2026-11-04)

- **One option left:** the player is still asked, so they see the greyed-out option and why; the remaining option is not taken by itself (unlike Diplomacy's `anyBuilding`).
- **A bonus for a building with none left** (Ships' Farm, Mathematics' House, Carpentry's Market): still offered, its pay choice greyed out with the reason, so only declining it can be answered.

## The engine

- `buildingsOut(state, player, effects)` (`effects/building.js`): the buildings an option would gain, when it gains nothing but income buildings and none of them is left; null otherwise (an empty option, one with anything else in it, or one of two buildings with one left). It reads only the income mat, so the client calls it on the view, whose income mats are public.
- `chooseOption` leaves such options out of its answers, and answering one throws `PlayerError` "You have no House left." This reaches every question asked as a `chooseOption`: the choice effect, a civilization's offer, explore's Exploitation, the Treasure Hunters and the Plans & Ploys cards.
- `choice()` asks nothing when every option is out, and emits `noBuildingLeft` with `building: null` and the `buildings` missing; the log says "Ana had no Farm, House or Armory left to gain."
- Any other question whose options are all out keeps them all, so it can still be answered as before (a Treasure Hunters' pick between two used-up buildings) **(my call: no such question can be left with no answer)**.
- `chooseBonus` answers only its decline when its gain is out, and paying throws the same `PlayerError`. A bonus the player can't pay for is still not offered at all.

## The prompt

- `promptFor()` adds `unavailable`: each option left out of the answers for this reason, with its words and art as an answer would have them, the reason ("No House left", "No Farm or House left") and the answer it sits before. A bonus that is out adds one, "Take the bonus" with the building's art, after **No bonus** **(my call: the words)**.
- `PromptState.panelOptions` lists them in their place among the panel's options, keyed apart (index −1), and `DecisionPrompt` passes the reason to `DecisionOption`.
- `DecisionOption` gains `reason`: the option is disabled, dimmed as a trade the player can't pay for already is, and the reason stands under its words in the body colour, bold, so it reads through the dimming **(my call)**. Its library section shows both cases.

## Testing

- `tests/engine-building-out.test.mjs`: an option out of the answers, answering it throws, nothing out with a building left, every option out asks nothing and logs the buildings, `buildingsOut`'s cases, another question keeping all its options, and a bonus with only its decline.
- `tests/client-prompts.test.mjs`: the greyed option in its place with its reason and art, none with a building left, and the bonus beside No bonus. `tests/client-prompt-state.test.mjs`: the panel's order with two greyed options. `tests/client-log.test.mjs`: the log names the buildings.
- The simulation's 200 games pass.
