// The decision to pick a territory tile, a hex and a turn to explore; `tile`, when set, is the only tile offered (Coal Baron). `mat` offers only the Islanders' mat hexes, and `free` only places the tile (R113).
import { PlayerError } from '../errors.js';
import { exploreAnswers, exploreTile, migrate } from '../effects/explore.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseExplore = {
	hidden: [],
	answers(state, decision) {
		return exploreAnswers(
			state,
			/** @type {number} */ (decision.player),
			decision.anywhere === true,
			decision.tile,
			decision.mat === true,
			decision.migration === true
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
		exploreTile(
			ctx,
			/** @type {number} */ (decision.player),
			{
				tile: answer.tile,
				hex: answer.hex,
				orient: answer.orient,
			},
			decision.free === true
		);
		// Migration's outposts (#37).
		if (decision.migration === true) {
			migrate(ctx, /** @type {number} */ (decision.player), answer.hex);
		}
	},
};
