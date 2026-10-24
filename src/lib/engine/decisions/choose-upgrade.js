// The decision to pick a tech card to upgrade, or to decline an optional upgrade.
import { PlayerError } from '../errors.js';
import { upgradable } from '../tech.js';
import { upgradeCard } from '../effects/tech.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseUpgrade = {
	hidden: [],
	answers(state, decision) {
		const cards = upgradable(
			state,
			/** @type {number} */ (decision.player)
		);
		return [
			...(decision.optional ? [{ card: null }] : []),
			...cards.map((card) => ({ card })),
		];
	},
	check(state, decision, answer) {
		const found = chooseUpgrade
			.answers(state, decision)
			.some((a) => a.card === answer.card);
		if (!found) {
			throw new PlayerError("You can't upgrade that card.");
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.card === null) {
			return;
		}
		upgradeCard(ctx, /** @type {number} */ (decision.player), answer.card);
	},
};
