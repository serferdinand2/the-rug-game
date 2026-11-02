// The civilization lookup, kept apart from the modules it holds so abilities.js can use it without importing them (#166). civs/index.js fills `CIVS`.
import { isPlayerSeat, playerSeat } from '../state.js';

/** @typedef {import('./civ.js').Civ} Civ */

/**
 * Every civilization built, by catalog id; civs/index.js registers them.
 * @type {Record<string, Civ>}
 */
export const CIVS = {};

/**
 * The rules of one civilization.
 * @param {string} id
 * @returns {Civ}
 * @throws {Error} For an id with no civilization (a bug, not a player's mistake)
 */
export function findCiv(id) {
	if (!Object.hasOwn(CIVS, id)) {
		throw new Error(`There is no civilization ${id}.`);
	}
	return CIVS[id];
}

/**
 * The civilizations a player holds, the one chosen at setup first and those gained later after it.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {Civ[]} Empty for a seat that isn't a player
 */
export function civsOf(state, player) {
	if (!isPlayerSeat(state, player)) {
		return [];
	}
	return playerSeat(state, player).civs.map(findCiv);
}
