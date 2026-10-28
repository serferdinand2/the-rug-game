# Rolling dice for the whole table (#61): design

Written 2026-10-28. #61 is in M12 · Cosmetic enhancements, assigned to the owner. The owner asked for it to be built after #75 ("when you are done finish up 61 and push to main"), without a question round, as #72, #67, #69 and #74 were. The issue's proposed solution is the brief; what the owner said is marked **(owner)**, every other decision **(my call)**.

## 1. What and why

When anyone rolls a die, every screen at the table shows the roll in the middle of the screen, as at a real table. Today a roll is only a line in the log (`src/lib/log.js`), so the other players miss it and the roller sees a choice open without seeing the dice.

**Done when** every science-die, conquer-dice and Alchemists roll tumbles in a tray over the middle of every seat's screen and the public view, lands on the rolled faces under a caption, and steps out of the way.

## 2. Goals, non-goals and anti-goals

- **Goals.** The issue's list: real dice in style C; the faces match the event; rolls in one batch play in order; a refresh doesn't replay them; reduced motion, the keyboard and screen readers work; the tray and the die art are in the component library.
- **Non-goals.** Dice that decide anything (the engine rolls; the tray only shows the result). The arts track's d20 (#35) and its "arts" science-die face (Arts & Architecture) wait for their issues. Causes in the caption ("for Research") wait for #60 **(my call)**.
- **Anti-goals.** A tray that takes the keyboard focus from the decision panel, covers the panel's buttons, or plays again after a refresh.

## 3. The dice

- **Bodies (new art).** Three style C pictures, 32×32 vector pixels with one `crispEdges` path per colour, drawn from the palette (`tools/art/palette.js`): `die/science-body` (a d12 seen face-on: a cream pentagon face ringed by its shaded neighbours), `die/red-body` (brick red) and `die/black-body` (night purple-black), both a d6 face as a rounded, shaded square **(my call)**. They join the catalog's `die` group, so the library's Art area shows them for the owner's approval; they are not in `docs/art/approved-assets.json` until then. No lettering, as the owner's art rules require.
- **Two art contracts change.** `tests/art-catalog.test.mjs` counts 3 more base dice and 3 more icons. `tests/art-approved.test.mjs`' "placeholder dice and game symbols are not released as drawings" keeps refusing face drawings (#5's placeholders) and game symbols, but lets the three bodies through, which #61 asks for ("Draw die bodies in style C").
- **Faces (composed, as #5 decided).** The tray draws the rolled face over the body: the science die shows the track's symbol (`track/<id>`); the red die "4 VP" … "7 VP" or "1 VP / territory" as a VP label; the black die the resource's 24px icon, or "?" for the tile's benefit. The 14 face ids #5 catalogued stay empty slots: separate face pictures are unnecessary (#5).

## 4. Behaviour

- **What rolls.** A plain module `src/lib/dice.js` turns events into rolls, in event order: `scienceDieRolled` (one science die), `conquerDiceRolled` (the red and the black die), `alchemistsRolled` and `alchemistsBust` (one science die; the bust's caption says it busts). The engine's `alchemistsBust` event gains the `track` it rolled, so the bust can show its face **(my call; an event field, no rule changes)**.
- **Captions.** "Vera rolls the science die", "Vera rolls the conquer dice", "Vera rolls for the Alchemists", "Vera rolls for the Alchemists and busts"; the viewer's own roll reads "You roll …" **(my call, following the log's wording)**.
- **Which rolls.** Only rolls in the store's fresh events (#29's `freshEvents()`), so a refresh or a returning tab doesn't roll again; an `undone` can't take a roll back, because a roll is revealing (#24).
- **Playing.** The tray sits over the screen's centre, above the shared area. Each roll tumbles for about a second (the dice spin and bounce in), lands on its faces, and holds for about 1.5 seconds; then the next roll in the batch plays, and after the last the tray fades out **(my call: it fades rather than parking beside the panel, the simpler of the issue's two options)**. Empiricism's two rolls and the Alchemists' rolls play one after another.
- **Out of the way.** A click on the tray or Escape dismisses the rest of the batch. The tray is `aria-hidden` apart from one live region that reads the result once ("Vera rolled the conquer dice: red 5 VP, black food"); it has no focusable element and never moves the focus. It doesn't block the decision panel: it sits above it in the middle but passes clicks outside its own box through.
- **Reduced motion.** The dice appear on their faces at once, with no tumble, for the same hold.
- **Sound.** A `dice` cue joins `cueFor()`, ranked after `reward` and before `turn`; it reuses `drop_001` from the bundled CC0 Kenney Interface Sounds rather than adding an outside download **(my call)**.
- **Hot-seat.** The tray is drawn by the app above whichever screen is on show, so a roll that arrives with the move that brings the pass screen shows over the pass screen too (#30).

## 5. The pieces

- `src/lib/dice.js` (Vitest): `rollsOf(events, game, viewer)` → `{ id, dice: { die: 'science' | 'red' | 'black', face: number }[], caption, spoken }[]`; `faceOf(die, face)` → what the face shows.
- `src/lib/components/board/DiceTray.svelte` and `Die.svelte`: a die body with its face, and the tray with a queue, the tumble, the caption and the live region; library sections show every face of every die, a tumble, reduced motion and a two-roll batch.
- Art: `tools/art/drawings/die/{science,red,black}-body.js` → `static/art/die/*-body.svg`, catalogued.
- The store keeps the rolls of each fresh batch; `App.svelte` draws the tray.
- The engine's `alchemistsBust` event carries `track`.

## 6. Tests

- `tests/client-dice.test.mjs`: each event becomes its roll; each face of each die (all 12 + 6 + 6) shows what the data says; batches keep order; the viewer's own roll says "You".
- The engine test for the Alchemists checks `alchemistsBust.track`.
- Library: the new sections; the art test covers the new ids.
- Browser: an online table of two players in two browsers; a conquest made through the API shows both dice rolling on both screens, with the right caption, and a refresh doesn't roll again.

## 7. Documentation and approval

The README's screenshots show the tray (from the running game); `docs/ui/README.md`, the components README, `docs/architecture.md`, `docs/status.md` and CLAUDE.md record it. The issue asks the owner to approve the tray and the die art in the component library before the game uses them; as with #74, it is built into the game in the same change and #61 closes once the owner has looked. The owner closed it on 2026-10-28, and the three die bodies joined `docs/art/approved-assets.json`.
