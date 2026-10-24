// The decision to pick one of the two conquer dice (01 §7.3).
import { PlayerError } from '../errors.js';
import { RED_DIE, BLACK_DIE } from '../data/dice.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseDie = {
	hidden: [],
	answers() {
		return [{ die: 'red' }, { die: 'black' }];
	},
	check(state, decision, answer) {
		if (answer.die !== 'red' && answer.die !== 'black') {
			throw new PlayerError('Choose one of the two dice.');
		}
	},
	resolve(ctx, decision, answer) {
		const face =
			answer.die === 'red'
				? RED_DIE[/** @type {number} */ (decision.red)]
				: BLACK_DIE[/** @type {number} */ (decision.black)];
		ctx.push([
			{
				player: /** @type {number} */ (decision.player),
				kind: 'effects',
				effects: [structuredClone(face)],
				source: { hex: /** @type {string} */ (decision.hex) },
			},
		]);
	},
};
