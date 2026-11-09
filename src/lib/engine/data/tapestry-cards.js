// The 43 base tapestry cards, the trap played as a card, Plans & Ploys' cards (#33) and Arts & Architecture's (#37): timing and what happens when played (02 §3, 03 §1.4, §2.5).
import { deepFreeze } from './ids.js';

/** @typedef {import('./effects.js').Effect} Effect */

/**
 * A tapestry card.
 * @typedef {Object} TapestryCard
 * @property {string} id - The slug the asset catalog uses, such as 'meritocracy'; the trap's is 'trap'
 * @property {string} name
 * @property {'played' | 'era' | 'continuous'} timing - 'played' is WHEN PLAYED; 'era' is THIS ERA; 'continuous' is A&A's
 *   CONTINUOUS, active while the card tops its slot (#37)
 * @property {Effect[]} played - What runs when the card's ability resolves; a THIS ERA card's setup choice, if any
 * @property {boolean} ordered - Whether the effects run in the order listed (Renaissance is the only false)
 * @property {'base' | 'pp' | 'aa'} expansion - Where it comes from
 * @property {false} [solo] - Left out of solo games (Granges, 03 §2.11; #31 reads it)
 * @property {'conquest' | 'trap' | 'track'} [response] - A response card: 'conquest' a defender discards against a
 *   conquest (the trap, Retreat, Surprise Party, Surrender); 'trap' an attacker discards against a Trap (Double Cross,
 *   Stolen Plans); 'track' a neighbour discards when a player completes a track (Spymaster, R127)
 */

/** Words a name keeps in lower case. */
const SMALL = ['of', 'and', 'for'];

/**
 * A card name from its slug, such as 'age-of-sail' to 'Age of Sail'.
 * @param {string} id
 * @returns {string}
 */
function nameOf(id) {
	return id
		.split('-')
		.map((word) =>
			SMALL.includes(word) ? word : word[0].toUpperCase() + word.slice(1)
		)
		.join(' ');
}

/**
 * A THIS ERA card.
 * @param {string} id
 * @param {Effect[]} [played]
 * @returns {TapestryCard}
 */
const era = (id, played = []) => ({
	id,
	name: nameOf(id),
	timing: 'era',
	played,
	ordered: true,
	expansion: 'base',
});

/**
 * A WHEN PLAYED card.
 * @param {string} id
 * @param {Effect[]} played
 * @param {boolean} [ordered]
 * @returns {TapestryCard}
 */
const when = (id, played, ordered = true) => ({
	id,
	name: nameOf(id),
	timing: 'played',
	played,
	ordered,
	expansion: 'base',
});

/**
 * A CONTINUOUS card (A&A, #37): it works while it tops its slot, and nothing runs when it is played.
 * @param {string} id
 * @returns {TapestryCard}
 */
const continuous = (id) => ({
	id,
	name: nameOf(id),
	timing: 'continuous',
	played: [],
	ordered: true,
	expansion: 'base',
});

/**
 * A Plans & Ploys card (#33; 03 §1.4), with its name when the slug doesn't give it.
 * @param {TapestryCard} card
 * @param {{ name?: string, response?: 'conquest' | 'trap' }} [extra]
 * @returns {TapestryCard}
 */
const pp = (card, extra = {}) => ({ ...card, ...extra, expansion: 'pp' });

/**
 * An Arts & Architecture card (#37; 03 §2.5), with its name when the slug doesn't give it.
 * @param {TapestryCard} card
 * @param {{ name?: string, solo?: false, response?: 'track' }} [extra]
 * @returns {TapestryCard}
 */
const aa = (card, extra = {}) => ({ ...card, ...extra, expansion: 'aa' });

/**
 * A trade offer of VP for resources of the player's choice.
 * @param {number} vp
 * @param {number} resources
 */
const sellVp = (vp, resources) => ({
	pay: { vp },
	gain: [{ gain: { any: resources } }],
});

/**
 * A trade offer of resources of the player's choice for VP.
 * @param {number} resources
 * @param {number} vp
 */
const buyVp = (resources, vp) => ({
	pay: { any: resources },
	gain: [{ vp }],
});

/**
 * The 43 base cards in BASE_TAPESTRY order (alphabetical), then the trap, then Plans & Ploys' cards (#33), then
 * Arts & Architecture's (#37), each in catalog order.
 * @type {readonly TapestryCard[]}
 */
export const TAPESTRY_CARDS = deepFreeze([
	era('academia'),
	when('age-of-discovery', [
		{ sharedAdvance: { track: 'roll', others: 'opponents' } },
	]),
	era('age-of-sail'),
	when('age-of-wonders', [
		{
			landmarkRank: {
				fewest: [{ gain: { any: 2 } }],
				most: [{ vp: 12 }],
				otherwise: [{ gain: { any: 1 } }, { vp: 6 }],
			},
		},
	]),
	era('alliance', [{ eraPartner: {} }]),
	when('boast-of-superiority', [{ vp: { per: 'trackLead', each: 4 } }]),
	era('broker-of-peace'),
	era('capitalism'),
	when('coal-baron', [{ coalBaron: {} }]),
	when('colonialism', [{ colonialism: {} }]),
	when('dark-ages', [{ darkAges: {} }]),
	when('democracy', [
		{ gain: { tapestry: 3 } },
		{ discardTapestry: { vpEach: 2 } },
	]),
	when('dictatorship', [{ dictatorship: {} }]),
	when('diplomacy', [
		{ anyBuilding: {} },
		{ others: { who: 'all', effects: [{ gain: { any: 1 } }] } },
	]),
	when('dystopia', [{ trackLandmark: {} }]),
	era('empiricism'),
	when('espionage', [{ copyTapestry: {} }]),
	era('exploitation'),
	when('feudalism', [
		{
			choice: [
				[{ gain: { any: 1 } }],
				[{ vp: { per: 'landmark', each: 3 } }],
			],
		},
	]),
	era('golden-age'),
	when('guilds', [
		{
			trade: {
				offers: [
					sellVp(5, 1),
					sellVp(10, 2),
					sellVp(15, 3),
					buyVp(1, 5),
					buyVp(2, 10),
					buyVp(3, 15),
				],
			},
		},
	]),
	era('industrialism'),
	era('marriage-of-state', [{ eraPartner: { track: true } }]),
	era('mercantilism'),
	when('meritocracy', [{ invent: {} }, { vp: { per: 'techCard', each: 2 } }]),
	era('militarism'),
	era('monarchy'),
	when('oil-magnate', [
		{
			sharedAdvance: {
				track: 'choose',
				others: 'neighbours',
				optional: true,
			},
		},
	]),
	when('olympic-host', [{ olympicHost: {} }]),
	era('pillage-and-plunder'),
	era('pirate-rule'),
	when('plea-for-aid', [{ pleaForAid: {} }]),
	// R118: "each track", the arts track's too when it is in play, in any order.
	when(
		'renaissance',
		[{ advanceEach: { noBenefit: true, freeBonus: true } }],
		false
	),
	era('revisionism'),
	when('revolution', [
		{ choice: [[{ gain: { any: 1 } }], [{ revolution: {} }]] },
	]),
	when('socialism', [{ socialism: {} }]),
	when('steam-tycoon', [
		{ invent: { faceUpOnly: true, thenUpgrade: true } },
		{
			others: {
				who: 'neighbours',
				effects: [{ invent: { deckOnly: true } }],
			},
		},
	]),
	when('technocracy', [{ technocracy: {} }]),
	era('terraforming'),
	era('theocracy'),
	when('trade-economy', [{ tradeEconomy: {} }]),
	era('tyranny'),
	era('wartime-economy'),
	// R22: a trap played as a tapestry card is worth 10 VP.
	{ ...when('trap', [{ vp: 10 }]), response: 'conquest' },
	// Plans & Ploys (#33; 03 §1.4). A response card played as a tapestry card gains its printed line (R45 for Retreat).
	pp(when('astronomy', [{ astronomy: {} }])),
	pp(when('cartography', [{ cartography: {} }])),
	pp(when('double-cross', [{ vp: 9 }, { gain: { territory: 1 } }]), {
		response: 'trap',
	}),
	pp(era('engineering')),
	pp(when('entertain-the-masses', [{ landmark: 'stadium' }])),
	pp(when('manifest-destiny', [{ manifestDestiny: {} }])),
	pp(era('public-works')),
	pp(when('retreat', [{ vp: 9 }, { gain: { tapestry: 1 } }]), {
		response: 'conquest',
	}),
	pp(when('status-quo', [{ statusQuo: {} }])),
	pp(when('stolen-plans', [{ vp: 8 }, { invent: {} }]), {
		response: 'trap',
	}),
	pp(
		when('surprise-party', [
			{ choice: [[{ vp: 10 }], [{ building: 'armory' }]] },
		]),
		{ response: 'conquest' }
	),
	pp(when('surrender', [{ vp: 7 }, { gain: { any: 1 } }]), {
		response: 'conquest',
	}),
	pp(when('worlds-fair', [{ gain: { culture: 1 } }, { worldsFair: {} }]), {
		name: "World's Fair",
	}),
	// Arts & Architecture (#37; 03 §2.5).
	aa(when('age-of-enlightenment', [{ ageOfEnlightenment: {} }])),
	aa(continuous('commercial-center')),
	aa(era('artistic-inspiration')),
	aa(era('found-art')),
	aa(when('granges', [{ granges: {} }]), { solo: false }),
	aa(
		when('information-age', [
			{ invent: {} },
			{
				choice: [
					[{ upgrade: {} }],
					[{ techBenefit: { icon: 'circle', anyRow: true } }],
				],
			},
		])
	),
	aa(when('infrastructure-upgrade', [{ infrastructureUpgrade: {} }])),
	// Explored with a tile from the supply, VP and benefit as any explore (03 §2.5).
	aa(when('migration', [{ explore: { migration: true } }])),
	aa(continuous('monuments')),
	aa(
		when('moon-landing', [
			{
				trade: {
					offers: [
						{
							pay: { territory: 2, tech: 1 },
							gain: [
								{ gain: { space: 1 } },
								{ exploreSpace: {} },
							],
						},
					],
					optional: true,
					purpose: 'moonLanding',
					otherwise: [{ invent: {} }],
				},
			},
		])
	),
	aa(era('national-parks')),
	aa(when('plague', [{ plague: {} }])),
	aa(when('political-posturing', [{ politicalPosturing: {} }])),
	aa(when('silk-road', [{ silkRoad: {} }])),
	aa(era('space-race')),
	aa(when('spymaster', [{ vp: 5 }, { spymaster: {} }]), {
		response: 'track',
	}),
	aa(continuous('star-chamber')),
	// Mandatory where possible; the arts track is in play whenever this card is (R124).
	aa(
		when('government-grants', [
			{ advance: { tracks: ['arts'], freeBonus: true } },
			{
				regress: {
					tracks: [
						'exploration',
						'science',
						'technology',
						'military',
					],
					noBonus: true,
				},
			},
		])
	),
	aa(era('steam'), { name: 'S.T.E.A.M.' }),
	aa(era('trade-routes')),
]);

/**
 * A&A's building-plot cards (#37; 03 §2.5): their squares row by row ('X' a square), and Commercial Center's printed
 * benefit on each square in reading order: 1 coin, 1 tapestry card, invent, a science-die roll without benefit (my
 * call: the research lists them in this order, the card's layout isn't in it).
 * @type {Readonly<Record<string, { grid: readonly string[], squares?: readonly Effect[][] }>>}
 */
export const PLOT_CARDS = deepFreeze({
	'commercial-center': {
		grid: ['XX', 'XX'],
		squares: [
			[{ gain: { coin: 1 } }],
			[{ gain: { tapestry: 1 } }],
			[{ invent: {} }],
			[{ research: { noBenefit: true } }],
		],
	},
	monuments: { grid: ['..X', '.XX', 'XXX'] },
	'star-chamber': { grid: ['.X.', 'XXX', '.X.'] },
});

/**
 * A tapestry card by id; each of the 7 trap copies is the trap.
 * @param {string} id
 * @returns {TapestryCard}
 */
export function tapestryCard(id) {
	const wanted = /^trap-[1-7]$/.test(id) ? 'trap' : id;
	const card = TAPESTRY_CARDS.find((c) => c.id === wanted);
	if (!card) {
		throw new Error(`no tapestry card ${id}`);
	}
	return card;
}
