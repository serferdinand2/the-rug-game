// The game's hotkeys, for How to play's Keyboard shortcuts tab (#42, #83): one list, so a new key is added here and
// nowhere else; src/lib/hotkeys.js maps the keys to actions, and the track, tab and turn keys are listed from its own (#127),
// the landmark piece's from src/lib/landmark-keys.js (#111).
import { TAB_KEYS, TRACK_KEYS, TURN_KEYS } from './hotkeys.js';
import { TRACK_IDS } from './engine/data/ids.js';
import {
	CONFIRM_KEY,
	MOVE_KEYS,
	RETURN_KEYS,
	keyName,
} from './landmark-keys.js';
import { TABS } from './area/tabs.js';
import { trackName } from './game-names.js';
import { joinList } from './words.js';

/**
 * One shortcut: the keys of each way to press it, pressed together, and what it does.
 * @typedef {Object} Shortcut
 * @property {string[][]} keys - Each alternative, such as [['R'], ['Shift', 'R']]
 * @property {string} action - What it does, one sentence
 */

/**
 * The shortcuts of one part of the game.
 * @typedef {Object} ShortcutGroup
 * @property {string} title
 * @property {Shortcut[]} shortcuts
 */

/**
 * The shortcuts for a table's tracks: the track keys answer 1–4, or 1–5 with the arts track (#35).
 * @param {readonly import('./ui.js').TrackId[]} tracks - The tracks in play, in board order
 * @returns {readonly ShortcutGroup[]}
 */
export function shortcutGroups(tracks) {
	const keyed = TRACK_KEYS.filter((track) => tracks.includes(track));
	return Object.freeze([
		{
			title: 'Your turn',
			shortcuts: [
				{
					keys: [['I']],
					action: 'Take income: the footer asks first, and I or Enter again takes it.',
				},
				{
					keys: [['A']],
					action: 'Advance: the footer asks which track.',
				},
				{
					keys: [[`1–${keyed.length}`]],
					action: `Then answer it: ${joinList(
						keyed.map(
							(track, at) => `${at + 1} ${trackName(track)}`
						),
						'or'
					)}.`,
				},
				{
					keys: [['Enter']],
					action: 'Confirm the open decision, or Advance on the space you selected.',
				},
				{
					keys: [['Z']],
					action: 'Undo your last choice, when the table allows it.',
				},
				{
					keys: [['Esc']],
					action: 'Cancel the question in the footer, or close what is open, one thing at a time.',
				},
			],
		},
		{
			title: 'The board and the players',
			shortcuts: [
				{
					keys: [['M']],
					action: 'Go to the World Map, and back to the tracks.',
				},
				{
					keys: [['V']],
					action: 'Minimize the question to look at the board, and bring it back.',
				},
				{
					keys: [['1–5']],
					action: "Show that player's tabs in your player area, as their chip does; the same key or your own goes back.",
				},
				{
					keys: [['Tab']],
					action: 'Hold it to see the log and scores; a tap still moves the focus.',
				},
				{
					keys: [['L']],
					action: 'Open or close the log and scores.',
				},
			],
		},
		{
			title: 'Your player area',
			shortcuts: Object.entries(TAB_KEYS).map(([key, tab]) => ({
				keys: [[key.toUpperCase()]],
				action: `${TABS.find((t) => t.id === tab)?.label ?? tab}.`,
			})),
		},
		{
			title: 'Exploring and placing',
			shortcuts: [
				{
					keys: [[TURN_KEYS.back], [TURN_KEYS.forward]],
					action: "Turn the explore's territory tile back or forward, or turn the landmark you are placing.",
				},
				{
					keys: Object.keys(MOVE_KEYS).map((key) => [keyName(key)]),
					action: 'Move the landmark you are placing one plot.',
				},
				{
					keys: [[CONFIRM_KEY]],
					action: 'Place the landmark where it is.',
				},
				{
					keys: RETURN_KEYS.map((key) => [key]),
					action: 'Take it off the capital again.',
				},
			],
		},
		{
			title: 'Help',
			shortcuts: [
				{ keys: [['H']], action: 'How to play.' },
				{ keys: [['K']], action: 'These keyboard shortcuts.' },
			],
		},
	]);
}

/** The shortcuts for the four tracks of the main board, as a table without the arts track has them. */
export const SHORTCUTS = shortcutGroups(TRACK_IDS);
