// The Architects gained mid-game: up to 3 optional swaps of two income buildings of different types in the capital (02 §1.2).
import { emit } from '../events.js';
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { plotIndex } from '../../capital.js';

/** @typedef {import('../state.js').PlayerSeat} PlayerSeat */

/**
 * The income building on a plot of the capital.
 * @param {PlayerSeat} seat
 * @param {unknown} plot - A plot index, as answered
 * @returns {import('../city.js').PlacedBuilding | undefined}
 */
function buildingAt(seat, plot) {
	return seat.capital.buildings.find((b) => plotIndex(b.row, b.col) === plot);
}

/**
 * Every swap the capital allows: two plots holding income buildings of different types, in reading order.
 * @param {PlayerSeat} seat
 * @returns {{ a: number, b: number }[]}
 */
function swaps(seat) {
	const placed = seat.capital.buildings
		.map((b) => ({ plot: plotIndex(b.row, b.col), building: b.building }))
		.sort((x, y) => x.plot - y.plot);
	return placed.flatMap((x, i) =>
		placed
			.slice(i + 1)
			.filter((y) => y.building !== x.building)
			.map((y) => ({ a: x.plot, b: y.plot }))
	);
}

/**
 * Asks for the next swap while some are left and one is possible.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} left - Swaps still allowed
 */
export function askSwap(ctx, player, left) {
	if (left > 0 && swaps(playerSeat(ctx.state, player)).length > 0) {
		ctx.push([{ player, kind: 'chooseSwap', left }]);
	}
}

/** @type {import('../state.js').DecisionKind} */
export const chooseSwap = {
	hidden: [],
	answers(state, decision) {
		return [
			{ a: null },
			...swaps(
				playerSeat(state, /** @type {number} */ (decision.player))
			),
		];
	},
	check(state, decision, answer) {
		if (answer.a === null) {
			return;
		}
		const seat = playerSeat(state, /** @type {number} */ (decision.player));
		const first = buildingAt(seat, answer.a);
		const second = buildingAt(seat, answer.b);
		if (!first || !second || first.building === second.building) {
			throw new PlayerError(
				'Swap two different income buildings in your capital, or stop.'
			);
		}
	},
	// The two buildings trade places. A swap completes nothing, so it pays no district reward.
	resolve(ctx, decision, answer) {
		if (answer.a === null) {
			return;
		}
		const player = /** @type {number} */ (decision.player);
		const seat = playerSeat(ctx.state, player);
		const first = /** @type {import('../city.js').PlacedBuilding} */ (
			buildingAt(seat, answer.a)
		);
		const second = /** @type {import('../city.js').PlacedBuilding} */ (
			buildingAt(seat, answer.b)
		);
		[first.building, second.building] = [second.building, first.building];
		emit(ctx.state, {
			type: 'buildingsSwapped',
			player,
			a: answer.a,
			b: answer.b,
		});
		askSwap(ctx, player, decision.left - 1);
	},
};
