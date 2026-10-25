// The decision of which offered place, token, card or target a civilization uses; the answer goes on to `then`.
import { PlayerError } from '../errors.js';

/**
 * What a slot pick offers and where its answer goes.
 * @typedef {Object} SlotPick
 * @property {any[]} options - The slots, each any JSON value, such as a resource id or `{ player, card }`
 * @property {boolean} [optional] - Whether the player may decline
 * @property {string} purpose - What the slot is for, for the interface, such as 'loseResource' or 'architectsCube'
 * @property {{ kind: string } & Record<string, any>} then - The operation to push, without its player: `player` and `slot` are added
 */

/**
 * Goes on to `then` with the slot: at once when a required pick has only one option, otherwise by asking with `chooseSlot`.
 * An optional pick always asks while there is something to offer. With nothing offered, nothing happens.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {SlotPick} pick
 */
export function askSlot(
	ctx,
	player,
	{ options, optional = false, purpose, then }
) {
	if (options.length === 0) {
		return;
	}
	if (options.length === 1 && !optional) {
		ctx.push([
			{
				...structuredClone(then),
				player,
				slot: structuredClone(options[0]),
			},
		]);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseSlot',
			options: structuredClone(options),
			optional,
			purpose,
			then: structuredClone(then),
		},
	]);
}

/**
 * Whether two JSON values are the same, whatever the order of their keys.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function same(a, b) {
	if (a === b) {
		return true;
	}
	if (
		typeof a !== 'object' ||
		typeof b !== 'object' ||
		a === null ||
		b === null ||
		Array.isArray(a) !== Array.isArray(b)
	) {
		return false;
	}
	const x = /** @type {Record<string, unknown>} */ (a);
	const y = /** @type {Record<string, unknown>} */ (b);
	const keys = Object.keys(x);
	return (
		keys.length === Object.keys(y).length &&
		keys.every((key) => Object.hasOwn(y, key) && same(x[key], y[key]))
	);
}

/** @type {import('../state.js').DecisionKind} */
export const chooseSlot = {
	hidden: [],
	answers(state, decision) {
		const slots = decision.options.map((/** @type {any} */ slot) => ({
			slot,
		}));
		return decision.optional ? [{ slot: null }, ...slots] : slots;
	},
	check(state, decision, answer) {
		const offered = chooseSlot
			.answers(state, decision)
			.some((a) => same(a.slot, answer.slot));
		if (!offered) {
			throw new PlayerError('Choose one of the options offered.');
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.slot === null) {
			return;
		}
		ctx.push([
			{
				...decision.then,
				player: decision.player,
				slot: structuredClone(answer.slot),
			},
		]);
	},
};
