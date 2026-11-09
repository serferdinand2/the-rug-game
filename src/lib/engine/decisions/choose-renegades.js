// The Renegades' question on an advance whose tier matches their next space: the track space's benefit, or the Renegades' space instead (A&A, #37; 03 §2.4).
import { PlayerError } from '../errors.js';
import { activationOps } from '../movement.js';
import { renegadesAdvance } from '../civs/renegades.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseRenegades = {
	hidden: [],
	answers() {
		return [{ renegades: false }, { renegades: true }];
	},
	check(state, decision, answer) {
		if (typeof answer.renegades !== 'boolean') {
			throw new PlayerError('Choose the benefit or the Renegades space.');
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		if (answer.renegades) {
			// Its benefit and bonus are forgone (Jamey, 03 §2.4); the landmarks came already.
			renegadesAdvance(ctx, player);
			return;
		}
		ctx.push(
			activationOps(
				ctx,
				player,
				decision.track,
				decision.space,
				decision.bonus !== false,
				decision.free === true
			)
		);
	},
};
