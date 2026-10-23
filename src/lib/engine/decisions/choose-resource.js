// The decision to pick resources: some number of them, from any kind or from a short list.
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { RESOURCE_IDS } from '../data/ids.js';
import { gainResources, RESOURCE_CAP } from '../effects/gain.js';

/**
 * The resource ids a decision allows.
 * @param {import('../state.js').Operation} decision
 * @returns {readonly string[]}
 */
function allowed(decision) {
	return decision.from === 'any' ? RESOURCE_IDS : decision.from;
}

/** @type {import('../state.js').DecisionKind} */
export const chooseResource = {
	hidden: [],
	answers(state, decision) {
		const seat = playerSeat(state, /** @type {number} */ (decision.player));
		const ids = RESOURCE_IDS.filter((id) => allowed(decision).includes(id));
		/** @type {{ resources: Record<string, number>, loss: number }[]} */
		const found = [];
		/**
		 * @param {number} from
		 * @param {number} left
		 * @param {Record<string, number>} chosen
		 */
		const build = (from, left, chosen) => {
			if (left === 0) {
				let loss = 0;
				for (const [id, n] of Object.entries(chosen)) {
					loss += Math.max(
						0,
						seat.resources[/** @type {'coin'} */ (id)] +
							n -
							RESOURCE_CAP
					);
				}
				found.push({ resources: chosen, loss });
				return;
			}
			for (let i = from; i < ids.length; i++) {
				build(i, left - 1, {
					...chosen,
					[ids[i]]: (chosen[ids[i]] ?? 0) + 1,
				});
			}
		};
		build(0, decision.count, {});
		return found
			.map((entry, index) => ({ ...entry, index }))
			.sort((a, b) => a.loss - b.loss || a.index - b.index)
			.map(({ resources }) => ({ resources }));
	},
	check(state, decision, answer) {
		const resources = answer.resources;
		const noun = decision.count === 1 ? 'resource' : 'resources';
		const exactly = new PlayerError(
			`Choose exactly ${decision.count} ${noun}.`
		);
		if (typeof resources !== 'object' || resources === null) {
			throw exactly;
		}
		let total = 0;
		for (const [id, n] of Object.entries(resources)) {
			if (
				!RESOURCE_IDS.includes(/** @type {any} */ (id)) ||
				!allowed(decision).includes(id)
			) {
				throw new PlayerError(`You can't choose ${id} here.`);
			}
			if (!Number.isInteger(n) || n <= 0) {
				throw exactly;
			}
			total += n;
		}
		if (total !== decision.count) {
			throw exactly;
		}
	},
	resolve(ctx, decision, answer) {
		gainResources(
			ctx,
			/** @type {number} */ (decision.player),
			answer.resources
		);
	},
};
