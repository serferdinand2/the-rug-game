// The advancement tracks and the achievements as the board components take them, from a game view.
import { TRACKS, TIER_COSTS, TRACK_RESOURCE } from './engine/data/tracks.js';
import { LANDMARKS } from './engine/data/landmarks.js';
import { ACHIEVEMENTS } from './engine/data/achievements.js';
import { bonusOf } from './engine/game.js';
import { describeBonus, describeEffects } from './describe.js';
import { bonusGlyphs, spaceGlyphs } from './glyphs.js';

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
 * @property {string[]} variants - The table's variants, which can change a bonus's price (#53)
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
 * A space's benefit and its bonus in words, as the track's hover and the footer say them; an ordered space's effects
 * are joined by "then" (#59, #84).
 * @param {any} view - The game as view() gives it; the words read only its seats and variants, which it shares with the state
 * @param {TrackId} track
 * @param {number} space - 1–12
 * @returns {string}
 */
export function spaceWords(view, track, space) {
	const data = TRACKS[track][space];
	const benefit = describeEffects(data.benefit, {
		state: view,
		ordered: data.ordered,
	});
	const bonus = bonusOf(view, track, space);
	return bonus
		? `${benefit}. Bonus: ${describeBonus(bonus, { state: view })}.`
		: `${benefit}.`;
}

/**
 * A tier's price as symbols, the track's own resource before any resource of the player's choice (#86): what the
 * board shows above each tier and the footer beside a selected space.
 * @param {TrackId} track
 * @param {1 | 2 | 3 | 4} tier - A space's tier is `Math.ceil(space / 3)`
 * @returns {CostSymbol[]}
 */
export function tierSymbols(track, tier) {
	const { track: own = 0, any = 0 } = TIER_COSTS[tier];
	return [
		...Array(own).fill(TRACK_RESOURCE[track]),
		...Array(any).fill('any'),
	];
}

/**
 * The four tracks for TrackBoard. Which spaces are available is TrackBoard's own `available` prop.
 * @param {BoardView} view
 * @returns {TrackBoardTrack[]}
 */
export function trackBoard(view) {
	const unowned = new Set(view.landmarks);
	return /** @type {TrackId[]} */ (Object.keys(TRACKS)).map((track) => {
		return {
			id: track,
			name: TRACK_NAMES[track],
			spaces: TRACKS[track].slice(1).map((space) => {
				const bonus = bonusOf(
					/** @type {any} */ (view),
					track,
					space.space
				);
				/** @type {TrackBoardTrack['spaces'][number]} */
				const entry = {
					name: space.name,
					benefit: spaceGlyphs(space.benefit),
					bonus: bonusGlyphs(bonus),
					words: spaceWords(view, track, space.space),
				};
				if (space.landmark && unowned.has(space.landmark)) {
					entry.landmark =
						LANDMARK_NAMES.get(space.landmark) ?? space.landmark;
				}
				return entry;
			}),
			tiers: /** @type {(1 | 2 | 3 | 4)[]} */ ([1, 2, 3, 4]).map((tier) =>
				tierSymbols(track, tier)
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
