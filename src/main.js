// Mounts the Svelte app into the page and loads the global styles.
import { mount } from 'svelte';
import App from './App.svelte';
import './styles/tokens.css';
import './styles/base.css';

const target = /** @type {HTMLElement} */ (document.getElementById('app'));

export const app = mount(App, { target });
