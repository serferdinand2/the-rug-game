// The header menu's entries for each screen (#99): How to play, the card gallery in a new tab, the Dark cards switch, then the screen's own.

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
 * @param {{ hosting?: boolean, darkCards?: boolean }} [choices] - Whether the viewer hosts the table, which offers
 *   Table settings in the game, and whether they chose dark cards, which turns the Dark cards switch on
 * @returns {MenuItem[]}
 */
export function menuItems(screen, { hosting = false, darkCards = false } = {}) {
	/** @type {MenuItem} */
	const cards = { id: 'cards', label: 'Dark cards', checked: darkCards };
	if (screen === 'start') {
		return [
			HELP,
			GALLERY,
			cards,
			{ id: 'about', label: 'About this project' },
		];
	}
	if (screen === 'game') {
		return [
			HELP,
			GALLERY,
			cards,
			{ id: 'keys', label: 'Keyboard shortcuts' },
			...(hosting ? [{ id: 'settings', label: 'Table settings' }] : []),
			LEAVE,
		];
	}
	return [HELP, GALLERY, cards, LEAVE];
}
