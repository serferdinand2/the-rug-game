# AI Singularity's token on the board (#147): design

Written 2026-10-30. #147 is a bug found in play. Every decision here is **(my call)** unless marked.

## 1. What and why

The report: after Technology 12, AI Singularity, the token "does not move to the chosen destination and instead returns to Technology 1".

The engine is right. AI Singularity (01 §3.4) asks `chooseRestart`, takes the token off technology 12, adds the technology track to the seat's `restartedTracks` and puts a token on the start space (0) of the chosen track; `spacesAdvanced` (in `movement.js`) reads a restarted track as 12, and every rule that compares or counts positions uses it (FAQ #9, R109). The existing engine test (`tests/engine-track-spaces.test.mjs`, "technology 12 AI Singularity") passes, and the view keeps `tracks` and `restartedTracks`.

The client draws it wrong. `trackBoard` (`src/lib/board.js`) and `playerCards` (`src/lib/area/players.js`) each wrote a seat's position on a track as `Math.max(0, ...seat.tracks[track])`, which ignores `restartedTracks`:

- the technology track, now holding no token, drew the player's lane at 0, the left end of the track beside space 1: "returns to Technology 1";
- the chosen track still drew its most advanced token, so a new token at its start showed no change there: "does not move to the chosen destination". Choosing technology itself also drew the lane at 0.

**Done when** the board's lane and the player card read a track AI Singularity took the token off as 12, the most advanced token everywhere else, played through the engine in a test.

## 2. The change

- `src/lib/engine/game.js` exports `spacesAdvanced`, the engine's own reading of "how far a seat has advanced on a track" (the most advanced token, or 12 on a restarted track). The app imports the engine through `game.js` only.
- `trackBoard` and `playerCards` take each position from `spacesAdvanced`, so the client and the rules can't disagree again.

The technology lane stays full, at space 12, after AI Singularity, as FAQ #9 and R109 treat the token as still there. The new token at the start of the chosen track is not drawn as a second marker: the lanes draw one token per player per track (only the most advanced counts when comparing, 01 §3.1), and drawing a second one is a visual change for the owner. The token can still be advanced: the advance footer offers it, and the board outlines that track's space 1 in green.

## 3. Tests

- `tests/client-board.test.mjs`: AI Singularity played through the engine from technology 11 with military 5, restarting on military: the seat's tokens are technology `[]` and military `[5, 0]`, the technology lane is at 12 and the military lane at 5; restarting on technology itself keeps the technology lane at 12.
- `tests/client-area-players.test.mjs`: a restarted technology track reads 12 on the player card.

## 4. For the owner

- Should a second token on one track, such as AI Singularity's new token at the start of a track already advanced, be drawn as its own marker on the progress lane? Today only the most advanced shows.
