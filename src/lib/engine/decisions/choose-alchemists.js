// The Alchemists' decision after each roll: roll again, or stop and advance on the marked tracks (02 §1.2).
import { PlayerError } from '../errors.js';
import { stopAlchemists } from '../civs/alchemists.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseAlchemists = {
	hidden: [],
	answers() {
		return [{ roll: true }, { roll: false }];
	},
	check(state, decision, answer) {
		if (typeof answer.roll !== 'boolean') {
			throw new PlayerError('Roll again or stop.');
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		if (answer.roll) {
			ctx.push([{ player, kind: 'alchemistsRoll' }]);
		} else {
			stopAlchemists(ctx, player, decision.marked);
		}
	},
};
