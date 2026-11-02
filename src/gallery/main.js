// Mount the public catalog-driven card gallery with the game's interface styles, in the card theme chosen in the game.
import { mount } from 'svelte';
import Gallery from './Gallery.svelte';
import { CARD_THEME, darkCardsSaved } from '../lib/card-theme.js';
import { safeStorage } from '../lib/storage.js';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/card-layouts.css';

const prefs = safeStorage(() => localStorage);

/** Shows the cards light or dark, as the game's menu last chose (owner, 2026-11-02). */
const applyCardTheme = () => {
	document.documentElement.dataset.cards = darkCardsSaved(prefs)
		? 'dark'
		: 'light';
};

applyCardTheme();
// The gallery opens in its own tab, so a switch in the game's tab reaches it through the storage event.
window.addEventListener('storage', (event) => {
	if (event.key === CARD_THEME) {
		applyCardTheme();
	}
});

mount(Gallery, {
	target: /** @type {HTMLElement} */ (document.getElementById('app')),
});
