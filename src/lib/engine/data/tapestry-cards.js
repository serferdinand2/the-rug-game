// The 43 base tapestry cards and the trap played as a card: timing and what happens when played (02 §3, design 2026-10-25).
import { deepFreeze, TRACK_IDS } from './ids.js';

/** @typedef {import('./effects.js').Effect} Effect */

/**
 * A tapestry card.
 * @typedef {Object} TapestryCard
 * @property {string} id - The slug the asset catalog uses, such as 'meritocracy'; the trap's is 'trap'
 * @property {string} name
 * @property {'played' | 'era'} timing - 'played' is WHEN PLAYED; 'era' is THIS ERA
 * @property {Effect[]} played - What runs when the card's ability resolves; a THIS ERA card's setup choice, if any
 * @property {boolean} ordered - Whether the effects run in the order listed (Renaissance is the only false)
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
});

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
 * The 43 base cards in BASE_TAPESTRY order (alphabetical), then the trap.
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
	when(
		'renaissance',
		TRACK_IDS.map((track) => ({
			advance: { tracks: [track], noBenefit: true, freeBonus: true },
		})),
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
	when('trap', [{ vp: 10 }]),
]);

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
