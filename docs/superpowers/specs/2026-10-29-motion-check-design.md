# One reduced-motion check and one tumble timing (#119): design

Written 2026-10-29. #119 is in M12 · Cosmetic enhancements, found by the client scan (#80). Every decision here is **(my call)**; the issue gave the shape.

## 1. What and why

`DiceTray`'s `still()` repeats the game screen's `matchMedia('(prefers-reduced-motion: reduce)')` check. The tray's `TUMBLE_MS` (1000) is typed again as `1s` in `Die`'s CSS, and its `FADE_MS` (220) repeats the `--duration-medium` token, which `tokens.css` already sets to 0 under reduced motion. Nothing imports the three exports.

**Done when** one function asks for reduced motion, the tumble's length is written once, and the fade follows its token.

## 2. The changes

- **The check.** `prefersReducedMotion(view)` in `src/lib/motion.js`, where `view` defaults to the page's `window`. It is false with no window or no `matchMedia`, as the tray's check was. `Game.svelte` and `DiceTray` call it.
- **The tumble.** `TUMBLE_MS` moves to `src/lib/dice.js`, beside the rolls the tray plays. `Die` sets `--rg-die-tumble` from it on its own root, so a die rolls at the same pace in the tray and in the library, and its CSS reads the property instead of `1s`. The issue had `DiceTray` set the property; a die drawn outside the tray would then have no duration **(my call)**.
- **The fade.** `FADE_MS` goes. The tray reads `--duration-medium` from its own element when it fades, through `msOf()` in `motion.js`, which turns a CSS time (`220ms`, `0.38s`) into milliseconds. Under reduced motion the token is `0ms`, so the fade needs no check of its own.
- `HOLD_MS` stays the tray's own, no longer exported.

Nothing on screen changes.

## 3. Tests

Vitest, in `tests/client-sound-motion.test.mjs`: `prefersReducedMotion` with a stubbed `matchMedia` that matches, one that doesn't, a window without it and no window; `msOf` for milliseconds, seconds, spaces and an empty value; a source guard that only `motion.js` calls `matchMedia`, that `Die`'s CSS names no tumble length and that the tray writes no fade length. Playwright: `dice-tray.test.mjs` still passes.
