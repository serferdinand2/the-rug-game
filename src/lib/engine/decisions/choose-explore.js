// The decision to pick a territory tile, a hex and a turn to explore; `tile`, when set, is the only tile offered (Coal Baron).
import { PlayerError } from '../errors.js';
import { exploreAnswers, exploreTile } from '../effects/explore.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseExplore = {
	hidden: [],
	answers(state, decision) {
		return exploreAnswers(
			state,
			/** @type {number} */ (decision.player),
			decision.anywhere === true,
			decision.tile
		);
	},
	check(state, decision, answer) {
		const found = chooseExplore
			.answers(state, decision)
			.some(
				(a) =>
					a.tile === answer.tile &&
					a.hex === answer.hex &&
					a.orient === answer.orient
			);
		if (!found) {
			throw new PlayerError("You can't explore there.");
		}
	},
	resolve(ctx, decision, answer) {
		exploreTile(ctx, /** @type {number} */ (decision.player), {
			tile: answer.tile,
			hex: answer.hex,
			orient: answer.orient,
		});
	},
};
