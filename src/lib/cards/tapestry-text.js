// The tapestry cards' faces in words (#26 design §8, #126): each card's ability, and what the trap gains played as a card.
import { describeEffects, effectsPhrase } from '../describe.js';
import { tapestryCardOf } from '../game-names.js';

/** The notes of response cards whose tapestry side is no plain effect list: Robotic Decoys is THIS ERA (#40). */
const RESPONSE_NOTES = /** @type {Readonly<Record<string, string>>} */ (
	Object.freeze({
		'robotic-decoys':
			'Played as a tapestry card, This Era: after you or a neighbour advances on Science, you may pay 1 coin to gain 1 worker and 5 VP',
	})
);

/** What a card the client doesn't know reads, as describe.js words an effect it doesn't know. */
const ANY_ABILITY = 'Take this effect';

/**
 * The words of each tapestry card whose rules the engine keeps in code rather than in its effects: every THIS ERA
 * ability, the WHEN PLAYED cards whose rules are their own effect kind (describe.js's CARD_RULES), and the trap's response. They
 * follow 02 §3, numbers exact, in this module's names for things.
 * @type {Readonly<Record<string, string>>}
 */
const TAPESTRY_RULES = Object.freeze({
	academia:
		'Whenever you invent a tech card or gain a tapestry card, gain 3 VP',
	'age-of-sail':
		'Whenever you explore, draw a total of 3 territory tiles. Before placing one, you may give 1 territory tile to an opponent to gain 3 VP',
	alliance:
		"Choose an opponent. Neither of you may conquer the other's territories. Whenever they upgrade a tech card, you gain the same benefit after them",
	'broker-of-peace':
		'You may not advance on Military. Whenever an opponent advances on Military, gain 3 VP',
	capitalism:
		'When you gain income, gain 2 VP for each coin earned. Whenever you gain a Market, also gain 1 coin',
	'coal-baron':
		'Gain 1 territory tile and explore with it, then each of your neighbours gains 1 territory tile',
	colonialism:
		'Choose a territory tile you control. Gain 1 resource for each different land terrain on it: a worker for mountain, culture for grassland, food for forest and a coin for desert',
	'dark-ages':
		'Go back 1 space on 3 different tracks if you can, then advance 3 times on the remaining track, without benefits or bonuses',
	dictatorship:
		'Advance on any track with its benefit; you may pay its bonus. Your opponents may not advance on that track until your next turn starts',
	empiricism:
		'Whenever you advance on Science, gain 2 VP. Whenever you roll the science die, roll it twice and choose 1 result',
	exploitation:
		'Whenever you place a territory tile on the map, you may gain double its benefit; if you do, gain no VP for its matching sides',
	'golden-age':
		'Ignore the prerequisites for upgrading tech cards. Whenever you upgrade a tech card, gain 3 VP',
	industrialism:
		'Whenever you invent a tech card, gain its circle benefit; the card stays in your bottom row',
	'marriage-of-state':
		'Choose a track and an opponent. After they gain a benefit on that track, you gain it too, without its bonus',
	mercantilism:
		'When you gain income, you may convert food you earned into other resources, gaining 2 VP for each food converted',
	militarism:
		'Whenever you explore a territory, you may also place an outpost on it. This is not a conquer',
	monarchy:
		'Whenever you place an income building in your capital city, gain 3 VP',
	'olympic-host':
		'Starting with you, each player may pay 1 worker to gain 10 VP. If at least 1 opponent pays, gain an income building from your income mat; if none does, gain 1 coin',
	'pillage-and-plunder':
		"Whenever you conquer an opponent's territory, gain the results of both conquer dice. Traps may not be played against you",
	// Its four advances are unordered, and each free bonus stays optional (FAQ #4).
	renaissance:
		'Advance once on each track, in any order, without their benefits. You may take each bonus you reach for free',
	'pirate-rule':
		'Whenever you conquer a territory tile, also gain the benefit on that tile',
	'plea-for-aid':
		'For each track where every other token is further advanced than yours, gain 2 VP and 1 resource of your choice',
	revisionism:
		'Whenever you gain a landmark on a track, also gain 1 resource of your choice. Whenever you reach a track landmark space already claimed, gain an Armory',
	revolution:
		"Choose one: gain 1 resource of your choice, or choose up to 3 territories with your toppled outposts, stand them up and topple those opponents' outposts",
	'steam-tycoon':
		'Invent a face-up tech card and upgrade it. Then each of your neighbours invents the top card of the tech deck',
	socialism:
		'Choose a track and advance or go back on it to match the closest opponent, without its benefit or bonus',
	technocracy:
		'If you are the first player to enter this era, invent a tech card and upgrade it. Otherwise gain 3 VP for each opponent',
	terraforming:
		'You may build on impassable plots of your capital. Each time you do, gain 5 VP',
	theocracy:
		'You may not advance on Science. Whenever you enter a new tier on any track, gain 4 VP',
	'trade-economy':
		"Choose an opponent's current space on any track and gain its benefit. If it has a bonus, that opponent may take it for free",
	trap: 'When an opponent tries to conquer one of your territories, discard this card. Gain 1 resource of your choice, keep control and topple their outpost; they still gain the benefit of 1 conquer die',
	// Plans & Ploys' cards (#33; 03 §1.4).
	astronomy:
		'Gain 1 territory tile and explore with it. Then gain 2 space tiles and keep them; you may explore them later',
	engineering:
		'Whenever you invent a tech card, upgrade it to your middle row at once and gain its circle benefit',
	'public-works':
		'After you advance on a track, if it is now your least advanced track (ties count), gain 3 VP',
	cartography:
		'Gain 1 territory tile and explore with it. If that scored at least 3 VP, you may also conquer that territory',
	'manifest-destiny':
		'Conquer a territory next to your capital-city territory. Then you may gain the benefit of a territory tile you control',
	'status-quo':
		'For each tier where you have a token on a space with a bonus, gain one such bonus without paying for it, up to 4',
	'worlds-fair':
		'Gain 1 culture. Then gain 1 resource of your choice if your capital city has a complete row or column, and 1 VP for each complete district',
	// The response cards; a defender plays one card at most against a conquest.
	'double-cross':
		'When an opponent plays a trap against your conquest, discard this card to cancel the trap: your outpost stays and theirs stays toppled. Gain 5 VP',
	retreat:
		'When an opponent conquers one of your territories, discard this card instead of a trap. Move your outpost to a territory you control next to it, even one with 2 tokens, and gain 1 worker; they still take the territory',
	'stolen-plans':
		'When an opponent plays a trap against your conquest, discard this card to cancel the trap and take a random tapestry card from their hand',
	'surprise-party':
		'When an opponent conquers one of your territories while you are further along the Military track, discard this card instead of a trap. Topple their outpost, keep control and gain 15 VP. It is not a trap',
	surrender:
		'When an opponent conquers one of your territories, discard this card instead of a trap. After they roll, roll both conquer dice and gain both results; they still take the territory',
	tyranny:
		'When you gain a tapestry card, you may play it on top of this card at once. The first and only time you do, gain 5 VP',
	'wartime-economy':
		'Every bonus that costs resources of your choice is free',
	// Arts & Architecture's cards (#37; 03 §2.5).
	'age-of-enlightenment':
		'Roll the science die. Advance once or twice on that track without benefits, then gain the benefit of the space you reached, without its bonus',
	'artistic-inspiration':
		'Whenever you advance on Arts, gain 3 VP. Whenever you roll the science die, you may use Arts instead of the result',
	'government-grants':
		'Advance on Arts and gain its benefit; you may take its bonus for free. Then go back 1 space on another track and gain that benefit, without its bonus',
	granges:
		'Starting with you, each player may pay 1 food to gain a Farm. If at least 1 opponent pays, gain the benefit of your space on Arts, without its bonus',
	'infrastructure-upgrade':
		'Look through the landmark deck and keep 1 card, as you keep your drafted one; when you meet its goal, gain its landmark. If none is left, gain 10 VP',
	migration:
		'Explore a territory next to no territory anyone controls, yours included, with a tile from your supply. Then place 2 of your outposts there; this is not a conquer',
	monuments:
		'You may place income buildings and landmarks on this card instead of your capital city; a landmark may hang off it. When every square is covered, gain 8 VP or 1 culture, 1 coin, 1 food and 1 worker',
	'national-parks':
		'Instead of placing an income building or landmark in your capital city, you may place it on a territory you control that holds only your 1 outpost. Then roll the black or the red conquer die and gain its result',
	plague: 'Draw a random civilization. Either it replaces one of yours and you gain 1 resource of your choice, or discard it and gain 10 VP. You keep what the replaced one gave you',
	'political-posturing':
		"Choose an achievement you haven't earned. Put your token on its highest open space and gain those VP",
	spymaster:
		'When a neighbour reaches the end of a track, discard this card. At the end of their turn, advance on that track and gain its benefit; you may pay its bonus',
	'commercial-center':
		'You may place income buildings and landmarks on this card instead of your capital city. For each square you cover, gain its benefit or 3 VP',
	'found-art':
		'When you pay to advance on Arts, you may discard 2 territory tiles instead of paying one of its resources',
	'silk-road':
		"Advance straight to the first space of Arts' next tier. Gain its benefit, and you may pay its bonus, or its landmark if it is still there",
	'space-race':
		'When you gain a landmark, if this card holds none, you may place it here. Then gain 1 space tile and explore a space tile',
	'star-chamber':
		'You may place income buildings and landmarks on this card instead of your capital city; a landmark may hang off it. When every square is covered, advance on any track with its benefit; you may take its bonus for free',
	'trade-routes':
		'When you gain a landmark, you may place it on this card. Then conquer, gaining the results of both conquer dice, and gain 5 VP for each landmark on this card',
	// Fantasies & Futures' cards that reserve an item on the income mat's overlay (#39; 03 FF.4.3).
	'ecstatic-visions':
		"Draw 3 masterpieces (with the Arts track) or 3 space tiles. Place 1 on your income mat's overlay and shuffle the others back. On income turn 5, gain that masterpiece's benefits or explore that space tile",
	'generation-ships':
		"Draw 3 space tiles. Place 1 on your income mat's overlay and shuffle the others back. On income turn 5, explore it, or with the Arts track discard it to gain an inspiration tile",
	'ghost-towns':
		"Place a reminder on your income mat's overlay. On income turn 5, gain 3 VP for each income building still on your income mat",
	'great-library-of-potions':
		"Place your next Market on your income mat's overlay; it counts when scoring Markets. On income turn 5, place it in your capital city",
	'lost-artifacts':
		"Place a face-up tech card or the deck's top card on your income mat's overlay; it doesn't score until invented. On income turn 5, invent it and upgrade it twice, ignoring prerequisites",
	'microbial-magic':
		"Place your next Farm on your income mat's overlay; it counts when scoring Farms. On income turn 5, place it in your capital city",
	'phantasmal-paladins':
		"Place your next Armory on your income mat's overlay; it counts when scoring Armories. On income turn 5, place it in your capital city",
	'quest-culture':
		"Place 3 territory tiles from the supply on your income mat's overlay; they count when scoring territory tiles. On income turn 5, explore anywhere with them",
	'secret-societies':
		"Place your next House on your income mat's overlay; it counts when scoring Houses. On income turn 5, place it in your capital city",
	'suspended-animation':
		"Place a reminder on your income mat's overlay. On income turn 5, advance on any track and gain its benefit; you may take its bonus for free",
	// Fantasies & Futures' other cards whose rules are their own effect kind (#40; 03 FF.4.3).
	'alien-disclosure':
		'Gain 1 space tile. You may spend 5 VP to explore it now; otherwise keep it in your supply',
	'chimera-citizen-rights':
		'Roll the science die, without advancing. Military or Exploration: explore and gain 1 culture. Science or Technology: upgrade 1 tech card. Arts: gain 1 inspiration tile',
	'citadel-of-power':
		'Reveal tech cards from the deck until one grants a landmark. Gain that landmark, discard that card and shuffle the others back',
	'deja-vu':
		'Gain 7 VP, or the benefit, not the bonus, of a tier II space you have reached or passed',
	muses: 'Gain 7 VP, or choose a track where you are ahead of every opponent. Exploration: 1 territory tile and a Farm. Military: 1 culture and 1 VP per territory you control. Arts: 1 masterpiece. Science: roll the science die and advance with its benefit. Technology: refresh the face-up tech cards, then invent 2',
	technomancy:
		'Gain the circle benefits of 2 of the 3 face-up tech cards; they stay face up',
	'temporal-nomadism':
		'Go back to a space of your choice on a track you have not completed, and gain its benefit, not its bonus',
	'uploaded-consciousness':
		'Discard up to 3 territory tiles from your supply. For each, gain 1 tapestry card and 1 resource of your choice',
	'astral-expeditions':
		'When you pay for a bonus, you may gain 1 space tile, or explore a space tile from your supply, instead of the bonus',
	'interdimensional-trade':
		'When you gain a tapestry card, you may discard a tapestry card from your hand. If you do, invent 1 tech card and gain 2 VP',
	'living-cities': 'When you gain a landmark, gain 1 VP per Farm you own',
	doppelgangers:
		"Place one of your player tokens on a track, on a space where an opponent's token is. It gives no benefit, and later advances like any of your tokens",
	'seer-sight':
		'Reveal 1 tapestry card from the deck per completed district in your capital city. Gain 3 VP for each This Era card revealed, then discard them',
	'good-omens':
		'Before you roll the science die, guess what you will roll. At the end of a turn in which a guess was right, gain 1 VP per space you have advanced on Arts, and the benefit of the guessed track’s 4th space',
	'dream-monitors':
		'Place one of your player tokens on an open plot of your capital city, as you would an income building. If a House is beside it, diagonally included, gain 2 resources of your choice',
	'high-council':
		'Starting with you, each player may reveal a trap or other response card to gain 1 resource of their choice. If an opponent does, gain 10 VP; if none does, gain an income building of your choice',
	soothsaying:
		'Reveal 5 tapestry cards from the deck. For each with a charm, gain 1 resource of your choice and 2 VP, then give it to an opponent. Discard the others',
	'superpower-regulators':
		'Your opponents reveal the cards with charms in their hands. Gain both charms of up to 2 of them, or 9 VP; they keep their cards',
	// F&F's response cards (#40; 03 FF.4.2).
	'ghost-ship':
		"When an opponent conquers one of your territories, discard this card instead of a trap. Topple their outpost, keep control, and gain one of this card's two charms",
	gremlins:
		"When an opponent conquers one of your territories, discard this card instead of a trap. Topple their outpost, keep control, and gain one of this card's two charms",
	'the-kraken':
		"When an opponent conquers one of your territories, discard this card instead of a trap. Topple their outpost, keep control, and gain one of this card's two charms",
	'league-of-the-charmed':
		"When an opponent conquers one of your territories, discard this card instead of a trap. Topple their outpost, keep control, and gain one of this card's two charms",
	'robotic-decoys':
		"When an opponent conquers one of your territories, discard this card instead of a trap. Topple their outpost, keep control, and gain one of this card's two charms",
	'zombie-army':
		"Take up to 3 of your outposts from territories that hold that outpost and nothing else, and place them on your income mat's overlay. On income turn 5, conquer with each of them",
	steam: 'Whenever you advance into a new tier on Science or Arts, gain 1 worker',
});

/**
 * A tapestry card's face in words: its ability, and for a response card (the trap, Plans & Ploys' five) what it gains
 * played as a tapestry card (R22, #33). A card whose rules are all effects reads as them.
 * @param {string} id - A card id; each trap copy, such as 'trap-3', is the trap
 * @returns {{ ability: string, note?: string }}
 */
export function describeTapestryCard(id) {
	const card = tapestryCardOf(id);
	if (!card) {
		return { ability: ANY_ABILITY };
	}
	if (card.response !== undefined) {
		return {
			ability: TAPESTRY_RULES[card.id],
			note: Object.hasOwn(RESPONSE_NOTES, card.id)
				? RESPONSE_NOTES[card.id]
				: `Played as a tapestry card on an income turn: ${effectsPhrase(card.played, undefined, card.ordered)}`,
		};
	}
	if (Object.hasOwn(TAPESTRY_RULES, card.id)) {
		return { ability: TAPESTRY_RULES[card.id] };
	}
	return {
		ability: describeEffects(card.played, { ordered: card.ordered }),
	};
}
