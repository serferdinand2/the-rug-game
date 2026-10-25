// The effects of single tapestry cards: Diplomacy, Dystopia, Age of Wonders, Plea for Aid, Technocracy,
// and the cards that move tokens, Dark Ages, Socialism, Dictatorship and Trade Economy (design §8).
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { advanceBlocked, opponents, triggered } from '../abilities.js';
import {
	benefitOps,
	isActivated,
	movableFroms,
	moveToken,
	spacesAdvanced,
	LAST_SPACE,
} from '../movement.js';
import { askTrack } from '../decisions/choose-track.js';
import { BUILDING_IDS, TRACK_IDS } from '../data/ids.js';
import { LANDMARKS } from '../data/landmarks.js';
import { TRACKS } from '../data/tracks.js';
import { building } from './building.js';
import { landmarksOwned } from './vp.js';

/** @typedef {import('../data/ids.js').TrackId} TrackId */

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

/**
 * Whether a player could advance on a track now: a token there can move forward, and the track isn't blocked (design §5).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {TrackId} track
 * @returns {boolean}
 */
function canAdvance(state, player, track) {
	return (
		!advanceBlocked(state, player, track) &&
		movableFroms(seatOf(state, player), track, 'advance').length > 0
	);
}

/**
 * Dark Ages: the player chooses the track to advance on, among those where they could advance,
 * or else among those where they have a token. One is taken without asking.
 * @type {import('../state.js').EffectHandler}
 */
export function darkAges(ctx, player) {
	const { state } = ctx;
	const seat = seatOf(state, player);
	const advanceable = TRACK_IDS.filter((track) =>
		canAdvance(state, player, track)
	);
	const options =
		advanceable.length > 0
			? advanceable
			: TRACK_IDS.filter((track) => seat.tracks[track].length > 0);
	askTrack(ctx, player, options, 'darkAges', { kind: 'darkAgesOn' });
}

/**
 * Dark Ages on its chosen track: regress once without benefit on each other track, where possible,
 * then advance 3 times without benefit on the chosen one, gaining landmarks (the F&F FAQ order).
 * @type {import('../state.js').AutomaticKind}
 */
export function darkAgesOn(ctx, op) {
	/** @type {TrackId} */
	const track = op.track;
	ctx.push([
		{
			player: op.player,
			kind: 'effects',
			effects: [
				...TRACK_IDS.filter((other) => other !== track).map(
					(other) => ({
						regress: { tracks: [other], noBenefit: true },
					})
				),
				...[1, 2, 3].map(() => ({
					advance: { tracks: [track], noBenefit: true },
				})),
			],
			ordered: true,
		},
	]);
}

/**
 * Socialism: one of the player's tokens jumps to the nearest opponent token ahead of it or behind it on the same track,
 * never one on its own space, without benefit or bonus. Ahead is left out on a blocked track (design §5).
 * A forward jump gains every landmark it passes (R9). A single jump is made without asking.
 * @type {import('../state.js').EffectHandler}
 */
export function socialism(ctx, player) {
	const { state } = ctx;
	const seat = seatOf(state, player);
	const rivals = opponents(state, player).map((other) =>
		seatOf(state, other)
	);
	/** @type {{ track: TrackId, from: number, to: number }[]} */
	const options = [];
	for (const track of TRACK_IDS) {
		const theirs = rivals.flatMap((rival) => rival.tracks[track]);
		const froms = [...new Set(seat.tracks[track])].sort((a, b) => a - b);
		for (const from of froms) {
			const ahead = theirs.filter((space) => space > from);
			const behind = theirs.filter((space) => space < from);
			if (ahead.length > 0 && !advanceBlocked(state, player, track)) {
				options.push({ track, from, to: Math.min(...ahead) });
			}
			if (behind.length > 0) {
				options.push({ track, from, to: Math.max(...behind) });
			}
		}
	}
	if (options.length === 0) {
		emit(state, { type: 'noMove', player });
		return;
	}
	if (options.length === 1) {
		moveToken(ctx, player, { ...options[0], benefit: false });
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseMove',
			direction: 'jump',
			options,
			benefit: false,
			optional: false,
		},
	]);
}

/**
 * Dictatorship: the player chooses a track they can advance on. With none, nothing happens and nothing is blocked (my call).
 * @type {import('../state.js').EffectHandler}
 */
export function dictatorship(ctx, player) {
	const options = TRACK_IDS.filter((track) =>
		canAdvance(ctx.state, player, track)
	);
	if (options.length === 0) {
		emit(ctx.state, { type: 'noMove', player });
		return;
	}
	askTrack(ctx, player, options, 'dictatorship', { kind: 'dictate' });
}

/**
 * Dictatorship on its chosen track: the player's opponents are blocked on it until turn order next reaches or skips
 * the player (R26), then the player advances on it with the benefit and may pay the bonus.
 * @type {import('../state.js').AutomaticKind}
 */
export function dictate(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	/** @type {TrackId} */
	const track = op.track;
	state.blocks.push({ player, track });
	emit(state, { type: 'trackBlocked', player, track });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ advance: { tracks: [track] } }],
			ordered: true,
		},
	]);
}

/**
 * Trade Economy: the player chooses an opponent's token on space 1 to 12 of any track, except a space the player
 * activated this turn (R19), and gains that space's benefit. One is taken without asking; with none, nothing.
 * @type {import('../state.js').EffectHandler}
 */
export function tradeEconomy(ctx, player) {
	const { state } = ctx;
	/** @type {{ player: number, track: TrackId, space: number }[]} */
	const options = [];
	for (const owner of opponents(state, player)) {
		const { tracks } = seatOf(state, owner);
		for (const track of TRACK_IDS) {
			const spaces = [...new Set(tracks[track])].sort((a, b) => a - b);
			for (const space of spaces) {
				if (space > 0 && !isActivated(state, player, track, space)) {
					options.push({ player: owner, track, space });
				}
			}
		}
	}
	if (options.length === 1) {
		tradeSpace(ctx, player, options[0]);
		return;
	}
	if (options.length > 1) {
		ctx.push([{ player, kind: 'chooseSpace', options }]);
	}
}

/**
 * Gains the benefit of an opponent's track space (Trade Economy), which activates the space for the player.
 * If the space has a bonus, its owner may take it for free.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ player: number, track: TrackId, space: number }} chosen - `player` owns the token there
 */
export function tradeSpace(ctx, player, { player: owner, track, space }) {
	const { state } = ctx;
	state.activated.push({ player, track, space });
	emit(state, { type: 'spaceActivated', player, track, space });
	const ops = benefitOps(state, player, track, space);
	if (TRACKS[track][space].bonus) {
		ops.push({ player: owner, kind: 'bonus', track, space, free: true });
	}
	ctx.push(ops);
}
