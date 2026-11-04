// Mounts the component library page and loads the global styles; dealt cards whoosh after the first click (#176).
import { mount } from 'svelte';
import Library from './Library.svelte';
import { createSoundPlayer, shareSounds } from '../lib/sound.js';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/card-layouts.css';

const target = /** @type {HTMLElement} */ (document.getElementById('app'));

export const library = mount(Library, { target });

// The library has no sound switch: its dealt cards are heard once a click or key lets audio start (#176).
const sound = createSoundPlayer();
shareSounds({ play: sound.play, enabled: () => true });
document.addEventListener('click', sound.unlock, true);
document.addEventListener('keydown', sound.unlock, true);
