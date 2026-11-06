# The Spies' track pick takes a click, and the owner's review of #172's looks (#172)

**Asked (issue #172):** no civilization's choice is a long list of text buttons; a slot pick answered in the panel has at most 8 options with the art the game has, and a longer one is made where the thing is. The code landed on 2026-11-03 (see docs/status.md); what was left was the owner's review of the two new looks, the Spies' tile shelf and their pick on lit track spaces. The owner asked for it on 2026-11-06, with screenshots from a real game.

## The bug the real game showed

- A four-seat hot-seat Plans & Ploys table was played through the API until the Spies' income turn asked for a neighbour's track space (option 3). In the browser, the six lit spaces were outlined, but none took a click: the prompt's root (`.rg-decision-panel`) is the scrim over the whole shared area, and it took the pointer. The unit test of #172 picked the space in code (`selectTrackSpace`), so it never saw this.
- A choice on the map doesn't have this problem, because a map choice docks the panel at the right with no scrim (`docked`, #74).

## The owner's calls (2026-11-06)

- **The track pick:** shown two working prototypes, A (dock the panel at the right as for the map, the tracks shrinking beside it) and B (keep the panel at the tracks' centre, drop the scrim, and let the board around it take the click), the owner chose **B**. The panel can still cover spaces in the middle of Science and Technology; Minimize (V) uncovers them.
- **The tile shelf:** approved as built: the neighbours' territory and space tiles at 96 px on a shelf above the panel, the picked one outlined in gold, with the Terrain tab opened.

## Built

- `PromptState.clickThrough` is true for a choice on the tracks (`isTrack`). `DecisionPrompt` passes it to `DecisionPanel`'s new `clickThrough` prop, whose root then draws no scrim and takes no pointer; only the panel and its shelf do. The panel stays where #79 puts every prompt, at the centre of the tracks.
- The library's DecisionPanel section shows `clickThrough`.

## Tests

- `client-prompt-state`: the Spies' space pick is `clickThrough` and not `docked`; a choice off the tracks keeps its scrim.
- The browser test `spies-tracks` plays the table to the Spies' space pick and clicks a lit space as a player would, choosing the neighbour in the panel when two share the space, then confirms. Run against the code before the fix, the click fails because the panel intercepts it.
