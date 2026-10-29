// The header menu's entries for each screen (#99): How to play, the card gallery in a new tab, then the screen's own.

/** @typedef {import('./components/ui/Menu.svelte').MenuItem} MenuItem */

/**
 * The screens whose header has a menu: 'start' is the loading, landing and lobby pages; 'passing' the hot-seat pass
 * screen.
 * @typedef {'start' | 'passing' | 'results' | 'game'} MenuScreen
 */

/** @type {MenuItem} */
const HELP = { id: 'help', label: 'How to play' };
/** @type {MenuItem} */
const GALLERY = {
	id: 'gallery',
	label: 'Card gallery',
	href: '/cards.html',
	target: '_blank',
};
/** @type {MenuItem} */
const LEAVE = { id: 'leave', label: 'Leave table' };

/**
 * A screen's menu entries, in order.
 * @param {MenuScreen} screen
 * @param {{ hosting?: boolean }} [table] - Whether the viewer hosts the table, which offers Table settings in the game
 * @returns {MenuItem[]}
 */
export function menuItems(screen, { hosting = false } = {}) {
	if (screen === 'start') {
		return [HELP, GALLERY, { id: 'about', label: 'About this project' }];
	}
	if (screen === 'game') {
		return [
			HELP,
			GALLERY,
			{ id: 'keys', label: 'Keyboard shortcuts' },
			...(hosting ? [{ id: 'settings', label: 'Table settings' }] : []),
			LEAVE,
		];
	}
	return [HELP, GALLERY, LEAVE];
}
