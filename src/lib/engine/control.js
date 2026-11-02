// Territory control on the map: who controls which hex, and how many items a hex holds (01 §7.3, #20 design §8, R114).

/** The civilization whose token controls a hex (R114); every other token gives no control (R33). */
const CONTROLLING_TOKEN = 'treasure-hunters';

/**
 * Who a Treasure Hunters token on a hex makes its controller: its seat, when no upright outpost stands there (R114).
 * After a conquest the attacker's upright outpost controls; after a trap it is toppled, so the token controls again.
 * @param {import('./state.js').Hex} hex
 * @returns {number | null}
 */
export function tokenController(hex) {
	if (hex.outposts.some((o) => !o.toppled)) {
		return null;
	}
	return hex.tokens.find((t) => t.civ === CONTROLLING_TOKEN)?.seat ?? null;
}

/**
 * The hexes a player controls: each has at least one upright outpost, and every upright outpost on it is theirs; or
 * none, and their Treasure Hunters token (R114). #17 reuses this for conquering and the red die.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]} Hex keys
 */
export function controlledTerritories(state, player) {
	return Object.keys(state.hexes).filter((key) => {
		const hex = state.hexes[key];
		const upright = hex.outposts.filter((o) => !o.toppled);
		if (upright.length === 0) {
			return tokenController(hex) === player;
		}
		return upright.every((o) => o.seat === player);
	});
}

/**
 * How many items a hex holds: its outposts, Nomads pieces included, and its civilization tokens (#20 design §8).
 * It lives here, in a module that imports nothing, so civilization modules can count items without the civilization cycle.
 * @param {import('./state.js').State} state
 * @param {string} hex
 * @returns {number}
 */
export function itemCount(state, hex) {
	const { outposts, tokens } = state.hexes[hex];
	return outposts.length + tokens.length;
}
