# What other players just did (#153): mockup and design questions

Written 2026-10-30. The owner asked (2026-10-30): "As for what happens on other players' turn, whenever they play a card or do an action I wanna see what they did. I want it to be more apparent. If they play a tapestry show me that tapestry and say who played it." CLAUDE.md asks for interface ideas as clickable HTML mockups before anything is built, so this note goes with the mockup and asks the owner to choose. The owner chose on 2026-10-30; the decisions are below, and the build follows them.

## The mockup

- **Page:** [docs/ui/opponent-actions.html](../../ui/opponent-actions.html). Open it directly at 1920×1080. The dashed **Mockup** box at the bottom right holds the mockup's own controls, which are not part of the design: **A · Centre** or **B · Strip**, **▶ Advance turn**, **▶ Income turn**, **Settled**, and one button per action. Keys: A or B switch the option, 1–8 show one action each, Space plays an advance turn, I plays an income turn, S shows the settled screen, and Escape dismisses. Add `?clean&option=b&state=conquer&expanded` (or `queue=turn&index=1`, or `settled`) to the address to open one state without the controls.
- **Backdrop:** screenshots of the running game (ef56a28), not the older mockups: Mira's screen at a three-player table in era III while Lazar (seat 1, blue) takes his turn. The game was played through the API to that point. The advance backdrop is the same screen with Lazar's lane moved to Navigation and the Lighthouse taken off the board. Cards are the real `TapestryCard` and `TechnologyCard` components, captured as pictures. Everything is in `docs/ui/assets/issue-153/`.
- **Words:** every sentence is the table log's (`src/lib/log.js`), such as "Lazar played Industrialism.", "Lazar advanced to Navigation on Exploration.", "Lazar gained the Lighthouse." and "Mira's outpost on hex −3,−2 was toppled by Lazar.". The big line is the log sentence without its full stop, with the player's name in their colour and the card or space name in Cinzel gold.
- **Screenshots:** `docs/ui/screens/issue-153/`. They show option A (`a-…`), option B collapsed (`b-…`) and opened (`b-…-open`) for each action (1 tapestry, 2 face down, 3 advance with a landmark, 4 invent, 5 upgrade, 6 explore, 7 conquer, 8 income turn), a queue of two (`…-9-queue-…`), the settled footer (`…-10-settled`), and the page with its controls (`0-page-with-controls.png`).

## What both options share

- **One display per thing the player did**, in order, made from that player's fresh events. A refresh plays nothing, as with the dice tray (#61).
  - A face-up tapestry card is the full 319 px card, large enough to read.
  - A face-down one is a card back saying so.
  - An advance shows the track and space, and the landmark it gained. The space is lit in the player's colour on the board while the display is open.
  - An invented or upgraded tech card is the full card, with "Middle row → Top row" for an upgrade.
  - An explore or a conquer shows the hex, cut from the map, and the dice for a conquer. The hex is lit on the map.
  - An income turn is one summary: its card, then Tapestry, Upgrade, Score and Income in the log's words, with the resources gained.
- **Who did it:** a band in the player's colour with "Lazar's turn · Leaders · Income turn 4", and the name in their colour in the headline.
- **Several in a row:** the band counts them ("1 of 2", with dots). The mockup's two queues are an advance turn (the advance that gains the Lighthouse, then the explore it gives) and an income turn (the tapestry card on its own, large, then the summary of the rest).
- **Staying and going:** each display holds for 5 seconds, shown by a bar in the player's colour that runs down. Hovering pauses it. A click moves on (A) and Escape skips the rest. The display takes no focus and has nothing to focus. With reduced motion it appears and goes without moving.
- **Settled:** when the last one goes, the footer keeps "Just now: Lazar explored hex −2,−1, matching 2 sides." with **Show again**, which plays the turn's displays again. In A, the panel shrinks into Lazar's header chip, which glows once.

## Option A · Centre (like the prompts and the dice tray)

The panel opens at the centre of the tracks, as every decision prompt and the dice tray do (owner, 2026-10-28, #79). The picture is on the left and the words on the right. For an action on the map, the board switches to the World Map and the panel docks at the right, as a map decision does, so the lit hex stays in view. It is the most visible option and the closest to what the owner asked for. It covers the middle of the tracks for a few seconds per action.

## Option B · Strip (compact, opens on a click)

One line sits above the footer at the bottom of the tracks: a small picture, "Lazar played Industrialism", "1 of 2" and **Show ▴**. A click opens the full display upward from the strip, with the same picture and words as A. An opened strip stays until it is closed, while a closed one moves on by itself. It covers far less of the board, but the card is not readable until it is clicked, which is what the owner said he misses today.

## Questions for the owner

1. **A or B?** Or A for tapestry cards and B for everything else.
2. **How long** should each display stay: 5 seconds as in the mockup, longer for a tapestry card, or until clicked?
3. **Your own actions:** should they show too, or only other players'? The mockup shows only other players'. The dice tray shows everyone's rolls.
4. **Which actions?** Should every gain show (resources, VP, buildings, territory tiles), or only the ones in the mockup? The mockup keeps small gains as lines under the main action.
5. **The map:** for an opponent's explore or conquer, should the board switch to the World Map while it shows, then switch back (as in the mockup)? Or should it stay on your view, with the hex shown only in the panel?
6. **Hot-seat:** should the pass screen (#30) come after the displays of the player who just went, or should the next player see them when they take the screen? I lean towards the second, because the next player is the one who needs to see them.
7. **The log:** the log already lists every line. Should the displayed actions be marked there too, for example with a "shown" picture beside them? Should **Show again** in the footer stay?
8. **A long turn of other players:** with four opponents, should their displays play one after another, or should each player's turn collapse into one summary like the income turn's?

## Decisions (2026-10-30)

### The owner's

- **Option A** (owner, 2026-10-30): the panel opens at the centre of the tracks, like the decision prompts and the dice tray, as in the `a-*.png` screenshots. Option B is not built.
- **A 4-second timer** (owner, 2026-10-30): under the "Lazar played Industrialism" headline, a progress line in the player's colour runs down over 4 seconds. When it runs out, the panel closes by itself, and the next queued action, if any, shows.
- **Hovering pauses it** (owner, 2026-10-30): while the pointer is over the panel the timer stops; it goes on from where it was when the pointer leaves.
- **A button to cancel it** (owner, 2026-10-30): a visible **Close** button closes the panel at once and moves on to the next queued action. A click on the panel and Escape do the same, so "Click or Esc to close" and the button agree. While more actions wait, **Skip all** (and Shift+Escape) closes the rest too.

### Claude's calls, to revisit after playing

- **Only other players' actions show**, not your own (Claude's call, to revisit after playing). At a hot-seat table "your own" is the seat on show.
- **Which actions** (Claude's call, to revisit after playing): each main action has its own display: a tapestry card played (face up with the card; face down as a card back that says so), an advance (the track and space, lit on the board, with the landmark it gained), a tech card invented or upgraded (the full card, with "Middle row → Top row"), an explore (the tile as it lies), a conquer (the hex's tile, the conquer dice), and an income turn as one summary. The small gains that follow an action (resources, VP, buildings, tiles, outposts toppled) are lines under its headline, in the log's words (`src/lib/log.js`), at most six, then "and N more in the log".
- **An income turn** (Claude's call, to revisit after playing): its tapestry card shows on its own, large, then one summary of the rest of the turn (the tech upgrade, the VP scored, the income), as the mockup's income queue. The summary covers what arrived in one batch of events; a turn that arrives in several batches (the player answering one question at a time) makes one summary per batch that has something to say. Income turn 1, which everyone takes during setup, shows nothing.
- **Several in a row** play one after another, with "1 of N" and dots in the band (Claude's call, to revisit after playing). A batch that arrives while one plays joins the end of the queue, and N grows.
- **The map** (Claude's call, to revisit after playing): for an explore or a conquer the board does not switch to the World Map. The panel stays at the centre of the tracks and shows the tile in its picture; when the map is the view on screen, the hex is lit there in the player's colour.
- **Hot-seat** (Claude's call, to revisit after playing): the next player sees the previous players' actions after taking the screen (#30): the other players' events since that seat last had the screen, or, the first time, since the previous player took it.
- **The footer keeps "Just now: …"** with **Show again** (Claude's call, to revisit after playing): the last display's headline stays in the footer, and Show again plays the last run again. The log is not marked.
- **A refresh plays nothing** (Claude's call, to revisit after playing): only fresh events show, as with the dice tray (#61).
- **It takes no focus** (Claude's call, to revisit after playing): opening the panel never moves the focus; its buttons can be clicked.
- **Reduced motion** (Claude's call, to revisit after playing): the panel appears and goes without sliding; the progress line still runs, because it shows time rather than moving anything.
- **The dice tray goes first** (Claude's call, to revisit after playing): while it rolls, the actions wait, then play.
- **Your own question goes first** (Claude's call, to revisit after playing): while you have a decision panel, a card shelf or the first-income notice open, the actions wait, and play once it is answered, so the panel never covers your question.
- **Income turn 1 shows its tapestry card** (Claude's call, to revisit after playing): the Heralds' Maker of Fire plays a card in income turn 1; it shows like any other card, while the rest of income turn 1 stays silent.
- **Where an income turn's card ends** (Claude's call, to revisit after playing): the events have no marker for the income steps, so the lines after the card are the card's until the score step's first VP (any VP not from a tapestry card, or the capital's score); from there they go to the summary.
- **Nothing the viewer's view() lacks** is ever shown: an opponent's face-down card is a back, because the event carries no card.

## What the build touches

- **`src/lib/player-actions.js`** (new, a plain module with Vitest tests first). It turns fresh events from other seats into display items, the way `rollsOf()` in `src/lib/dice.js` turns them into rolls. It groups an income turn into one summary, keeps a face-down card's id hidden, and uses `log.js`'s sentences for the words.
- **A queue in `src/App.svelte`** next to the dice tray's. It is fed by `freshEvents()` (`src/lib/event-feed.js`) from the store `src/lib/game.svelte.js`, waits for a dice roll in the same batch to finish, and plays the rest in order.
- **`src/lib/components/board/PlayerAction.svelte`** (new, presentational). It shows the band, the picture (`TapestryCard`, `TechnologyCard`, the landmark art, a map hex or a card back), the words and the timer. It has a library section and a row in `src/lib/components/README.md`.
- **Lighting:** a prop on `Track`/`TrackSpace` and `WorldMap` for the lit space or hex, in the acting player's colour. `WorldMap` already has a "fresh" outline.
- **`TurnFooter.svelte`:** the "Just now" line and **Show again**.
- **The hot-seat hand-over:** not the pass screen itself, which is unchanged, but the store (`handed`, `handedCount`, from `handedEvents()` in `src/lib/pass.js`): a player who takes the screen is handed the other players' events since they last held it.
- **The timer** is its own plain module, `src/lib/action-timer.js`, with the time passed in, so its 4 seconds, pause and resume are tested without real timers.
- **Tests:** Vitest for the mapping, the queue and the timer (`tests/client-player-actions.test.mjs`) and the hand-over (`tests/client-pass.test.mjs`), and a browser test (`tests/browser/player-actions.test.mjs`) in which an opponent's tapestry card is shown with their name, holds while hovered, closes by its button, and a reload shows nothing.
- **Docs:** `docs/ui/README.md` and the README's screenshot `docs/ui/screens/game-player-action.png`, from the running game.

The plan is `docs/superpowers/plans/2026-10-30-opponent-actions-issue-153.md`. The build follows it; the plan's step 3 placed the hand-over in the store, and the panel waits for the viewer's own question rather than moving aside, as the browser tests showed it otherwise covers a notice's button.
