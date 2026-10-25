// The Nomads (02 §1.2): a building or landmark may go on the map instead of the capital, as a piece that gives control.
import { playerSeat } from '../state.js';
import { controlledTerritories } from '../control.js';
import { MAPS, hexNeighbours } from '../data/maps.js';

/**
 * The hexes a player may put a building or landmark on, in map order, when they hold the Nomads (#20 design §7):
 * (a) a territory they control holding exactly 1 item, or (b) an explored territory with no item next to one they
 * control. A territory's items are its outposts, pieces included, and its tokens (design §8).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
export function nomadsHexes(state, player) {
	if (!playerSeat(state, player).civs.includes('nomads')) {
		return [];
	}
	const owned = new Set(controlledTerritories(state, player));
	return MAPS[state.map].hexes.filter((hex) => {
		const { tile, outposts, tokens } = state.hexes[hex];
		// map.js's itemCount, counted here: placing.js imports this module, and map.js would bring in the civilization cycle.
		const items = outposts.length + tokens.length;
		if (owned.has(hex)) {
			return items === 1;
		}
		return (
			tile !== null &&
			items === 0 &&
			hexNeighbours(hex).some((other) => owned.has(other))
		);
	});
}

/** @type {import('./civ.js').Civ} */
export const nomads = {
	id: 'nomads',
	// Nothing to set up and no state: placing.js offers the hexes (#20 design §9).
};
