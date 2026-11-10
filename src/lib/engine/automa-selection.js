// Pure base-bot track selection: unfinished tracks, nearest targets and opposite card tiebreak orders (02 §9.4).
import { TRACK_IDS } from './data/ids.js';
import { TRACKS } from './data/tracks.js';
import { LAST_SPACE, spacesAdvanced } from './movement.js';
import { seatOf } from './state.js';

/** @typedef {import('./data/ids.js').BoardTrackId} BoardTrackId */
/** @typedef {import('./data/automa-cards.js').AutomaTrackIndicator} AutomaTrackIndicator */

/**
 * The tracks an indicator permits, in board-track order (02 §9.4). ALL permits
 * every unfinished track; END minimizes distance to its end; LMK minimizes
 * distance to an unclaimed landmark or the end, whichever is nearer.
 * An unclaimed landmark at the token's current space has distance zero; only
 * landmarks behind it are excluded. Arts and additional blocking policies are
 * outside these base-card indicators (R59).
 * @param {import('./state.js').State} state
 * @param {number} seat - The bot's seat number, not an array index
 * @param {AutomaTrackIndicator} indicator
 * @returns {BoardTrackId[]} Empty when every track is complete
 */
export function validBotTracks(state, seat, indicator) {
	const bot = seatOf(state, seat);
	const tracks = TRACK_IDS.filter(
		(track) => spacesAdvanced(bot, track) < LAST_SPACE
	);
	if (indicator === 'ALL' || tracks.length === 0) {
		return tracks;
	}
	const distances = tracks.map((track) => {
		const current = spacesAdvanced(bot, track);
		let distance = LAST_SPACE - current;
		if (indicator === 'LMK') {
			for (const entry of TRACKS[track]) {
				if (
					entry.space >= current &&
					entry.landmark &&
					state.landmarks.includes(entry.landmark)
				) {
					distance = Math.min(distance, entry.space - current);
				}
			}
		}
		return { track, distance };
	});
	const nearest = Math.min(...distances.map((entry) => entry.distance));
	return distances
		.filter((entry) => entry.distance === nearest)
		.map((entry) => entry.track);
}

/**
 * Resolves valid-track ties using the tiebreaker card: top to bottom for Automa,
 * bottom to top for Shadow Empire. Each heart means this seat's favourite;
 * neither the shared card nor the game state is changed (02 §9.4).
 * @param {import('./state.js').State} state
 * @param {number} seat - The acting bot's seat number
 * @param {AutomaTrackIndicator} indicator - From the track card
 * @param {Pick<import('./data/automa-cards.js').AutomaCard, 'trackTiebreakers'>} card - The tiebreaker card
 * @param {'automa' | 'shadow'} kind - Which direction reads the printed list
 * @returns {BoardTrackId | null} Null when no unfinished track is available
 */
export function selectBotTrack(state, seat, indicator, card, kind) {
	const valid = validBotTracks(state, seat, indicator);
	const bot =
		/** @type {import('./state.js').BotSeat & {favouriteTrack: BoardTrackId}} */ (
			seatOf(state, seat)
		);
	const tiebreakers =
		kind === 'shadow'
			? [...card.trackTiebreakers].reverse()
			: card.trackTiebreakers;
	for (const tiebreaker of tiebreakers) {
		const track =
			tiebreaker === 'favourite' ? bot.favouriteTrack : tiebreaker;
		if (valid.includes(track)) {
			return track;
		}
	}
	return null;
}
