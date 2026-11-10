// The decision of which track space Déjà Vu copies or Temporal Nomadism goes back to, or Déjà Vu's VP instead (#40).
import { PlayerError } from '../errors.js';
import { trackSpacePicked } from '../effects/ff-cards.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseTrackSpace = {
	hidden: [],
	answers(state, decision) {
		return [
			...(decision.vp !== undefined ? [{ vp: true }] : []),
			...decision.options.map(
				(/** @type {{ track: string, space: number }} */ o) => ({
					track: o.track,
					space: o.space,
				})
			),
		];
	},
	check(state, decision, answer) {
		const offered = chooseTrackSpace
			.answers(state, decision)
			.some((a) =>
				a.vp
					? answer.vp === true &&
						answer.track === undefined &&
						answer.space === undefined
					: answer.vp === undefined &&
						a.track === answer.track &&
						a.space === answer.space
			);
		if (!offered) {
			throw new PlayerError('Choose one of the track spaces offered.');
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		if (answer.vp === true) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ vp: decision.vp }],
					source: decision.source,
				},
			]);
			return;
		}
		trackSpacePicked(ctx, player, decision.purpose, {
			track: answer.track,
			space: answer.space,
		});
	},
};
