// The lose effect: a player gives up culture first, then resources of their choice, as far as they hold them (design §5).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { askSlot } from '../decisions/choose-slot.js';
import { RESOURCE_IDS } from '../data/ids.js';

/**
 * Takes resources from a player and says so.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {import('../data/ids.js').ResourceId} id
 * @param {number} amount
 */
function take(ctx, player, id, amount) {
	playerSeat(ctx.state, player).resources[id] -= amount;
	emit(ctx.state, { type: 'resourcesLost', player, lost: { [id]: amount } });
}

/**
 * Asks for the next resource to lose among those held, takes the only kind held without asking, or takes nothing.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} left - Resources still to lose
 */
function loseAny(ctx, player, left) {
	if (left <= 0) {
		return;
	}
	const seat = playerSeat(ctx.state, player);
	askSlot(ctx, player, {
		options: RESOURCE_IDS.filter((id) => seat.resources[id] > 0),
		optional: false,
		purpose: 'loseResource',
		then: { kind: 'loseResource', left: left - 1 },
	});
}

/**
 * Loses culture, as much of it as the player has (with none, none is lost: my call), then `any` resources one at a time.
 * @type {import('../state.js').EffectHandler}
 */
export function lose(ctx, player, value) {
	for (const key of Object.keys(value)) {
		if (key !== 'culture' && key !== 'any') {
			throw new Error(`Unknown loss "${key}".`);
		}
	}
	const seat = playerSeat(ctx.state, player);
	const culture = Math.min(value.culture ?? 0, seat.resources.culture);
	if (culture > 0) {
		take(ctx, player, 'culture', culture);
	}
	loseAny(ctx, player, value.any ?? 0);
}

/**
 * Loses the resource the player chose (`slot`), then asks for the next one.
 * @type {import('../state.js').AutomaticKind}
 */
export function loseResource(ctx, op) {
	const player = /** @type {number} */ (op.player);
	take(ctx, player, op.slot, 1);
	loseAny(ctx, player, op.left);
}
