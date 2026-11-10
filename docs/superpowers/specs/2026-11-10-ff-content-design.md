# Fantasies & Futures content: the 26 tapestry cards, 10 civilizations and 6 mats (#40): design

Written 2026-11-10. #40 is in M9 · Fantasies & Futures; its blockers (#39, #107, #109) are closed. #39 built the charms, the income mat's overlay, the 11 cards that reserve an item and the 12 tech cards (owner's scope move, 2026-11-09; see #39's design, `2026-11-09-ff-rules-design.md`). Decisions are marked **(owner)** or **(my call)**; earlier rulings are cited by rule id. New calls on the rules become **R135 and up**. **The owner approved this design on 2026-11-10**, with a check-in after each part; the calls in §9 stay the owner's to check after playing.

## 1. What and why

A table with F&F on deals only the content #39 built. #40 adds the rest: **26 tapestry cards** (the 5 response cards among them), the **10 civilizations** and the **6 advanced capital mats**, whose reliefs #133 drew. Cloud Colonies is #49's; the F&F Automa (#41) is Lazar's.

**Done when** a table with F&F on deals all 37 of its tapestry cards (38 with #49), its 10 civilizations and its 6 mats, each playable in a full game with the mouse, with any mix of the other expansions and with or without the arts track; a game without F&F is unchanged, seed for seed.

## 2. Decided

- **Scope (owner, #40 and its 2026-11-09 comment):** 03 FF.3 (civilizations), FF.4.3 (the 26 cards), FF.6 (mats), numbers exact; R67–R100 and R131–R134 apply.
- **Looks (my call, as the owner ruled for #39):** built from the existing patterns, marked **awaiting review** in the component library. The mats' art is approved (#133); each mat draws in `CapitalGrid`'s four layers (ground, Quagmire features, relief, overlay) as #133's handoff on #40 says, with the library's `drawReliefPreview` as the reference. Civilization cards are drawn from data (#107).
- **Process (owner's standing rule):** built inline, test-first, in parts on `issue-40-ff-content`; one final review only if the owner agrees.
- **Earlier rulings:** R25 (era-4 stack), R34 (no F&F setup adjustments, FF.3 General), R59, R67–R100, R108 (finished players and responses), R113 (a civilization gained mid-game takes its printed start), R118 (any track includes arts), R124 (A&A's arts content), R131–R134.

## 3. Parts and order (my call)

Each part lands on the branch with every test green and the game playable; new content joins the deck as it is built, as #37 did.

1. **The 6 mats, engine and screen** (§4). Self-contained, art already approved.
2. **The 26 tapestry cards** (§5), in three batches: (a) the plain WHEN PLAYED cards, (b) THIS ERA, CONTINUOUS and the cards that look at hands or decks, (c) the 5 response cards.
3. **The 10 civilizations** (§6), simplest first: Werefolk, Psionics, Artificers, Celestials, Faefolk, Genies, Weefolk, Illuminati, then the two that play on after income turn 5, Elder Ones and Merfolk.
4. **The screen** (§7): civilization mats' pieces, the new prompts' looks, How to play, the library, screenshots, the README and status.

## 4. The 6 mats

Data in `data/capitals.js` (`expansion: 'ff'`, numbers 13–18 as printed: Quagmire 13, City in a Bottle 14, Veil 15, Savanna 16, Polar 17, Netherworld 18), grids and districts exactly as 03 FF.6. `advancedMatsFor(expansions)` adds them with F&F; the joint mat-and-civilization pick (#36) deals from A&A's and F&F's together. Per mat:

- **City in a Bottle (6×6):** six 3×2 districts, each 1 resource of your choice. No landmark may go in the city; a landmark gained may instead be set aside for 6 VP (`besideMat`, still owned for per-landmark counts). It still scores 6 rows and 6 columns. It always loses the tallest-landmark tiebreak (R11, Mike Young).
- **Netherworld:** four imp districts, each 2 resources of your choice once its imp plot and the centre plot are covered and joined by an orthogonal chain of covered plots holding income buildings or landmarks (R87: impassable plots don't link; off-grid overhangs don't link). Checked after every placement; each imp pays once.
- **Polar:** six line districts (A–F) of ringed plots; impassable plots on a line count as filled; a completed line pays 2, 2, 1, 2, 1, 1 resources (R91). Other plots score rows and columns only.
- **Quagmire:** nine 3×3 districts, 1 resource each. At the end of the player's income turn 5: −5 VP per landmark on reeds, +3 VP per landmark of the city not on reeds (R88: any plot of its footprint on a reed plot; R89: only landmarks covering a grid plot).
- **Savanna:** six unicorn districts, clipped at the edge; no resource on completion; in the income step of income turns 2–4, 1 resource of your choice per filled district. The 36 grey plots score rows and columns only.
- **Veil:** five worldly 3×3 districts (1 resource each) and three pockets: T invents 1 tech card, R rolls the science die with benefit and payable bonus, B gains any 1 income building (R90).
- **Shared:** unicorns and wisps are impassable plots for every rule that names impassable terrain (the Riverfolk, Terraforming), as FF.6 2.0 says.

## 5. The 26 tapestry cards

Effects as 03 FF.4.3, charms as FF.4.1, numbers exact; an arts option only with the arts track (R118, #39's choice filter). Each card gets its face words, decision words and log lines with its batch.

**(a) Plain WHEN PLAYED:** Alien Disclosure (R86), Chimera-Citizen Rights (roll; no advance; arts face only on the d20), Citadel of Power, Déjà Vu, Haunted Houses (a random civilization, R113), Hive Mind, Muses (a track where you are ahead of every opponent), Technomancy, Temporal Nomadism, Uploaded Consciousness, Wizards' Guild (3 VP per visible charm tag on your mat, its own included).

**(b) Era, continuous and the cards that look:** Astral Expeditions (R76), Interdimensional Trade, Living Cities, Good Omens (CONTINUOUS; the guess is a decision before each roll, the reward once at the end of a turn with a right guess; R81), Doppelgangers (a second token of yours on an opponent's space, no benefit; your most advanced token counts for comparisons and per-space VP), Dream Monitors (R78: a token in the capital, filling its plot), High Council (each player in turn may reveal a response card for 1 resource, as #17's defender is asked whenever they hold any card), Seer Sight (Robotic Decoys counts as THIS ERA), Soothsaying (each charmed card revealed goes to an opponent of the player's choice), Superpower Regulators (R84).

**(c) Response cards:** Ghost Ship, Gremlins, The Kraken, League of the Charmed and Robotic Decoys join #17's `responseCards()` as conquest responses: discard to topple the attacker and gain one of its two charms (the player picks); played as a tapestry they do their "if played as a tapestry" text and their charms trigger (R75). R108 for finished players.

## 6. The 10 civilizations

Each in `civs/`, drawn on its card from data (#107), with its rules for both versions (none has an F&F adjustment, R34), and solo flags for #31 (Genies, Illuminati, Weefolk removed).

- **Werefolk:** at the start of income turns 2–5, discard the space tile on the mat, draw one and flip it with the injected random (face up: may regress without benefit, then explore it onto the mat, else 4 VP; face down: advance with benefit, the bonus free). A tile not explored stays in the supply. A coin flip is not a die roll (Psionics).
- **Psionics:** whenever they gain something random from a deck or supply (a tech card, tapestry card, masterpiece, territory tile, space tile, civilization) or roll a die, one extra is drawn or rolled and they keep one (R74); it adds one to other extra-draw rules (Empiricism rolls 3). Income turns 2–5: 1 territory tile, 1 tapestry card, invent, research. With the drafts, 3 keep 1 (#53's handoff).
- **Artificers:** income turns 2–4: set aside a track's leftmost building, or slide it 1 space left (R70); income turn 5: 1 VP per income building in the capital, or slide one track flush left. Set-aside buildings count for their type (R71), never as gained.
- **Celestials:** setup places 1 outpost and 1 token on the start territory; income turns 2–4 may move the token to an adjacent explored territory and gain both conquer dice (no control); income turn 5: −2 VP per landmark hanging off the capital, +5 per landmark that doesn't (R99: City in a Bottle 0). Gained mid-game, as FF.3 says.
- **Faefolk:** the 7-spot ellipse; at the start of income turns 2–5 may gain 1 tapestry card, then move clockwise by visible cards (hand plus uncovered mat cards, R73) and gain the spot, twice on income turn 5.
- **Genies:** a token from each opponent; income turns 2–4 draw one at random, that opponent picks a circled benefit, both score it, and the Genies gain one adjacent square; income turn 5: 2 different circled benefits. A finished opponent gains nothing.
- **Weefolk:** at the start of income turns 2–5 (or when gained), give a token to an opponent of the Weefolk's choice; that opponent places it on a plot of their capital (a full city replaces an income building or a 1×1 landmark, set aside). It fills the plot for districts, rows and columns, not as a building. Income turns 2–4: may pay 1 territory tile for an income building of choice. Income turn 5: 1 VP per income building or landmark in each row and column of each of their tokens.
- **Illuminati:** draw 3 tapestry cards and keep 1; the 3 dice live on their mat (`state.dice`); an opponent's roll takes the die off until the Illuminati's next income turn and pays them (both conquer results, or an advance without benefit on the science die's track), resolved before the roller's use; start of income turns 2–5: 6 VP per die still on the mat, then all return.
- **Elder Ones** and **Merfolk:** after their income turn 5 they keep taking turns in normal turn order while they can (R72 for charms). The Elder Ones: income turns 2–4 a resource or 2 tapestry cards; income turn 5 discard up to 6 cards for 2 resources each; afterwards advance turns only, 10 VP per landmark gained, the era-4 card staying in effect, ending when no advance is possible. The Merfolk: income turns 2–4 draw 1 and submerge all but 2 (hidden from others, a new hidden field in `view()` and `revealed()`); income turn 5 draw 1 and resurface; end of income turn 5 keep 5; afterwards each turn discard any (at least 1) for 5 VP each or play a WHEN PLAYED card onto the era-4 stack (its left charm and reserved items at once), ending with no cards. Both together: the player picks each turn. `turn.js` gains "finished but playing on", and the game ends when every seat is done.

## 7. The screen

From the existing patterns, awaiting review: each mat in `CapitalGrid` (its layers, the Veil's sides, the Savanna's grey plots, the 6×6 bottle), the City in a Bottle's set-aside answer, the civilizations' live state on their cards (the ellipse spot, the Genies' tokens, the Illuminati's dice, the Merfolk's submerged count, the Werefolk's tile, the Weefolk's tokens), the new decisions' panels and words, How to play's F&F sections, the library, the README's screenshots and status.

## 8. Tests

Test-first, a file per part (`engine-ff-mats`, `engine-ff-cards`, `engine-ff-civs`), `checkState` and `checkViews` on each; every card and civilization run to the end with and without the arts track; the simulation deals all of F&F in every fourth game and a game without F&F is replayed seed for seed (the 200-game hash the #39 review used); a browser test per part where a screen changes, ending and leaving its tables.

## 9. My calls for the owner to check (R135 and up, numbered when built)

- Haunted Houses' random civilization takes its printed start (R113), as Plague's does.
- Doppelgangers' token is a second token of the player's on that track, moving like any of theirs; per-space VP and "ahead of" use the most advanced one.
- High Council asks every player holding any tapestry card, so nobody learns who holds a response card (as #17).
- Soothsaying: the player picks the opponent for each charmed card revealed.
- Good Omens: the guess is asked before each science-die roll of its player, while the card works; one reward per turn.
- Weefolk: a token given to a finished player is allowed (DQ 23), but the Weefolk are offered active opponents first.
- Illuminati: an opponent's die taken stays off until the Illuminati's next income turn; rerolls pay only the first roll.
- Psionics: a choice of one extra applies to draws from decks and supplies only, never to cards taken from hands or discards (DQ 19).
- The mats' looks and the civilizations' cards, awaiting review.

## 10. Size

The largest issue of M9: roughly 12–18 hours inline, in the four parts above, with one optional final review at the end.
