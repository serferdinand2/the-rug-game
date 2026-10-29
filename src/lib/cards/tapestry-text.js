// The tapestry cards' faces in words (#26 design §8, #126): each card's ability, and what the trap gains played as a card.
import { describeEffects, effectsPhrase } from '../describe.js';
import { tapestryCardOf } from '../game-names.js';

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
	tyranny:
		'When you gain a tapestry card, you may play it on top of this card at once. The first and only time you do, gain 5 VP',
	'wartime-economy':
		'Every bonus that costs resources of your choice is free',
});

/**
 * A tapestry card's face in words: its ability, and for the trap what it gains played as a tapestry card (R22).
 * A card whose rules are all effects reads as them.
 * @param {string} id - A card id; each trap copy, such as 'trap-3', is the trap
 * @returns {{ ability: string, note?: string }}
 */
export function describeTapestryCard(id) {
	const card = tapestryCardOf(id);
	if (!card) {
		return { ability: ANY_ABILITY };
	}
	if (card.id === 'trap') {
		return {
			ability: TAPESTRY_RULES.trap,
			note: `Played as a tapestry card on an income turn: ${effectsPhrase(card.played, undefined, card.ordered)}`,
		};
	}
	if (Object.hasOwn(TAPESTRY_RULES, card.id)) {
		return { ability: TAPESTRY_RULES[card.id] };
	}
	return {
		ability: describeEffects(card.played, { ordered: card.ordered }),
	};
}
