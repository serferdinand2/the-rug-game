// The decision of which territory a card acts on (Colonialism, Revolution); the answer goes on to `then`.
import { PlayerError } from '../errors.js';

/**
 * Goes on to `then` with the hex: at once when a required pick has only one hex, otherwise by asking with `chooseHex`.
 * An optional pick always asks while there is a hex to offer. With none offered, nothing happens.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string[]} options - Hex keys
 * @param {boolean} optional - Whether the player may decline
 * @param {string} purpose - What the hex is for, for the interface: 'colonialism' or 'revolution'
 * @param {{ kind: string } & Record<string, any>} then - The operation to push, without its player: `player` and `hex` are added
 */
export function askHex(ctx, player, options, optional, purpose, then) {
	if (options.length === 0) {
		return;
	}
	if (options.length === 1 && !optional) {
		ctx.push([{ ...then, player, hex: options[0] }]);
		return;
	}
	ctx.push([{ player, kind: 'chooseHex', options, optional, purpose, then }]);
}

/** @type {import('../state.js').DecisionKind} */
export const chooseHex = {
	hidden: [],
	answers(state, decision) {
		const hexes = decision.options.map((/** @type {string} */ hex) => ({
			hex,
		}));
		return decision.optional ? [{ hex: null }, ...hexes] : hexes;
	},
	check(state, decision, answer) {
		const offered = chooseHex
			.answers(state, decision)
			.some((a) => a.hex === answer.hex);
		if (!offered) {
			throw new PlayerError('Choose one of the territories offered.');
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.hex === null) {
			return;
		}
		ctx.push([
			{ ...decision.then, player: decision.player, hex: answer.hex },
		]);
	},
};
