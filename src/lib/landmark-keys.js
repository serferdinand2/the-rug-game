// A landmark piece's keys and words (#111): what a key asks of a LandmarkPiece, its label and its control titles, from the keys How to play lists.
import { TURN_KEYS } from './hotkeys.js';

/** @typedef {'tray' | 'placed' | 'locked'} LandmarkPieceState */

/**
 * What a key asks of a landmark piece.
 * @typedef {{ type: 'move', row: -1 | 0 | 1, col: -1 | 0 | 1 }
 *   | { type: 'select' | 'rotate' | 'confirm' | 'return' }} LandmarkKeyAction
 */

/**
 * The modifier keys held with a key press, as a KeyboardEvent has them.
 * @typedef {Object} KeyModifiers
 * @property {boolean} [altKey]
 * @property {boolean} [ctrlKey]
 * @property {boolean} [metaKey]
 * @property {boolean} [shiftKey]
 */

/** The arrow keys as row and column steps, in the order How to play lists them. */
export const MOVE_KEYS = Object.freeze(
	/** @type {Record<string, readonly [-1 | 0 | 1, -1 | 0 | 1]>} */ ({
		ArrowLeft: [0, -1],
		ArrowUp: [-1, 0],
		ArrowRight: [0, 1],
		ArrowDown: [1, 0],
	})
);

/** The keys that turn a placed piece: the explore's turn keys, forward first (#83). */
export const ROTATE_KEYS = Object.freeze(
	/** @type {string[]} */ ([TURN_KEYS.forward, TURN_KEYS.back])
);

/** The key that locks a placed piece where it is. */
export const CONFIRM_KEY = 'Enter';

/** The keys that send a placed piece back to the tray. */
export const RETURN_KEYS = Object.freeze(['Backspace', 'Delete']);

/** How the arrow keys are shown. @type {Readonly<Record<string, string>>} */
const KEY_SYMBOLS = Object.freeze({
	ArrowLeft: '←',
	ArrowUp: '↑',
	ArrowRight: '→',
	ArrowDown: '↓',
});

/** How the turn keys are said in a sentence. @type {Readonly<Record<string, string>>} */
const KEY_WORDS = Object.freeze({ '.': 'full stop', ',': 'comma' });

/**
 * A key as How to play and the titles show it: an arrow as its symbol, any other key as it is.
 * @param {string} key - KeyboardEvent.key
 * @returns {string}
 */
export function keyName(key) {
	return KEY_SYMBOLS[key] ?? key;
}

/**
 * A control's title: its word and the keys that do the same, such as "Rotate (. or ,)".
 * @param {string} word
 * @param {readonly string[]} keys
 * @returns {string}
 */
function keyTitle(word, keys) {
	return `${word} (${keys.map(keyName).join(' or ')})`;
}

/** The titles of a placed piece's rotate, confirm and return controls; the return control names Delete only. */
export const LANDMARK_TITLES = Object.freeze({
	rotate: keyTitle('Rotate', ROTATE_KEYS),
	confirm: keyTitle('Confirm', [CONFIRM_KEY]),
	return: keyTitle('Return', [RETURN_KEYS[1]]),
});

/**
 * What a key pressed on a landmark piece asks for, or null for nothing. An arrow moves it, in the tray (onto the grid)
 * and on the grid; Space selects it, and so does Enter in the tray; on the grid Enter confirms it, the turn keys
 * rotate it and Backspace and Delete return it. A locked piece takes no keys, and Ctrl, Alt and Cmd are the browser's.
 * @param {string} key - KeyboardEvent.key
 * @param {LandmarkPieceState} state
 * @param {KeyModifiers} [modifiers]
 * @returns {LandmarkKeyAction | null}
 */
export function landmarkKeyAction(key, state, modifiers = {}) {
	if (
		state === 'locked' ||
		modifiers.altKey ||
		modifiers.ctrlKey ||
		modifiers.metaKey
	) {
		return null;
	}
	if (Object.hasOwn(MOVE_KEYS, key)) {
		const [row, col] = MOVE_KEYS[key];
		return { type: 'move', row, col };
	}
	if (key === ' ' || (key === CONFIRM_KEY && state === 'tray')) {
		return { type: 'select' };
	}
	if (state !== 'placed') {
		return null;
	}
	if (key === CONFIRM_KEY) {
		return { type: 'confirm' };
	}
	if (ROTATE_KEYS.includes(key)) {
		return { type: 'rotate' };
	}
	if (RETURN_KEYS.includes(key)) {
		return { type: 'return' };
	}
	return null;
}

/**
 * A landmark piece's label: its name and plots, and on the grid the keys that move, turn, lock and return it.
 * @param {string} name - Such as 'Lighthouse'
 * @param {number} plots - The plots it covers
 * @param {LandmarkPieceState} state
 * @returns {string}
 */
export function landmarkLabel(name, plots, state) {
	if (state === 'tray') {
		return `${name}, ${plots} plots, to be placed`;
	}
	if (state === 'locked') {
		return `${name}, locked in place`;
	}
	const rotate = ROTATE_KEYS.map((key) => KEY_WORDS[key] ?? key).join(' or ');
	return `${name}, ${plots} plots, not confirmed. Arrow keys move it, ${rotate} rotates it, ${CONFIRM_KEY} confirms it, ${RETURN_KEYS[1]} returns it`;
}
