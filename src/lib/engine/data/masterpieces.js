// Arts & Architecture's 20 masterpiece cards: what each gives when it fires, and which are single-use (03 §2.7).
import { deepFreeze } from './ids.js';

/** @typedef {import('./effects.js').Effect} Effect */

/**
 * One masterpiece card. Its effects run in order whenever it fires: at the start of its owner's income turn, through
 * Broadcast or through Streaming Implants (03 §2.2).
 * @typedef {Object} MasterpieceCard
 * @property {string} id - The art's slug, such as 'art-deco'
 * @property {string} name - As printed
 * @property {Effect[]} effects
 * @property {boolean} singleUse - Turned face down when used, and never usable by another player (Art Deco, Mime)
 */

/** Any 1 resource, which most masterpieces add to their own benefit. */
const ANY = { gain: { any: 1 } };

/**
 * A masterpiece card's entry.
 * @param {string} id
 * @param {string} name
 * @param {Effect[]} effects
 * @param {boolean} [singleUse]
 * @returns {MasterpieceCard}
 */
function card(id, name, effects, singleUse = false) {
	return { id, name, effects, singleUse };
}

/**
 * VP per space advanced on a track.
 * @param {import('./ids.js').TrackId} track
 * @returns {Effect}
 */
function perSpace(track) {
	return { vp: { per: 'trackSpace', track } };
}

/**
 * The 20 masterpieces, in the reference page's order (RB-FF p27). A single-use card turns face down before its benefit,
 * so its own benefit can't fire it again (my call, #35 part 2); Mime turns only once paid.
 * @type {readonly MasterpieceCard[]}
 */
export const MASTERPIECES = deepFreeze([
	card('animation', 'Animation', [{ vp: { per: 'techCard' } }, ANY]),
	card(
		'art-deco',
		'Art Deco',
		[{ flipMasterpiece: {} }, { anyBuilding: {} }, ANY],
		true
	),
	// Not capital scoring: no capital-scoring trigger fires (03 §2.12).
	card('ballet', 'Ballet', [{ vp: { per: 'capitalRow' } }, ANY]),
	// The text says "barns"; the icon is the farm (03 §2.7).
	card('baroque', 'Baroque', [
		{ vp: { per: 'armory' } },
		{ vp: { per: 'farm' } },
		{ choice: [[{ gain: { food: 1 } }], [{ gain: { culture: 1 } }]] },
	]),
	card('calligraphy', 'Calligraphy', [{ gain: { territory: 1, any: 1 } }]),
	// That card may not be upgraded again this turn (RB-AA p3).
	card('ceramics', 'Ceramics', [{ upgrade: { lock: true } }]),
	// Declined by not paying (03 §2.12).
	card('costuming', 'Costuming', [
		{
			trade: {
				offers: [
					{
						pay: { any: 1 },
						gain: [{ advance: { tracks: ['arts'] } }],
					},
				],
				optional: true,
			},
		},
	]),
	card('fresco', 'Fresco', [
		{ vp: { per: 'territory' } },
		{ gain: { culture: 1 } },
	]),
	card('graffiti', 'Graffiti', [
		{ vp: { per: 'market' } },
		{ vp: { per: 'house' } },
		{ choice: [[{ gain: { worker: 1 } }], [{ gain: { coin: 1 } }]] },
	]),
	// Hand and income mat, covered cards included (BGG-2777701).
	card('haute-cuisine', 'Haute Cuisine', [
		{ vp: { per: 'tapestryCard' } },
		ANY,
	]),
	card('krav-maga', 'Krav Maga', [perSpace('military')]),
	card('mapmaking', 'Mapmaking', [perSpace('exploration')]),
	card(
		'mime',
		'Mime',
		[
			{
				trade: {
					offers: [
						{
							pay: { any: 1 },
							gain: [{ flipMasterpiece: {} }, { repeat: {} }],
						},
					],
					optional: true,
				},
			},
		],
		true
	),
	card('modern-dance', 'Modern Dance', [
		{ vp: { per: 'capitalColumn' } },
		ANY,
	]),
	card('motion-picture', 'Motion Picture', [perSpace('science')]),
	card('painting', 'Painting', [{ vp: 4 }, ANY]),
	// A completed track counts as 12 (BGG-2858761).
	card('stained-glass', 'Stained Glass', [perSpace('technology')]),
	card('tapestry', 'Tapestry', [{ gain: { tapestry: 1, any: 1 } }]),
	card('theater', 'Theater', [perSpace('arts')]),
	// R53: a normal conquer of an adjacent territory with no item on it.
	card('topiary', 'Topiary', [{ conquer: { empty: true } }]),
]);

/**
 * Finds a masterpiece by id.
 * @param {string} id
 * @returns {MasterpieceCard}
 * @throws {Error} For an unknown id (a bug, not a player's mistake)
 */
export function masterpiece(id) {
	const found = MASTERPIECES.find((m) => m.id === id);
	if (!found) {
		throw new Error(`There is no masterpiece "${id}".`);
	}
	return found;
}
