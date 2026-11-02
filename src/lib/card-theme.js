// The card theme (#167, owner, 2026-11-02): light paper or dark cards, switched in the header menu and remembered in this browser.

/** Where the browser remembers the choice, as 'dark' or 'light'. */
export const CARD_THEME = 'rg-cards';

/**
 * Whether the player chose dark cards; light paper until they do.
 * @param {import('./api.js').SessionStore} prefs - The browser's localStorage
 * @returns {boolean}
 */
export function darkCardsSaved(prefs) {
	return prefs.getItem(CARD_THEME) === 'dark';
}

/**
 * Remembers the player's choice.
 * @param {import('./api.js').SessionStore} prefs - The browser's localStorage
 * @param {boolean} dark
 */
export function saveDarkCards(prefs, dark) {
	try {
		prefs.setItem(CARD_THEME, dark ? 'dark' : 'light');
	} catch {
		// A browser that keeps nothing still shows the choice for this visit.
	}
}
