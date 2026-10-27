// The advancement tracks and the achievements as the board components take them, from a game view.
import { TRACKS, TIER_COSTS, TRACK_RESOURCE } from './engine/data/tracks.js';
import { LANDMARKS } from './engine/data/landmarks.js';
import { ACHIEVEMENTS } from './engine/data/achievements.js';

/** @typedef {import('./components/board/TrackBoard.svelte').TrackBoardTrack} TrackBoardTrack */
/** @typedef {import('./ui.js').Seat} Seat */
/** @typedef {import('./ui.js').TrackId} TrackId */
/** @typedef {import('./ui.js').CostSymbol} CostSymbol */

/**
 * The parts of a game view the board reads.
 * @typedef {Object} BoardView
 * @property {{ seat: number, kind: string, name: string, tracks: Record<string, number[]> }[]} seats
 * @property {string[]} landmarks - The unowned landmark ids
 * @property {Record<string, number[]>} achievements - The seats that claimed each achievement, in order
 * @property {'small' | 'large'} map
 */

/**
 * One achievement as the strip shows it.
 * @typedef {Object} AchievementEntry
 * @property {string} id
 * @property {string} name - The short name
 * @property {number | null} vp - The VP the next claimant gets, or null when every place is taken
 * @property {Seat[]} claimed - The seats that claimed it, in order
 */

/** @type {Record<TrackId, string>} */
const TRACK_NAMES = {
	exploration: 'Exploration',
	science: 'Science',
	technology: 'Technology',
	military: 'Military',
};

/** @type {Record<string, string>} */
const SHORT_NAMES = {
	'complete-track': 'Complete a track',
	'topple-two': 'Topple two outposts',
	'middle-island': 'Conquer the middle',
};

const LANDMARK_NAMES = new Map(LANDMARKS.map((l) => [l.id, l.name]));

/**
 * The four tracks for TrackBoard. Which spaces are available is drawn by TrackBoard's own prop.
 * @param {BoardView} view
 * @param {{ track: TrackId, space: number }[]} [available]
 * @returns {TrackBoardTrack[]}
 */
// eslint-disable-next-line no-unused-vars
export function trackBoard(view, available = []) {
	const unowned = new Set(view.landmarks);
	return /** @type {TrackId[]} */ (Object.keys(TRACKS)).map((track) => {
		const resource = TRACK_RESOURCE[track];
		return {
			id: track,
			name: TRACK_NAMES[track],
			spaces: TRACKS[track].slice(1).map((space) => {
				/** @type {{ name: string, landmark?: string }} */
				const entry = { name: space.name };
				if (space.landmark && unowned.has(space.landmark)) {
					entry.landmark =
						LANDMARK_NAMES.get(space.landmark) ?? space.landmark;
				}
				return entry;
			}),
			tiers: /** @type {(1 | 2 | 3 | 4)[]} */ ([1, 2, 3, 4]).map(
				(tier) => {
					const { track: own = 0, any = 0 } = TIER_COSTS[tier];
					/** @type {CostSymbol[]} */
					const symbols = [
						...Array(own).fill(resource),
						...Array(any).fill('any'),
					];
					return symbols;
				}
			),
			players: view.seats
				.filter((seat) => seat.kind === 'player')
				.map((seat) => ({
					seat: /** @type {Seat} */ (seat.seat),
					name: seat.name,
					position: Math.max(0, ...seat.tracks[track]),
				})),
		};
	});
}

/**
 * The three achievements, with who claimed each and what the next claimant gets.
 * @param {BoardView} view
 * @returns {AchievementEntry[]}
 */
export function achievements(view) {
	return ACHIEVEMENTS.map((achievement) => {
		const claimed = /** @type {Seat[]} */ (
			view.achievements[achievement.id] ?? []
		);
		return {
			id: achievement.id,
			name: SHORT_NAMES[achievement.id] ?? achievement.name,
			vp: achievement.vp[view.map][claimed.length] ?? null,
			claimed: [...claimed],
		};
	});
}
