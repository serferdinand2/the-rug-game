// The decision for AI Singularity: which track's start gets the token taken off the technology track.
import { PlayerError } from '../errors.js';
import { emit } from '../events.js';
import { seatOf } from '../state.js';

/** @type {import('../state.js').DecisionKind} */
export const chooseRestart = {
	hidden: [],
	answers(state, decision) {
		return decision.options.map((/** @type {string} */ track) => ({
			track,
		}));
	},
	check(state, decision, answer) {
		if (!decision.options.includes(answer.track)) {
			throw new PlayerError('Choose the track to start your token on.');
		}
	},
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const { track: from, space } = decision.source;
		const seat = seatOf(ctx.state, player);
		const tokens =
			seat.tracks[/** @type {import('../data/ids.js').TrackId} */ (from)];
		tokens.splice(tokens.indexOf(space), 1);
		// The track still counts as complete, with 12 spaces advanced (FAQ #9).
		if (!seat.restartedTracks.includes(from)) {
			seat.restartedTracks.push(from);
		}
		seat.tracks[
			/** @type {import('../data/ids.js').TrackId} */ (answer.track)
		].push(0);
		emit(ctx.state, {
			type: 'tokenRestarted',
			player,
			from,
			to: answer.track,
		});
	},
};
