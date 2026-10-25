// The decision of which opponent (and track) the active THIS ERA ability names (Alliance, Marriage of State).
import { PlayerError } from '../errors.js';
import { setPartner } from '../effects/tapestry.js';

/** @typedef {import('../effects/tapestry.js').Partner} Partner */

/** @type {import('../state.js').DecisionKind} */
export const choosePartner = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {Partner} */ o) => ({ ...o }));
	},
	check(state, decision, answer) {
		if (!offered(decision, answer)) {
			throw new PlayerError('Choose one of the opponents offered.');
		}
	},
	resolve(ctx, decision, answer) {
		setPartner(
			ctx,
			/** @type {number} */ (decision.player),
			/** @type {Partner} */ (offered(decision, answer))
		);
	},
};

/**
 * The option an answer names: the same opponent, and the same track or none.
 * @param {import('../state.js').Operation} decision
 * @param {import('../state.js').Answer} answer
 * @returns {Partner | undefined}
 */
function offered(decision, answer) {
	return decision.options.find(
		(/** @type {Partner} */ o) =>
			o.player === answer.player && o.track === answer.track
	);
}
