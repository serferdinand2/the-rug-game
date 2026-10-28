// The game's hotkeys, for How to play's Keyboard shortcuts tab (#42, #83): one list, so a new key is added here and
// nowhere else; src/lib/hotkeys.js maps the keys to actions.

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

/** @type {readonly ShortcutGroup[]} */
export const SHORTCUTS = Object.freeze([
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
				keys: [['1–4']],
				action: 'Then answer it: 1 Exploration, 2 Science, 3 Technology or 4 Military.',
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
				keys: [['1–5']],
				action: 'Open the players overview on that player; the same key closes it.',
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
		shortcuts: [
			{ keys: [['Q']], action: 'Capital.' },
			{ keys: [['W']], action: 'Hand.' },
			{ keys: [['E']], action: 'Income.' },
			{ keys: [['R']], action: 'Eras.' },
			{ keys: [['T']], action: 'Civ.' },
			{ keys: [['Y']], action: 'Tech.' },
			{ keys: [['U']], action: 'Terrain.' },
		],
	},
	{
		title: 'Exploring and placing',
		shortcuts: [
			{
				keys: [[','], ['.']],
				action: "Turn the explore's territory tile back or forward, or turn the landmark you are placing.",
			},
			{
				keys: [['←'], ['↑'], ['→'], ['↓']],
				action: 'Move the landmark you are placing one plot.',
			},
			{
				keys: [['Enter']],
				action: 'Place the landmark where it is.',
			},
			{
				keys: [['Backspace'], ['Delete']],
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
