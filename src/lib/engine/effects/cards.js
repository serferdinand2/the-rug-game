// The effects of single tapestry cards: Diplomacy, Dystopia, Age of Wonders, Plea for Aid and Technocracy (design §8).
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { opponents, triggered } from '../abilities.js';
import { spacesAdvanced, LAST_SPACE } from '../movement.js';
import { BUILDING_IDS, TRACK_IDS } from '../data/ids.js';
import { LANDMARKS } from '../data/landmarks.js';
import { building } from './building.js';
import { landmarksOwned } from './vp.js';

/**
 * One income building of the player's choice among the types still on the income mat (Diplomacy).
 * One type left is taken without asking; none says so.
 * @type {import('../state.js').EffectHandler}
 */
export function anyBuilding(ctx, player, value, op) {
	const { buildings } = playerSeat(ctx.state, player).incomeMat;
	const left = BUILDING_IDS.filter((type) => buildings[type] > 0);
	if (left.length === 0) {
		emit(ctx.state, { type: 'noBuildingLeft', player, building: null });
		return;
	}
	if (left.length === 1) {
		building(ctx, player, left[0], op);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseOption',
			options: left.map((type) => [{ building: type }]),
			source: op.source,
		},
	]);
}

/**
 * Gains a track landmark nobody owns, places it, and fires its triggers (Dystopia).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} landmark
 */
export function gainTrackLandmark(ctx, player, landmark) {
	const { state } = ctx;
	state.landmarks.splice(state.landmarks.indexOf(landmark), 1);
	emit(state, { type: 'landmarkGained', player, landmark });
	ctx.push([
		{ player, kind: 'placeLandmark', landmark },
		...triggered(state, 'landmarkGained', {
			player,
			landmark,
			fromTrack: true,
		}),
	]);
}

/**
 * The track landmarks nobody owns, in `LANDMARKS` order.
 * @param {import('../state.js').State} state
 * @returns {string[]}
 */
export function freeTrackLandmarks(state) {
	return LANDMARKS.filter(
		(landmark) =>
			'track' in landmark.source && state.landmarks.includes(landmark.id)
	).map((landmark) => landmark.id);
}

/**
 * Gains any track landmark nobody owns (Dystopia). One is taken without asking; with none, nothing (02 §3).
 * @type {import('../state.js').EffectHandler}
 */
export function trackLandmark(ctx, player) {
	const options = freeTrackLandmarks(ctx.state);
	if (options.length === 0) {
		emit(ctx.state, { type: 'noLandmarkLeft', player, landmark: null });
		return;
	}
	if (options.length === 1) {
		gainTrackLandmark(ctx, player, options[0]);
		return;
	}
	ctx.push([{ player, kind: 'chooseLandmark', options }]);
}

/**
 * Compares landmarks owned with every opponent (Age of Wonders): fewer than all runs `fewest`, more than all
 * runs `most`, anything else (ties, or no opponent) runs `otherwise`.
 * @type {import('../state.js').EffectHandler}
 */
export function landmarkRank(ctx, player, value) {
	const mine = landmarksOwned(playerSeat(ctx.state, player)).length;
	const theirs = opponents(ctx.state, player).map(
		(other) => landmarksOwned(playerSeat(ctx.state, other)).length
	);
	let list = value.otherwise;
	if (theirs.length > 0 && theirs.every((count) => mine < count)) {
		list = value.fewest;
	} else if (theirs.length > 0 && theirs.every((count) => mine > count)) {
		list = value.most;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(list),
			ordered: true,
		},
	]);
}

/**
 * For each track where the player's best token is behind every token of every other seat: 2 VP and 1 any resource (Plea for Aid).
 * A restarted track counts as 12 (FAQ #9).
 * @type {import('../state.js').EffectHandler}
 */
export function pleaForAid(ctx, player) {
	const { state } = ctx;
	const me = seatOf(state, player);
	const rivals = state.seats.filter((seat) => seat.seat !== player);
	const n =
		rivals.length === 0
			? 0
			: TRACK_IDS.filter((track) =>
					rivals.every((seat) =>
						seat.restartedTracks.includes(track)
							? spacesAdvanced(me, track) < LAST_SPACE
							: seat.tracks[track].every(
									(space) => spacesAdvanced(me, track) < space
								)
					)
				).length;
	if (n === 0) {
		return;
	}
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ vp: 2 * n }, { gain: { any: n } }],
			ordered: true,
		},
	]);
}

/**
 * Invents and upgrades that card when nobody else has started this era, otherwise 3 VP per opponent (Technocracy).
 * @type {import('../state.js').EffectHandler}
 */
export function technocracy(ctx, player) {
	const { state } = ctx;
	const mine = seatOf(state, player).incomeTurns;
	const first = state.seats.every(
		(seat) => seat.seat === player || seat.incomeTurns < mine
	);
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: first
				? [{ invent: { thenUpgrade: true } }]
				: [{ vp: { per: 'opponent', each: 3 } }],
			ordered: true,
		},
	]);
}
