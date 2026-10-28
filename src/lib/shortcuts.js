// The game's keyboard shortcuts, for How to play (#42): one list, so a new shortcut is added here and nowhere else.

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
		title: 'Anywhere',
		shortcuts: [
			{
				keys: [['Tab'], ['Shift', 'Tab']],
				action: 'Move to the next or the previous control.',
			},
			{
				keys: [['Enter'], ['Space']],
				action: 'Press the button in focus, or choose the space, hex, card or resource in focus.',
			},
			{
				keys: [['Esc']],
				action: 'Close what is open, one thing at a time: the menu, a panel, the players overview, the dice or a notice.',
			},
		],
	},
	{
		title: 'Menus and tabs',
		shortcuts: [
			{
				keys: [['↑'], ['↓']],
				action: 'Move between the entries of the open menu.',
			},
			{
				keys: [['←'], ['→']],
				action: 'Move between the player tabs.',
			},
			{
				keys: [['Home'], ['End']],
				action: 'Go to the first or the last entry or tab.',
			},
		],
	},
	{
		title: 'Exploring on the map',
		shortcuts: [
			{
				keys: [['R']],
				action: 'Turn the territory tile on the chosen hex.',
			},
			{
				keys: [['Shift', 'R']],
				action: 'Turn it back.',
			},
		],
	},
	{
		title: 'Placing a landmark on the Capital tab',
		shortcuts: [
			{
				keys: [['Space'], ['Enter']],
				action: 'Pick up the landmark waiting beside your capital.',
			},
			{
				keys: [['←'], ['↑'], ['→'], ['↓']],
				action: 'Move it one plot.',
			},
			{
				keys: [['R']],
				action: 'Turn it.',
			},
			{
				keys: [['Enter']],
				action: 'Place it where it is.',
			},
			{
				keys: [['Backspace'], ['Delete']],
				action: 'Take it off the capital again.',
			},
		],
	},
]);
