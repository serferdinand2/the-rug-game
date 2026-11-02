// The decision to pick a tech card to upgrade, or to decline an optional upgrade; the Recyclers may recycle a top-row card instead.
import { PlayerError } from '../errors.js';
import { recyclable, upgradable } from '../tech.js';
import { upgradeCard } from '../effects/tech.js';
import { recycleCard } from '../civs/recyclers.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseUpgrade = {
	hidden: [],
	// Every upgrade asked is the player's own, so the Recyclers' top-row cards join (03 §1.3); an Inventors token's
	// upgrade never asks.
	answers(state, decision) {
		const player = /** @type {number} */ (decision.player);
		return [
			...(decision.optional ? [{ card: null }] : []),
			...upgradable(state, player).map((card) => ({ card })),
			...recyclable(state, player).map((card) => ({ card })),
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
		const player = /** @type {number} */ (decision.player);
		if (recyclable(ctx.state, player).includes(answer.card)) {
			recycleCard(ctx, player, answer.card);
			return;
		}
		upgradeCard(ctx, player, answer.card);
	},
};
