// What lasts for a player: the active THIS ERA ability, which #20's civilizations join (design §5).
import { isPlayerSeat, playerSeat } from './state.js';

/**
 * A player's active THIS ERA ability.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {import('./state.js').Era | null} Null with no active ability, or for a seat that isn't a player
 */
export function eraOf(state, player) {
	if (!isPlayerSeat(state, player)) {
		return null;
	}
	return playerSeat(state, player).era;
}

/**
 * The id of the card whose THIS ERA rules apply to a player now.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string | null}
 */
export function eraAbility(state, player) {
	return eraOf(state, player)?.ability ?? null;
}

/**
 * Whether one THIS ERA ability is active for a player.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {string} id - A tapestry card id, such as 'monarchy'
 * @returns {boolean}
 */
export function hasEra(state, player, id) {
	return eraAbility(state, player) === id;
}
