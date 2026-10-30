# What other players just did (#153): mockup and design questions

Written 2026-10-30. The owner asked (2026-10-30): "As for what happens on other players' turn, whenever they play a card or do an action I wanna see what they did. I want it to be more apparent. If they play a tapestry show me that tapestry and say who played it." CLAUDE.md asks for interface ideas as clickable HTML mockups before anything is built, so this note goes with the mockup and asks the owner to choose. Nothing is built yet.

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

## What the build would touch (after approval)

- **`src/lib/player-actions.js`** (new, a plain module with Vitest tests first). It turns fresh events from other seats into display items, the way `rollsOf()` in `src/lib/dice.js` turns them into rolls. It groups an income turn into one summary, keeps a face-down card's id hidden, and uses `log.js`'s sentences for the words.
- **A queue in `src/App.svelte`** next to the dice tray's. It is fed by `freshEvents()` (`src/lib/event-feed.js`) from the store `src/lib/game.svelte.js`, waits for a dice roll in the same batch to finish, and plays the rest in order.
- **`src/lib/components/board/PlayerAction.svelte`** (new, presentational). It shows the band, the picture (`TapestryCard`, `TechnologyCard`, the landmark art, a map hex or a card back), the words and the timer. It has a library section and a row in `src/lib/components/README.md`.
- **Lighting:** a prop on `Track`/`TrackSpace` and `WorldMap` for the lit space or hex, in the acting player's colour. `WorldMap` already has a "fresh" outline.
- **`TurnFooter.svelte`:** the "Just now" line and **Show again**.
- **The pass screen** (`src/screens/HandOver.svelte`, `PassScreen`), depending on question 6.
- **Tests:** Vitest for the mapping and the queue, and a browser test in which an opponent's tapestry card is shown and a reload shows nothing.
- **Docs:** `docs/ui/README.md` and the README's screenshots, from the running game.
