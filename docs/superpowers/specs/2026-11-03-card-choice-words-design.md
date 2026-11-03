# Tapestry and civilization choices in plain words (#148): design

## Intent

A decision a tapestry card or a civilization opens should say what the player is choosing and what each answer does. Before this, Feudalism, Revolution and Diplomacy asked only "Choose one", Revolution's second answer read "Resolve Revolution", Dark Ages and Dictatorship named the card but not what the track is for, a neighbour moved by Oil Magnate saw "Advance on a track?" without whose card it was, Renaissance's answers contradicted themselves ("without its benefit or bonus and take its bonus for free"), and the Inventors', Traders' and Isolationists' offers all asked "Use your civilization?".

## Owner's decision (2026-11-03)

The mockup `docs/ui/prompt-and-hand.html` showed the pattern and a table of proposed words: the title is "<card or civilization>: <what you choose>", and each answer says what it does; an answer worth VP that depend on the game says what it comes to now. The owner approved the pattern, with the VP preview.

Where a prompt comes from many places at once, such as a plain "Choose a resource" or "Choose a tech card to invent" (Meritocracy, Stolen Plans, Steam Tycoon), the line saying where it comes from is #60's (Lazar's), and these words leave it alone.

## The words

| From | Title | Answers |
|---|---|---|
| Feudalism | Feudalism: a resource, or VP for your landmarks? | Gain 1 resource of your choice · Gain 3 VP for each landmark you own (2 now: 6 VP) |
| Revolution | Revolution: a resource, or stand your outposts back up? | Gain 1 resource of your choice · Stand up to 3 of your toppled outposts, toppling the opponents' outposts there |
| Revolution's territories | Revolution: choose a territory where your toppled outpost stands back up; then: Revolution: stand up another toppled outpost? | the territories |
| Diplomacy | Diplomacy: choose an income building to gain | Gain a Market … |
| Surprise Party | Surprise Party: 10 VP, or an Armory? | |
| Any other card's "or" | <card>: choose one | |
| Dark Ages | Dark Ages: choose the track to advance 3 times on | Science: advance 3 times, and go back once on each other track |
| Dictatorship | Dictatorship: advance on a track, and close it to opponents | Science: no opponent advances on it until your next turn |
| Oil Magnate | Oil Magnate: choose a track you and your neighbours may advance on | the tracks |
| A shared advance (Oil Magnate, Age of Discovery) | yours: Oil Magnate: advance on Exploration?; another player's: Ana's Oil Magnate: advance on Exploration, without the benefit? | Advance to Scouting · Don't move |
| Socialism | Socialism: move a token to the closest opponent on its track, without benefit or bonus | the moves |
| Renaissance | Renaissance: choose the next track to advance on | Advance on Exploration without its benefit, and take its bonus for free |
| Any other card's order | <card>: choose what comes next | |
| Espionage | Espionage: choose a tapestry card on an income mat to copy | |
| Guilds | Guilds: pay VP for resources, or resources for VP | the trades |
| Olympic Host | Cy's Olympic Host: pay 1 worker to gain 10 VP? (the host's own: Olympic Host: …) | |
| Dystopia | Dystopia: choose a track landmark nobody has claimed | |
| Colonialism | Colonialism: choose a territory tile you control, for 1 resource per land terrain on it | |
| Trade Economy | Trade Economy: choose an opponent's track space to gain its benefit | |
| Tyranny | Tyranny: play the card you just gained on top of it, for 5 VP? | |
| Heralds | Heralds: play a When Played card on top of Maker of Fire? | |
| Inventors | Inventors: Bo upgraded Clocks; gain its circle benefit? (or square) | Decline · Gain 1 culture |
| Traders | Traders: Bo conquered hex 1,0; gain the die they didn't keep? | Decline · Gain 1 coin |
| Isolationists | Isolationists: put a token on the territory you just conquered, and gain a resource? | |
| Another civilization's offer | Use your <civilization>? | |

## How it is built

- Words: `src/lib/decision-words.js`, from fields the decisions already carry where they could: a `chooseOption`'s, `chooseOrder`'s or `chooseTrade`'s `source.tapestry`, a `chooseTrack`'s or `chooseHex`'s `purpose`, a `chooseCopy`'s `espionage`, a `chooseTrade`'s `host`. The VP preview counts the viewer's own landmarks or tech cards with the engine's `countVp`, only when the view shows the player's seat.
- The engine gains the few public fields the words need: `purpose` on Socialism's move ('socialism'), Dystopia's landmark ('dystopia') and the Heralds' and Tyranny's cards ('heralds', 'tyranny'); `shared: { by, card }` on each advance a shared advance asks for, carried through the advance effect; and `civ` and `from` on the Inventors', Traders' and Isolationists' offers, through a new `fields` argument of `offer()`. `REVOLUTION_MORE` and `DARK_AGES_ADVANCES` are exported from `effects/cards.js`, so the words follow the rules' numbers.
- `describe.js`: an advance without its benefit whose bonus is free reads "without its benefit, and take its bonus for free".

## Claude's calls, to revisit

1. The VP preview covers landmarks and tech cards, the counters a viewer's own view always shows; others read without it.
2. Choices from track spaces, tech cards and tiles ("Choose one" from Wagons, for example) keep their words: they are not tapestry or civilization choices, and #60 names their source.
3. Trade Economy's answers still name the space and its player, without saying that player takes the bonus for free; the title says what is gained.

## Tests

- `client-decision-words`: every row above from literal decisions, and Feudalism's VP preview from a real view (none, then two landmarks).
- The engine tests for Oil Magnate, Socialism, Dystopia, Tyranny, the Heralds, the Inventors, the Traders and the Isolationists check the new fields.
- The random games (`simulation`, with `checkViews`) and the 20-game words test still pass.
