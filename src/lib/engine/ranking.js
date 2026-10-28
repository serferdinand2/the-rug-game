// The final ranking: players by VP, ties broken by the table version's chain, every step recorded (R10–R13).
import { VERSIONS, RESOURCE_IDS } from './data/ids.js';
import { HEIGHT_RANKING } from './data/landmarks.js';

/** @typedef {import('./state.js').Seat | import('./state.js').PlayerSeat} AnySeat */

/**
 * One player's place. Players still tied after every step share a place, and the next place skips (1, 1, 3).
 * @typedef {{ seat: number, place: number, vp: number }} Placing
 */

/**
 * One tiebreak step: what it compared, and the value of every player it compared.
 * @typedef {{ by: 'tallestLandmark' | 'resources', values: { seat: number, value: string | number | null }[] }} TiebreakStep
 */

/**
 * How the game ended: every player's place, and how each group tied on VP was split.
 * @typedef {{ ranking: Placing[], ties: { vp: number, seats: number[], steps: TiebreakStep[] }[] }} Result
 */

/**
 * The landmarks on a seat's capital city grid: each covers at least 1 grid plot (R13).
 * @param {AnySeat} seat
 * @returns {string[]}
 */
export function landmarksInCity(seat) {
	return 'capital' in seat
		? seat.capital.landmarks.map((p) => p.landmark)
		: [];
}

/**
 * The tallest landmark in a seat's capital city (R11, R12: the first in HEIGHT_RANKING), or null with none.
 * @param {AnySeat} seat
 * @returns {string | null}
 */
function tallestLandmark(seat) {
	const ranks = landmarksInCity(seat)
		.map((id) => HEIGHT_RANKING.indexOf(id))
		.filter((rank) => rank !== -1);
	return ranks.length > 0 ? HEIGHT_RANKING[Math.min(...ranks)] : null;
}

/**
 * The resources a seat holds, all four together.
 * @param {AnySeat} seat
 * @returns {number}
 */
function resourcesHeld(seat) {
	return 'resources' in seat
		? RESOURCE_IDS.reduce((sum, id) => sum + seat.resources[id], 0)
		: 0;
}

/**
 * A seat's value for each tiebreak step, as the ranking compares them, for the scoreboard during play (#128). It
 * reads only public fields, so it takes a seat of a view too.
 * @param {AnySeat} seat
 * @returns {{ tallestLandmark: string | null, resources: number }}
 */
export function tiebreakValues(seat) {
	return {
		tallestLandmark: tallestLandmark(seat),
		resources: resourcesHeld(seat),
	};
}

/**
 * A seat's value for a tiebreak step, and how good it is (higher is better).
 * @param {'tallestLandmark' | 'resources'} by
 * @param {AnySeat} seat
 * @returns {{ value: string | number | null, score: number }}
 */
function tiebreakValue(by, seat) {
	if (by === 'tallestLandmark') {
		// R11, R12: the tallest is first in the ranking; any landmark beats none.
		const tallest = tallestLandmark(seat);
		return tallest === null
			? { value: null, score: -Infinity }
			: { value: tallest, score: -HEIGHT_RANKING.indexOf(tallest) };
	}
	const total = resourcesHeld(seat);
	return { value: total, score: total };
}

/**
 * Splits players into groups with equal scores, best first; each group keeps seat order.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => number} score
 * @returns {T[][]}
 */
function groupBy(items, score) {
	const scores = [...new Set(items.map(score))].sort((a, b) => b - a);
	return scores.map((s) => items.filter((item) => score(item) === s));
}

/**
 * Ranks every seat: by VP, then each group tied on VP through the version's tiebreak chain (R10, R11).
 * Every step a tie used is recorded with the values it compared, so the result can explain each tie.
 * @param {import('./state.js').State} state
 * @returns {Result}
 */
export function rankPlayers(state) {
	const version = VERSIONS.find((v) => v.id === state.version);
	if (!version) {
		throw new Error(`Unknown version ${state.version}.`);
	}
	const chain = /** @type {('tallestLandmark' | 'resources')[]} */ (
		version.tiebreak.filter((step) => step !== 'vp')
	);
	/** @type {Result['ties']} */
	const ties = [];

	/**
	 * Breaks a group's tie from one step of the chain on; returns its subgroups, best first.
	 * @param {AnySeat[]} group
	 * @param {number} at
	 * @param {TiebreakStep[]} steps
	 * @returns {AnySeat[][]}
	 */
	const split = (group, at, steps) => {
		if (group.length === 1 || at >= chain.length) {
			return [group];
		}
		const by = chain[at];
		const scored = group.map((seat) => ({
			seat,
			...tiebreakValue(by, seat),
		}));
		steps.push({
			by,
			values: scored.map(({ seat, value }) => ({
				seat: seat.seat,
				value,
			})),
		});
		return groupBy(scored, (s) => s.score).flatMap((sub) =>
			split(
				sub.map((s) => s.seat),
				at + 1,
				steps
			)
		);
	};

	/** @type {Placing[]} */
	const ranking = [];
	for (const group of groupBy(state.seats, (seat) => seat.vp)) {
		/** @type {AnySeat[][]} */
		let places = [group];
		if (group.length > 1) {
			/** @type {TiebreakStep[]} */
			const steps = [];
			places = split(group, 0, steps);
			ties.push({
				vp: group[0].vp,
				seats: group.map((s) => s.seat),
				steps,
			});
		}
		for (const shared of places) {
			const place = ranking.length + 1;
			for (const seat of shared) {
				ranking.push({ seat: seat.seat, place, vp: seat.vp });
			}
		}
	}
	return { ranking, ties };
}
