// The decision to pick a tech card to upgrade, or to decline an optional upgrade; the Recyclers may recycle a top-row card instead.
import { PlayerError } from '../errors.js';
import { lockTech, recyclable, upgradable } from '../tech.js';
import { upgradeCard } from '../effects/tech.js';
import { recycleCard } from '../civs/recyclers.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseUpgrade = {
	hidden: [],
	// Every upgrade asked is the player's own, so the Recyclers' top-row cards join (03 §1.3); an Inventors token's
	// upgrade never asks. `only` names the one card an upgrade may move (upgradeTech: the card just invented).
	answers(state, decision) {
		const player = /** @type {number} */ (decision.player);
		const cards = upgradable(
			state,
			player,
			decision.ignorePrerequisite === true
		).filter(
			(card) =>
				typeof decision.only !== 'string' || card === decision.only
		);
		return [
			...(decision.optional ? [{ card: null }] : []),
			...cards.map((card) => ({ card })),
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
		// Ceramics (#35): locked at once, before the card's benefit runs.
		if (decision.lock) {
			lockTech(ctx.state, player, answer.card);
		}
	},
};
