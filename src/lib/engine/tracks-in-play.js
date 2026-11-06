// The advancement tracks a game plays: the four of the main board, then the arts track when it is in play (#35, R118).
import { ARTS_TRACK, TRACK_IDS } from './data/ids.js';
import { artsTrackOn } from './data/tracks.js';

/**
 * Whether the arts track is in play in a game.
 * @param {{ expansions: readonly string[], variants: readonly string[] }} state
 * @returns {boolean}
 */
export function artsInPlay(state) {
	return artsTrackOn(state.expansions, state.variants);
}

/**
 * The tracks in play, in board order with the arts track last: what an effect that says "any track" or "each track"
 * offers (R118). A new list each call.
 * @param {{ expansions: readonly string[], variants: readonly string[] }} state
 * @returns {import('./data/ids.js').TrackId[]}
 */
export function tracksOf(state) {
	return artsInPlay(state) ? [...TRACK_IDS, ARTS_TRACK] : [...TRACK_IDS];
}
