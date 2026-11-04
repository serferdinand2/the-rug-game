# Motion and transitions across the game (#175)

**Asked (owner, 2026-11-04):** after #174's new look, "more animations and transitions put in place. Make a best decision you can on every possible transition and animation." The owner approved the full plan below (all fifteen items), a new M12 issue and one review at the end. Every choice here is Claude's, marked **(my call)** where the owner may want another after playing.

## Motion thesis

- **The one authored moment** is a player's token advancing on a track, the game's core move: it hops space by space, squashes as it lands and spreads a ring in the player's colour from the space it reached. Other players' advances look the same (my call).
- **Continuity:** screens, the board switch, tabs, the prompt and the side panels come in from where they belong, so a change never happens in one frame.
- **Feedback:** controls press, a choice pops, cards and pieces move to where they go.
- **Budget:** transform and opacity only, so nothing lays the page out again; the log's lines and the dealt cards stagger within 240 ms; the focal moments stay within the 600 ms focal time.

## Rules

- **One helper.** `src/lib/transitions.js` times every JavaScript motion from the motion tokens and stays still under reduced motion: `motionMs` (a token read from the page), `rise` (a Svelte transition), `glide` (Svelte's flip, timed by the tokens), `listKeys` (keys for a list whose items repeat, such as two traps in a hand, so its cards can glide), `enter` (a Web Animations entrance on an element that stays), `hopPlan`, `hopFrames` and `tokenHop` (the track token's attachment). `EASE_OUT` mirrors `--ease-out` for the Web Animations API. Only `motion.js` asks for reduced motion (#119).
- **Two new tokens:** `--duration-exit` (140 ms, leaving) and `--duration-focal` (600 ms, the authored moments), with `--ease-in` for leaving. Under reduced motion every duration is 0 ms, and each component's own `@media (prefers-reduced-motion: reduce)` turns its keyframes off: **no motion at all**, as docs/conventions.md asks.
- **Entrances, not exits (my call).** A panel, dialog, prompt or screen that a parent mounts comes in with a CSS animation on mount and goes at once. A Svelte out transition would keep the old element in the page while it leaves, overlapping the next one, and the browser tests would find two of it. Only things that open and close inside their own block leave with motion: the menu (it lifts away in `--duration-exit`) and the toast.
- **Local transitions where Svelte can tell.** A Svelte `in:` plays only when its own block already existed, so it marks what is *added* (a card gained, a piece in the tray, a claim, a new open table) and never plays on first show. Where an item's markup sits inside an `{#if}`, a class does the work instead (the log's new lines).
- **Exits faster than entrances**; deceleration (`--ease-out`) for arrivals; no bounce or elastic curves, except the token's and the building's landing squash.

## Catalogue

| What | Motion | Time |
|---|---|---|
| Track token (`ProgressLanes`, `tokenHop`) | Hops once a space (170 ms a hop, the run within 600 ms) while the marker slides linearly; squashes on landing; a ring in the player's colour spreads from the space. Nothing hops when a track first shows, and the board's redraws during a hop leave it playing. | ≤ 600 ms + 380 ms ring |
| Screens (`Landing`, `Lobby`, `PlayLayout`) | Fade in; the landing and lobby content rise 6 px. The header that stays doesn't move. | 380 ms |
| Tracks ⇄ World Map (`Game`) | The board switched to fades in and settles from 98.5% (keyed by the board). | 220 ms |
| Tabs (`Tabs`, every tab row) | The newly chosen tab's panel slides in 16 px from the side of the tab. | 220 ms |
| Decision prompt (`DecisionPanel`) | The scrim fades; the panel rises 16 px from 98.5%; docked at the map, it slides in from the right; a new question in a panel that stays refreshes it. Minimizing hides it at once, and Show choice brings it back rising, from the footer's side. | 150 / 220 ms |
| Shelf (`CardFan` on a shelf) | Its cards are dealt in from below, 40 ms apart, within 240 ms. Replaced by #176's deal from a deck with a whoosh. | 220 ms each |
| Log, overview (`LogPanel`, `PlayersOverview`) | The log slides in from the right edge; the overview fades and its cards rise one after another. | 220 ms |
| Dialogs (`Dialog`: How to play, Table settings, Help) | The backdrop fades; the box rises and grows from 98%. | 150 / 220 ms |
| Menu (`Menu`) | Drops from its button; lifts away faster. | 150 / 140 ms |
| Toast (`Toast`) | Rises 8 px as it fades in; sinks as it fades out. | 150–220 ms |
| Footer (`TurnBar`) | When the turn's words change, they rise in, and the actions slide in from the right. | 150 ms |
| Header (`TopBar`) | On the viewer's turn the green rule sweeps out from the centre; it draws back faster. | 600 / 140 ms |
| Buttons, options (`Button`, `DecisionOption`) | Press down under the pointer; a chosen option pops. | 150 / 220 ms |
| Hand (`CardFan`) | A gained card rises in; the others close up (`glide`) when one is played. | 220 ms |
| To be placed (`PlacementTray`) | The others close up when one is placed; one gained rises in. | 220 ms |
| Capital (`CapitalGrid`) | A building just placed drops onto its plot and squashes, as the plot glows (#29). | 380 ms |
| Achievements (`AchievementStrip`) | A new claim stamps its player's square in from twice its size. | 380 ms |
| Eras (`EraSlots`) | A card played into a slot slides in from the left. | 220 ms |
| Log (`TableLog`) | A line that arrives while the log is open comes in from the left; an opened turn's lines unfold one after another. | 220 ms, 30 ms apart |
| Lobby (`SeatCard`), landing (`Landing`) | A player rises into their seat; a new open table rises into the list and the others make room. | 380 / 220 ms |
| Results (`StandingRow`, `WinnerShowcase`) | The standings rise in by place (ties together), 80 ms apart; an opened row's VP sources come down; then the winner's heading fades in, the portrait rises into its gold frame, and the capital follows. | ≈ 1.2 s in all |
| Art fans (`ArtFan`) | The three cards are dealt into the fan from below, one after another, as the page opens. | 600 ms each |

Kept as they were: the dice tray, the pass screen, what other players just did, the map's pulse, the chip's bump, CountUp, a landmark's landing and the income mat's lift.

Left out (my call): "VP bars grow from zero" in the plan, because the results draw no bars: the sources are a list, which now opens smoothly instead.

## Testing

- `tests/client-transitions.test.mjs`: the fallback durations match `tokens.css`, a duration is read from the page and is 0 under reduced motion, `listKeys`, the hop's plan and frames, `rise` keeps the element's own transform, `enter`, `EASE_OUT` matches the token, and the token hops only on a new position (not on first show, nor on a redraw), a new hop replacing the last.
- The browser suite runs with reduced motion (`reducedMotion: 'reduce'` in `playwright.config.js`), so panels and cards are measured where they rest; the dice tray's fade test turns motion back on.
- `tests/browser/motion.test.mjs` runs with motion on, in the component library only (no tables): the token hops and rests, a hand's card rises in and the others close up, a prompt opened again rises with its shelf dealt in and rests where it was, a menu lifts away and drops back, and under reduced motion nothing moves. An init script notes each motion as it starts, so a busy machine can't miss a short one.
- Each component's library section plays its motion with a button: ProgressLanes, CardFan, PlacementTray, AchievementStrip, EraSlots, TableLog, CapitalGrid, TopBar, TurnBar, SeatCard, Dialog and DecisionPanel; Tabs, Menu, Toast and DecisionOption already could.

## Calls to revisit

1. Other players' advances hop like your own.
2. Panels, dialogs, prompts and screens leave at once; only the menu and the toast leave with motion.
3. Show choice brings a minimized prompt back rising, rather than growing out of the footer.
4. The track's ring is square, like the tokens' frame and the board's corners, not round.
5. The landing and lobby fans deal in on every visit.
6. The results' entrance takes about 1.2 s before the winner's capital is in.
7. The header's rule sweeps for 600 ms, the focal time, each time your turn comes.
8. Hand cards gained rise in, but opening the Hand tab doesn't deal the hand; only a prompt's shelf deals.
9. A map choice's panel that docks or undocks as the board switches comes in again at its new place, which reads as a move.

The final review's other notes, kept as they are: the staggers live in each component's CSS (the helper's own was unused and is gone); `motionMs` reads the page's tokens each time a motion starts, which is only on a change; the dice tray still reads its fade time itself (#119's code); and an unfolded log turn's lines come in again whenever it is opened, as intended.
