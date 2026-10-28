// Mount the public catalog-driven card gallery with the game's interface styles.
import { mount } from 'svelte';
import Gallery from './Gallery.svelte';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/card-layouts.css';

mount(Gallery, {
	target: /** @type {HTMLElement} */ (document.getElementById('app')),
});
