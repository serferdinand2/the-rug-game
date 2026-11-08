// The advancement tracks and the achievements as the board components take them, from a game view.
import { TRACKS, TIER_COSTS, TRACK_RESOURCE } from './engine/data/tracks.js';
import { ACHIEVEMENTS } from './engine/data/achievements.js';
import { bonusOf, spacesAdvanced } from './engine/game.js';
import { tracksOf } from './engine/tracks-in-play.js';
import { describeBonus, describeEffects } from './describe.js';
import { achievementName, landmarkName, trackName } from './game-names.js';
import { bonusGlyphs, spaceGlyphs } from './glyphs.js';

/** @typedef {import('./components/board/TrackBoard.svelte').TrackBoardTrack} TrackBoardTrack */
/** @typedef {import('./ui.js').Seat} Seat */
/** @typedef {import('./ui.js').TrackId} TrackId */
/** @typedef {import('./ui.js').PriceSymbol} PriceSymbol */

/**
 * The parts of a game view the board reads.
 * @typedef {Object} BoardView
 * @property {{ seat: number, kind: string, name: string, tracks: Record<string, number[]> }[]} seats
 * @property {string[]} landmarks - The unowned landmark ids
 * @property {Record<string, number[]>} achievements - The seats that claimed each achievement, in order
 * @property {'small' | 'large'} map
 * @property {string[]} variants - The table's variants, which can change a bonus's price (#53)
 * @property {string[]} [expansions] - The table's expansions: with Arts & Architecture, the arts track is in play unless a variant leaves it out (#35)
 */

/**
 * One achievement as the strip shows it.
 * @typedef {Object} AchievementEntry
 * @property {string} id
 * @property {string} name - The short name
 * @property {number | null} vp - The VP the next claimant gets, or null when every place is taken
 * @property {Seat[]} claimed - The seats that claimed it, in order
 */

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
 * The arts track's prices (03 §2.2): any 1, then 2 different, any 3, and 2 of the same type, each mark after its two
 * any-resource icons (owner, #35 part 4).
 * @type {Readonly<Record<1 | 2 | 3 | 4, PriceSymbol[]>>}
 */
const ARTS_PRICES = Object.freeze({
	1: ['any'],
	2: ['any', 'any', 'different'],
	3: ['any', 'any', 'any'],
	4: ['any', 'any', 'same'],
});

/**
 * A tier's price as symbols, the track's own resource before any resource of the player's choice (#86): what the
 * board shows above each tier and the footer beside a selected space. The arts track's marks follow its icons.
 * @param {TrackId} track
 * @param {1 | 2 | 3 | 4} tier - A space's tier is the engine's `tierOf(space)`
 * @returns {PriceSymbol[]}
 */
export function tierSymbols(track, tier) {
	if (track === 'arts') {
		return [...ARTS_PRICES[tier]];
	}
	const { track: own = 0, any = 0 } = TIER_COSTS[tier];
	return [
		...Array(own).fill(TRACK_RESOURCE[track]),
		...Array(any).fill('any'),
	];
}

/**
 * The tracks a game view plays, in board order: the four, then the arts track with Arts & Architecture unless a
 * variant leaves it out (#35). A view without expansions plays the four.
 * @param {{ expansions?: readonly string[], variants?: readonly string[] }} view
 * @returns {TrackId[]}
 */
export function boardTracks(view) {
	return tracksOf({
		expansions: view.expansions ?? [],
		variants: view.variants ?? [],
	});
}

/** The tiers, from the engine's tier prices. */
const TIERS = /** @type {(1 | 2 | 3 | 4)[]} */ (
	Object.keys(TIER_COSTS).map(Number)
);

/**
 * The tracks in play for TrackBoard: the four, then the arts track with Arts & Architecture (#35). Which spaces are
 * available is TrackBoard's own `available` prop.
 * @param {BoardView} view
 * @returns {TrackBoardTrack[]}
 */
export function trackBoard(view) {
	const unowned = new Set(view.landmarks);
	return boardTracks(view).map((track) => {
		return {
			id: track,
			name: trackName(track),
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
					entry.landmark = landmarkName(space.landmark);
				}
				return entry;
			}),
			tiers: TIERS.map((tier) => tierSymbols(track, tier)),
			players: view.seats
				.filter((seat) => seat.kind === 'player')
				.map((seat) => ({
					seat: /** @type {Seat} */ (seat.seat),
					name: seat.name,
					// The most advanced token, or 12 on a track AI Singularity took it off (#147, FAQ #9, R109).
					position: spacesAdvanced(/** @type {any} */ (seat), track),
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
			name: achievementName(achievement.id),
			vp: achievement.vp[view.map][claimed.length] ?? null,
			claimed: [...claimed],
		};
	});
}
