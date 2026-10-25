// Tokens on the tracks: moving them, the landmark race, activating a space, and how far a seat has advanced.
import { emit } from './events.js';
import { seatOf } from './state.js';
import { triggered } from './abilities.js';
import { claimAchievement } from './achievements.js';
import { TRACKS } from './data/tracks.js';

/** @typedef {import('./data/ids.js').TrackId} TrackId */

/** The last space of every track (01 §3.7). */
export const LAST_SPACE = 12;

/** The first space of tiers II, III and IV, where the landmarks sit (01 §3.1). */
const TIER_FIRST_SPACES = [4, 7, 10];

/**
 * Spaces a seat has advanced on a track: its most advanced token, or 12 when AI Singularity took the token off (FAQ #9).
 * @param {import('./state.js').Seat} seat
 * @param {TrackId} track
 * @returns {number}
 */
export function spacesAdvanced(seat, track) {
	if (seat.restartedTracks.includes(track)) {
		return LAST_SPACE;
	}
	return Math.max(0, ...seat.tracks[track]);
}

/**
 * The spaces of a seat's tokens on a track that can move one space that way, each space once.
 * @param {import('./state.js').Seat} seat
 * @param {TrackId} track
 * @param {'advance' | 'regress'} direction
 * @returns {number[]}
 */
export function movableFroms(seat, track, direction) {
	const froms = seat.tracks[track].filter((space) =>
		direction === 'advance' ? space < LAST_SPACE : space > 0
	);
	return [...new Set(froms)].sort((a, b) => a - b);
}

/**
 * Whether a player has activated a track space this turn (R19).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {TrackId} track
 * @param {number} space
 * @returns {boolean}
 */
export function isActivated(state, player, track, space) {
	return state.activated.some(
		(a) => a.player === player && a.track === track && a.space === space
	);
}

/**
 * The operations for gaining a track space's benefit: the benefit, then the triggers of a gained benefit (design §6).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {TrackId} track
 * @param {number} space
 * @returns {import('./state.js').NewOperation[]}
 */
export function benefitOps(state, player, track, space) {
	const entry = TRACKS[track][space];
	return [
		{
			player,
			kind: 'effects',
			effects: structuredClone(entry.benefit),
			ordered: entry.ordered,
			source: { track, space },
		},
		...triggered(state, 'benefitGained', { player, track, space }),
	];
}

/**
 * Activates a track space for a player: records it and returns the operations for its benefit, the triggers of
 * a gained benefit, and its bonus. Returns none for the start, or for a space the player already activated this turn (R19, FAQ #5).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {TrackId} track
 * @param {number} space
 * @returns {import('./state.js').NewOperation[]}
 */
export function activationOps(ctx, player, track, space) {
	const { state } = ctx;
	if (space === 0 || isActivated(state, player, track, space)) {
		return [];
	}
	state.activated.push({ player, track, space });
	emit(state, { type: 'spaceActivated', player, track, space });
	const ops = benefitOps(state, player, track, space);
	if (TRACKS[track][space].bonus) {
		ops.push({ player, kind: 'bonus', track, space });
	}
	return ops;
}

/**
 * Moves one of a seat's tokens and pushes what follows, in the order of FAQ #1: landmarks, then the benefit, then the bonus.
 * Moving forward gains every still-available landmark whose tier starts in (from, to], lowest first (R9);
 * moving back gains none. Without `benefit` (the X), the landmarks are still gained.
 * Each landmark's triggers follow its placement, and a forward move's triggers come before the benefit (design §6).
 * With `freeBonus` and no benefit (Renaissance), the bonus of the space reached is offered for free, unless the
 * player already activated that space this turn; offering it activates the space (R19).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {{ track: TrackId, from: number, to: number, benefit: boolean, freeBonus?: boolean }} move
 */
export function moveToken(
	ctx,
	player,
	{ track, from, to, benefit, freeBonus = false }
) {
	const { state } = ctx;
	const tokens = seatOf(state, player).tracks[track];
	const index = tokens.indexOf(from);
	if (index === -1) {
		throw new Error(`Seat ${player} has no token on ${track} ${from}.`);
	}
	tokens[index] = to;
	emit(state, { type: 'tokenMoved', player, track, from, to });
	if (to === LAST_SPACE) {
		claimAchievement(ctx, player, 'complete-track');
	}
	/** @type {import('./state.js').NewOperation[]} */
	const ops = [];
	// Landmark spaces reached or passed whose landmark someone already owned (Revisionism).
	let claimedPassed = 0;
	for (const first of TIER_FIRST_SPACES) {
		const landmark = TRACKS[track][first].landmark;
		if (from >= first || first > to || !landmark) {
			continue;
		}
		if (!state.landmarks.includes(landmark)) {
			claimedPassed += 1;
			continue;
		}
		state.landmarks.splice(state.landmarks.indexOf(landmark), 1);
		emit(state, { type: 'landmarkGained', player, landmark, track });
		ops.push(
			{ player, kind: 'placeLandmark', landmark },
			...triggered(state, 'landmarkGained', {
				player,
				landmark,
				fromTrack: true,
			})
		);
	}
	if (to > from) {
		ops.push(
			...triggered(state, 'advanced', {
				player,
				track,
				from,
				to,
				claimedPassed,
			})
		);
	}
	if (benefit) {
		ops.push(...activationOps(ctx, player, track, to));
	} else if (
		freeBonus &&
		TRACKS[track][to].bonus &&
		!isActivated(state, player, track, to)
	) {
		state.activated.push({ player, track, space: to });
		ops.push({ player, kind: 'bonus', track, space: to, free: true });
	}
	ctx.push(ops);
}
