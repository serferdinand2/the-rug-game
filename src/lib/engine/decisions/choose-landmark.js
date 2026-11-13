// The decision to pick a track landmark nobody owns (Dystopia).
import { PlayerError } from '../errors.js';
import { gainTrackLandmark } from '../effects/cards.js';
import { emit } from '../events.js';
import { triggered } from '../abilities.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseLandmark = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ landmark) => ({
			landmark,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.landmark)) {
			throw new PlayerError('Choose one of the landmarks offered.');
		}
	},
	resolve(ctx, decision, answer) {
		if (decision.purpose === 'timeTravelers') {
			const player = /** @type {number} */ (decision.player);
			const bot = /** @type {any} */ (
				ctx.state.seats.find(
					(seat) =>
						seat.kind === 'automa' &&
						/** @type {any} */ (
							/** @type {any} */ (seat).civilization ===
								'time-travelers' ||
								/** @type {any} */ (seat).secondCivilization ===
									'time-travelers'
						)
				)
			);
			if (!bot)
				throw new PlayerError(
					'The Time Travelers are not in this game.'
				);
			const at = ctx.state.landmarks.indexOf(answer.landmark);
			if (at < 0)
				throw new PlayerError('That landmark is no longer available.');
			ctx.state.landmarks.splice(at, 1);
			bot.timeTravelersLandmark = answer.landmark;
			emit(ctx.state, {
				type: 'landmarkGained',
				player,
				landmark: answer.landmark,
			});
			ctx.push([
				{ player, kind: 'placeLandmark', landmark: answer.landmark },
				...triggered(ctx.state, 'landmarkGained', {
					player,
					landmark: answer.landmark,
					fromTrack: false,
				}),
			]);
			return;
		}
		gainTrackLandmark(
			ctx,
			/** @type {number} */ (decision.player),
			answer.landmark
		);
	},
};
