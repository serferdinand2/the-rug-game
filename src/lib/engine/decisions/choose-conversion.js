// The decision to turn food earned in the income step into other resources for 2 VP each, or none (Mercantilism).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { pay } from '../payment.js';
import { gainResources } from '../effects/gain.js';
import { vp } from '../effects/vp.js';

/** @typedef {'coin' | 'worker' | 'culture'} Into */

/** What food may become: any other resource (02 §3). @type {readonly Into[]} */
const INTO = ['coin', 'worker', 'culture'];

/** VP for each food converted (02 §3). */
const VP_EACH = 2;

/**
 * Every way to convert exactly `total` food, the most coin first. Resources left at 0 are left out.
 * @param {number} total
 * @returns {Partial<Record<Into, number>>[]}
 */
function splits(total) {
	/** @type {Partial<Record<Into, number>>[]} */
	const found = [];
	for (let coin = total; coin >= 0; coin--) {
		for (let worker = total - coin; worker >= 0; worker--) {
			const counts = { coin, worker, culture: total - coin - worker };
			found.push(
				Object.fromEntries(
					Object.entries(counts).filter(([, n]) => n > 0)
				)
			);
		}
	}
	return found;
}

/** @type {import('../state.js').DecisionKind} */
export const chooseConversion = {
	hidden: [],
	answers(state, decision) {
		const { food } = playerSeat(
			state,
			/** @type {number} */ (decision.player)
		).resources;
		const most = Math.min(decision.max, food);
		/** @type {{ resources: Partial<Record<Into, number>> }[]} */
		const found = [];
		for (let total = 0; total <= most; total++) {
			found.push(...splits(total).map((resources) => ({ resources })));
		}
		return found;
	},
	check(state, decision, answer) {
		const given = answer.resources;
		const offered =
			typeof given === 'object' &&
			given !== null &&
			Object.keys(given).every((id) =>
				INTO.includes(/** @type {Into} */ (id))
			) &&
			chooseConversion
				.answers(state, decision)
				.some((a) =>
					INTO.every(
						(id) => (given[id] ?? 0) === (a.resources[id] ?? 0)
					)
				);
		if (!offered) {
			throw new PlayerError(
				'Convert at most the food you earned and hold.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		/** @type {Partial<Record<Into, number>>} */
		const resources = {};
		let total = 0;
		for (const id of INTO) {
			const count = answer.resources[id] ?? 0;
			if (count > 0) {
				resources[id] = count;
				total += count;
			}
		}
		if (total === 0) {
			return;
		}
		pay(ctx, player, { food: total });
		gainResources(ctx, player, resources);
		emit(ctx.state, {
			type: 'resourcesConverted',
			player,
			resources,
			vp: VP_EACH * total,
		});
		vp(ctx, player, VP_EACH * total, decision);
	},
};
