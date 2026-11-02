// The pay effect: resources of the player's choice paid one at a time, before what they pay for (the Aliens' explore, #33).
import { playerSeat } from '../state.js';
import { pay as payment } from '../payment.js';
import { askSlot } from '../decisions/choose-slot.js';
import { RESOURCE_IDS } from '../data/ids.js';

/**
 * Asks for the next resource to pay among those held, or pays the only kind held without asking.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} left - Resources still to pay
 * @throws {Error} With nothing left to pay with: every caller checks first, so that is a bug, not a player's mistake
 */
function payAny(ctx, player, left) {
	if (left <= 0) {
		return;
	}
	const seat = playerSeat(ctx.state, player);
	const options = RESOURCE_IDS.filter((id) => seat.resources[id] > 0);
	if (options.length === 0) {
		throw new Error(`Seat ${player} has no resource left to pay.`);
	}
	askSlot(ctx, player, {
		options,
		purpose: 'payResource',
		then: { kind: 'payResource', left: left - 1 },
	});
}

/**
 * Pays `any` resources of the player's choice. Unlike a loss, the whole cost is paid, so whoever offers it checks
 * first that the player holds enough.
 * @type {import('../state.js').EffectHandler}
 */
export function pay(ctx, player, value) {
	for (const key of Object.keys(value)) {
		if (key !== 'any') {
			throw new Error(`Unknown payment "${key}".`);
		}
	}
	payAny(ctx, player, value.any ?? 0);
}

/**
 * Pays the resource the player chose (`slot`), then asks for the next one.
 * @type {import('../state.js').AutomaticKind}
 */
export function payResource(ctx, op) {
	const player = /** @type {number} */ (op.player);
	payment(ctx, player, { [op.slot]: 1 });
	payAny(ctx, player, op.left);
}
