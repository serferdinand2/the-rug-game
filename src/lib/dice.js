// The dice tray's rolls (#61 design §4): which fresh events roll which dice, the faces they land on, and the words for them.
import { BLACK_DIE, RED_DIE, SCIENCE_DIE } from './engine/data/dice.js';
import { eventText } from './log.js';

/** How long the dice tumble, in milliseconds: the tray waits this long before a roll lands, and Die animates for it (#119). */
export const TUMBLE_MS = 1000;

/** @typedef {'science' | 'red' | 'black'} DieId */

/**
 * One die of a roll, and the face it lands on: an index into its face list.
 * @typedef {Object} RolledDie
 * @property {DieId} die
 * @property {number} face
 */

/**
 * One roll, as the tray plays it.
 * @typedef {Object} Roll
 * @property {string} id - The event's seq, unique within a game
 * @property {number} player - Who rolled
 * @property {RolledDie[]} dice - In the order they are drawn
 * @property {string} caption - Who rolls and why, such as 'Vera rolls the conquer dice'
 * @property {string} spoken - The result, read once to screen readers, in the log's words
 * @property {boolean} bust - An Alchemists roll that went bust
 */

/**
 * What a face shows: a track's symbol, VP in words, a resource's icon, or the territory tile's benefit ("?").
 * @typedef {{ kind: 'track', id: string } | { kind: 'vp', words: string } | { kind: 'resource', id: string } | { kind: 'tile' }} FaceArt
 */

/** The verb and what is rolled, for each kind of roll. */
const ROLLED = /** @type {Readonly<Record<string, string>>} */ ({
	scienceDieRolled: 'the science die',
	conquerDiceRolled: 'the conquer dice',
	alchemistsRolled: 'for the Alchemists',
	alchemistsBust: 'for the Alchemists',
});

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isRecord(value) {
	return typeof value === 'object' && value !== null;
}

/**
 * The science die's face for a track: the first of its three.
 * @param {unknown} track
 * @returns {number}
 */
function scienceFace(track) {
	return Math.max(0, SCIENCE_DIE.indexOf(/** @type {any} */ (track)));
}

/**
 * The dice an event rolls, or none for an event that rolls nothing.
 * @param {Record<string, any>} event
 * @returns {RolledDie[]}
 */
function diceOf(event) {
	switch (event.type) {
		case 'scienceDieRolled':
		case 'alchemistsRolled':
		case 'alchemistsBust':
			return [{ die: 'science', face: scienceFace(event.track) }];
		case 'conquerDiceRolled':
			return [
				{ die: 'red', face: Number(event.red) || 0 },
				{ die: 'black', face: Number(event.black) || 0 },
			];
		default:
			return [];
	}
}

/**
 * The rolls in a batch of fresh events, in event order.
 * @param {any[]} events - Fresh events, as the store keeps them (#29)
 * @param {any} game - The viewer's view, for the seats' names
 * @param {number | null} viewer - The viewer's seat; their own roll reads "You roll"
 * @returns {Roll[]}
 */
export function rollsOf(events, game, viewer) {
	if (!Array.isArray(events)) {
		return [];
	}
	return events.flatMap((event) => {
		if (!isRecord(event) || !Object.hasOwn(ROLLED, event.type)) {
			return [];
		}
		const player = Number(event.player);
		const name =
			game?.seats?.find((/** @type {any} */ s) => s.seat === player)
				?.name ??
			game?.seats?.[player - 1]?.name ??
			'A player';
		const who = player === viewer ? 'You roll' : `${name} rolls`;
		const bust = event.type === 'alchemistsBust';
		return [
			{
				id: String(event.seq),
				player,
				dice: diceOf(event),
				caption: `${who} ${ROLLED[event.type]}${bust ? ' and busts' : ''}`,
				spoken: eventText(event, game) ?? '',
				bust,
			},
		];
	});
}

/**
 * What a die's face shows.
 * @param {DieId} die
 * @param {number} face - An index into the die's faces
 * @returns {FaceArt}
 */
export function faceOf(die, face) {
	if (die === 'science') {
		return { kind: 'track', id: SCIENCE_DIE[face] };
	}
	if (die === 'red') {
		const vp = /** @type {any} */ (RED_DIE[face])?.vp;
		return {
			kind: 'vp',
			words: typeof vp === 'number' ? `${vp} VP` : '1 VP / territory',
		};
	}
	const gain = /** @type {any} */ (BLACK_DIE[face])?.gain;
	return isRecord(gain)
		? { kind: 'resource', id: Object.keys(gain)[0] }
		: { kind: 'tile' };
}
