// The advance and regress effects: one space forward or back on one of the listed tracks, with that space's benefit.
import { seatOf } from '../state.js';
import { LAST_SPACE, movableFroms, moveToken } from '../movement.js';
import { advanceBlocked } from '../abilities.js';

/**
 * Moves one of a player's tokens one space on one of `value.tracks`. Mandatory unless `optional`: a single possible
 * move is made without asking, and with none nothing happens. An optional move always asks while there is one (Oil Magnate).
 * Landing on the start gains nothing. A blocked track is left out of an advance (design §5); regressing is never blocked.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ tracks: import('../data/ids.js').TrackId[], noBenefit?: boolean, optional?: boolean, freeBonus?: boolean, noBonus?: boolean, offTrackVp?: number }} value - `noBenefit`
 *   is the X: landmarks are still gained, but no benefit or bonus. `freeBonus` offers the bonus for free instead (Renaissance).
 *   `noBonus` gives the benefit without the bonus (Leaders). `offTrackVp` is the VP an advance gives instead when every
 *   token on every listed track is on space 12 and none of them is blocked (Alchemists)
 * @param {'advance' | 'regress'} direction
 */
function moveOnOneOf(ctx, player, value, direction) {
	const seat = seatOf(ctx.state, player);
	const benefit = !value.noBenefit;
	const optional = value.optional ?? false;
	const freeBonus = value.freeBonus ?? false;
	const noBonus = value.noBonus ?? false;
	const options = value.tracks
		.filter(
			(track) =>
				direction === 'regress' ||
				!advanceBlocked(ctx.state, player, track)
		)
		.flatMap((track) =>
			movableFroms(seat, track, direction).map((from) => ({
				track,
				from,
			}))
		);
	if (options.length === 0) {
		if (
			direction === 'advance' &&
			value.offTrackVp &&
			offTrack(ctx.state, player, value.tracks)
		) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ vp: value.offTrackVp }],
				},
			]);
		}
		return;
	}
	if (options.length === 1 && !optional) {
		const [{ track, from }] = options;
		const to = direction === 'advance' ? from + 1 : from - 1;
		moveToken(ctx, player, {
			track,
			from,
			to,
			benefit,
			freeBonus,
			noBonus,
		});
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseMove',
			direction,
			options,
			benefit,
			optional,
			...(freeBonus && { freeBonus: true }),
			...(noBonus && { noBonus: true }),
		},
	]);
}

/**
 * Whether a player's every token on every one of the tracks is on space 12, and none of the tracks is blocked for them.
 * A track whose token AI Singularity took off has no token left, so it counts as finished (as for Alien Biology, #54).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {import('../data/ids.js').TrackId[]} tracks
 * @returns {boolean}
 */
function offTrack(state, player, tracks) {
	const seat = seatOf(state, player);
	return tracks.every(
		(track) =>
			!advanceBlocked(state, player, track) &&
			seat.tracks[track].every((space) => space === LAST_SPACE)
	);
}

/**
 * Advance 1 space on one of the listed tracks, with its benefit and optional bonus (Physics, Quantum Physics).
 * @type {import('../state.js').EffectHandler}
 */
export function advance(ctx, player, value) {
	moveOnOneOf(ctx, player, value, 'advance');
}

/**
 * Go back 1 space on one of the listed tracks, then gain that space's benefit and optional bonus (Neuroscience).
 * @type {import('../state.js').EffectHandler}
 */
export function regress(ctx, player, value) {
	moveOnOneOf(ctx, player, value, 'regress');
}
