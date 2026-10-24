// Tokens on the tracks: how far a seat has advanced.

/** @typedef {import('./data/ids.js').TrackId} TrackId */

/** The last space of every track (01 §3.7). */
export const LAST_SPACE = 12;

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
