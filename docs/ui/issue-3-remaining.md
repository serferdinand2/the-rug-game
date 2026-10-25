# Issue #3 remaining design work

Status: proposal for owner review, 2026-10-23. No new screen design is approved by this document.

Baseline: main d88b0af; local branch codex/issue-3-remaining-designs. The local issue #5 component refresh is preserved. Issue #3 has three unchecked checklist groups: every decision prompt, end-of-game results, and the income-turn sequence.

## Existing foundation

Use the approved desktop layout, tokens, fonts, header, 3/4 board + 1/4 detail split and footer from docs/ui/README.md. Reuse TurnBar, CostBox, ResourceIcon, ResourceChip, Tabs, PlayerCard, CapitalGrid, PlacementTray and LandmarkPiece. Use the reviewed SVGs. The six full capital mats are examples only; game capitals are composed from tiles using canonical plot masks.

The existing Ships/Farm interaction covers a fixed optional action, not a resource chooser or general decision flow. CapitalGrid covers landmark manipulation, but map hex selection is still a static SVG. The opponent Capital view is developed; other opponent detail selections are fixtures.

## Remaining decision designs

| Item | Existing coverage | Proposed solution |
|---|---|---|
| Pay costs | CostBox displays a price; no allocation of any-resource costs | Expand the footer to show resource balances and allocation controls for flexible costs. Show the exact deduction and remaining balances; confirm only a complete affordable allocation. Keep a one-click path for an unambiguous fixed cost. |
| Choose resources / reward | Resource display only | Reuse the same resource selector with a required quantity, per-type limits and live gain preview, including resource-cap losses. Support multi-part rewards and choosing a building or track. |
| Select hex / explore / conquer | WorldMap is static | Highlight legal targets supplied by the game, select one to preview its outcome, and confirm in the footer. Exploration also needs tile selection and rotation. Conquest must show defender and outposts before commit. Include a keyboard-selectable list of the same targets. |
| Place buildings and landmarks | Existing landmark drag, rotate, return and confirm | Extend the current tray/grid pattern to single-plot buildings, multiple pending pieces, overhang and the no-legal-placement case. Resolve district-reward choices before continuing the original effect. Use canonical footprints and legality, not demo geometry as a rule. |
| Choose cards | No complete hand, market or decision picker | Use one card-picker layout in the detail area, with the selected card enlarged and its action in the footer. Cover invent, draw/keep, discard N, tapestry play and tech upgrade; show row transitions and unmet upgrade requirements. Preserve private hands. |
| Dice | No decision/result flow | Acknowledge a roll, show its text/symbol result and consequence, then offer only the legal follow-up choices. Include science advance/decline and conquest result selection. Future rerolls/keep choices appear only where allowed. No new die-face SVGs are required. |
| Trap and response | No defender interruption | Give the responding player a private prompt; others see a neutral waiting state without revealing their hand. Support respond/decline, then resume the suspended conquest. Include hot-seat privacy handover and ineligible/final-income states. |
| Chained and interrupted choices | TurnBar has neutral, selected, optional and waiting tones only | Show one active decision plus a short breadcrumb back to its source. Mandatory choices have no Skip; optional choices do. Preserve the original action when rewards, placement or another player's response interrupt it. Show completed consequences in history. |

## Income-turn sequence

The current income button demonstrates access only. Build a walkthrough in the existing play shell: begin income -> applicable civilization actions -> tapestry slot and neighbour bonus -> technology upgrade -> VP breakdown -> income summary -> return to play or finish.

The steps come from the selected rules and turn number, not a universal fixed wizard. Base income turn 1 gains income; turns 2-4 use the ordinary full sequence; turn 5 activates applicable abilities and upgrades/scores, with no ordinary tapestry-play or income step. Expansion and civilization exceptions insert their required actions at the correct point. Show resource caps, an empty tapestry hand, an unavailable tech upgrade and reserved final-income items. Choosing one action may open a nested prompt before returning to the sequence. Completed effects are not reversible navigation steps.

Design an inspectable income mat with its four building rows, uncovered rewards, tapestry eras and active effects. A player's completion of turn 5 must leave them able to inspect the game while others finish, without offering further normal turns or responses.

## End-of-game results

Show final ranking, player colors/civilizations, final VP, an expandable explanation of points already earned, and the actual tiebreak reason. Do not add a second scoring pass: base-game scoring has already happened during play. Use the selected original/current rules for tiebreaks (README R10-R13), including a shared victory. Include solo win/loss and difficulty when applicable, a board-review action and a return-to-tables action. A rematch action should open setup with previous settings for review, not silently start a new table.

## Shared gaps to resolve during those designs

These are recorded in the existing UI manifest and are broader than the three unchecked issue rows:

- Complete the right-panel Income, Civilization, Technology and card views; fill the opponent Civilization and Technology drill-downs using public information only.
- Show the five-track Arts & Architecture layout, so prompts and board selection work with every supported track count.
- Complete setup behavior for solo/Automa difficulty, timer and undo, incompatible settings and validation. The checked setup design exists, but some options remain fixtures. Add bot remains shelved by owner decision.
- Provide waiting, submission, stale-choice, reconnect, loading, empty and error states. A failed/stale submission must retain a useful draft or explain why choices need refreshing.
- Include keyboard/focus alternatives for hover and drag, an explicit reading order and reduced-motion behavior. Desktop only; no phone-layout work.

## Suggested local order and completion evidence

1. Design the shared footer and payment/resource-choice interaction first.
2. Add card selection and board targeting, then finish placement edge cases.
3. Connect nested decisions, dice and private response handovers.
4. Assemble income turns 1, 2-4 and 5 using those same patterns.
5. Design finished-player and table-results views, then cover the shared gaps above.

For each group, provide an interactive local scenario, screenshots at the approved 1920x1080 desktop size and behavior notes in docs/ui/README.md. Include normal, unavailable, empty and interrupted states. Obtain owner approval before marking a design complete in issue #3. Engine/server implementation belongs to the dependent build issues; fixture interactions must not invent game rules.

Sources: GitHub issue #3 and its desktop-only comment; docs/ui/README.md; src/lib/components/README.md; TurnBar, WorldMap, CapitalGrid and PlayerCard; docs/research/01-base-core-rules.md sections 3-5 and 11; root README rules conventions, especially R10-R15 and R25.

## Delivered since this proposal: card detail foundation (2026-10-24)

The reviewed civilization-card frame and fourteen layout examples are now shared components with a detailed generation guide (`card-design-rules.md`). This resolves the civilization detail-layout foundation. It does not resolve the full card chooser, cost/resource decisions, private responses, income sequencing or results screens listed above. Issue #47 tracks the remaining card families and in-game reference access.
