// The card or tile corresponding to the Time Travelers' setup landmark is discarded if drawn later (R96).

/** @param {import('./state.js').State} state @returns {string | undefined} */
export function timeTravelersTakenLandmark(state) {
	const bot = /** @type {any} */ (
		state.seats.find(
			(seat) =>
				seat.kind === 'automa' &&
				/** @type {any} */ (
					/** @type {any} */ (seat).civilization ===
						'time-travelers' ||
						/** @type {any} */ (seat).secondCivilization ===
							'time-travelers'
				)
		)
	);
	return bot?.timeTravelersLandmark;
}

/** @param {import('./state.js').State} state @param {string} card @returns {boolean} */
export function timeTravelersBlocksTech(state, card) {
	const landmark = timeTravelersTakenLandmark(state);
	return (
		landmark !== undefined && landmark !== 'monolith' && landmark === card
	);
}

/** The Monolith's P&P space tile is 19. @param {import('./state.js').State} state @param {number} tile @returns {boolean} */
export function timeTravelersBlocksSpaceTile(state, tile) {
	return tile === 19 && timeTravelersTakenLandmark(state) === 'monolith';
}

/** Take up to count tiles, discarding a blocked Monolith as it is drawn.
 * @param {import('./state.js').State} state
 * @param {'space'|'territory'} stack
 * @param {number} count
 * @returns {number[]}
 */
export function drawAvailableTiles(state, stack, count) {
	/** @type {number[]} */
	const drawn = [];
	while (drawn.length < count && state.supply[stack].length) {
		const tile = /** @type {number} */ (state.supply[stack].shift());
		if (stack === 'space' && timeTravelersBlocksSpaceTile(state, tile))
			state.supply.spaceDiscard.push(tile);
		else drawn.push(tile);
	}
	return drawn;
}
