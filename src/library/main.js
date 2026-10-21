// Mounts the component library page and loads the global styles.
import { mount } from 'svelte';
import Library from './Library.svelte';
import '../styles/tokens.css';
import '../styles/base.css';

const target = /** @type {HTMLElement} */ (document.getElementById('app'));

export const library = mount(Library, { target });
