// Territory control on the map: who controls which hex, and how many items a hex holds (01 §7.3, #20 design §8).

/**
 * The hexes a player controls: each has at least one upright outpost, and every upright outpost on it is theirs.
 * #17 reuses this for conquering and the red die.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]} Hex keys
 */
export function controlledTerritories(state, player) {
	return Object.keys(state.hexes).filter((key) => {
		const upright = state.hexes[key].outposts.filter((o) => !o.toppled);
		return upright.length > 0 && upright.every((o) => o.seat === player);
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
