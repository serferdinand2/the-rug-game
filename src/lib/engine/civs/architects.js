// The Architects (02 §1.2): 1 more resource for a district of one type of income building, 2 VP for such a line, and swaps when gained mid-game.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { opponents } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { askSwap } from '../decisions/choose-swap.js';
import { cityPlots, uniformGroup } from '../city.js';
import { groupsOf } from '../../capital.js';

/** How many swaps the Architects gained mid-game may make. */
const SWAPS = 3;

/**
 * Asks where the next impassable cube goes: an open plot in a district that holds no cube yet.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} left - Cubes still to place
 */
function askCube(ctx, player, left) {
	if (left <= 0) {
		return;
	}
	const seat = playerSeat(ctx.state, player);
	const plots = cityPlots(seat);
	askSlot(ctx, player, {
		options: groupsOf('districts')
			.filter(
				(group) => !group.some((p) => seat.capital.cubes.includes(p))
			)
			.flat()
			.filter((p) => plots[p] === 'empty')
			.sort((a, b) => a - b),
		purpose: 'architectsCube',
		then: { kind: 'architectsCube', left: left - 1 },
	});
}

/**
 * Puts a cube on the plot picked (`slot`), making it impassable, then asks for the next.
 * @type {import('../state.js').AutomaticKind}
 */
export function architectsCube(ctx, op) {
	const player = /** @type {number} */ (op.player);
	playerSeat(ctx.state, player).capital.cubes.push(op.slot);
	emit(ctx.state, { type: 'cubePlaced', player, plot: op.slot });
	askCube(ctx, player, op.left);
}

/** @type {import('./civ.js').Civ} */
export const architects = {
	id: 'architects',
	// Nothing at setup; gained mid-game, up to 3 swaps.
	setup(ctx, player, midGame) {
		if (midGame) {
			askSwap(ctx, player, SWAPS);
		}
	},
	hooks: {
		// After the district reward: 1 more resource for each district completed whose income buildings are all one type.
		districtsCompleted(state, owner, { player, districts }) {
			if (owner !== player) {
				return [];
			}
			const seat = playerSeat(state, owner);
			const uniform = districts.filter((/** @type {number} */ d) =>
				uniformGroup(seat, groupsOf('districts')[d])
			).length;
			return uniform > 0
				? [
						{
							player: owner,
							kind: 'effects',
							effects: [{ gain: { any: uniform } }],
						},
					]
				: [];
		},
	},
	adjustment: {
		// One impassable cube per opponent, each in a different district.
		setup(ctx, player) {
			askCube(ctx, player, opponents(ctx.state, player).length);
		},
	},
};
