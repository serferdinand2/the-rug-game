// The setup decision with Arts & Architecture: which capital mat and which civilization to keep, chosen together (03 §2.2, player step A; owner, #36).
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { playerSeat } from '../state.js';

/** Cloud City's printed number (R49). */
const CLOUD_CITY = 10;

/**
 * R120: under the current rules (the F&F adjustments, the revised Riverfolk), the Riverfolk may not keep Cloud City;
 * under the original 2019 rules they may.
 * @param {import('../state.js').State} state
 * @param {number} capital
 * @param {string} civ
 * @returns {boolean}
 */
function banned(state, capital, civ) {
	return (
		state.version === 'current' &&
		capital === CLOUD_CITY &&
		civ === 'riverfolk'
	);
}

/** @type {import('../state.js').DecisionKind} */
export const chooseMatAndCiv = {
	// The mats are dealt face up; only the civilizations are secret.
	hidden: ['civs'],
	answers(state, decision) {
		return decision.mats.flatMap((/** @type {number} */ capital) =>
			decision.civs
				.filter(
					(/** @type {string} */ civ) => !banned(state, capital, civ)
				)
				.map((/** @type {string} */ civ) => ({ capital, civ }))
		);
	},
	check(state, decision, answer) {
		if (
			!decision.mats.includes(answer.capital) ||
			!decision.civs.includes(answer.civ)
		) {
			throw new PlayerError(
				'Choose one of your capital mats and one of your two civilizations.'
			);
		}
		if (banned(state, answer.capital, answer.civ)) {
			throw new PlayerError(
				'Under the current rules, the Riverfolk may not keep Cloud City.'
			);
		}
	},
	// The picks stay secret until the reveal, which sets the mat and returns the others to the supply. The other
	// civilization joins the deck now, as only its count is ever public.
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const seat = playerSeat(ctx.state, player);
		seat.picks.capital = answer.capital;
		seat.picks.civ = answer.civ;
		seat.picks.dealt = [...decision.mats];
		for (const civ of decision.civs) {
			if (civ !== answer.civ) {
				ctx.state.supply.civs.push(civ);
			}
		}
		emit(ctx.state, {
			type: 'capitalChosen',
			player,
			secret: { capital: answer.capital },
		});
		emit(ctx.state, {
			type: 'civChosen',
			player,
			secret: { civ: answer.civ },
		});
	},
};
