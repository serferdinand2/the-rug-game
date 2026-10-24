// Territory control on the map: who controls which hex (01 §7.3).

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
