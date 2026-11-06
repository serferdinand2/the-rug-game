// The decision of which science die to roll, with the variant "Roll either science die" (#35); the answer goes on to `then`.
import { PlayerError } from '../errors.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseScienceDie = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ die) => ({ die }));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.die)) {
			throw new PlayerError('Choose the d12 or the d20.');
		}
	},
	resolve(ctx, decision, answer) {
		ctx.push([
			{
				...decision.then,
				player: decision.player,
				scienceDie: answer.die,
			},
		]);
	},
};
