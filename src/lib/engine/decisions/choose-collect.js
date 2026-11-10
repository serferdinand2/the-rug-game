// The Collectors' offer to put a tapestry card, territory tile or tech card just gained on their mat (A&A, #37); its options are the player's own, as a drawn card is secret.
import { PlayerError } from '../errors.js';
import { collectorsTake } from '../civs/collectors.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseCollect = {
	hidden: ['options'],
	answers(state, decision) {
		return [
			{ slot: null },
			...decision.options.map((/** @type {string | number} */ slot) => ({
				slot,
			})),
		];
	},
	check(state, decision, answer) {
		if (answer.slot !== null && !decision.options.includes(answer.slot)) {
			throw new PlayerError("You can't put that on your mat.");
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.slot === null) {
			return;
		}
		collectorsTake(ctx, {
			id: 0,
			batch: 0,
			player: decision.player,
			kind: 'collectorsTake',
			type: decision.type,
			slot: answer.slot,
		});
	},
};
