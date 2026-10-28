// The game's hotkeys (#83): which action a key asks for on the game screen, given what the screen can do now.

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
 * @typedef {{ type: 'income' | 'incomeConfirm' | 'advance' | 'confirm' | 'undo' | 'log' | 'help' | 'keys' | 'cancel' }
 *   | { type: 'track', track: TrackId }
 *   | { type: 'board', board: 'tracks' | 'map' }
 *   | { type: 'tab', tab: string }
 *   | { type: 'player', seat: number }
 *   | { type: 'turn', step: 1 | -1 }} HotkeyAction
 */

/** The tracks in the board's order, which the track question numbers from 1; the arts track (#35) will be 5. */
export const TRACK_KEYS = Object.freeze(
	/** @type {TrackId[]} */ ([
		'exploration',
		'science',
		'technology',
		'military',
	])
);

/** The player tabs in order, on the keyboard's top row (owner). */
const TAB_KEYS = Object.freeze({
	q: 'capital',
	w: 'hand',
	e: 'income',
	r: 'eras',
	t: 'civ',
	y: 'tech',
	u: 'terrain',
});

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
	if (key === 'Escape') {
		return confirming || asking ? { type: 'cancel' } : null;
	}
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
	if (key === ',' || key === '.') {
		return exploring ? { type: 'turn', step: key === '.' ? 1 : -1 } : null;
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
