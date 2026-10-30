# The chosen look in one home, and one VpTag (#116): design

Written 2026-10-30. #116 is in M13 · Refactor, found by the client scan (#80). Every decision here is **(my call)** unless marked; the issue gave the shape.

## 1. What and why

The prompts' "chosen" look is copied from component to component. The gold chosen fill, `color-mix(in srgb, var(--gold) 17%, var(--surface))`, is written out in `DecisionOption`, `TilePicker`, `ResourceRows` and `PromptArt`. The resting fill, `color-mix(in srgb, var(--raised) 70%, transparent)`, is written out in `DecisionOption`, `TilePicker` (small) and `TurnControl`. `DecisionOption` has no disabled look, so the game's trades prompt (`src/screens/game/DecisionPrompt.svelte`, where #79 moved it from `Game.svelte`) and the library's DecisionPanel section each reach into it with `:global(.rg-decision-option:disabled)`. The corner "+N VP" badge is the same CSS twice, in `DecisionOption` and `TilePicker`.

The issue also asks for one look where the copies differ: one "+N VP" instead of five, the dashed focus and the thick chosen outline on `DecisionOption` too. Those change pixels, and the owner approves anything visual before it is built, so this issue builds only what is pixel-identical and lists the rest for the owner (section 4).

**Done when** the fills come from tokens, no screen or section styles `DecisionOption` from outside, and one `VpTag` draws the "+N VP" of `DecisionOption`, `TilePicker` and `TurnControl`, with before-and-after screenshots of the touched library sections byte-identical.

## 2. The changes

- **Tokens** in `src/styles/tokens.css`, beside #97's disabled look:
  - `--choice-fill`: `color-mix(in srgb, var(--raised) 70%, transparent)`, a pressable choice at rest. Used by `DecisionOption`, `TilePicker` (small) and `TurnControl`'s turn buttons.
  - `--picked-fill`: `color-mix(in srgb, var(--gold) 17%, var(--surface))`, the chosen one. Used by `DecisionOption`, `TilePicker`, `ResourceRows` and `PromptArt`'s VP badge.
  - `--vp-tag` (`var(--gold)`) and `--vp-tag-text` (`var(--ink)`): the "+N VP" tag's colours, used by `VpTag` and by the World Map's SVG tag, which keeps its shape.
  - `--opacity-unpickable: 0.35`: the dimmer look of a choice that can't be picked now, apart from `--opacity-disabled` (0.5), which #97 handed on. Used by `DecisionOption` and `TilePicker`; `ResourceRows`' 0.3 stays (section 4).
- **`DecisionOption` owns its disabled state:** `:disabled` dims to `--opacity-unpickable` with the default cursor, as the trades prompt's patch did. Both `:global(.rg-decision-option:disabled)` patches go. Hover still turns a disabled option's border gold, as it does today.
- **`src/lib/components/prompts/VpTag.svelte`:** a span with `value`, `unit` (`'VP'` by default; `''` draws "+N" alone), `muted` and `variant`:
  - `corner`: the gold badge in the top-right corner of a `position: relative` parent, over its border; muted, it is `--line` with `--text`, as `TilePicker` draws a tile that scores 0.
  - `inline`: gold bold text at `--font-size-md`, as `TurnControl` draws it; muted, it is `--muted` and regular.

  `DecisionOption` (`vp`, "+N VP"), `TilePicker` (each tile's "+N", muted at 0, hidden from screen readers as before) and `TurnControl` ("+N VP" inline) draw it. `TurnControl`'s "No hex yet" is not a VP value, so it stays the control's own span. The library gets a VpTag section and the components README a row.
- **What stays.** `PromptArt`'s "N VP" badge keeps its own look and only takes `--picked-fill`. The dashed focus stays in `TilePicker` and `ResourceRows` only; `DecisionOption`'s chosen outline stays `--border`. The Terrain tab's chosen fill that the issue names in `PlayerTabs.svelte` is gone already: #93 moved those tiles to `TilePicker`.

Nothing on screen changes.

## 3. Tests

Vitest, in `tests/styles.test.mjs`:
- the five tokens are declared, and `--picked-fill` and `--choice-fill` hold today's mixes;
- no component or screen writes out the chosen or the resting fill;
- no stylesheet but `DecisionOption`'s styles `.rg-decision-option`, and `DecisionOption` has a `:disabled` rule;
- `DecisionOption`, `TilePicker` and `TurnControl` draw "+N VP" with `VpTag` and keep no badge or tag class of their own; the World Map's tag takes the tokens.

`tests/library.test.mjs` checks VpTag's section and structure. Pixels: Playwright screenshots of the DecisionOption, TilePicker, ResourceRows, TurnControl, PromptArt, DecisionPanel and WorldMap sections, plus a pressed option and a picked tile focused from the keyboard and a disabled trade offer at rest and hovered, byte-identical before and after.

## 4. For the owner: one look would change pixels

Each of these is left as it is. The pictures are in `docs/ui/screens/issue-116/`, taken from the component library: `-before` is today, `-after` the unified look put on with a stylesheet for the picture only, and `-reference` the look the others would follow.

1. **One "+N VP".** Five looks today: `DecisionOption`'s and `TilePicker`'s gold corner badge (`TilePicker` writes "+N", without "VP"), `TurnControl`'s gold text, `PromptArt`'s outlined "N VP" badge (no plus) and the World Map's SVG tag (a gold box with a thin ink edge). Which one should every "+N VP" be? The pictures (`1-vp-tag-*`) show each as `DecisionOption`'s corner badge, the map keeping its shape.
2. **The chosen outline.** `DecisionOption`'s chosen outline is 1 px (`--border`); `TilePicker`'s and `ResourceRows`' is 2 px (`--border-thick`). (`2-chosen-outline-*`)
3. **The dashed focus.** A picked tile or resource focused from the keyboard turns its outline dashed and stands it off; a chosen `DecisionOption` keeps a solid 1 px outline, stood off 2 px. (`3-dashed-focus-*`, with the thick outline of item 2)
4. **How dim an unpickable choice is.** `DecisionOption` and `TilePicker` dim to 0.35, `ResourceRows` to 0.3. (`4-unpickable-dim-*`, at 0.35)
5. **Hover on a disabled choice.** A disabled `DecisionOption` (a trade the player can't pay for) still turns its border gold on hover; a disabled tile doesn't. (`5-disabled-hover-*`)

## 5. Hand-offs

The owner's answers to section 4 become one change each in `VpTag`, `DecisionOption` or the tokens. #60 may add to `DecisionOption`; #93's Terrain tiles already take the fills through `TilePicker`.
