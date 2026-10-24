// The restartToken effect: AI Singularity takes the token off its space and starts a token on any track (01 §3.4).
import { seatOf } from '../state.js';
import { TRACK_IDS } from '../data/ids.js';

/**
 * Asks which track gets the new token. The token on the source space must still be there.
 * @type {import('../state.js').EffectHandler}
 */
export function restartToken(ctx, player, value, op) {
	/** @type {{ track: import('../data/ids.js').TrackId, space: number } | undefined} */
	const source = op.source;
	if (!source) {
		throw new Error('restartToken needs the space it was gained from.');
	}
	const tokens = seatOf(ctx.state, player).tracks[source.track];
	if (!tokens.includes(source.space)) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseRestart',
			options: [...TRACK_IDS],
			source,
		},
	]);
}
