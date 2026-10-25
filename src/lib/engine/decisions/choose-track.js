// The decision of which track a card acts on (Oil Magnate, Dark Ages, Dictatorship); the answer goes on to `then`.
import { PlayerError } from '../errors.js';

/** @typedef {import('../data/ids.js').TrackId} TrackId */

/**
 * Goes on to `then` with the track: at once when only one is offered, otherwise by asking with `chooseTrack`.
 * With none offered, nothing happens.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {TrackId[]} options
 * @param {string} purpose - What the track is for, for the interface: 'sharedAdvance', 'darkAges' or 'dictatorship'
 * @param {{ kind: string } & Record<string, any>} then - The operation to push, without its player: `player` and `track` are added
 */
export function askTrack(ctx, player, options, purpose, then) {
	if (options.length === 1) {
		ctx.push([{ ...then, player, track: options[0] }]);
		return;
	}
	if (options.length > 1) {
		ctx.push([{ player, kind: 'chooseTrack', options, purpose, then }]);
	}
}

/** @type {import('../state.js').DecisionKind} */
export const chooseTrack = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {TrackId} */ track) => ({
			track,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.track)) {
			throw new PlayerError('Choose one of the tracks offered.');
		}
	},
	resolve(ctx, decision, answer) {
		ctx.push([
			{ ...decision.then, player: decision.player, track: answer.track },
		]);
	},
};
