# Dealing cards and tiles in with a whoosh (#176)

**Asked (owner, 2026-11-04):** "When cards are being drawn or presented in the game beginning woosh them over like they are being drawn and add a sound for that. Same goes for tiles and civ cards. Woosh them in one by one." The owner approved Claude's plan and a new M12 issue. Choices not in the request are Claude's, marked **(my call)**.

## What is dealt

- **Shown (dealt as they appear):** every card on a prompt's shelf (`CardFan`'s shelf look, through `CardShelf`): the civilizations and capital mats at the game's beginning, tapestry, tech and landmark cards, the tech deck, and territory and space tiles; and the explore prompt's tiles (`TilePicker`, `deal="show"`, its default).
- **Drawn (dealt only when they arrive while their list is on show):** a tapestry card into the Hand tab and a tech card into the tech rows or the display (`CardFan`'s other looks), a territory tile into the Terrain tab (`TilePicker`, `deal="drawn"`), and a space tile into it. A list as it first shows stays still, so opening a tab deals nothing (my call, as #175 decided for the hand).

## The flight

- Every card of a row leaves one deck point, 320 px left of the row's start and 60 px below its top (`deckOffset`), so a card further along travels further (my call: a deck at the left, as a dealer's hand moves).
- It leaves turned −14°, unseen, shows within the first fifth of its flight, and settles into place with a soft deceleration (`cubic-bezier(0.16, 1, 0.3, 1)`), in the slow motion token's 380 ms (`dealFrames`).
- **One by one:** whatever appears within 120 ms of the last card, anywhere on the page, joins the same deal (`createDealQueue`, one shared queue). Cards leave 130 ms apart for the first five, then 60 ms apart, and the last no later than 900 ms (`dealDelay`), so a long shelf doesn't keep anyone waiting.
- `dealIn` is a Svelte attachment: Web Animations with `fill: 'backwards'`, so a card waiting its turn stays hidden. It deals a card once, whatever redraws follow; a list given `when` (the hand, the Terrain tab) deals only what appears after its first frame.

## The whoosh

- `static/audio/card_whoosh.ogg`, synthesized by `tools/audio/card-whoosh.mjs` (ffmpeg, as #61's dice roll): noise through a band that rises to about 2.6 kHz as the card speeds off the deck and falls as it slows, then a soft slap of card on felt at 0.2 s, where the card lands. 0.36 s, peak at −1 dB.
- One whoosh per card, sounded as the card leaves the deck, each a little faster or slower in turn (rates 1, 1.07, 0.94, 1.12), so a deal doesn't sound like one sample repeated (my call).
- It plays through the game's player and its sound switch: App shares them with `shareSounds`, and a card sounds `soundCue('deal')`. With sound off (the default) nothing is heard. No event earns the cue, so `cueFor` never returns it. The component library shares a player of its own, heard after the first click, so the deal can be heard there.

## Reduced motion

Nothing flies and nothing sounds: the cards are in place at once.

## Replaces

\#175's shelf rise (cards rising 24 px, 40 ms apart) and its rise for a card gained in a fan.

## Testing

- `tests/client-transitions.test.mjs`: the deck point, the flight's frames, the delays and their cap, the shared deal queue, a card dealt once with its whoosh as it leaves, the next card following, nothing under reduced motion, and a list with `when` dealing only what is drawn later.
- `tests/client-sound-motion.test.mjs`: a cue through the shared player only while sound is on, and that no batch of events earns the deal cue; every cue, the deal's included, has its file.
- `tests/browser/motion.test.mjs`: a shelf opened again deals its three cards 0, 130 and 260 ms apart, each from the left and turned, and they rest in place.
- The library plays it: DecisionPanel's Open again, CardFan's Gain a card, and TilePicker's Deal again and Draw a tile.

## Calls to revisit

1. The deck is at the left of each row, not one place on the screen.
2. Opening the Hand or Terrain tab deals nothing; only cards and tiles drawn while it is open fly in.
3. A whoosh for every card, not one for the whole deal.
4. Each flight takes 380 ms, and a deal of five cards about 0.9 s in all.
