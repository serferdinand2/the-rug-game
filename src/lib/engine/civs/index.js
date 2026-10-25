// The civilization registry: every base civilization by id and the ones a player holds (design §4).
import { isPlayerSeat, playerSeat } from '../state.js';
import { alchemists } from './alchemists.js';
import { architects } from './architects.js';
import { craftsmen } from './craftsmen.js';
import { entertainers } from './entertainers.js';
import { futurists } from './futurists.js';
import { heralds } from './heralds.js';
import { historians } from './historians.js';
import { inventors } from './inventors.js';
import { isolationists } from './isolationists.js';
import { leaders } from './leaders.js';
import { merrymakers } from './merrymakers.js';
import { militants } from './militants.js';
import { mystics } from './mystics.js';
import { nomads } from './nomads.js';
import { theChosen } from './the-chosen.js';
import { traders } from './traders.js';

/** @typedef {import('./civ.js').Civ} Civ */

// For callers outside this folder. Civilization modules import `offer` from './civ.js', which keeps them out of a cycle with this module.
export { offer } from './civ.js';

/**
 * Every base civilization, by catalog id.
 * @type {Record<string, Civ>}
 */
export const CIVS = {
	alchemists,
	architects,
	craftsmen,
	entertainers,
	futurists,
	heralds,
	historians,
	inventors,
	isolationists,
	leaders,
	merrymakers,
	militants,
	mystics,
	nomads,
	'the-chosen': theChosen,
	traders,
};

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
