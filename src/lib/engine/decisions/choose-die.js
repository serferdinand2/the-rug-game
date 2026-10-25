// The decision to pick one of the two conquer dice (01 §7.3).
import { PlayerError } from '../errors.js';
import { triggered } from '../abilities.js';
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
		const player = /** @type {number} */ (decision.player);
		const hex = /** @type {string} */ (decision.hex);
		const red = RED_DIE[/** @type {number} */ (decision.red)];
		const black = BLACK_DIE[/** @type {number} */ (decision.black)];
		const [face, other] =
			answer.die === 'red' ? [red, black] : [black, red];
		// The kept face, then the `dieKept` triggers, told the face not kept (#20 design §7, Traders).
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [structuredClone(face)],
				source: { hex },
			},
			...triggered(ctx.state, 'dieKept', {
				player,
				hex,
				other: structuredClone(other),
			}),
		]);
	},
};
