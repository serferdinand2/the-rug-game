# Lifting a building off the income mat (#142): design

Written 2026-10-31. #142 is in M12 · Cosmetic enhancements and has no blockers. The owner chose the lift and its timing from the clickable mockup [docs/ui/income-lift.html](../../ui/income-lift.html) (screenshots in `docs/ui/screens/issue-142/`). Every other decision here is **(my call)**.

## 1. What and why

On the Income tab, a building hides the printed space it sits on, so a player learns what a covered space pays only once the building is gone. `incomeRows()` already words every space's `reward`, covered or not; `IncomeMat` just never draws it under a building.

**Done when** pointing at a building, or reaching its space with the keyboard, lifts the building off the mat and shows the printed space under it, name and reward, exactly as an exposed space shows them; and it settles back when the pointer or focus leaves.

## 2. Decided by the owner (2026-10-31)

- **Option A · Straight up.** The building rises straight up until it floats just above its own space, 15% larger, as if nearer. Option B (up, to the left and tipped 10°) was not chosen.
- **Timing: medium, 220 ms** (`--duration-medium`, the token for reveals), easing `--ease-out`.

## 3. The design

- **A covered space is the printed space with the building resting on it.** It draws the space's name and reward as an exposed space does, then over them:
  - the **cover**: the dark tile (`--raised`, bordered in `--line`) with the space's name in grey under the building, as a covered space looks today;
  - the **shadow** the lifted building casts on the mat: a soft ellipse (a radial gradient of `--card-shadow-strong`) along the space's top edge, hidden at rest;
  - the **building**, 32 px, centred above the grey name.
- **Lifted** (on `:hover`, on `:focus-visible`, or held by the `lifted` prop):
  - the cover fades out, so the printed space shows;
  - the building rises from its resting place to 40 px above the space's top, at 1.15 scale, with a dragged piece's shadow (`drop-shadow(var(--shadow-float))`, as `LandmarkPiece` draws one), above the other spaces (`z-index: 1`; nothing else in the mat is stacked);
  - the cast shadow grows from half size and fades in.

  Everything moves over `--duration-medium` with `--ease-out`. The building moves by `top` rather than a transform, because its resting place is a share of the space's height, which rows stretch to their tallest space (my call).
- **Keyboard.** A covered space takes the focus (`tabindex="0"`), shows the page's gold focus outline and lifts its building while it holds the focus. `:focus-visible`, not `:focus`, so a click doesn't keep the building up after the pointer leaves (my call).
- **Reduced motion.** The lift sits under `prefers-reduced-motion: no-preference`; under `reduce` the building and the cover fade where they stand, with no rise, scale or shadow. The motion tokens are 0 ms under reduced motion, so the fade is a swap (my call; the mockup said so and the owner didn't object).
- **Nothing shifts.** The cover, shadow and building are positioned absolutely, so a space keeps its size whether its building rests or lifts.
- **The row tint goes.** The hover tint in the row's track colour (`--rg-income-mat-hover`) is dropped, with the per-row classes that set it: the revealed space says more (shown in the mockup).
- **`lifted` prop.** `lifted` names a covered space (innovation names are unique on the mat) whose building is held up, as if pointed at. The library uses it to show a lifted space beside the mats at rest; a later caller could use it to show which space a building will expose (my call).

## 4. Tests

- **Vitest** (`tests/client-income-mat.test.mjs`, a source guard as #122 used): the component draws the name and reward for every space, covered included; a covered space is focusable; the lift uses `--duration-medium`, `--ease-out` and `--shadow-float`, sits under `prefers-reduced-motion: no-preference`, and fades under `reduce`; the row tint is gone.
- **Playwright** (`tests/browser/library.test.mjs`): in the IncomeMat section, a covered space's reward is hidden under its cover at rest; hovering lifts the building above the space, fades the cover and keeps the space's size; Tab focus lifts it too; the `lifted` example is held up; with reduced motion emulated, the building fades in place.

## 5. Left alone

- Long innovation names (Preservation, Fertilization) break mid-word in a space 68 px wide, as exposed spaces already do; the hover now shows it on covered spaces too. Not part of this issue.
- #51 draws the income-mat board itself; the printed spaces here stay the tan slots until then.
