# The scrim, floating surface and disabled look in tokens (#97): design

Written 2026-10-29. #97 is in M12 · Cosmetic enhancements, found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

The same CSS recipes are copied across components and screens:
- the 52% scrim in `DecisionPanel`, the game's card inspector and the modeless `Dialog`, and the 70% one in the modal `Dialog`;
- the floating surface (ink at 60% over `var(--texture) var(--chrome)`) in `DiceTray` and `DecisionPanel`;
- the disabled opacity in `Button` and `Segmented`, while `PassScreen` reaches into its `Button` with `:global(…[aria-disabled='true'])`, because `Button` has no `aria-disabled` look;
- the panel heading's font. `Panel` styles any `h2` in its heading, so `Landing` doubles its own class to beat it, and `Lobby`'s `.rg-lobby--players-title` loses to it and is dead CSS.

#87 has since moved the How to play, help and Table settings scrims into `Dialog`, so three of the issue's five scrim copies are now two in one file.

**Done when** no scrim, floating surface or disabled opacity is copied, and no screen fights `Panel` over its heading.

## 2. The changes

- **Tokens** in `tokens.css`, beside the shadows:
  - `--scrim`: ink at 52%;
  - `--scrim-strong`: ink at 70%;
  - `--float-surface`: the floating panels' whole background, ink at 60% over the texture and the chrome;
  - `--opacity-disabled`: 0.5.
- **The users:** `DecisionPanel`, `Dialog` and the game's inspector take the scrims; `DecisionPanel` and `DiceTray` take `--float-surface`; `Button`, `Segmented` and `TurnControl`'s button take `--opacity-disabled`. The dimmer look of a choice that can't be picked (0.3 to 0.35 in `ResourceRows`, `TilePicker`, `CardShelf` and the trades) is a different look, and #116 gives `DecisionOption` its own.
- **`Button` styles `[aria-disabled='true']`**: the disabled opacity with the default cursor, still clickable and focusable, so a screen can explain why. `PassScreen` drops its `:global` patch. This is the one visible change: the take button, dimmed for about a second while it arms and while the view loads, goes from 0.6 to Button's 0.5 **(my call)**.
- **`Panel` takes `titleFont: 'body' | 'title'`** (default `'body'`), which sets the heading's font, for its own title and for an `h2` in a `heading` snippet alike. The landing page's Open tables panel uses `title` with `titleFont="title"` and drops its snippet and doubled class. `Lobby` drops its dead `.rg-lobby--players-title` rule, whose `--leading-tight` never applied, so the look stays as it renders today.
- **Left out:** the issue's `Spoken` component for visually hidden text. The owner ruled out screen-reader work on 2026-10-28, so the hidden-text copies stay as built.

Apart from the take button's dimming, nothing on screen changes. Screenshots of the Panel, Button, Segmented, DecisionPanel, DiceTray, Dialog and PassScreen library sections and of the landing page, taken before and after, are compared byte for byte. On 2026-10-29 the Button, Segmented, DecisionPanel, DiceTray and Dialog sections and the landing page came out identical; PassScreen differed only inside its `taking` example's button, and Panel by its new `titleFont` example.

## 3. Tests

Vitest, in `tests/styles.test.mjs`: the four tokens are declared; no component or screen writes the ink scrim, the floating gradient or a disabled opacity; `Button` styles `aria-disabled`; `PassScreen` has no `:global` disabled patch; no screen doubles a class to beat `Panel` or keeps the players-title rule. `tests/ui.test.mjs` renders `Panel` with `svelte/server`: `titleFont="title"` marks the panel, and the default doesn't. Playwright: `lobby`, `pass-screen`, `dialogs`, `decision-prompt` and `library` pass.
