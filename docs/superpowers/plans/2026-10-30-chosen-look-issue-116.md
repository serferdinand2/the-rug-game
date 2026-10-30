# The chosen look in one home, and one VpTag (#116) Implementation Plan

**Goal:** the prompts' fills come from tokens, `DecisionOption` owns its disabled state, and one `VpTag` draws "+N VP", with nothing on screen changing.

**Spec:** `docs/superpowers/specs/2026-10-30-chosen-look-design.md`

## Global Constraints

- docs/conventions.md throughout; `npm run check` clean; Prettier on the changed files only.
- Pixel-identical: the touched library sections' screenshots match before and after. Every unification that would change pixels is listed for the owner, not built.
- Keep clear of the parallel M13 work: in `WorldMap.svelte` only the score tag's colours change (#114 moves its hex maths); `TurnBar` is untouched (#122); `Game.svelte` is untouched (#105), and the trades patch now lives in `DecisionPrompt.svelte`.

### Task 1: Before

- [ ] Screenshot the DecisionOption, TilePicker, ResourceRows, TurnControl, PromptArt, DecisionPanel and WorldMap library sections, a focused chosen option and tile, and a disabled trade offer at rest and hovered, twice, to check the shots are stable.

### Task 2: Tests first

- [ ] `tests/styles.test.mjs`: the tokens; no copied fill; nothing outside `DecisionOption` styles it, and it has `:disabled`; the three components use `VpTag`; the map's tag takes the tokens.
- [ ] Run them: FAIL.

### Task 3: The tokens and the components

- [ ] `tokens.css`: `--choice-fill`, `--picked-fill`, `--vp-tag`, `--vp-tag-text`, `--opacity-unpickable`.
- [ ] `VpTag.svelte`, its library section and its README row.
- [ ] `DecisionOption`: `:disabled`, `VpTag`, the tokens. Drop the patches in `DecisionPrompt.svelte` and the DecisionPanel section.
- [ ] `TilePicker`, `TurnControl`: `VpTag` and the tokens. `ResourceRows`, `PromptArt`: `--picked-fill`. `WorldMap`: the tag's colours.

### Task 4: Verify

- [ ] `npx vitest run tests/styles.test.mjs tests/library.test.mjs`, then `npm run test:unit` and `npm run check`.
- [ ] The screenshots again: byte-identical. Pictures of each look decision for the owner in `docs/ui/screens/issue-116/`.
- [ ] Commit `Refs #116: …`.
