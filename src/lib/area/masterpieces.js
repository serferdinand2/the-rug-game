// A&A's masterpieces and inspiration tiles as the screen shows them (#35 part 4): the masterpiece row on the arts
// track's line, a seat's masterpieces on the Civ tab and its tiles still to place on the Income tab, from a game view.
import { BUILDING_IDS } from '../engine/data/ids.js';
import { masterpieceName } from '../game-names.js';

/** @typedef {import('../engine/data/ids.js').BuildingId} BuildingId */

/**
 * One masterpiece a seat holds.
 * @typedef {Object} HeldMasterpiece
 * @property {string} card - The masterpiece's id
 * @property {string} name - Its name
 * @property {boolean} used - A single-use card turned face down
 */

/**
 * The masterpiece row beside the arts track's name: the face-up cards and how many the deck holds.
 * @typedef {Object} MasterpieceRowView
 * @property {string[]} faceUp - The face-up masterpieces, up to 3, in the supply's order
 * @property {number} deck - The cards left in the face-down deck
 */

/**
 * The masterpiece row, or null for a game without the arts track, which has no masterpieces.
 * @param {any} game - The game view
 * @returns {MasterpieceRowView | null}
 */
export function masterpieceRow(game) {
	const supply = game?.supply?.masterpieces;
	if (!supply) {
		return null;
	}
	return {
		faceUp: [...supply.faceUp],
		deck: typeof supply.deck === 'number' ? supply.deck : 0,
	};
}

/**
 * A seat's masterpieces, in the order gained: public, as they lie face up beside the mat. None without the arts track.
 * @param {any} seat - A seat of the game view
 * @returns {HeldMasterpiece[]}
 */
export function heldMasterpieces(seat) {
	const held = Array.isArray(seat?.masterpieces) ? seat.masterpieces : [];
	return held.map((/** @type {{ card: string, used: boolean }} */ entry) => ({
		card: entry.card,
		name: masterpieceName(entry.card),
		used: entry.used === true,
	}));
}

/**
 * The rows whose inspiration tile the seat hasn't placed, in income-mat order; none without the arts track.
 * @param {any} seat - A seat of the game view
 * @returns {BuildingId[]}
 */
export function spareTiles(seat) {
	if (!Array.isArray(seat?.inspired)) {
		return [];
	}
	return BUILDING_IDS.filter((building) => !seat.inspired.includes(building));
}
