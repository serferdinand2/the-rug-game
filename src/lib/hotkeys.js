// The game's hotkeys (#83): which action a key asks for on the game screen, given what the screen can do now.
import { TRACK_IDS } from './engine/data/ids.js';

/** @typedef {import('./ui.js').TrackId} TrackId */

/**
 * What the game screen can do when the key is pressed.
 * @typedef {Object} HotkeyContext
 * @property {boolean} [canIncome] - The viewer's turn choice offers income, with nothing over the board
 * @property {boolean} [canAdvance] - The viewer can pay for some advance now
 * @property {boolean} [canUndo] - Undo is allowed
 * @property {boolean} [confirming] - The footer asks "Take an income turn?"
 * @property {boolean} [asking] - The footer asks "Advance on which track?"
 * @property {readonly TrackId[]} [tracks] - The tracks with a space the viewer can pay for, for the track question
 * @property {number} [players] - How many players there are, for 1 to 5
 * @property {'tracks' | 'map'} [board] - The board on show
 * @property {boolean} [exploring] - An explore's tile can be turned
 */

/**
 * The action a key asks for.
 * @typedef {{ type: 'income' | 'incomeConfirm' | 'advance' | 'confirm' | 'undo' | 'log' | 'help' | 'keys' }
 *   | { type: 'track', track: TrackId }
 *   | { type: 'board', board: 'tracks' | 'map' }
 *   | { type: 'tab', tab: string }
 *   | { type: 'player', seat: number }
 *   | { type: 'turn', step: 1 | -1 }} HotkeyAction
 */

/**
 * What the screen knows about a key press, read from the event and its target (#88).
 * @typedef {Object} KeyFacts
 * @property {string} key - KeyboardEvent.key
 * @property {boolean} modified - Ctrl, Alt or Cmd is held, for a browser shortcut
 * @property {boolean} taken - A component already handled it
 * @property {boolean} typing - It was typed into a field or editable text
 * @property {boolean} inMenu - It was pressed in an open menu
 * @property {boolean} inModal - It was pressed in a modal dialog
 * @property {boolean} onControl - It was pressed on a control rather than the page, where Enter presses that control
 */

/** The engine's tracks in board order, which the track question numbers from 1; the arts track (#35) will be 5. */
export const TRACK_KEYS = TRACK_IDS;

/** The player tabs in order, on the keyboard's top row (owner); shortcuts.js lists them from here. */
export const TAB_KEYS = Object.freeze({
	q: 'capital',
	w: 'hand',
	e: 'income',
	r: 'eras',
	t: 'civ',
	y: 'tech',
	u: 'terrain',
});

/** The keys that turn an explore's tile, and a landmark being placed (#83): back and forward; shortcuts.js and the turn controls name them from here. */
export const TURN_KEYS = Object.freeze({ back: ',', forward: '.' });

/**
 * The action a key asks for, or null when it asks for nothing now. The caller has already left out keys typed into a
 * field, pressed with Ctrl, Alt or Cmd, or handled by a component.
 * @param {string} key - KeyboardEvent.key
 * @param {HotkeyContext} context
 * @returns {HotkeyAction | null}
 */
export function hotkeyAction(key, context) {
	const {
		canIncome = false,
		canAdvance = false,
		canUndo = false,
		confirming = false,
		asking = false,
		tracks = [],
		players = 0,
		board = 'tracks',
		exploring = false,
	} = context;
	if (key === 'Enter') {
		return confirming ? { type: 'incomeConfirm' } : { type: 'confirm' };
	}
	if (/^[1-5]$/.test(key)) {
		const number = Number(key);
		if (asking) {
			const track = TRACK_KEYS[number - 1];
			return track && tracks.includes(track)
				? { type: 'track', track }
				: null;
		}
		return number <= players ? { type: 'player', seat: number } : null;
	}
	if (key === TURN_KEYS.back || key === TURN_KEYS.forward) {
		return exploring
			? { type: 'turn', step: key === TURN_KEYS.forward ? 1 : -1 }
			: null;
	}
	const letter = key.toLowerCase();
	if (Object.hasOwn(TAB_KEYS, letter)) {
		return {
			type: 'tab',
			tab: TAB_KEYS[/** @type {keyof typeof TAB_KEYS} */ (letter)],
		};
	}
	switch (letter) {
		case 'i':
			if (confirming) {
				return { type: 'incomeConfirm' };
			}
			return canIncome ? { type: 'income' } : null;
		case 'a':
			return canAdvance ? { type: 'advance' } : null;
		case 'z':
			return canUndo ? { type: 'undo' } : null;
		case 'm':
			return { type: 'board', board: board === 'map' ? 'tracks' : 'map' };
		case 'l':
			return { type: 'log' };
		case 'h':
			return { type: 'help' };
		case 'k':
			return { type: 'keys' };
		default:
			return null;
	}
}

/**
 * Whether the game screen takes a key at all (#88). A modifier, a component, a field, a menu or a modal keeps its keys,
 * Escape included; How to play and Table settings keep every key but Escape, which closes the layer on top; Enter on
 * a control presses that control.
 * @param {KeyFacts} facts
 * @param {import('./layers.js').Layers} layers
 * @returns {boolean}
 */
export function hotkeyGate(facts, layers) {
	if (
		facts.modified ||
		facts.taken ||
		facts.typing ||
		facts.inMenu ||
		facts.inModal
	) {
		return false;
	}
	if (facts.key === 'Escape') {
		return true;
	}
	if (layers.rules || layers.settings) {
		return false;
	}
	return !(facts.key === 'Enter' && facts.onControl);
}
