// Another player's tabs in the player area (#145, owner 2026-10-30): which seat shows, its words, and a guard that keeps private parts out.
import { seatName } from '../game-names.js';
import { countWords, possessive } from '../words.js';

/**
 * The words of the player area for the seat on show.
 * @typedef {Object} AreaWords
 * @property {boolean} own - The seat is the viewer's own
 * @property {string} name - The seat's player
 * @property {string} viewing - "Viewing Vera's area"
 * @property {string} tabs - The tab list's label: "Your city and cards" or "Vera's city and cards"
 * @property {string} eras - The Eras tab's heading
 * @property {string} tech - The Tech tab's heading
 * @property {string} handHeading - The Hand tab's heading
 * @property {(count: number) => string} hand - What the Hand tab says when it draws no cards
 * @property {string} capitalSoon - What the Capital tab says before the mat is dealt
 * @property {string} civSoon - What the Civ tab says before the civilization is chosen
 */

/**
 * The seat whose tabs show after a chip or a 1 to 5 key names one: that seat, or none (the viewer's own area) when it
 * is the viewer's or already on show.
 * @param {number | null} inspected - The seat on show now, other than the viewer's; null for the viewer's own
 * @param {number} chosen - The seat named
 * @param {number | null} viewer - The viewer's seat; null for the public view
 * @returns {number | null}
 */
export function nextInspected(inspected, chosen, viewer) {
	return chosen === viewer || chosen === inspected ? null : chosen;
}

/**
 * The seat whose tabs the player area draws.
 * @param {number | null} inspected
 * @param {number | null} viewer
 * @returns {number | null}
 */
export function shownSeat(inspected, viewer) {
	return inspected ?? viewer;
}

/**
 * A seat of the view as the player area may draw it: without its hand and picks unless it is the viewer's own. view()
 * already removes them; this guard keeps them out should a view ever hold them.
 * @param {any} seat - A player seat of the game view
 * @param {number | null} viewer
 * @returns {any} A copy, or the seat itself when it is the viewer's
 */
export function publicSeat(seat, viewer) {
	if (seat.seat === viewer) {
		return seat;
	}
	const copy = { ...seat, handCount: handCount(seat) };
	delete copy.hand;
	delete copy.picks;
	return copy;
}

/**
 * How many tapestry cards a seat holds.
 * @param {any} seat
 * @returns {number}
 */
export function handCount(seat) {
	return seat.handCount ?? seat.hand?.length ?? 0;
}

/**
 * The player area's words for a seat.
 * @param {any} game - The game view
 * @param {number} seat - The seat on show
 * @param {number | null} viewer
 * @returns {AreaWords}
 */
export function areaWords(game, seat, viewer) {
	const name = seatName(game, seat);
	if (seat === viewer) {
		return {
			own: true,
			name,
			viewing: '',
			tabs: 'Your city and cards',
			eras: 'Your eras',
			tech: 'Your technology',
			handHeading: 'Your hand',
			hand: () => 'No tapestry cards in hand.',
			capitalSoon: 'Your capital mat is dealt as the game starts.',
			civSoon: 'You choose your civilization as the game starts.',
		};
	}
	const theirs = possessive(name);
	return {
		own: false,
		name,
		viewing: `Viewing ${theirs} area`,
		tabs: `${theirs} city and cards`,
		eras: `${theirs} eras`,
		tech: `${theirs} technology`,
		handHeading: `${theirs} hand`,
		hand: (count) =>
			count === 0
				? `${name} holds no tapestry cards.`
				: `${name} holds ${countWords(count, 'tapestry card')}. A hand stays private.`,
		capitalSoon: `${theirs} capital mat is dealt as the game starts.`,
		civSoon: `${name} chooses a civilization as the game starts.`,
	};
}
