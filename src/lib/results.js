// The results screen and the scoreboard (#29 design §5–§6): the standings, shared places, each tie step by step, VP by source and the table's facts, from a game view.
import { VERSIONS, tiebreakValues } from './engine/game.js';
import {
	civilizationOf,
	landmarkName,
	seatName,
	variantName,
	versionName,
} from './game-names.js';
import { countWords, joinList, ordinal } from './words.js';
import { expansionBadges } from './lobby.js';

/** @typedef {import('./engine/stack.js').VpSource} VpSource */
/** @typedef {import('./ui.js').Seat} Seat */

/**
 * Where VP came from, in the order the breakdown lists them, with the end-screen mockup's words where it has them.
 * @type {readonly { id: VpSource, label: string }[]}
 */
export const VP_SOURCES = Object.freeze([
	{ id: 'income', label: 'Income turn scoring' },
	{ id: 'tracks', label: 'Advancement rewards' },
	{ id: 'tapestry', label: 'Tapestry effects' },
	{ id: 'civ', label: 'Civilization abilities' },
	{ id: 'map', label: 'Exploring and conquering' },
	{ id: 'tech', label: 'Tech cards' },
	{ id: 'capital', label: 'Capital city' },
	{ id: 'achievements', label: 'Achievements' },
	{ id: 'other', label: 'Other' },
	{ id: 'paid', label: 'VP paid' },
]);

/** The words for each tiebreak step. */
const STEP_TITLES = /** @type {Readonly<Record<string, string>>} */ ({
	tallestLandmark: 'Tallest landmark in the capital',
	resources: 'Resources left',
});

/**
 * One source of a seat's VP.
 * @typedef {{ id: VpSource, label: string, vp: number }} SourceLine
 */

/**
 * One player's line in the final standings.
 * @typedef {Object} StandingRow
 * @property {Seat} seat
 * @property {string} name
 * @property {string} civ - Their first civilization's name, or 'Setting up' without one
 * @property {number} place - 1 for the winners; a shared place repeats and the next one skips
 * @property {number} vp
 * @property {boolean} winner
 * @property {SourceLine[]} sources - Adding up to `vp`
 */

/**
 * One tie the ranking split, explained.
 * @typedef {Object} TieExplanation
 * @property {number} vp - The VP they tied on
 * @property {string} intro - Who tied, and that the rules decide
 * @property {{ title: string, values: { seat: number, name: string, value: string, landmark: boolean }[], separates: boolean }[]} steps
 * @property {string} outcome - Who came first, or who shares the place
 */

/**
 * A seat's VP by source, in VP_SOURCES order, without the sources that gave nothing.
 * @param {{ vpSources?: Record<string, number> }} seat
 * @returns {SourceLine[]}
 */
export function vpBreakdown(seat) {
	const sources = seat.vpSources ?? {};
	return VP_SOURCES.flatMap(({ id, label }) =>
		sources[id] ? [{ id, label, vp: sources[id] }] : []
	);
}

/**
 * The engine's final ranking, from the state or its gameEnded event.
 * @param {any} game
 * @returns {{ ranking: { seat: number, place: number, vp: number }[], ties: { vp: number, seats: number[], steps: { by: string, values: { seat: number, value: string | number | null }[] }[] }[] } | null}
 */
function resultOf(game) {
	return (
		game.result ??
		game.events?.findLast((/** @type {any} */ e) => e.type === 'gameEnded')
			?.result ??
		null
	);
}

/**
 * The final standings, best first, from the engine's ranking: never scored again here.
 * @param {any} game - The game as view() gives it, once over
 * @returns {StandingRow[]}
 */
export function standings(game) {
	const result = resultOf(game);
	if (!result) {
		return [];
	}
	return result.ranking.map(({ seat, place, vp }) => {
		const player = game.seats[seat - 1];
		return {
			seat: /** @type {Seat} */ (seat),
			name: seatName(game, seat),
			civ: civilizationOf(player ?? {}),
			place,
			vp,
			winner: place === 1,
			sources: vpBreakdown(player ?? {}),
		};
	});
}

/**
 * Each tie the ranking split, step by step, as the owner asked (#15): who tied, each step's values, whether it
 * separated them, and the outcome.
 * @param {any} game
 * @returns {TieExplanation[]}
 */
export function tieExplanations(game) {
	const result = resultOf(game);
	if (!result) {
		return [];
	}
	return result.ties.map((tie) => {
		const names = tie.seats.map((seat) => seatName(game, seat));
		const both = tie.seats.length === 2 ? 'both' : 'all';
		const intro = `${joinList(names)} ${both} finished on ${tie.vp} VP. Under the ${versionName(game.version).toLowerCase()}, the tiebreaks decide their order.`;
		const steps = tie.steps.map((step) => ({
			title: STEP_TITLES[step.by] ?? step.by,
			values: step.values.map(({ seat, value }) => ({
				seat,
				name: seatName(game, seat),
				value:
					step.by === 'tallestLandmark'
						? value === null
							? 'No landmark'
							: landmarkName(String(value))
						: countWords(/** @type {number} */ (value), 'resource'),
				landmark: step.by === 'tallestLandmark' && value !== null,
			})),
			separates: new Set(step.values.map((v) => v.value)).size > 1,
		}));
		const places = result.ranking.filter((p) => tie.seats.includes(p.seat));
		const best = Math.min(...places.map((p) => p.place));
		const first = places.filter((p) => p.place === best);
		const outcome =
			first.length > 1
				? `${joinList(first.map((p) => seatName(game, p.seat)))} share ${ordinal(best)} place.`
				: `${seatName(game, first[0].seat)} takes ${ordinal(best)} place.`;
		return { vp: tie.vp, intro, steps, outcome };
	});
}

/**
 * The viewer's result, or the winners' when the view belongs to no seat (a hot-seat table's public view).
 * @param {any} game
 * @param {number | null} seat
 * @returns {{ title: string, place: string, vp: number, outcome: string }}
 */
export function yourResult(game, seat) {
	const rows = standings(game);
	const winners = rows.filter((row) => row.winner);
	const shared = winners.length > 1;
	const winnerNames = joinList(winners.map((row) => row.name));
	const won = shared
		? `${winnerNames} share the victory.`
		: `${winnerNames} won this table.`;
	const own = rows.find((row) => row.seat === seat);
	if (!own) {
		return {
			title: shared ? 'The winners' : 'The winner',
			place: shared ? 'Shared 1st' : '1st',
			vp: winners[0]?.vp ?? 0,
			outcome: won,
		};
	}
	const others = winners.filter((row) => row.seat !== seat);
	return {
		title: 'Your result',
		place: own.winner && shared ? 'Shared 1st' : ordinal(own.place),
		vp: own.vp,
		outcome: own.winner
			? shared
				? `You share the victory with ${joinList(others.map((row) => row.name))}.`
				: 'You won this table.'
			: won,
	};
}

/**
 * The note under the standings: how places were decided.
 * @param {any} game
 * @returns {string}
 */
export function ruleNote(game) {
	const shared = standings(game).filter((row) => row.winner).length > 1;
	return shared
		? 'A tie remaining after every applicable step is a shared victory. The next place skips: 1st, 1st, 3rd.'
		: 'Places follow final VP. A tied score is resolved by the selected rules version’s tie-break chain.';
}

/**
 * The table's facts for the results: the rules, the mode with the number of players, and the expansions and
 * variants by name (#53).
 * @param {{ mode: string, game: any }} room
 * @returns {{ rules: string, mode: string, expansions: { name: string, color: string }[], variants: string[] }}
 */
export function tableFacts(room) {
	const { game } = room;
	const players = game.seats.filter(
		(/** @type {any} */ s) => s.kind === 'player'
	).length;
	return {
		rules: versionName(game.version),
		mode: `${room.mode === 'hotseat' ? 'Hot-seat' : 'Online'} · ${players} players`,
		expansions: expansionBadges(game.expansions),
		// The lobby's short names, as the table was set up with them.
		variants: (game.variants ?? []).map((/** @type {string} */ id) =>
			variantName(id)
		),
	};
}

/**
 * One player's line on the scoreboard during play.
 * @typedef {Object} ScoreRow
 * @property {Seat} seat
 * @property {string} name
 * @property {string} civ
 * @property {number} place - By VP alone; equal VP share a place
 * @property {number} vp
 * @property {SourceLine[]} sources
 * @property {number} resources - The resources held, the last tiebreak
 * @property {string | null} [landmark] - The tallest landmark in the capital, for the current rules' tiebreak only
 * @property {TiebreakPart[]} tiebreak - The tiebreak values as one line, such as "Tallest landmark: Skyscraper · 7 resources" (#104)
 */

/**
 * A piece of a scoreboard row's tiebreak line; a landmark's name is marked so it can be drawn in gold.
 * @typedef {{ text: string, landmark: boolean }} TiebreakPart
 */

/**
 * The tiebreak line of a scoreboard row: the tallest landmark under the current rules, then the resources.
 * @param {string | null | undefined} landmark - Undefined when the table's rules don't compare landmarks
 * @param {number} resources
 * @returns {TiebreakPart[]}
 */
export function tiebreakLine(landmark, resources) {
	const held = countWords(resources, 'resource');
	if (landmark === undefined) {
		return [{ text: held, landmark: false }];
	}
	if (landmark === null) {
		return [{ text: `Tallest landmark: none · ${held}`, landmark: false }];
	}
	return [
		{ text: 'Tallest landmark: ', landmark: false },
		{ text: landmark, landmark: true },
		{ text: ` · ${held}`, landmark: false },
	];
}

/**
 * The scoreboard during play: the players by VP, with where it came from and the tiebreak values of the version.
 * @param {any} game
 * @returns {ScoreRow[]}
 */
export function scoreboard(game) {
	const players = game.seats
		.filter((/** @type {any} */ s) => s.kind === 'player')
		.slice()
		.sort((/** @type {any} */ a, /** @type {any} */ b) => b.vp - a.vp);
	const usesLandmark = (
		VERSIONS.find((v) => v.id === game.version)?.tiebreak ?? []
	).includes('tallestLandmark');
	return players.map((/** @type {any} */ seat) => {
		// The engine's own values, so the scoreboard and the final ranking compare the same things (#128).
		const values = tiebreakValues(seat);
		/** @type {ScoreRow} */
		const row = {
			seat: seat.seat,
			name: seat.name,
			civ: civilizationOf(seat),
			place:
				1 +
				players.filter((/** @type {any} */ o) => o.vp > seat.vp).length,
			vp: seat.vp,
			sources: vpBreakdown(seat),
			resources: values.resources,
			tiebreak: [],
		};
		if (usesLandmark) {
			row.landmark =
				values.tallestLandmark === null
					? null
					: landmarkName(values.tallestLandmark);
		}
		row.tiebreak = tiebreakLine(row.landmark, row.resources);
		return row;
	});
}
