// The decision of which token to move: one space forward or back (research, advance and regress effects), or a jump to a set space (Socialism).
import { PlayerError } from '../errors.js';
import { moveToken } from '../movement.js';

/** @typedef {{ track: import('../data/ids.js').TrackId, from: number, to?: number }} Move - `to` only for a jump */

/** @type {import('../state.js').DecisionKind} */
export const chooseMove = {
	hidden: [],
	answers(state, decision) {
		/** @type {import('../state.js').Answer[]} */
		const answers = decision.options.map((/** @type {Move} */ o) => ({
			track: o.track,
			from: o.from,
			...(o.to !== undefined && { to: o.to }),
		}));
		if (decision.optional) {
			answers.push({ track: null });
		}
		return answers;
	},
	check(state, decision, answer) {
		if (answer.track === null) {
			if (!decision.optional) {
				throw new PlayerError('This move is not optional.');
			}
			return;
		}
		const offered = decision.options.some(
			(/** @type {Move} */ o) =>
				o.track === answer.track &&
				o.from === answer.from &&
				o.to === answer.to
		);
		if (!offered) {
			throw new PlayerError('Choose one of the moves offered.');
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.track === null) {
			return;
		}
		const step = decision.direction === 'advance' ? 1 : -1;
		moveToken(ctx, /** @type {number} */ (decision.player), {
			track: answer.track,
			from: answer.from,
			to: answer.to ?? answer.from + step,
			benefit: decision.benefit,
			freeBonus: decision.freeBonus ?? false,
			noBonus: decision.noBonus ?? false,
		});
	},
};
