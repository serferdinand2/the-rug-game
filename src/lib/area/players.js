// The players overview's cards (#27 design §4): each player's public facts, from the viewer's view.
import { civilizationName } from '../describe.js';
import { selfSummary } from '../overview.js';
import { mapHexes } from '../hexmap.js';
import { TERRAINS } from '../ui.js';
import { controlledTerritories, uniformLines } from '../engine/game.js';

const TRACK_IDS = /** @type {const} */ ([
	'exploration',
	'science',
	'technology',
	'military',
]);

/**
 * The props of one PlayerCard.
 * @typedef {Object} PlayerCardFacts
 * @property {import('../ui.js').Seat} seat
 * @property {string} name
 * @property {number} vp
 * @property {boolean} you
 * @property {boolean} host
 * @property {string} civilization
 * @property {number} era
 * @property {{ coin: number, worker: number, food: number, culture: number }} resources
 * @property {Record<import('../ui.js').TrackId, number>} tracks - Each track's furthest token
 * @property {number} handSize - Only the count: a hand never leaves its owner's view
 * @property {number} capitalPoints - What the capital scores: its complete rows and columns, and the Architects' uniform lines again
 * @property {number} tech
 * @property {string[]} terrain - The land terrains of the territories they control, each once, in the interface's order
 */

/**
 * One card per player seat, in seat order.
 * @param {any} view - The game as view() gives it to the viewer
 * @param {number | null} viewer - The viewer's seat
 * @param {number | null} host - The host's seat
 * @returns {PlayerCardFacts[]}
 */
export function playerCards(view, viewer, host) {
	const hexes = new Map(mapHexes(view).map((hex) => [hex.key, hex]));
	return view.seats
		.filter((/** @type {any} */ seat) => seat.kind === 'player')
		.map((/** @type {any} */ seat) => {
			const summary =
				/** @type {import('../overview.js').SelfSummary} */ (
					selfSummary(view, seat.seat)
				);
			return {
				seat: summary.seat,
				name: seat.name,
				vp: seat.vp,
				you: seat.seat === viewer,
				host: seat.seat === host,
				civilization: seat.civs.length
					? civilizationName(seat.civs[0])
					: 'Setting up',
				era: summary.era,
				resources: { ...seat.resources },
				tracks: /** @type {Record<import('../ui.js').TrackId, number>} */ (
					Object.fromEntries(
						TRACK_IDS.map((track) => [
							track,
							Math.max(0, ...seat.tracks[track]),
						])
					)
				),
				handSize: summary.hand,
				capitalPoints:
					summary.lines +
					(seat.civs.includes('architects') ? uniformLines(seat) : 0),
				tech: summary.tech,
				terrain: landTerrains(view, seat.seat, hexes),
			};
		});
}

/**
 * The land terrains a player's territories show, each once, named for the card.
 * @param {any} view
 * @param {number} player
 * @param {Map<string, import('../hexmap.js').MapHex>} hexes
 * @returns {string[]}
 */
function landTerrains(view, player, hexes) {
	const shown = new Set(
		controlledTerritories(view, player).flatMap((key) => {
			const hex = hexes.get(key);
			return hex ? [...(hex.corners ?? []), ...hex.island] : [];
		})
	);
	return TERRAINS.filter(
		(terrain) => terrain.id !== 'sea' && shown.has(terrain.id)
	).map((terrain) => terrain.name);
}
