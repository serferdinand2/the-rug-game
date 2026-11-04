// The dice tray's rolls (#61 design §4): which fresh events roll which dice, the faces they land on, and the words for them.
import { BLACK_DIE, RED_DIE, SCIENCE_DIE } from './engine/data/dice.js';
import { eventText } from './log.js';
import { seatName } from './game-names.js';

/** How long the dice tumble, in milliseconds: the tray waits this long before a roll lands, and Die animates for it (#119). */
export const TUMBLE_MS = 1600;

/** How many other faces a die shows as it tumbles, before its rolled face. */
const FLIPS = 12;

/** When a tumbling die lands on its rolled face, as a share of the tumble; it rocks on that face after. */
const LANDS_AT = 0.7;

/** How the flips slow down: above 1, each waits longer than the one before. */
const SLOWING = 1.6;

/** @typedef {'science' | 'red' | 'black'} DieId */

/**
 * One die of a roll, and the face it lands on: an index into its face list.
 * @typedef {Object} RolledDie
 * @property {DieId} die
 * @property {number} face
 */

/**
 * One face a tumbling die shows, and when.
 * @typedef {Object} TumbleStep
 * @property {number} at - Milliseconds into the tumble
 * @property {number} face - An index into the die's faces
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
	surrenderRolled: 'the conquer dice for Surrender',
	alchemistsRolled: 'for the Alchemists',
	alchemistsBust: 'for the Alchemists',
	treasureRolled: 'for the Treasure Hunters',
});

/** The dice a Treasure Hunters treasure rolls (#33): one die twice, or both conquer dice once, red first. */
const TREASURE_DICE = /** @type {Readonly<Record<string, DieId[]>>} */ ({
	black: ['black', 'black'],
	red: ['red', 'red'],
	science: ['science', 'science'],
	conquer: ['red', 'black'],
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
		case 'surrenderRolled':
			return [
				{ die: 'red', face: Number(event.red) || 0 },
				{ die: 'black', face: Number(event.black) || 0 },
			];
		case 'treasureRolled': {
			const faces = Array.isArray(event.faces) ? event.faces : [];
			const dice = Object.hasOwn(TREASURE_DICE, event.die)
				? TREASURE_DICE[event.die]
				: [];
			return dice.map((die, i) => ({
				die,
				face: Number(faces[i]) || 0,
			}));
		}
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
		const name = seatName(game, player);
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
 * A die's faces that look different, one index each: the science die's 4 tracks, each conquer die's 5 faces.
 * @param {DieId} die
 * @returns {number[]}
 */
function distinctFaces(die) {
	const count = die === 'science' ? SCIENCE_DIE.length : RED_DIE.length;
	/** @type {string[]} */
	const seen = [];
	/** @type {number[]} */
	const faces = [];
	for (let face = 0; face < count; face++) {
		const art = JSON.stringify(faceOf(die, face));
		if (!seen.includes(art)) {
			seen.push(art);
			faces.push(face);
		}
	}
	return faces;
}

/**
 * The faces a die shows as it tumbles: other faces, quick at first and slowing, never the same twice in a row, then
 * the one it rolled. The same die, face and seed always tumble alike; a different seed tumbles otherwise, so two dice
 * in the tray don't flip in step. It is only for show, so it needs no injected randomness.
 * @param {DieId} die
 * @param {number} face - The face it lands on
 * @param {number} [seed=0]
 * @returns {TumbleStep[]}
 */
export function tumbleOf(die, face, seed = 0) {
	const faces = distinctFaces(die);
	const landing = JSON.stringify(faceOf(die, face));
	let shown = Math.max(
		0,
		faces.findIndex(
			(index) => JSON.stringify(faceOf(die, index)) === landing
		)
	);
	// A small linear congruential generator, seeded by the die, the face and the seed.
	let state =
		(Math.imul(seed + 1, 2654435761) ^ Math.imul(face + 1, 40503)) >>> 0;
	const next = () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return state / 2 ** 32;
	};
	const landsAt = Math.round(TUMBLE_MS * LANDS_AT);
	/** @type {TumbleStep[]} */
	const steps = [{ at: landsAt, face }];
	for (let flip = FLIPS - 1; flip >= 0; flip--) {
		shown =
			(shown + 1 + Math.floor(next() * (faces.length - 1))) %
			faces.length;
		steps.unshift({
			at: Math.round(landsAt * (flip / FLIPS) ** SLOWING),
			face: faces[shown],
		});
	}
	return steps;
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
