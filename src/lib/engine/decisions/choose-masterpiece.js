// The decision of which masterpiece fires next: at the start of an income turn, for Broadcast or for Streaming Implants (#35, 03 §2.2–2.3).
import { PlayerError } from '../errors.js';
import { fireChosen } from '../masterpieces.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseMasterpiece = {
	hidden: [],
	// The options were read when it was asked (masterpieceOptions). Streaming Implants may stop: "up to 3".
	answers(state, decision) {
		return [
			...(decision.purpose === 'implants' ? [{ card: null }] : []),
			...decision.options.map(
				(/** @type {{ seat: number, card: string }} */ o) => ({
					seat: o.seat,
					card: o.card,
				})
			),
		];
	},
	check(state, decision, answer) {
		if (answer.card === null && decision.purpose === 'implants') {
			return;
		}
		const offered = decision.options.some(
			(/** @type {{ seat: number, card: string }} */ o) =>
				o.seat === answer.seat && o.card === answer.card
		);
		if (!offered) {
			throw new PlayerError('Choose one of the masterpieces offered.');
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.card === null) {
			return;
		}
		fireChosen(ctx, /** @type {any} */ (decision), {
			seat: answer.seat,
			card: answer.card,
		});
	},
};
