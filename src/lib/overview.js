// Your overview (#26 design §9): the viewer's name, era, VP, resources and counts, from their own view.
import { capitalScore, controlledTerritories } from './engine/game.js';

/**
 * What the compact overview at the foot of the player area shows.
 * @typedef {Object} SelfSummary
 * @property {import('./ui.js').Seat} seat
 * @property {string} name
 * @property {number} era - 1 to 4: the era the player's last income turn began
 * @property {number} vp
 * @property {{ coin: number, worker: number, food: number, culture: number }} resources
 * @property {number} hand - Tapestry cards in hand
 * @property {number} tech - Tech cards in all three rows
 * @property {number} territories - Territories the player controls
 * @property {number} lines - Complete rows and columns in the capital
 */

/**
 * The viewer's summary, or null for the public view or a seat that isn't a player.
 * @param {any} view - The game as view() gives it to the viewer
 * @param {number | null} seat
 * @returns {SelfSummary | null}
 */
export function selfSummary(view, seat) {
	const player = seat === null ? null : view?.seats?.[seat - 1];
	if (!player || player.kind !== 'player') {
		return null;
	}
	// In setup, before the mats are dealt, the capital scores nothing.
	const lines = capitalScore(player);
	return {
		seat: /** @type {import('./ui.js').Seat} */ (seat),
		name: player.name,
		era: Math.min(Math.max(player.incomeTurns, 1), 4),
		vp: player.vp,
		resources: { ...player.resources },
		hand: player.handCount ?? player.hand?.length ?? 0,
		tech:
			player.tech.bottom.length +
			player.tech.middle.length +
			player.tech.top.length,
		territories: controlledTerritories(view, /** @type {number} */ (seat))
			.length,
		lines: lines.rows + lines.columns,
	};
}
